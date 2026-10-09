import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import authService from '../../services/authService';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import MedicineCard from '../../components/MedicineCard';
import dbService from '../../services/db';
import PatientText from '../../components/PatientText';

const Text = PatientText;

export default function PharmacistPatientMedicinesScreen({ navigation, route, currentUser }) {
  const pharmacist = route?.params?.pharmacist || (route?.params?.doctor?.role === 'pharmacist' ? route.params.doctor : null) || currentUser || {
    name: 'Mr. Jayasuriya',
    pharmacyRegNo: 'PH-778',
  };
  const [patientId, setPatientId] = useState(route?.params?.patientId || '');
  const [patientName, setPatientName] = useState(route?.params?.patientName || '');
  const [patientLoadError, setPatientLoadError] = useState('');
  const [localOnlyMode, setLocalOnlyMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All medicines'); // 'All medicines' or 'Needs refill'
  const [medicines, setMedicines] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [refillRequests, setRefillRequests] = useState([]);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [medicineToRefill, setMedicineToRefill] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [dose, setDose] = useState('');
  const [stockDays, setStockDays] = useState('30');
  const [medicineTime, setMedicineTime] = useState('9:00 AM');
  const [mealInstruction, setMealInstruction] = useState('After meal');
  const [medicineNotes, setMedicineNotes] = useState('');
  const [editorError, setEditorError] = useState('');
  const [savingMedicine, setSavingMedicine] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const resolvePatient = async () => {
      if (route?.params?.patientId) {
        setPatientId(route.params.patientId);
        setPatientName(route.params.patientName || '');
        return;
      }
      try {
        const patients = await dbService.getPatientsForProfessional(pharmacist.id);
        if (cancelled) return;
        const patient = patients[0];
        if (patient) {
          setPatientId(patient.patientId);
          setPatientName(route?.params?.patientName || patient.name);
        }
      } catch (error) {
        if (!cancelled) {
          setLocalOnlyMode(true);
          setPatientId('usr-patient-1');
          setPatientName('Mrs. Perera · Demo');
          setPatientLoadError('Demo medicines are shown because Firebase access is blocked. Changes are saved on this device only.');
        }
      }
    };
    resolvePatient();
    return () => { cancelled = true; };
  }, [pharmacist.id, route?.params?.patientId, route?.params?.patientName]);

  useEffect(() => {
    if (!patientId) return undefined;
    const stopMedicines = dbService.subscribeToMedicines(patientId, setMedicines, () => {
      setLocalOnlyMode(true);
      setMedicines(dbService.getMedicines(patientId));
      setPatientLoadError('Firebase access is blocked. Changes are saved on this device only.');
    });
    const stopRefills = dbService.subscribeToRefillRequests(patientId, setRefillRequests, () => {
      setLocalOnlyMode(true);
      setRefillRequests(dbService.getRefillRequests(patientId));
      setPatientLoadError('Firebase access is blocked. Changes are saved on this device only.');
    });
    return () => { stopMedicines?.(); stopRefills?.(); };
  }, [patientId]);

  const refreshMedicines = () => {
    setMedicines(dbService.getMedicines(patientId));
    setRefillRequests(dbService.getRefillRequests(patientId));
  };

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleMarkRefilled = (medicine) => {
    setMedicineToRefill(medicine);
    setShowConfirmSheet(true);
  };

  const handleConfirmRefill = async () => {
    if (!medicineToRefill) return;
    setShowConfirmSheet(false);
    try {
      await dbService.markRefilled(medicineToRefill.id, pharmacist.id || 'usr-pharmacist-1', pharmacist.name || 'Pharmacist', { localOnly: localOnlyMode });
      refreshMedicines();
      showToast(`${medicineToRefill.name} marked as refilled`);
    } catch (error) {
      showToast(error.message || 'Could not update refill status.');
    } finally {
      setMedicineToRefill(null);
    }
  };

  const openAddMedicine = () => {
    setEditingMedicine(null);
    setMedicineName('');
    setDose('');
    setStockDays('30');
    setMedicineTime('9:00 AM');
    setMealInstruction('After meal');
    setMedicineNotes('');
    setEditorError('');
    setEditorVisible(true);
  };

  const openEditMedicine = (medicine) => {
    const reminderTimes = dbService.getReminderTimes(medicine.id).map((item) => item.time || item.timeStr).filter(Boolean);
    setEditingMedicine(medicine);
    setMedicineName(medicine.name || '');
    setDose(medicine.dose || '');
    setStockDays(String(medicine.stockDays ?? 30));
    setMedicineTime(reminderTimes.join(', ') || medicine.time || '9:00 AM');
    setMealInstruction(medicine.mealInstruction || 'After meal');
    setMedicineNotes(medicine.notes || '');
    setEditorError('');
    setEditorVisible(true);
  };

  const handleSaveMedicine = async () => {
    const parsedStockDays = Number(stockDays);
    const times = medicineTime.split(',').map((time) => time.trim()).filter(Boolean);
    if (!medicineName.trim() || !dose.trim()) {
      setEditorError('Medicine name and dose are required.');
      return;
    }
    if (!Number.isInteger(parsedStockDays) || parsedStockDays < 0) {
      setEditorError('Stock days must be a whole number of 0 or more.');
      return;
    }
    if (times.length === 0) {
      setEditorError('Enter at least one dose time. Separate multiple times with commas.');
      return;
    }

    const refillStatus = parsedStockDays === 0 ? 'Out of stock' : parsedStockDays <= 3 ? 'Refill now' : parsedStockDays <= 7 ? 'Refill soon' : 'OK';
    const medicineData = {
      patientId,
      name: medicineName.trim(),
      dose: dose.trim(),
      stockDays: parsedStockDays,
      mealInstruction: mealInstruction.trim(),
      notes: medicineNotes.trim(),
      refillStatus,
      active: true,
    };

    setSavingMedicine(true);
    setEditorError('');
    try {
      if (editingMedicine) {
        await dbService.updateMedicine(editingMedicine.id, medicineData, times, { localOnly: localOnlyMode });
        showToast('Medicine updated');
      } else {
        await dbService.addMedicine(medicineData, times, { localOnly: localOnlyMode });
        showToast('Medicine added');
      }
      refreshMedicines();
      setEditorVisible(false);
    } catch (error) {
      setEditorError(error.message || 'Could not save medicine.');
    } finally {
      setSavingMedicine(false);
    }
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete) return;
    try {
      await dbService.deleteMedicine(medicineToDelete.id, patientId, { localOnly: localOnlyMode });
      refreshMedicines();
      showToast(`${medicineToDelete.name} deleted`);
    } catch (error) {
      showToast(error.message || 'Could not delete medicine.');
    } finally {
      setMedicineToDelete(null);
    }
  };

  const needsRefill = (medicine) => Number(medicine.stockDays ?? 30) <= 7 || (medicine.refillStatus && medicine.refillStatus !== 'OK');
  const filtered = medicines.filter((m) => {
    if (activeFilter === 'Needs refill') {
      return needsRefill(m);
    }
    return true;
  });
  const medicinesNeedingRefill = medicines.filter(needsRefill).length;

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Patient medicines"
        subtitle={patientName ? `${patientName} · pharmacy access` : 'Loading shared patient'}
        onProfilePress={() => navigation?.navigate('PharmacistProfile', { pharmacist })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      <View style={styles.summaryBanner}>
        <Text style={styles.summaryText}>{medicinesNeedingRefill} medicines need refill</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddMedicine} disabled={!patientId}>
          <Text style={styles.addButtonText}>+ Add medicine</Text>
        </TouchableOpacity>
      </View>
      {localOnlyMode ? (
        <View style={styles.localOnlyBanner}>
          <Text style={styles.localOnlyText}>{patientLoadError || 'Demo data · changes are saved on this device only.'}</Text>
        </View>
      ) : null}

      {/* Filter Tabs: All medicines / Needs refill */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'All medicines' && styles.selectedTabBtn]}
          onPress={() => setActiveFilter('All medicines')}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === 'All medicines' && styles.selectedTabText,
            ]}
          >
            All medicines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'Needs refill' && styles.selectedTabBtn]}
          onPress={() => setActiveFilter('Needs refill')}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === 'Needs refill' && styles.selectedTabText,
            ]}
          >
            Needs refill
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!patientId ? <Text style={styles.emptyText}>{patientLoadError || 'No patient has shared medicine access with this pharmacy.'}</Text> : null}
        {patientId && filtered.length === 0 ? <Text style={styles.emptyText}>{activeFilter === 'Needs refill' ? 'No medicines currently need a refill.' : 'No medicines for this patient.'}</Text> : null}
        {filtered.map((item) => (
          <View key={item.id} style={styles.medicineItem}>
            <MedicineCard
              medicine={item}
              showStockDays
              showRefillStatus
              onMarkRefilled={() => handleMarkRefilled(item)}
            />
            <View style={styles.medicineActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditMedicine(item)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => setMedicineToDelete(item)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {refillRequests.length > 0 ? (
          <View style={styles.refillRequestSection}>
            <Text style={styles.refillRequestTitle}>REFILL REQUESTS</Text>
            {refillRequests.map((request) => (
              <View key={request.id} style={styles.refillRequestRow}>
                <Text style={styles.refillRequestMedicine}>{request.medicineName || dbService.getMedicineById(request.medicineId)?.name || 'Medicine'}</Text>
                <Text style={styles.refillRequestStatus}>{request.status}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Toast Notification Banner (Page 34/35) */}
      {toastMsg ? (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.editorSheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.editorTitle}>{editingMedicine ? 'Edit medicine' : 'Add medicine'}</Text>
              {editorError ? <Text style={styles.editorError}>{editorError}</Text> : null}
              <Text style={styles.fieldLabel}>MEDICINE NAME</Text>
              <TextInput style={styles.input} value={medicineName} onChangeText={setMedicineName} placeholder="Medicine name" />
              <Text style={styles.fieldLabel}>DOSE</Text>
              <TextInput style={styles.input} value={dose} onChangeText={setDose} placeholder="e.g. 1 tablet, 500 mg" />
              <Text style={styles.fieldLabel}>DAYS OF STOCK</Text>
              <TextInput style={styles.input} value={stockDays} onChangeText={setStockDays} keyboardType="number-pad" placeholder="30" />
              <Text style={styles.fieldLabel}>DOSE TIMES</Text>
              <TextInput style={styles.input} value={medicineTime} onChangeText={setMedicineTime} placeholder="8:00 AM, 8:00 PM" />
              <Text style={styles.fieldLabel}>MEAL INSTRUCTION</Text>
              <TextInput style={styles.input} value={mealInstruction} onChangeText={setMealInstruction} placeholder="After meal" />
              <Text style={styles.fieldLabel}>NOTES</Text>
              <TextInput style={[styles.input, styles.notesInput]} value={medicineNotes} onChangeText={setMedicineNotes} multiline placeholder="Optional" />
              <View style={styles.editorActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditorVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedicine} disabled={savingMedicine}>
                  <Text style={styles.saveButtonText}>{savingMedicine ? 'Saving...' : 'Save medicine'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirm Refill Sheet */}
      <BottomSheetConfirmation
        visible={showConfirmSheet}
        title="Mark as refilled"
        message={`Mark ${medicineToRefill?.name || 'this medicine'} as refilled?`}
        onCancel={() => {
          setShowConfirmSheet(false);
          setMedicineToRefill(null);
        }}
        onConfirm={handleConfirmRefill}
      />
      <BottomSheetConfirmation
        visible={Boolean(medicineToDelete)}
        title="Delete medicine?"
        message={`Delete ${medicineToDelete?.name || 'this medicine'} from ${patientName || 'this patient'}'s list?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setMedicineToDelete(null)}
        onConfirm={handleDeleteMedicine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryBanner: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  summaryText: { color: '#1F2937', fontSize: 14, fontWeight: '700' },
  localOnlyBanner: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF7ED', borderBottomWidth: 1, borderBottomColor: '#FED7AA' },
  localOnlyText: { color: '#9A3412', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  addButton: { alignSelf: 'flex-start', marginTop: 9, backgroundColor: '#0D8F7A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#4B5563', fontSize: 16, textAlign: 'center', paddingVertical: 24 },
  medicineItem: { marginBottom: 8 },
  medicineActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -5, marginBottom: 8, gap: 8 },
  editButton: { borderWidth: 1, borderColor: '#0D8F7A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  editButtonText: { color: '#0D7668', fontSize: 13, fontWeight: '700' },
  deleteButton: { borderWidth: 1, borderColor: '#DC2626', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  deleteButtonText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },
  refillRequestSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 14 },
  refillRequestTitle: { color: '#374151', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  refillRequestRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  refillRequestMedicine: { flex: 1, color: '#1F2937', fontSize: 14 },
  refillRequestStatus: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: 4,
    backgroundColor: '#F1F5F9',
  },
  selectedTabBtn: {
    backgroundColor: '#0D8F7A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  editorSheet: { maxHeight: '90%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 },
  editorTitle: { color: '#0F172A', fontSize: 21, fontWeight: '800', marginBottom: 16 },
  editorError: { color: '#B91C1C', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  fieldLabel: { color: '#475569', fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 11 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, color: '#0F172A', backgroundColor: '#F8FAFC', fontSize: 15 },
  notesInput: { minHeight: 68, textAlignVertical: 'top' },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  cancelButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 11 },
  cancelButtonText: { color: '#334155', fontSize: 14, fontWeight: '700' },
  saveButton: { backgroundColor: '#0D8F7A', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
