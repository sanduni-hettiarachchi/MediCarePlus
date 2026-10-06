import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../../components/Button';

export default function DoctorNotesScreen() {
  const [note, setNote] = useState('');
  const [finalized, setFinalized] = useState(false);
  return <View style={styles.screen}><Text style={styles.eyebrow}>CLINICAL RECORD</Text><Text style={styles.title}>Doctor notes</Text><Text style={styles.subtitle}>Notes become read-only after finalization.</Text><View style={styles.card}><Text style={styles.meta}>Dr. Fernando · SLMC XXXXX · 30 Sep 2026</Text><TextInput editable={!finalized} multiline style={styles.input} placeholder="Add an observation, assessment, or recommendation" placeholderTextColor="#9AA8A0" value={note} onChangeText={setNote} /><Text style={styles.helper}>Corrections must be recorded as a new addendum.</Text></View>{finalized ? <View style={styles.finalized}><Text style={styles.finalizedTitle}>Note finalized</Text><Text style={styles.finalizedText}>Read-only record. Add an addendum if the clinical information changes.</Text></View> : <Button title="Finalize doctor note" onPress={() => setFinalized(true)} />}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 }, eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 }, title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 }, subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 }, card: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 17, marginBottom: 14 }, meta: { color: '#1D8062', fontSize: 12, fontWeight: '800', marginBottom: 13 }, input: { minHeight: 170, borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 10, padding: 13, color: '#173C35', textAlignVertical: 'top' }, helper: { color: '#6B7B72', fontSize: 11, lineHeight: 17, marginTop: 12 }, finalized: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 16 }, finalizedTitle: { color: '#1D8062', fontWeight: '900' }, finalizedText: { color: '#527166', lineHeight: 18, marginTop: 5 } });
