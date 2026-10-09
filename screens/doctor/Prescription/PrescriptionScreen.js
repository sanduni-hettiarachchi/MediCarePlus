import React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../../../components/Button';
import Header from '../../../components/Header';
import dbService from '../../../services/db';

export default function PrescriptionScreen({ navigation, route, onBack }) {
  const doctor = route?.params?.doctor || { name: 'Dr. K. Silva', slmcNumber: '12345' };
  const patientId = route?.params?.patientId;
  const [prescription, setPrescription] = useState({
    medicine: '',
    dose: '',
    frequency: '',
    duration: '',
    registrationNumber: doctor.slmcNumber || '',
  });
  const [source, setSource] = useState('manual');
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setPrescription((current) => ({ ...current, [key]: value }));

  const finalizePrescription = async () => {
    if (!patientId) {
      setError('Select a patient before saving a prescription.');
      return;
    }
    if (!prescription.medicine.trim() || !prescription.dose.trim() || !prescription.frequency.trim() || !prescription.duration.trim()) {
      setError('Medicine, dose, frequency, and duration are required.');
      return;
    }
    if (!prescription.registrationNumber.trim()) {
      setError('Doctor registration number is required.');
      return;
    }
    try {
      await dbService.createPrescription({
        patientId,
        doctorId: doctor.id || doctor.uid,
        doctorName: doctor.name,
        registrationNumber: prescription.registrationNumber.trim(),
        medicine: prescription.medicine.trim(),
        dose: prescription.dose.trim(),
        frequency: prescription.frequency.trim(),
        duration: prescription.duration.trim(),
        status: 'active',
        source,
      });
      setError('');
      setFinalized(true);
    } catch (saveError) {
      setError(saveError.message || 'Could not save this prescription.');
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="New prescription" subtitle="Doctor-only prescription entry" onBack={() => (onBack ? onBack() : navigation?.goBack())} />
      <Text style={styles.eyebrow}>DOCTOR WORKSPACE</Text>
      <Text style={styles.title}>New prescription</Text>
      <Text style={styles.subtitle}>Verify every detail before finalizing this patient record.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.switcher}>
        <TouchableOpacity style={[styles.switch, source === 'manual' && styles.activeSwitch]} onPress={() => setSource('manual')}>
          <Text style={styles.switchText}>Enter manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.switch, source === 'photo' && styles.activeSwitch]} onPress={() => setSource('photo')}>
          <Text style={styles.switchText}>Upload photo</Text>
        </TouchableOpacity>
      </View>

      {source === 'photo' && (
        <TouchableOpacity style={styles.uploadBox} onPress={() => {}}>
          <Text style={styles.uploadIcon}>+</Text>
          <Text style={styles.uploadTitle}>Add handwritten prescription</Text>
          <Text style={styles.uploadHint}>The photo is stored for review. It will not create medication orders automatically.</Text>
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prescription details</Text>
        {[['medicine', 'Medicine name'], ['dose', 'Dosage e.g. 500 mg'], ['frequency', 'Frequency e.g. Twice daily'], ['duration', 'Duration e.g. 30 days']].map(([key, placeholder]) => (
          <TextInput key={key} editable={!finalized} style={styles.input} placeholder={placeholder} placeholderTextColor="#9AA8A0" value={prescription[key]} onChangeText={(value) => update(key, value)} />
        ))}
        <TextInput editable={!finalized} style={styles.input} placeholder="SLMC registration number" placeholderTextColor="#9AA8A0" value={prescription.registrationNumber} onChangeText={(value) => update('registrationNumber', value)} />
        <Text style={styles.helper}>This identifies the responsible verified doctor. It cannot be changed after finalization.</Text>
      </View>

      {finalized ? (
        <View style={styles.finalized}>
          <Text style={styles.finalizedTitle}>Prescription finalized</Text>
          <Text style={styles.finalizedText}>This prescription is now part of the patient record and attributed to the signed-in doctor.</Text>
        </View>
      ) : (
        <Button title="Finalize prescription" onPress={finalizePrescription} />
      )}

      <Button title="Cancel" variant="text" onPress={() => (onBack ? onBack() : navigation?.goBack())} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 },
  eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 },
  title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 },
  subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 },
  error: { color: '#B91C1C', marginBottom: 12 },
  switcher: { flexDirection: 'row', backgroundColor: '#E4F0E5', borderRadius: 11, padding: 4, marginBottom: 14 },
  switch: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 11 },
  activeSwitch: { backgroundColor: '#FFFFFF' },
  switchText: { color: '#1D8062', fontWeight: '800', fontSize: 12 },
  uploadBox: { backgroundColor: '#FFFFFF', borderWidth: 1, borderStyle: 'dashed', borderColor: '#1D8062', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 14 },
  uploadIcon: { color: '#1D8062', fontSize: 28, fontWeight: '300' },
  uploadTitle: { color: '#173C35', fontWeight: '800', marginTop: 6 },
  uploadHint: { color: '#6B7B72', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 17, marginBottom: 14 },
  cardTitle: { color: '#173C35', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 9, padding: 13, color: '#173C35', marginBottom: 10 },
  helper: { color: '#6B7B72', fontSize: 11, lineHeight: 17 },
  finalized: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 16 },
  finalizedTitle: { color: '#1D8062', fontWeight: '900' },
  finalizedText: { color: '#527166', marginTop: 5, lineHeight: 18 },
});
