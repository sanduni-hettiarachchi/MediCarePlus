import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import authService from '../../services/authService';
import Button from '../../components/Button';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import PrescriptionCard from '../../components/PrescriptionCard';

export default function PrescriptionsRefillsScreen({ navigation, route }) {
  const doctor = route?.params?.doctor;
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'dr-rx-1',
      doctorName: 'Dr. K. Silva (SLMC #12345)',
      date: '18 Sep 2026',
      status: 'Finalized',
      instructions:
        '1. Metformin 500mg (2x daily after meals)\n2. Blood pressure tablet (1x daily morning)\n3. DPP-4 Inhibitors 100mg (1x evening)',
    },
  ]);

  const handleAddNewRx = () => {
    const newRx = {
      id: `dr-rx-${Date.now()}`,
      doctorName: 'Dr. K. Silva (SLMC #12345)',
      date: 'Today',
      status: 'Finalized',
      instructions: '1. Atorvastatin 10mg (1x daily at night)',
    };
    setPrescriptions([newRx, ...prescriptions]);
  };

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Prescriptions & Refills"
        subtitle="Mrs. Perera · Active medication orders"
        onBackPress={() => navigation?.navigate('HomeVisitSummary', { doctor })}
        onProfilePress={() => navigation?.navigate('DoctorProfile', { doctor })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>FINALIZED PRESCRIPTIONS</Text>

        {prescriptions.map((rx) => (
          <PrescriptionCard key={rx.id} prescription={rx} />
        ))}

        <Button
          title="+ Add New Doctor Prescription"
          onPress={handleAddNewRx}
          style={styles.addBtn}
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
  addBtn: {
    marginTop: 8,
  },
});
