import React, { memo, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { impact } from '../utils/haptics';

const TaskInput = memo(({ taskText, onTaskTextChange, onAddTask, onInputFocus, onInputBlur }) => {
  const handleAddPress = useCallback(async () => {
    await impact();
    onAddTask();
  }, [onAddTask]);

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        placeholder="What should you do next?"
        placeholderTextColor="#8c8c8c"
        value={taskText}
        onChangeText={onTaskTextChange}
        returnKeyType="done"
        onSubmitEditing={handleAddPress}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addButtonText: {
    color: '#101010',
    fontWeight: '700',
  },
});

export default TaskInput;
