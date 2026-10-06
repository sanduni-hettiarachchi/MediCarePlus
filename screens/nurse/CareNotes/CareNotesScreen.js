import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../../components/Button';

export default function CareNotesScreen() {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  return <View style={styles.screen}><Text style={styles.eyebrow}>NURSE WORKSPACE</Text><Text style={styles.title}>Care note</Text><Text style={styles.subtitle}>Record an intervention without changing the doctor's clinical record.</Text><View style={styles.alert}><Text style={styles.alertTitle}>Repeated missed doses</Text><Text style={styles.alertText}>Metformin · 4 missed doses in the last 7 days</Text></View><TextInput multiline style={styles.input} placeholder="Describe the care intervention" placeholderTextColor="#9AA8A0" value={note} onChangeText={setNote} />{saved ? <View style={styles.saved}><Text style={styles.savedTitle}>Care note saved</Text><Text style={styles.savedText}>Nurse notes remain attributable and auditable.</Text></View> : <Button title="Save care note" onPress={() => setSaved(true)} />}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 }, eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 }, title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 }, subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 }, alert: { backgroundColor: '#FCE8D7', borderRadius: 14, padding: 16, marginBottom: 14 }, alertTitle: { color: '#8B5428', fontWeight: '900' }, alertText: { color: '#9B6A3E', marginTop: 5 }, input: { minHeight: 160, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 10, padding: 13, color: '#173C35', textAlignVertical: 'top', marginBottom: 14 }, saved: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 16 }, savedTitle: { color: '#1D8062', fontWeight: '900' }, savedText: { color: '#527166', marginTop: 5 } });
