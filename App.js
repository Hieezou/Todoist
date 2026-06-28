import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { impact, notification } from './utils/haptics';
import { HapticsProvider, useHaptics } from './utils/HapticsProvider';
import { cloudEnabled } from './firebaseConfig';
import { getCurrentUser, signIn, signUp, signOut } from './authService';
import { initializeNotificationSystem, sendTestNotification, checkNotificationStatus } from './utils/initNotifications';
import {
  sendTaskCompletionNotification,
  scheduleNotificationAt,
  cancelNotification,
  sendLocalNotification,
  getFirebaseMessagingToken,
  storeFirebaseMessagingToken,
} from './utils/notificationService';
import AuthScreen from './components/AuthScreen';
import TaskItem from './components/TaskItem';
import TaskInput from './components/TaskInput';
import SummaryCards from './components/SummaryCards';
import TaskList from './components/TaskList';
import ScheduleChart from './components/ScheduleChart';

const STORAGE_FILE = FileSystem.documentDirectory + 'todoist_assignments.json';
const USERS_FILE = FileSystem.documentDirectory + 'todoist_users.json';
const SESSION_FILE = FileSystem.documentDirectory + 'todoist_session.json';
const views = ['Assignments', 'Completed', 'History', 'Assignment Bin'];
// Sorting is handled internally; UI sort controls removed for simpler UX

export default function App() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [activeView, setActiveView] = useState('Assignments');
  const [page, setPage] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // removed sort UI state to simplify interface
  const cloudServiceRef = useRef(null);

  // File system utilities
  const readFileJson = useCallback(async (path) => {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      const contents = await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return contents ? JSON.parse(contents) : null;
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      throw error;
    }
  }, []);

  const writeFileJson = useCallback(async (path, value) => {
    try {
      await FileSystem.writeAsStringAsync(path, JSON.stringify(value), {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error(`Error writing file ${path}:`, error);
      throw error;
    }
  }, []);

  // Cloud service initialization
  const getCloudService = useCallback(async () => {
    if (!cloudEnabled) return null;
    if (cloudServiceRef.current) return cloudServiceRef.current;
    try {
      const service = await import('./firebaseService');
      cloudServiceRef.current = service;
      return service;
    } catch (error) {
      console.error('Unable to load cloud service:', error);
      setCloudError('Cloud unavailable - using local storage');
      return null;
    }
  }, []);

  // Initialize the current session and load assignments when the app starts.
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const localTasks = (await readFileJson(STORAGE_FILE)) || [];
          if (cloudEnabled) {
            try {
              const service = await getCloudService();
              if (service) {
                const cloudTasks = await service.getUserTasks(user.id);
                if (cloudTasks && cloudTasks.length > 0) {
                  setTasks(cloudTasks);
                  return;
                }
              }
            } catch (error) {
              console.warn('Cloud sync failed, using local tasks:', error.message);
            }
          }
          setTasks(localTasks);
        }
      } catch (error) {
        setCloudError('Failed to initialize: ' + error.message);
        console.error('Init error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [readFileJson, getCloudService]);

  // Auto-save to local storage
  useEffect(() => {
    if (!currentUser) return;
    const saveLocal = async () => {
      try {
        await writeFileJson(getTasksFile(currentUser.id), tasks);
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    };
    saveLocal();
  }, [tasks, writeFileJson, currentUser]);

  // Initialize notifications on app startup
  useEffect(() => {
    let cleanup;

    const initNotifications = async () => {
      cleanup = await initializeNotificationSystem();
    };

    initNotifications();

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  const getTasksFile = useCallback((userId) =>
    userId
      ? `${FileSystem.documentDirectory}todoist_assignments_${userId}.json`
      : STORAGE_FILE,
  []);

  // Cloud sync helpers
  const saveTaskCloud = useCallback(async (task) => {
    if (!currentUser?.id || !cloudEnabled) return;
    try {
      const service = await getCloudService();
      if (!service) return;
      await service.saveTaskToCloud(currentUser.id, task);
      setCloudError(null);
    } catch (error) {
      console.error('Cloud save failed:', error);
      setCloudError('Sync failed (will retry)');
    }
  }, [currentUser, getCloudService]);

  const removeTaskCloud = useCallback(async (id) => {
    if (!currentUser?.id || !cloudEnabled) return;
    try {
      const service = await getCloudService();
      if (!service) return;
      await service.deleteTaskFromCloud(id);
      setCloudError(null);
    } catch (error) {
      console.error('Cloud delete failed:', error);
      setCloudError('Sync failed (will retry)');
    }
  }, [currentUser, getCloudService]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (cloudEnabled && currentUser?.id) {
        const service = await getCloudService();
        if (service) {
          const cloudTasks = await service.getUserTasks(currentUser.id);
          if (cloudTasks && cloudTasks.length > 0) {
            setTasks(cloudTasks);
            await notification();
            setCloudError(null);
          }
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      setCloudError('Refresh failed: ' + error.message);
      await notification();
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser, getCloudService]);

  // Assignment operations with haptic feedback
  const addTask = useCallback(async (selectedDueDate) => {
    const trimmed = taskText.trim();
    if (!trimmed) {
      await notification();
      return;
    }

    const dueDateValue = selectedDueDate ? new Date(selectedDueDate) : null;
    if (selectedDueDate && (!dueDateValue || Number.isNaN(dueDateValue.getTime()))) {
      Alert.alert('Invalid deadline', 'Please select a valid due date from the calendar.');
      return;
    }

    await impact();

    const newTask = {
      id: `${Date.now()}-${Math.random()}`,
      text: trimmed,
      completed: false,
      deleted: false,
      history: false,
      dueDate: dueDateValue ? dueDateValue.toISOString() : null,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      completedAt: null,
      deletedAt: null,
    };

    setTasks(prev => [newTask, ...prev]);
    setTaskText('');
    await saveTaskCloud(newTask);
  }, [taskText, saveTaskCloud]);

  const completeTask = useCallback((id) => {
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      completed: true,
      deleted: false,
      history: true,
      completedAt: new Date().toISOString(),
      deletedAt: null,
    };

    setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)));
    saveTaskCloud(updatedTask);
  }, [tasks, saveTaskCloud]);

  const deleteToBin = useCallback((id) => {
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      deleted: true,
      history: true,
      deletedAt: new Date().toISOString(),
    };

    setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)));
    saveTaskCloud(updatedTask);
  }, [tasks, saveTaskCloud]);

  const restoreFromBin = useCallback((id) => {
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      deleted: false,
      history: true,
      deletedAt: null,
    };

    setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)));
    saveTaskCloud(updatedTask);
  }, [tasks, saveTaskCloud]);

  const permanentlyDeleteTask = useCallback((id) => {
    Alert.alert(
      'Delete Permanently?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
              await impact();
            setTasks(prev => prev.filter(task => task.id !== id));
            await removeTaskCloud(id);
          },
          style: 'destructive',
        },
      ]
    );
  }, [removeTaskCloud]);

  const startEditingTask = useCallback((id, text) => {
    setEditingTaskId(id);
    setEditingText(text);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTaskId(null);
    setEditingText('');
  }, []);

  const saveTaskEdit = useCallback((id) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Assignment text cannot be empty');
      return;
    }

    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      text: trimmed,
      updatedAt: new Date().toISOString(),
    };

    setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)));
    saveTaskCloud(updatedTask);
    cancelEditing();
  }, [editingText, tasks, saveTaskCloud, cancelEditing]);

  // Computed values with memoization
  const { activeTasks, completedTasks, historyTasks, binTasks } = useMemo(() => ({
    activeTasks: tasks.filter(task => !task.completed && !task.deleted),
    completedTasks: tasks.filter(task => task.completed && !task.deleted),
    historyTasks: tasks.filter(task => task.history || task.deleted),
    binTasks: tasks.filter(task => task.deleted),
  }), [tasks]);

  const viewCounts = useMemo(() => ({
    Assignments: activeTasks.length,
    Completed: completedTasks.length,
    History: historyTasks.length,
    'Assignment Bin': binTasks.length,
  }), [activeTasks, completedTasks, historyTasks, binTasks]);

  const sortTasks = useCallback((taskList) => {
    const sorted = [...taskList];
    // Default sorting: most recent first (by createdAt / updatedAt / completedAt)
    return sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || a.completedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || b.completedAt || 0).getTime();
      return bTime - aTime;
    });
  }, []);

  const getViewTasks = useCallback(() => {
    switch (activeView) {
      case 'Completed':
        return sortTasks(completedTasks);
      case 'History':
        return sortTasks(historyTasks);
      case 'Assignment Bin':
        return sortTasks(binTasks);
      default:
        return sortTasks(activeTasks);
    }
  }, [activeView, activeTasks, completedTasks, historyTasks, binTasks, sortTasks]);

  const getViewTitle = useCallback(() => {
    switch (activeView) {
      case 'Completed':
        return 'Completed Assignments';
      case 'History':
        return 'History';
      case 'Assignment Bin':
        return 'Assignment Bin';
      default:
        return 'Active Assignments';
    }
  }, [activeView]);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  const renderTask = useCallback(({ item }) => (
    <TaskItem
      item={item}
      isEditing={editingTaskId === item.id}
      editingText={editingText}
      onEditChange={setEditingText}
      onEditSave={saveTaskEdit}
      onEditCancel={cancelEditing}
      onStartEdit={startEditingTask}
      onComplete={completeTask}
      onDelete={deleteToBin}
      onRestore={restoreFromBin}
      onPermanentDelete={permanentlyDeleteTask}
      activeView={activeView}
      formatTime={formatTime}
    />
  ), [editingTaskId, editingText, activeView, saveTaskEdit, cancelEditing, startEditingTask, completeTask, deleteToBin, restoreFromBin, permanentlyDeleteTask, formatTime]);

  const currentTasks = getViewTasks();

  const renderTabContent = useCallback(() => {
    if (showProfile) {
      return (
        <ScrollView style={styles.profileScreen} contentContainerStyle={styles.profileContent}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileHeaderTitle}>Profile</Text>
          </View>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>EMAIL</Text>
              <Text style={styles.profileValue}>{currentUser?.email}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>FULL NAME</Text>
              <Text style={styles.profileValue}>{currentUser?.name || currentUser?.email?.split('@')[0]}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>MEMBER SINCE</Text>
              <Text style={styles.profileValue}>{currentUser ? new Date(currentUser.id.split('-')[0] * 1).toLocaleDateString() : ''}</Text>
            </View>
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>
              Todoist helps you manage assignments, completed tasks, history, and deleted items in one place. Add, complete, restore, and permanently remove entries to stay organized.
            </Text>
          </View>
          <ScheduleChart currentUser={currentUser} />
          <TouchableOpacity style={styles.profileTestNotificationButton} onPress={async () => {
            await sendTestNotification();
            Alert.alert('Test Notification', 'Check your notifications! If you don\'t see anything, check your phone\'s notification settings.');
          }}>
            <Text style={styles.profileTestNotificationText}>📢 Test Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileSignOutButton} onPress={confirmSignOut}>
            <Text style={styles.profileSignOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <View style={styles.content}>
        {cloudError && <Text style={styles.cloudError}>{cloudError}</Text>}
        <TaskInput
          taskText={taskText}
          onTaskTextChange={setTaskText}
          onAddTask={addTask}
        />
        <SummaryCards
          views={views}
          viewCounts={viewCounts}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <Text style={styles.sectionTitle}>{getViewTitle()}</Text>
        <TaskList
          tasks={currentTasks}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          renderTask={renderTask}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          fixedPager={true}
          hidePager={keyboardVisible}
          activeView={activeView}
        />
      </View>
    );
  }, [showProfile, currentUser, currentTasks, cloudError, taskText, viewCounts, activeView, getViewTitle, handleRefresh, addTask, renderTask, isRefreshing, page, keyboardVisible, confirmSignOut]);

  const PAGE_SIZE = 10;

  const handleAuthSubmit = useCallback(async (name, email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const user = authMode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, name);
      setCurrentUser(user);
      const localTasks = (await readFileJson(getTasksFile(user.id))) || [];
      setTasks(localTasks);
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, readFileJson]);

  const handleSwitchMode = useCallback(() => {
    setAuthError('');
    setAuthMode(prev => (prev === 'login' ? 'signup' : 'login'));
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    setTasks([]);
    setShowProfile(false);
    setActiveView('Assignments');
    setPage(1);
  }, []);

  const confirmSignOut = useCallback(() => {
    setShowSignOutModal(true);
  }, []);

  // Clamp page when the available tasks change so we never point past the last page
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((currentTasks.length || 0) / PAGE_SIZE));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [currentTasks, page]);

  // Reset pagination when view changes
  useEffect(() => {
    setPage(1);
    cancelEditing();
  }, [activeView, cancelEditing]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Preparing your workspace...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        onSubmit={handleAuthSubmit}
        onSwitchMode={handleSwitchMode}
        error={authError}
        isSubmitting={authLoading}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <HapticsProvider>
          <SafeAreaView style={styles.container}>
            <HapticsFallbackBanner />
            <View style={styles.headerRow}>
              <LogoHeader />
              <TouchableOpacity style={styles.profileIconButton} onPress={() => setShowProfile(prev => !prev)}>
                <Text style={styles.profileInitial}>{currentUser?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}</Text>
              </TouchableOpacity>
            </View>

            {!showProfile && (
              <View style={styles.welcomeRow}>
                <Text style={styles.welcomeTitle}>Hello, {currentUser.name || currentUser.email.split('@')[0]}</Text>
              </View>
            )}

            {renderTabContent()}

            {showSignOutModal && (
              <Modal visible={showSignOutModal} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                  <View style={styles.signOutModalCard}>
                    <Text style={styles.signOutTitle}>Sign Out</Text>
                    <Text style={styles.signOutMessage}>Do you want to sign out?</Text>
                    <View style={styles.modalActionsRow}>
                      <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowSignOutModal(false)}>
                        <Text style={styles.modalButtonText}>No</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalButtonConfirm} onPress={async () => { setShowSignOutModal(false); await handleSignOut(); }}>
                        <Text style={[styles.modalButtonText, { color: '#101010' }]}>Yes</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            <StatusBar style="auto" />
          </SafeAreaView>
        </HapticsProvider>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function LogoHeader() {
  return (
    <View style={styles.logoContainer}>
      <Text style={styles.logoText}>TODO</Text>
      <View style={styles.logoBlock}>
        <Text style={styles.logoBlockText}>IST</Text>
      </View>
    </View>
  );
}

function HapticsFallbackBanner() {
  const { available } = useHaptics();
  if (available) return null;
  return (
    <View style={{ backgroundColor: '#fff3cd', padding: 8 }}>
      <Text style={{ color: '#856404', textAlign: 'center' }}>
        Haptics unavailable � using visual feedback instead.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 18,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoBlock: {
    marginLeft: 10,
    backgroundColor: '#ff8c00',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoBlockText: {
    color: '#101010',
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: 0.5,
  },
  profileIconButton: {
    width: 46,
    height: 46,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
  },
  profileInitial: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#e2e8f0',
  },
  welcomeRow: {
    marginBottom: 12,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  profileScreen: {
    flex: 1,
  },
  profileHeader: {
    marginBottom: 16,
  },
  profileHeaderTitle: {
    color: '#e2e8f0',
    fontSize: 28,
    fontWeight: '800',
  },
  profileHeaderSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 6,
  },
  profileCard: {
    borderRadius: 24,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#173047',
    padding: 18,
    marginBottom: 16,
  },
  profileRow: {
    marginBottom: 16,
  },
  profileLabel: {
    color: '#94a3b8',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 6,
  },
  profileValue: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  aboutCard: {
    borderRadius: 24,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#173047',
    padding: 18,
    marginBottom: 16,
  },
  aboutTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  aboutText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signOutModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f1729',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#173047',
  },
  signOutTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 6,
  },
  signOutMessage: {
    color: '#cbd5e1',
    marginBottom: 12,
    fontSize: 14,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButtonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  modalButtonConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#ff8c00',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  profileTestNotificationButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  profileTestNotificationText: {
    color: '#0f1729',
    fontWeight: '900',
    fontSize: 16,
  },
  profileSignOutButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  profileSignOutText: {
    color: '#101010',
    fontWeight: '900',
    fontSize: 16,
  },
  profileContent: {
    paddingBottom: 40,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginRight: 8,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#111111',
    marginRight: 6,
  },
  sortButtonActive: {
    backgroundColor: '#ff8c00',
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  sortButtonTextActive: {
    color: '#101010',
  },  cloudError: {
    marginBottom: 8,
    fontSize: 12,
    color: '#f87171',
    textAlign: 'center',
    fontWeight: '600',
  },
  keyboardAvoiding: {
    flex: 1,
  },
});



