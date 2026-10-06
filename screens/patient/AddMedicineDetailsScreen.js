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
  const patientId = currentUser?.id || 'usr-patient-1';
  const [name, setName] = useState('Paracetamol XL2');
  const [dose, setDose] = useState('500 mg');
  const [times, setTimes] = useState(['8:00 AM', '1:00 PM', '8:00 PM']);
  const [newTimeInput, setNewTimeInput] = useState('1:00 PM');
  const [selectedInstruction, setSelectedInstruction] = useState('After lunch');
  const [notes, setNotes] = useState('Avoid if fever below 100°F');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddTime = () => {
    const trimmed = newTimeInput.trim();
    if (!trimmed) return;
    if (times.includes(trimmed)) {
      // Duplicates ignored
      return;
    }
    setTimes([...times, trimmed]);
    setNewTimeInput('');
  };

  const handleRemoveTime = (timeToRemove) => {
    setTimes(times.filter((t) => t !== timeToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg(t('medicineRequired'));
      return;
    }
    if (!dose.trim()) {
      setErrorMsg(t('dosageRequired'));
      return;
    }
    if (times.length === 0) {
      setErrorMsg(t('reminderRequired'));
      return;
    }

    setErrorMsg('');
    
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
      console.error('Error saving medicine:', error);
      setErrorMsg('Failed to save medicine. Please try again.');
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
