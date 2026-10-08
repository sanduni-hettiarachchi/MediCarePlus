import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import authService from '../../services/authService';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import MedicineCard from '../../components/MedicineCard';
import dbService from '../../services/db';

export default function RefillStatusScreen({ navigation, route }) {
  const doctor = route?.params?.doctor;
  const patientId = route?.params?.patientId;

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Patient ID is required</Text>
      </View>
    );
  }
  const [medicines, setMedicines] = useState([]);
  const [refillRequests, setRefillRequests] = useState([]);

  useEffect(() => {
    const stopMedicines = dbService.subscribeToMedicines(patientId, setMedicines);
    const stopRefills = dbService.subscribeToRefillRequests(patientId, setRefillRequests);
    return () => { stopMedicines?.(); stopRefills?.(); };
  }, [patientId]);

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Refill Status"
        subtitle="Mrs. Perera · Medication inventory"
        onBackPress={() => navigation?.navigate('HomeVisitSummary', { doctor })}
        onProfilePress={() => navigation?.navigate('DoctorProfile', { doctor })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => navigation?.navigate('HomeVisitSummary', { doctor })}
        >
          <Text style={styles.tabText}>Home visit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => navigation?.navigate('PatientVisits', { doctor })}
        >
          <Text style={styles.tabText}>Patient visits</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabBtn, styles.selectedTabBtn]}>
          <Text style={[styles.tabText, styles.selectedTabText]}>Refill status</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Read-only Banner */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>READ-ONLY</Text>
          <Text style={styles.instructionText}>
            Refills are handled by the pharmacist.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>MEDICATION REFILL LIST</Text>

        {medicines.map((m) => {
          const request = refillRequests.find((rr) => rr.medicineId === m.id);
          return (
            <MedicineCard
              key={m.id}
              medicine={m}
              showStockDays
              showRefillStatus
              refillRequest={request}
            />
          );
        })}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
    backgroundColor: '#F1F5F9',
  },
  selectedTabBtn: {
    backgroundColor: '#0D8F7A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  instructionCard: {
    backgroundColor: '#EAF5F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0D8F7A',
  },
  instructionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D8F7A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
});
