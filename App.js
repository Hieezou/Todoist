import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  View,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { impact, notification } from './utils/haptics';
import { HapticsProvider, useHaptics } from './utils/HapticsProvider';
import { cloudEnabled } from './firebaseConfig';
import TaskItem from './components/TaskItem';
import TaskInput from './components/TaskInput';
import SummaryCards from './components/SummaryCards';
import TaskList from './components/TaskList';

const STORAGE_FILE = FileSystem.documentDirectory + 'todoist_tasks.json';
const USER_ID_FILE = FileSystem.documentDirectory + 'todoist_user_id.txt';
const views = ['Tasks', 'Completed', 'History', 'Task Bin'];
// Sorting is handled internally; UI sort controls removed for simpler UX

export default function App() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('Tasks');
  const [page, setPage] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [userId, setUserId] = useState(null);
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

  // Initialize tasks on app load
  useEffect(() => {
    const initTasks = async () => {
      try {
        let id = null;
        const idInfo = await FileSystem.getInfoAsync(USER_ID_FILE);
        if (idInfo.exists) {
          id = await FileSystem.readAsStringAsync(USER_ID_FILE, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
        if (!id) {
          id = `${Date.now()}-${Math.random()}`;
          await FileSystem.writeAsStringAsync(USER_ID_FILE, id, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
        setUserId(id);

        const localTasks = (await readFileJson(STORAGE_FILE)) || [];
        if (cloudEnabled) {
          try {
            const service = await getCloudService();
            if (service) {
              const cloudTasks = await service.getUserTasks(id);
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
      } catch (error) {
        setCloudError('Failed to initialize: ' + error.message);
        console.error('Init error:', error);
      }
    };
    initTasks();
  }, [readFileJson, getCloudService]);

  // Auto-save to local storage
  useEffect(() => {
    const saveLocal = async () => {
      try {
        await writeFileJson(STORAGE_FILE, tasks);
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    };
    if (tasks.length > 0 || !cloudEnabled) {
      saveLocal();
    }
  }, [tasks, writeFileJson]);

  // Cloud sync helpers
  const saveTaskCloud = useCallback(async (task) => {
    if (!userId || !cloudEnabled) return;
    try {
      const service = await getCloudService();
      if (!service) return;
      await service.saveTaskToCloud(userId, task);
      setCloudError(null);
    } catch (error) {
      console.error('Cloud save failed:', error);
      setCloudError('Sync failed (will retry)');
    }
  }, [userId, getCloudService]);

  const removeTaskCloud = useCallback(async (id) => {
    if (!userId || !cloudEnabled) return;
    try {
      const service = await getCloudService();
      if (!service) return;
      await service.deleteTaskFromCloud(id);
      setCloudError(null);
    } catch (error) {
      console.error('Cloud delete failed:', error);
      setCloudError('Sync failed (will retry)');
    }
  }, [userId, getCloudService]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (cloudEnabled && userId) {
        const service = await getCloudService();
        if (service) {
          const cloudTasks = await service.getUserTasks(userId);
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
  }, [userId, getCloudService]);

  // Task operations with haptic feedback
  const addTask = useCallback(async () => {
    const trimmed = taskText.trim();
    if (!trimmed) {
      await notification();
      return;
    }

    await impact();

    const newTask = {
      id: `${Date.now()}-${Math.random()}`,
      text: trimmed,
      completed: false,
      deleted: false,
      history: false,
      dueDate: null,
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
      Alert.alert('Error', 'Task text cannot be empty');
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
    Tasks: activeTasks.length,
    Completed: completedTasks.length,
    History: historyTasks.length,
    'Task Bin': binTasks.length,
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
      case 'Task Bin':
        return sortTasks(binTasks);
      default:
        return sortTasks(activeTasks);
    }
  }, [activeView, activeTasks, completedTasks, historyTasks, binTasks, sortTasks]);

  const getViewTitle = useCallback(() => {
    switch (activeView) {
      case 'Completed':
        return 'Completed Tasks';
      case 'History':
        return 'History';
      case 'Task Bin':
        return 'Task Bin';
      default:
        return 'Active Tasks';
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

  const PAGE_SIZE = 10;

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
            </View>

            {cloudError && <Text style={styles.cloudError}>{cloudError}</Text>}

            <View style={styles.content}>
            <SummaryCards
              views={views}
              viewCounts={viewCounts}
              activeView={activeView}
              onViewChange={setActiveView}
            />

            <TaskInput
              taskText={taskText}
              onTaskTextChange={setTaskText}
              onAddTask={addTask}
            />

            {/* Sort controls removed — using default sorting for simplicity */}

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
        Haptics unavailable — using visual feedback instead.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b17',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoBlock: {
    marginLeft: 8,
    backgroundColor: '#ffa500',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoBlockText: {
    color: '#101010',
    fontWeight: 'bold',
    fontSize: 32,
    letterSpacing: 0.5,
  },
  headerRow: {
    marginBottom: 18,
  },
  headerTextWrapper: {
    flex: 1,
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
    backgroundColor: '#1f2937',
    marginRight: 6,
  },
  sortButtonActive: {
    backgroundColor: '#38bdf8',
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  sortButtonTextActive: {
    color: '#101010',
  },
  cloudError: {
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
