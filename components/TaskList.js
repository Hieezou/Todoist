import React, { memo, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';

const TaskList = memo(({
  tasks,
  onRefresh,
  isRefreshing,
  renderTask,
  pageSize = 10,
  page,
  onPageChange,
  fixedPager = false,
  hidePager = false,
  activeView,
  sortBy = 'date',
}) => {
  const totalPages = Math.max(1, Math.ceil((tasks.length || 0) / pageSize));
  const paginatedTasks = tasks.slice((page - 1) * pageSize, page * pageSize);

  const emptyStateMessages = {
    Tasks: {
      title: 'No active tasks',
      subtitle: 'Create a new task to get started!',
      icon: '✓',
    },
    Completed: {
      title: 'No completed tasks',
      subtitle: 'Complete some tasks to see them here.',
      icon: '✔️',
    },
    History: {
      title: 'No history yet',
      subtitle: 'Completed and deleted tasks appear here.',
      icon: '📋',
    },
    'Task Bin': {
      title: 'Trash is empty',
      subtitle: 'Deleted tasks can be permanently removed.',
      icon: '🗑️',
    },
  };

  const currentState = emptyStateMessages[activeView] || emptyStateMessages.Tasks;

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{currentState.icon}</Text>
      <Text style={styles.emptyTitle}>{currentState.title}</Text>
      <Text style={styles.emptySubtitle}>{currentState.subtitle}</Text>
    </View>
  ), [currentState]);

  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedTasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        contentContainerStyle={[styles.taskList, fixedPager ? styles.taskListWithPager : null]}
        ListEmptyComponent={renderEmptyComponent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#38bdf8"
            progressBackgroundColor="#111827"
          />
        }
      />
      {fixedPager && !hidePager && totalPages > 1 && (
        <View style={styles.fixedPagerContainer} pointerEvents="box-none">
          <View style={styles.paginationRowCompactFixed}>
            <TouchableOpacity
              style={[styles.navButton, page === 1 && styles.navButtonDisabled]}
              onPress={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <Text style={[styles.navButtonText, page === 1 && styles.navButtonTextDisabled]}>Prev</Text>
            </TouchableOpacity>

            <View style={styles.currentPageWrapper}>
              <View style={styles.currentPageCircle}>
                <Text style={styles.currentPageText}>{page}</Text>
              </View>
              <Text style={styles.currentPageLabel}>{page} of {totalPages}</Text>
            </View>

            <TouchableOpacity
              style={[styles.navButton, page === totalPages && styles.navButtonDisabled]}
              onPress={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              <Text style={[styles.navButtonText, page === totalPages && styles.navButtonTextDisabled]}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskList: {
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
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
  pageButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  pageButtonTextActive: {
    color: '#101010',
  },
  paginationRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  paginationRowCompactFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0b0b0b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  fixedPagerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
  },
  taskListWithPager: {
    paddingBottom: 120,
  },
  navButton: {
    minWidth: 64,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1b1b1f',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#111317',
  },
  navButtonDisabled: {
    backgroundColor: '#0f0f0f',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#6b7280',
  },
  currentPageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    minWidth: 90,
  },
  currentPageCircle: {
    minWidth: 48,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ff8c00',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#b25900',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  currentPageText: {
    color: '#101010',
    fontWeight: '800',
    fontSize: 16,
  },
  currentPageLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default TaskList;
