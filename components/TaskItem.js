import React, { memo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { impact, notification } from '../utils/haptics';

const TaskItem = memo(({
  item,
  isEditing,
  editingText,
  onEditChange,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onComplete,
  onDelete,
  onRestore,
  onPermanentDelete,
  activeView,
  formatTime,
}) => {
  const handleComplete = useCallback(async () => {
    await impact();
    onComplete(item.id);
  }, [item.id, onComplete]);

  const handleDelete = useCallback(async () => {
    await impact();
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleRestore = useCallback(async () => {
    await impact();
    onRestore(item.id);
  }, [item.id, onRestore]);

  const handlePermanentDelete = useCallback(async () => {
    await impact();
    onPermanentDelete(item.id);
  }, [item.id, onPermanentDelete]);

  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isDueSoon = dueDate && dueDate.getTime() - Date.now() < 86400000 && !item.completed;
  const isOverdue = dueDate && dueDate.getTime() < Date.now() && !item.completed;

  return (
    <View style={[styles.taskItem, item.completed && styles.taskCompleted, item.deleted && styles.taskDeleted]}>
      <View style={styles.taskDetails}>
        {isEditing ? (
          <TextInput
            value={editingText}
            onChangeText={onEditChange}
            style={[styles.input, styles.editInput]}
            placeholder="Update task"
            placeholderTextColor="#8c8c8c"
            returnKeyType="done"
            onSubmitEditing={() => onEditSave(item.id)}
          />
        ) : (
          <>
            <Text style={[styles.taskText, item.completed && styles.taskTextCompleted, item.deleted && styles.taskTextDeleted]}>
              {item.text}
            </Text>
            {dueDate && (
              <Text style={[styles.dueDate, isOverdue && styles.dueDateOverdue, isDueSoon && styles.dueDateSoon]}>
                Due: {dueDate.toLocaleDateString()} {isOverdue ? '(Overdue)' : ''}
              </Text>
            )}
            <View style={styles.metadataRow}>
              <Text style={styles.timestampText}>Added: {formatTime(item.createdAt)}</Text>
              {item.completedAt ? <Text style={styles.timestampText}> • Completed</Text> : null}
            </View>
            {item.updatedAt ? <Text style={styles.timestampText}>Updated: {formatTime(item.updatedAt)}</Text> : null}
            {(item.deleted || item.completed) && (
              <Text style={styles.statusLabel}>
                {item.deleted ? 'Deleted' : 'Completed'}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.actionRow}>
        {activeView === 'History' ? null : item.deleted ? (
          <>
            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
              <Text style={styles.restoreText}>Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePermanentDelete} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : isEditing ? (
          <>
            <TouchableOpacity onPress={() => onEditSave(item.id)} style={styles.completeButton}>
              <Text style={styles.completeText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onEditCancel} style={styles.archiveButton}>
              <Text style={styles.archiveText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : item.completed ? (
          <TouchableOpacity onPress={handleDelete} style={styles.archiveButton}>
            <Text style={styles.archiveText}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => onStartEdit(item.id, item.text)} style={styles.editButton}>
              <Text style={styles.editText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleComplete} style={styles.completeButton}>
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.archiveButton}>
              <Text style={styles.archiveText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#111827',
    marginBottom: 14,
  },
  taskCompleted: {
    borderColor: '#ffa500',
    borderWidth: 1,
  },
  taskDeleted: {
    backgroundColor: '#2a1a14',
  },
  taskDetails: {
    flex: 1,
  },
  taskText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#d6d6d6',
  },
  taskTextDeleted: {
    color: '#ffb347',
  },
  dueDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  dueDateSoon: {
    color: '#fbbf24',
  },
  dueDateOverdue: {
    color: '#f87171',
    fontWeight: '700',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
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
  input: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  editInput: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    marginLeft: 12,
    backgroundColor: '#38bdf8',
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
});

export default TaskItem;
