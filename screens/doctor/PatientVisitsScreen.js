import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import authService from '../../services/authService';
import ClinicianTopBar from '../../components/ClinicianTopBar';

export default function PatientVisitsScreen({ navigation, route }) {
  const doctor = route?.params?.doctor;

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Patient Visits"
        subtitle="Mrs. Perera · Visit history"
        onBackPress={() => navigation?.navigate('HomeVisitSummary', { doctor })}
        onProfilePress={() => navigation?.navigate('DoctorProfile', { doctor })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>PAST VISITS & CONSULTATIONS</Text>

        <View style={styles.visitCard}>
          <View style={styles.visitHeader}>
            <Text style={styles.visitTitle}>Routine Follow-up</Text>
            <Text style={styles.visitDate}>18 Sep 2026</Text>
          </View>
          <Text style={styles.doctorName}>Dr. K. Silva (SLMC #12345)</Text>
          <Text style={styles.visitNotes}>
            Patient reported occasional dizziness. Adjusted BP medication time to morning.
          </Text>
        </View>

        <View style={styles.visitCard}>
          <View style={styles.visitHeader}>
            <Text style={styles.visitTitle}>Initial Assessment</Text>
            <Text style={styles.visitDate}>01 Aug 2026</Text>
          </View>
          <Text style={styles.doctorName}>Dr. K. Silva (SLMC #12345)</Text>
          <Text style={styles.visitNotes}>
            Diagnosed hypertension & T2 diabetes. Commenced Metformin 500mg and BP tablet regimen.
          </Text>
        </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  visitCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  visitDate: {
    fontSize: 12,
    color: '#64748B',
  },
  doctorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D8F7A',
    marginBottom: 8,
  },
  visitNotes: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 19,
  },
});
