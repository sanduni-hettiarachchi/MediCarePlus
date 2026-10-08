import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import Text from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';

export default function AddMedicineDetailsScreen({ navigation, currentUser }) {
  const t = useT();
  const patientId = currentUser?.id;
  if (!patientId) {
    throw new Error('Patient ID is required');
  }
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState([]);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddTime = () => {
    const trimmed = newTimeInput.trim();
    if (!trimmed) {
      setErrorMsg('Enter a time like 1:00 PM');
      return;
    }

    // Parse and normalize time formats
    let normalizedTime;
    try {
      normalizedTime = normalizeTime(trimmed);
    } catch (e) {
      setErrorMsg('Enter a time like 1:00 PM');
      return;
    }

    if (times.includes(normalizedTime)) {
      setErrorMsg('This time is already added');
      return;
    }

    setTimes([...times, normalizedTime]);
    setNewTimeInput('');
    setErrorMsg('');
  };

  const normalizeTime = (timeStr) => {
    // Handle formats: "1:00 PM", "1.00pm", "13:00", "1pm"
    const lower = timeStr.toLowerCase().replace(/\./g, ':');
    
    // Extract hours and minutes
    let hours, minutes, isPM = false;
    
    if (lower.includes('pm')) {
      isPM = true;
      const timePart = lower.replace('pm', '').trim();
      const parts = timePart.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    } else if (lower.includes('am')) {
      const timePart = lower.replace('am', '').trim();
      const parts = timePart.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    } else {
      // 24-hour format or just hours
      const parts = lower.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
      if (hours >= 12) {
        isPM = true;
        if (hours > 12) hours -= 12;
      }
    }

    // Validate
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error('Invalid time');
    }
    if (hours < 0 || hours > 23) {
      throw new Error('Invalid hours');
    }
    if (minutes < 0 || minutes > 59) {
      throw new Error('Invalid minutes');
    }

    // Convert to 12-hour format
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    const formattedHours = date.getHours() % 12 || 12;
    const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const handleRemoveTime = (timeToRemove) => {
    setTimes(times.filter((t) => t !== timeToRemove));
  };

  const handleSave = async () => {
    if (!name.trim() || !dose.trim() || times.length === 0) {
      setErrorMsg('Please fill in medicine name, dosage, and at least one time.');
      return;
    }

    try {
      const newMed = await dbService.addMedicine(
        {
          patientId,
          name: name.trim(),
          dose: dose.trim(),
          mealInstruction: selectedInstruction,
          notes: notes.trim(),
          stockDays: 30,
          active: true,
          refillStatus: 'OK',
        },
        times
      );

      navigation?.navigate('MedicineAdded', { medicine: newMed.medicine, times });
    } catch (error) {
      console.error('AddMedicineDetailsScreen handleSave ERROR:', error, error?.code, error?.message);
      setErrorMsg(`Failed to save medicine [${error?.code || 'unknown'}]: ${error?.message || error}. Please try again.`);
    }
  };

  const instructionsList = [
    { value: 'Before food', key: 'beforeFood' },
    { value: 'After breakfast', key: 'afterBreakfast' },
    { value: 'After lunch', key: 'afterLunch' },
    { value: 'After dinner', key: 'afterDinner' },
    { value: 'With water only', key: 'withWaterOnly' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={t('addMedicine')}
        subtitle={t('enterDetailsBelow')}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {/* Medicine Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('medicineName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('medicineNamePlaceholder')}
            autoComplete="off"
          />
        </View>

        {/* Dosage */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('dosage')}</Text>
          <TextInput
            style={styles.input}
            value={dose}
            onChangeText={setDose}
            placeholder={t('dosagePlaceholder')}
            autoComplete="off"
          />
        </View>

        {/* Times Section */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('timesToTake', { count: times.length })}
          </Text>

          {/* Time chips */}
          <View style={styles.chipsRow}>
            {times.map((t) => (
              <View key={t} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{t}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTime(t)}
                  style={styles.chipRemoveBtn}
                >
                  <Text style={styles.chipRemoveIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Time Controls */}
          <View style={styles.addTimeRow}>
            <TextInput
              style={styles.timeInput}
              value={newTimeInput}
              onChangeText={setNewTimeInput}
              placeholder={t('timePlaceholder')}
              autoComplete="off"
            />
            <TouchableOpacity style={styles.addTimeBtn} onPress={handleAddTime}>
              <Text style={styles.addTimeBtnText}>{t('addTime')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('instructions')}</Text>
          <View style={styles.instructionsWrap}>
            {instructionsList.map((inst) => {
              const isSel = selectedInstruction === inst.value;
              return (
                <TouchableOpacity
                  key={inst.value}
                  style={[styles.instChip, isSel && styles.selectedInstChip]}
                  onPress={() => setSelectedInstruction(inst.value)}
                >
                  <Text style={[styles.instChipText, isSel && styles.selectedInstChipText]}>
                    {t(inst.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('notesOptional')}</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('notesPlaceholder')}
            autoComplete="off"
          />
        </View>

        <Button
          title={t('saveMedicine')}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 6,
  },
  chipRemoveBtn: {
    padding: 2,
  },
  chipRemoveIcon: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  addTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  addTimeBtn: {
    backgroundColor: '#0B7666',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  instChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedInstChip: {
    backgroundColor: '#0B7666',
  },
  instChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  selectedInstChipText: {
    color: '#FFFFFF',
  },
  saveBtn: {
    marginTop: 10,
  },
});
