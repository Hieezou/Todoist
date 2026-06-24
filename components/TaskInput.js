import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { impact } from '../utils/haptics';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const buildMonthCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: firstDay.getDay() }, () => null);
  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month, day));
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  return days;
};

const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getIsoDate = (date) => normalizeDate(date).toISOString();

const TaskInput = memo(({ taskText, onTaskTextChange, onAddTask, onInputFocus, onInputBlur }) => {
  const today = new Date();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const handleAddPress = useCallback(async () => {
    if (!taskText.trim()) return;
    await impact();
    setCalendarVisible(true);
  }, [onAddTask, taskText]);

  const confirmDate = useCallback(async () => {
    if (!selectedDate) {
      Alert.alert('Pick a due date', 'Please select a date from the calendar.');
      return;
    }
    await onAddTask(selectedDate);
    setCalendarVisible(false);
    setSelectedDate(null);
  }, [onAddTask, selectedDate]);

  useEffect(() => {
    if (!calendarVisible) {
      const today = new Date();
      setCalendarMonth(today.getMonth());
      setCalendarYear(today.getFullYear());
    }
  }, [calendarVisible]);

  const calendarDays = useMemo(() => buildMonthCalendar(calendarYear, calendarMonth), [calendarMonth, calendarYear]);
  const calendarRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);
  const monthLabel = useMemo(
    () => new Date(calendarYear, calendarMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [calendarMonth, calendarYear],
  );

  const changeMonth = useCallback((delta) => {
    setCalendarMonth((prevMonth) => {
      const month = prevMonth + delta;
      if (month < 0) {
        setCalendarYear((prevYear) => prevYear - 1);
        return 11;
      }
      if (month > 11) {
        setCalendarYear((prevYear) => prevYear + 1);
        return 0;
      }
      return month;
    });
  }, []);

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Assignment description"
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

      {calendarVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarModal}>
            <Text style={styles.modalTitle}>Pick a due date</Text>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.navButton} onPress={() => changeMonth(-1)}>
                <Text style={styles.navButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <TouchableOpacity style={styles.navButton} onPress={() => changeMonth(1)}>
                <Text style={styles.navButtonText}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarBody}>
              <View style={styles.weekRow}>
                {WEEK_DAYS.map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.calendarRow}>
                    {row.map((day, index) => {
                      const isSelected = day && selectedDate && normalizeDate(day).getTime() === normalizeDate(selectedDate).getTime();
                      return (
                        <TouchableOpacity
                          key={`${rowIndex}-${index}-${day ? day.getDate() : 'empty'}`}
                          style={[styles.dayCell, isSelected && styles.dayCellSelected, !day && styles.dayCellEmpty]}
                          onPress={() => day && setSelectedDate(day)}
                          disabled={!day}
                        >
                          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                            {day ? day.getDate() : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCalendarVisible(false);
                  setSelectedDate(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmDate}>
                <Text style={styles.confirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
    zIndex: 999,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#ff8c00',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addButtonText: {
    color: '#101010',
    fontWeight: '700',
  },
  deadlineLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
  },
  monthLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  calendarBody: {
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#172430',
  },
  weekDayText: {
    width: 44,
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  calendarGrid: {
    width: '100%',
    paddingHorizontal: 4,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayCell: {
    flexBasis: '13%',
    height: 44,
    marginHorizontal: 1,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellEmpty: {
    backgroundColor: '#111827',
    borderColor: '#0f192a',
  },
  dayCellSelected: {
    backgroundColor: '#ff8c00',
    borderColor: '#ffb347',
    borderWidth: 1,
  },
  dayText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#101010',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
    elevation: 20,
  },
  calendarModal: {
    width: 340,
    maxWidth: 380,
    alignSelf: 'center',
    backgroundColor: '#0f1729',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#172635',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
    zIndex: 10000,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#1f2937',
    marginRight: 10,
  },
  cancelText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#ff8c00',
  },
  confirmText: {
    color: '#101010',
    fontWeight: '700',
  },
  clearDateButton: {
    marginTop: 10,
  },
  clearDateText: {
    color: '#93c5fd',
    fontSize: 13,
  },
});

export default TaskInput;
