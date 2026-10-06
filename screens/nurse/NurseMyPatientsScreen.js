import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import authService from '../../services/authService';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import PatientCard from '../../components/PatientCard';

const initialPatientsList = [
  {
    id: 'p1',
    name: 'Mrs. Perera',
    age: '72 y',
    conditions: 'Hypertension, T2 Diabetes',
    adherence: 64,
    statusTag: 'Needs attention',
    reviewed: false,
  },
  {
    id: 'p2',
    name: 'Mr. Fernando',
    age: '68 y',
    conditions: 'Hypertension',
    adherence: 90,
    statusTag: 'On track',
    reviewed: true,
  },
  {
    id: 'p3',
    name: 'Ms. Jayawardena',
    age: '64 y',
    conditions: 'Arthritis',
    adherence: 86,
    statusTag: 'On track',
    reviewed: false,
  },
];

export default function NurseMyPatientsScreen({ navigation, route }) {
  const nurse = route?.params?.nurse || { name: 'Nurse Dilani', nurseId: 'N-2041' };
  const [patients, setPatients] = useState(initialPatientsList);

  const handleToggleReviewed = (patientId) => {
    setPatients(
      patients.map((p) =>
        p.id === patientId ? { ...p, reviewed: !p.reviewed } : p
      )
    );
  };

  const needingCount = patients.filter((p) => p.adherence < 70).length;

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="My Patients"
        subtitle={`${nurse.name || 'Nurse Dilani'} · ${needingCount} needing attention`}
        colorScheme="blue"
        onProfilePress={() => navigation?.navigate('NurseProfile', { nurse })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>ASSIGNED PATIENTS</Text>

        {patients.map((item) => (
          <PatientCard
            key={item.id}
            patient={item}
            onPress={() => navigation?.navigate('NursePatientDetail', { patient: item, nurse })}
            onMarkReviewed={() => handleToggleReviewed(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
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
});
