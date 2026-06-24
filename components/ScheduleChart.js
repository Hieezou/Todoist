import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getScheduleFile = (userId) =>
  userId ? `${FileSystem.documentDirectory}todoist_schedule_${userId}.json` : `${FileSystem.documentDirectory}todoist_schedule.json`;

export default function ScheduleChart({ currentUser }) {
  const [schedule, setSchedule] = useState(() => {
    const base = {};
    DAYS.forEach(d => (base[d] = ''));
    return base;
  });
  const [editingDay, setEditingDay] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!currentUser) return;
      try {
        const path = getScheduleFile(currentUser.id);
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return;
        const raw = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && mounted) setSchedule(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.warn('Failed to load schedule', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [currentUser]);

  const saveSchedule = async (next) => {
    try {
      const path = getScheduleFile(currentUser?.id);
      await FileSystem.writeAsStringAsync(path, JSON.stringify(next), { encoding: FileSystem.EncodingType.UTF8 });
      setSchedule(next);
    } catch (err) {
      console.error('Save schedule failed', err);
      Alert.alert('Save failed', 'Could not save your schedule.');
    }
  };

  const openEditor = (day) => {
    setEditingDay(day);
    setEditingText(schedule[day] || '');
  };

  const onSave = async () => {
    const next = { ...schedule, [editingDay]: editingText };
    await saveSchedule(next);
    setEditingDay(null);
    setEditingText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Schedule</Text>
      <View style={styles.grid}>
        {DAYS.map((day) => (
          <TouchableOpacity key={day} style={styles.cell} onPress={() => openEditor(day)}>
            <Text style={styles.cellTitle}>{day}</Text>
            <ScrollView style={styles.cellBody}>
              <Text style={styles.cellText} numberOfLines={6}>{schedule[day]}</Text>
            </ScrollView>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={!!editingDay} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit {editingDay}</Text>
            <TextInput
              multiline
              value={editingText}
              onChangeText={setEditingText}
              style={styles.modalInput}
              placeholder={`Enter schedule for ${editingDay}`}
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setEditingDay(null); setEditingText(''); }} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={styles.modalButtonSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  header: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '30%',
    minHeight: 110,
    backgroundColor: '#0b1220',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#173047',
  },
  notesCell: {
    width: '100%',
  },
  cellTitle: {
    color: '#cbd5e1',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 13,
  },
  cellBody: {
    maxHeight: 80,
  },
  cellText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0f1729',
    borderRadius: 14,
    padding: 12,
  },
  modalTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    marginBottom: 8,
  },
  modalInput: {
    minHeight: 140,
    backgroundColor: '#08101a',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalButtonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginRight: 8,
  },
  modalButtonSave: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#ff8c00',
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
