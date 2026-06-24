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
            placeholder="Update assignment"
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
              <View style={[styles.statusLabel, item.deleted ? styles.deletedStatusLabel : styles.completedStatusLabel]}>
                <Text style={[styles.statusLabelText, item.deleted ? styles.deletedStatusLabelText : styles.completedStatusLabelText]}>
                  {item.deleted ? 'Deleted' : '✔ Completed'}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.actionColumn}>
        {activeView === 'History' ? null : item.deleted ? (
          <>
            <TouchableOpacity onPress={handleRestore} style={[styles.actionButton, styles.restoreButton]}>
              <Text style={[styles.restoreText, styles.actionText]}>Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePermanentDelete} style={[styles.actionButton, styles.deleteButton]}>
              <Text style={[styles.deleteText, styles.actionText]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : isEditing ? (
          <>
            <TouchableOpacity onPress={() => onEditSave(item.id)} style={[styles.actionButton, styles.completeButton]}>
              <Text style={[styles.completeText, styles.actionText]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onEditCancel} style={[styles.actionButton, styles.archiveButton]}>
              <Text style={[styles.archiveText, styles.actionText]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : item.completed ? (
          <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, styles.archiveButton]}>
            <Text style={[styles.archiveText, styles.actionText]}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => onStartEdit(item.id, item.text)} style={[styles.actionButton, styles.editButton]}>
              <Text style={[styles.editText, styles.actionText]}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleComplete} style={[styles.actionButton, styles.completeButton]}>
              <Text style={[styles.completeText, styles.actionText]}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, styles.archiveButton]}>
              <Text style={[styles.archiveText, styles.actionText]}>Delete</Text>
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
    backgroundColor: '#0d0d0d',
    marginBottom: 14,
  },
  taskCompleted: {
    borderColor: '#ff8c00',
    borderWidth: 1,
  },
  taskDeleted: {
    backgroundColor: '#160f08',
  },  taskDetails: {
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
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 140, 0, 0.12)',
  },
  completedStatusLabel: {
    backgroundColor: 'rgba(255, 140, 0, 0.16)',
  },
  deletedStatusLabel: {
    backgroundColor: 'rgba(255, 101, 101, 0.15)',
  },
  statusLabelText: {
    fontSize: 11,
    color: '#ffb347',
    fontWeight: '700',
  },
  completedStatusLabelText: {
    color: '#ff8c00',
  },
  deletedStatusLabelText: {
    color: '#f87171',
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
  actionColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionButton: {
    minWidth: 56,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: '#ff8c00',
  },
  completeText: {
    color: '#101010',
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#ff8c00',
  },
  editText: {
    color: '#101010',
    fontWeight: '700',
  },
  archiveButton: {
    backgroundColor: '#ff8c00',
  },
  archiveText: {
    color: '#101010',
    fontWeight: '700',
  },
  restoreButton: {
    backgroundColor: '#3f3f3f',
  },
  restoreText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#c75000',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default TaskItem;
