import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Button from '../../components/Button';
import Header from '../../components/Header';
import PatientText from '../../components/PatientText';
import UndoSnackbar from '../../components/UndoSnackbar';
import dbService from '../../services/db';
import { useT } from '../../i18n/LanguageContext';

export default function EditDeleteMedicineScreen({ navigation, route }) {
  const t = useT();
  const medicineId = route?.params?.medicineId || 'med-1';
  const [medicine, setMedicine] = useState(null);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState([]);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [undoData, setUndoData] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  useEffect(() => {
    const med = dbService.getMedicineById(medicineId);
    if (!med) return;
    setMedicine(med);
    setName(med.name);
    setDose(med.dose);
    setSelectedInstruction(med.mealInstruction || 'After lunch');
    setNotes(med.notes || '');
    setTimes(dbService.getReminderTimes(med.id).map((time) => time.timeStr));
  }, [medicineId]);

  const instructionOptions = [
    { value: 'Before food', key: 'beforeFood' },
    { value: 'After breakfast', key: 'afterBreakfast' },
    { value: 'After lunch', key: 'afterLunch' },
    { value: 'After dinner', key: 'afterDinner' },
    { value: 'With water only', key: 'withWaterOnly' },
  ];

  const handleAddTime = () => {
    const trimmed = newTimeInput.trim();
    if (!trimmed || times.includes(trimmed)) return;
    setTimes((current) => [...current, trimmed]);
    setNewTimeInput('');
  };

  const handleSaveChanges = async () => {
    if (!name.trim() || !dose.trim() || times.length === 0) return;
    await dbService.updateMedicine(medicineId, {
      name: name.trim(),
      dose: dose.trim(),
      mealInstruction: selectedInstruction,
      notes: notes.trim(),
    }, times);
    navigation?.navigate('YourMedicines');
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    const res = await dbService.deleteMedicine(medicineId);
    setUndoData(res);
    setSnackbarMsg(t('deletedMedicine', { name }));
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setSnackbarMsg('');
      setUndoData(null);
      navigation?.navigate('YourMedicines');
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!undoData) return;
    dbService.restoreMedicine(undoData.medicine, undoData.times);
    setUndoData(null);
    setSnackbarMsg('');
    navigation?.navigate('YourMedicines');
  };

  const handleSnackbarDismiss = () => {
    setSnackbarMsg('');
    setUndoData(null);
    navigation?.navigate('YourMedicines');
  };

  if (!medicine) return null;

  return (
    <View style={styles.container}>
      <Header title={t('editMedicine')} subtitle={t('updateDetailsBelow')} onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.activeCard}>
          <PatientText style={styles.activeMedName}>{medicine.name}</PatientText>
          <View style={styles.activeTag}><PatientText style={styles.activeTagText}>{t('currentlyActive')}</PatientText></View>
        </View>

        <View style={styles.fieldGroup}>
          <PatientText style={styles.label}>{t('medicineName')}</PatientText>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>
        <View style={styles.fieldGroup}>
          <PatientText style={styles.label}>{t('dosage')}</PatientText>
          <TextInput style={styles.input} value={dose} onChangeText={setDose} />
        </View>

        <View style={styles.fieldGroup}>
          <PatientText style={styles.label}>{t('timesToTake', { count: times.length })}</PatientText>
          <View style={styles.chipsRow}>
            {times.map((time) => (
              <View key={time} style={styles.timeChip}>
                <PatientText style={styles.timeChipText}>{time}</PatientText>
                <TouchableOpacity onPress={() => setTimes((current) => current.filter((item) => item !== time))} style={styles.chipRemoveBtn}>
                  <PatientText style={styles.chipRemoveIcon}>✕</PatientText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addTimeRow}>
            <TextInput style={styles.timeInput} value={newTimeInput} onChangeText={setNewTimeInput} placeholder={t('timePlaceholder')} />
            <TouchableOpacity style={styles.addTimeBtn} onPress={handleAddTime}>
              <PatientText style={styles.addTimeBtnText}>{t('addTime')}</PatientText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <PatientText style={styles.label}>{t('instructions')}</PatientText>
          <View style={styles.instructionsWrap}>
            {instructionOptions.map((option) => {
              const selected = selectedInstruction === option.value;
              return (
                <TouchableOpacity key={option.value} style={[styles.instChip, selected && styles.selectedInstChip]} onPress={() => setSelectedInstruction(option.value)}>
                  <PatientText style={[styles.instChipText, selected && styles.selectedInstChipText]}>{t(option.key)}</PatientText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <PatientText style={styles.label}>{t('notesOptional')}</PatientText>
        <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} multiline />
        <Button title={t('saveChanges')} onPress={handleSaveChanges} style={styles.saveBtn} />
        <Button title={t('deleteMedicine')} variant="danger-outline" onPress={() => setShowDeleteModal(true)} style={styles.deleteBtn} />
      </ScrollView>

      <BottomSheetConfirmation
        visible={showDeleteModal}
        title={t('deleteMedicineTitle')}
        message={t('deleteMedicineMessage', { name })}
        confirmLabel={t('deleteMedicine')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
      <UndoSnackbar message={snackbarMsg} onUndo={handleUndoDelete} onDismiss={handleSnackbarDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  activeCard: { backgroundColor: '#EAF5F2', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  activeMedName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  activeTag: { backgroundColor: '#0B7666', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeTagText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: '#4B5563', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0F172A', backgroundColor: '#F8FAFC' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginRight: -4, marginBottom: 12 },
  timeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  timeChipText: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginRight: 6 },
  chipRemoveBtn: { padding: 2 },
  chipRemoveIcon: { fontSize: 14, color: '#4B5563', fontWeight: '700' },
  addTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeInput: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#0F172A', backgroundColor: '#F8FAFC' },
  addTimeBtn: { backgroundColor: '#0B7666', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  addTimeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  instructionsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginRight: -4 },
  instChip: { backgroundColor: '#F1F5F9', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  selectedInstChip: { backgroundColor: '#0B7666' },
  instChipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  selectedInstChipText: { color: '#FFFFFF' },
  saveBtn: { marginTop: 10, marginBottom: 8 },
  deleteBtn: { marginBottom: 20 },
});
