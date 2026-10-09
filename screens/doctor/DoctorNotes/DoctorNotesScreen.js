import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../../components/Button';
import Header from '../../../components/Header';
import dbService from '../../../services/db';

export default function DoctorNotesScreen({ navigation, route }) {
  const doctor = route?.params?.doctor || { name: 'Dr. K. Silva', slmcNumber: '12345' };
  const patientId = route?.params?.patientId;
  const [note, setNote] = useState('');
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState('');

  const finalizeNote = async () => {
    if (!patientId) {
      setError('Select a patient before saving a doctor note.');
      return;
    }
    if (!note.trim()) {
      setError('Enter a note before finalizing.');
      return;
    }
    try {
      await dbService.addCareNote({
        patientId,
        authorId: doctor.id || doctor.uid,
        authorName: doctor.name,
        authorRole: 'doctor',
        text: note.trim(),
        visibleToPatient: false,
      });
      setError('');
      setFinalized(true);
    } catch (saveError) {
      setError(saveError.message || 'Could not save this doctor note.');
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Doctor notes" subtitle="Doctor-only clinical notes" onBack={() => navigation?.goBack()} />
      <Text style={styles.eyebrow}>CLINICAL RECORD</Text>
      <Text style={styles.title}>Doctor notes</Text>
      <Text style={styles.subtitle}>Notes become read-only after finalization.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.meta}>{doctor.name || 'Dr. K. Silva'} · SLMC {doctor.slmcNumber || '12345'} · Today</Text>
        <TextInput editable={!finalized} multiline style={styles.input} placeholder="Add an observation, assessment, or recommendation" placeholderTextColor="#9AA8A0" value={note} onChangeText={setNote} />
        <Text style={styles.helper}>Corrections must be recorded as a new addendum.</Text>
      </View>
      {finalized ? (
        <View style={styles.finalized}>
          <Text style={styles.finalizedTitle}>Note finalized</Text>
          <Text style={styles.finalizedText}>Read-only record. Add an addendum if the clinical information changes.</Text>
        </View>
      ) : (
        <Button title="Finalize doctor note" onPress={finalizeNote} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 }, eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 }, title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 }, subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 }, error: { color: '#B91C1C', marginBottom: 12 }, card: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 17, marginBottom: 14 }, meta: { color: '#1D8062', fontSize: 12, fontWeight: '800', marginBottom: 13 }, input: { minHeight: 170, borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 10, padding: 13, color: '#173C35', textAlignVertical: 'top' }, helper: { color: '#6B7B72', fontSize: 11, lineHeight: 17, marginTop: 12 }, finalized: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 16 }, finalizedTitle: { color: '#1D8062', fontWeight: '900' }, finalizedText: { color: '#527166', lineHeight: 18, marginTop: 5 } });
