import React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../../../components/Button';

export default function PrescriptionScreen({ onBack }) {
  const [prescription, setPrescription] = useState({ medicine: '', dose: '', frequency: '', duration: '', registrationNumber: '' });
  const [source, setSource] = useState('manual');
  const [finalized, setFinalized] = useState(false);
  const update = (key, value) => setPrescription((current) => ({ ...current, [key]: value }));

  return <View style={styles.screen}>{onBack && <Text style={styles.back} onPress={onBack}>← Back to dashboard</Text>}<Text style={styles.eyebrow}>DOCTOR WORKSPACE</Text><Text style={styles.title}>New prescription</Text><Text style={styles.subtitle}>Verify every detail before finalizing this patient record.</Text><View style={styles.switcher}><TouchableOpacity style={[styles.switch, source === 'manual' && styles.activeSwitch]} onPress={() => setSource('manual')}><Text style={styles.switchText}>Enter manually</Text></TouchableOpacity><TouchableOpacity style={[styles.switch, source === 'photo' && styles.activeSwitch]} onPress={() => setSource('photo')}><Text style={styles.switchText}>Upload photo</Text></TouchableOpacity></View>{source === 'photo' && <TouchableOpacity style={styles.uploadBox} onPress={() => {}}><Text style={styles.uploadIcon}>+</Text><Text style={styles.uploadTitle}>Add handwritten prescription</Text><Text style={styles.uploadHint}>The photo is stored for review. It will not create medication orders automatically.</Text></TouchableOpacity>}<View style={styles.card}><Text style={styles.cardTitle}>Prescription details</Text>{[['medicine', 'Medicine name'], ['dose', 'Dosage e.g. 500 mg'], ['frequency', 'Frequency e.g. Twice daily'], ['duration', 'Duration e.g. 30 days']].map(([key, placeholder]) => <TextInput key={key} editable={!finalized} style={styles.input} placeholder={placeholder} placeholderTextColor="#9AA8A0" value={prescription[key]} onChangeText={(value) => update(key, value)} />)}<TextInput editable={!finalized} style={styles.input} placeholder="Medical registration number" placeholderTextColor="#9AA8A0" value={prescription.registrationNumber} onChangeText={(value) => update('registrationNumber', value)} /><Text style={styles.helper}>This identifies the responsible verified doctor. It cannot be changed after finalization.</Text></View>{finalized ? <View style={styles.finalized}><Text style={styles.finalizedTitle}>Prescription finalized</Text><Text style={styles.finalizedText}>This record is read-only. Create a new version if a correction is required.</Text></View> : <Button title="Finalize prescription" onPress={() => setFinalized(true)} />}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 },
  eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 },
  title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 },
  subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 },
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
