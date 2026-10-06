import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../../components/Button';

export default function HealthPlanScreen() {
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saved, setSaved] = useState(false);
  return <View style={styles.screen}><Text style={styles.eyebrow}>FOLLOW-UP PLAN</Text><Text style={styles.title}>Future health plan</Text><Text style={styles.subtitle}>Schedule tests, reviews, and follow-ups for this patient.</Text><View style={styles.card}><Text style={styles.cardTitle}>New planned activity</Text><TextInput style={styles.input} placeholder="Task e.g. HbA1c test" placeholderTextColor="#9AA8A0" value={task} onChangeText={setTask} /><TextInput style={styles.input} placeholder="Due date e.g. 30 March 2027" placeholderTextColor="#9AA8A0" value={dueDate} onChangeText={setDueDate} /><Button title="Add to health plan" onPress={() => setSaved(true)} /></View>{saved && <View style={styles.planRow}><View><Text style={styles.planTitle}>{task || 'HbA1c test'}</Text><Text style={styles.planDate}>{dueDate || '30 March 2027'} · Reminder 7 days before</Text></View><Text style={styles.upcoming}>UPCOMING</Text></View>}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F5F7F2', padding: 22 }, eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 }, title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 }, subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 }, card: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 17, marginBottom: 14 }, cardTitle: { color: '#173C35', fontSize: 16, fontWeight: '800', marginBottom: 12 }, input: { borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 9, padding: 13, color: '#173C35', marginBottom: 10 }, planRow: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, planTitle: { color: '#173C35', fontWeight: '800' }, planDate: { color: '#527166', fontSize: 11, marginTop: 5 }, upcoming: { color: '#1D8062', fontSize: 9, fontWeight: '900' } });
