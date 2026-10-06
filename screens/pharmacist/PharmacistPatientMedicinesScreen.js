import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
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

export default function PharmacistPatientMedicinesScreen({ navigation, route }) {
  const pharmacist = route?.params?.pharmacist || {
    name: 'Mr. Jayasuriya',
    pharmacyRegNo: 'PH-778',
  };
  const patientId = route?.params?.patientId || 'usr-patient-1';

  const [activeFilter, setActiveFilter] = useState('All medicines'); // 'All medicines' or 'Needs refill'
  const [medicines, setMedicines] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [refillRequests, setRefillRequests] = useState([]);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [medicineToRefill, setMedicineToRefill] = useState(null);

  useEffect(() => {
    const stopRefillSummary = dbService.subscribeToRefillSummary(patientId, setMedicines);
    const stopRefills = dbService.subscribeToRefillRequests(patientId, setRefillRequests);
    return () => { stopRefillSummary?.(); stopRefills?.(); };
  }, [patientId]);

  const handleMarkRefilled = (medId, medName) => {
    setMedicineToRefill({ id: medId, name: medName });
    setShowConfirmSheet(true);
  };

  const handleConfirmRefill = async () => {
    if (!medicineToRefill) return;
    setShowConfirmSheet(false);
    await dbService.markRefilled(medicineToRefill.medicineId || medicineToRefill.id, pharmacist.id || 'usr-pharmacist-1', pharmacist.name || 'Pharmacist');
    setToastMsg(`${medicineToRefill.name} marked as refilled`);
    setTimeout(() => setToastMsg(''), 3500);
    setMedicineToRefill(null);
  };

  const filtered = medicines.filter((m) => {
    if (activeFilter === 'Needs refill') {
      // Filter to 7 days or less (Page 35)
      return (m.stockDays <= 7) || (m.status !== 'OK');
    }
    return true;
  });
  const medicinesNeedingRefill = medicines.filter((medicine) => medicine.stockDays <= 7 || medicine.status !== 'OK').length;

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Patient medicines"
        subtitle="Mrs. Perera · read-only access"
        onProfilePress={() => navigation?.navigate('PharmacistProfile', { pharmacist })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      <View style={styles.summaryBanner}>
        <Text style={styles.summaryText}>{medicinesNeedingRefill} medicines need refill</Text>
      </View>

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
        {filtered.length === 0 ? <Text style={styles.emptyText}>No medicines for this patient.</Text> : null}
        {filtered.map((item) => (
          <MedicineCard
            key={item.id}
            medicine={item}
            showStockDays
            showRefillStatus
            onMarkRefilled={() => handleMarkRefilled(item, item.name)}
          />
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
  emptyText: { color: '#4B5563', fontSize: 16, textAlign: 'center', paddingVertical: 24 },
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
});
