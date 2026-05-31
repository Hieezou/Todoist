import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';

const views = ['Tasks', 'Completed', 'History', 'Task Bin'];

export default function App() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('Tasks');
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const formatTime = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const addTask = () => {
    const trimmed = taskText.trim();
    if (!trimmed) return;

    setTasks(prev => [
      {
        id: `${Date.now()}-${Math.random()}`,
        text: trimmed,
        completed: false,
        deleted: false,
        history: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        deletedAt: null,
      },
      ...prev,
    ]);

    setTaskText('');
  };

  const completeTask = id => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              completed: true,
              deleted: false,
              history: true,
              completedAt: new Date().toISOString(),
              deletedAt: null,
            }
          : task
      )
    );
  };

  const restoreFromBin = id => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, deleted: false, history: true, deletedAt: null }
          : task
      )
    );
  };

  const deleteToBin = id => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              deleted: true,
              history: true,
              deletedAt: new Date().toISOString(),
            }
          : task
      )
    );
  };

  const permanentlyDeleteTask = id => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const startEditingTask = (id, text) => {
    setEditingTaskId(id);
    setEditingText(text);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const saveTaskEdit = id => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, text: trimmed } : task
      )
    );
    cancelEditing();
  };

  const activeTasks = tasks.filter(task => !task.completed && !task.deleted);
  const completedTasks = tasks.filter(task => task.completed && !task.deleted);
  const historyTasks = tasks.filter(task => task.history || task.deleted);
  const binTasks = tasks.filter(task => task.deleted);

  const viewCounts = {
    Tasks: activeTasks.length,
    Completed: completedTasks.length,
    History: historyTasks.length,
    'Task Bin': binTasks.length,
  };

  const getViewTasks = () => {
    switch (activeView) {
      case 'Completed':
        return completedTasks;
      case 'History':
        return historyTasks;
      case 'Task Bin':
        return binTasks;
      default:
        return activeTasks;
    }
  };

  const getViewTitle = () => {
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
  };

  const renderTask = ({ item }) => {
    const isEditing = editingTaskId === item.id;
    return (
      <View style={[styles.taskItem, item.completed && styles.taskCompleted, item.deleted && styles.taskDeleted]}>
        <View style={styles.taskButton}>
          {isEditing ? (
            <TextInput
              value={editingText}
              onChangeText={setEditingText}
              style={[styles.input, styles.editInput]}
              placeholder="Update task"
              placeholderTextColor="#8c8c8c"
              returnKeyType="done"
              onSubmitEditing={() => saveTaskEdit(item.id)}
            />
          ) : (
            <>
              <Text style={[styles.taskText, item.completed && styles.taskTextCompleted, item.deleted && styles.taskTextDeleted]}>
                {item.text}
              </Text>
              <Text style={styles.timestampText}>Added: {formatTime(item.createdAt)}</Text>
              {item.completedAt && (
                <Text style={styles.timestampText}>Completed: {formatTime(item.completedAt)}</Text>
              )}
              {item.deletedAt && (
                <Text style={styles.timestampText}>Deleted: {formatTime(item.deletedAt)}</Text>
              )}
              {activeView === 'History' && (
                <Text style={styles.statusLabel}>
                  {item.deleted ? 'Deleted' : item.completed ? 'Nayswan Goodjob!!' : 'Unsuccessful'}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.actionRow}>
          {activeView === 'History' ? null : item.deleted ? (
            <>
              <TouchableOpacity onPress={() => restoreFromBin(item.id)} style={styles.restoreButton}>
                <Text style={styles.restoreText}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => permanentlyDeleteTask(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : isEditing ? (
            <>
              <TouchableOpacity onPress={() => saveTaskEdit(item.id)} style={styles.completeButton}>
                <Text style={styles.completeText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditing} style={styles.archiveButton}>
                <Text style={styles.archiveText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : item.completed ? (
            <TouchableOpacity onPress={() => deleteToBin(item.id)} style={styles.archiveButton}>
              <Text style={styles.archiveText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => startEditingTask(item.id, item.text)} style={styles.editButton}>
                <Text style={styles.editText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => completeTask(item.id)} style={styles.completeButton}>
                <Text style={styles.completeText}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteToBin(item.id)} style={styles.archiveButton}>
                <Text style={styles.archiveText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const currentTasks = getViewTasks();
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(currentTasks.length / pageSize));
  const pageGroupStart = Math.floor((page - 1) / 10) * 10 + 1;
  const pageGroupEnd = Math.min(totalPages, pageGroupStart + 9);
  const pageNumbers = Array.from({ length: pageGroupEnd - pageGroupStart + 1 }, (_, i) => pageGroupStart + i);
  const paginatedTasks = currentTasks.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
    cancelEditing();
  }, [activeView]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>TODOIST</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a new task"
            value={taskText}
            onChangeText={setTaskText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{getViewTitle()}</Text>

        <FlatList
          data={paginatedTasks}
          keyExtractor={item => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.taskList}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks in this view.</Text>}
        />

        <View style={styles.paginationRow}>
          <TouchableOpacity
            disabled={page === 1}
            style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            onPress={() => setPage(prev => Math.max(1, prev - 1))}
          >
            <Text style={styles.pageButtonText}>Prev</Text>
          </TouchableOpacity>
          {pageNumbers.map(number => (
            <TouchableOpacity
              key={number}
              style={[styles.pageButton, page === number && styles.pageButtonActive]}
              onPress={() => setPage(number)}
            >
              <Text style={[styles.pageButtonText, page === number && styles.pageButtonTextActive]}>
                {number}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            disabled={page === totalPages}
            style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
            onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {menuOpen && (
        <>
          <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuOpen(false)} />
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>Menu</Text>
            {views.map(view => (
              <TouchableOpacity
                key={view}
                style={[styles.drawerButton, activeView === view && styles.drawerButtonActive]}
                onPress={() => {
                  setActiveView(view);
                  setMenuOpen(false);
                }}
              >
                <Text style={[styles.drawerButtonText, activeView === view && styles.drawerButtonTextActive]}>
                  {view}
                </Text>
                <Text style={[styles.drawerCount, activeView === view && styles.drawerCountActive]}>
                  {viewCounts[view]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#ffa500',
    textAlign: 'center',
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 110,
    backgroundColor: '#181818',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  menuButtonText: {
    fontSize: 24,
    color: '#ffa500',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    backgroundColor: '#121212',
    paddingTop: 60,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 4, height: 0 },
    shadowRadius: 20,
    elevation: 12,
    zIndex: 20,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    color: '#ffa500',
  },
  drawerButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#1f1f1f',
  },
  drawerButtonActive: {
    backgroundColor: '#ff8c00',
  },
  drawerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5f5f5',
  },
  drawerButtonTextActive: {
    color: '#101010',
  },
  drawerCount: {
    marginTop: 4,
    fontSize: 12,
    color: '#d9d9d9',
  },
  drawerCountActive: {
    color: '#101010',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  editInput: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444444',
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#ff8c00',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#101010',
    fontWeight: '700',
  },
  taskList: {
    paddingBottom: 40,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#181818',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  taskCompleted: {
    borderColor: '#ffa500',
    borderWidth: 1,
  },
  taskButton: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#eeeeee',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#d6d6d6',
  },
  taskDeleted: {
    backgroundColor: '#2a1a14',
  },
  taskTextDeleted: {
    color: '#ffb347',
  },
  timestampText: {
    marginTop: 4,
    fontSize: 12,
    color: '#c0c0c0',
  },
  statusLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#ffb347',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    marginLeft: 12,
    backgroundColor: '#ff8c00',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  completeText: {
    color: '#101010',
    fontWeight: '700',
  },
  editButton: {
    marginLeft: 12,
    backgroundColor: '#f5a623',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editText: {
    color: '#101010',
    fontWeight: '700',
  },
  archiveButton: {
    marginLeft: 12,
    backgroundColor: '#ff6200',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  archiveText: {
    color: '#101010',
    fontWeight: '700',
  },
  restoreButton: {
    marginLeft: 12,
    backgroundColor: '#3f3f3f',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  restoreText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 12,
    backgroundColor: '#c75000',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#ffffff',
  },
  emptyText: {
    color: '#c0c0c0',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    marginTop: 10,
  },
  pageButton: {
    minWidth: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1f1f1f',
    marginHorizontal: 4,
    marginVertical: 4,
    alignItems: 'center',
  },
  pageButtonActive: {
    backgroundColor: '#ff8c00',
  },
  pageButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  pageButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  pageButtonTextActive: {
    color: '#101010',
  },
});
