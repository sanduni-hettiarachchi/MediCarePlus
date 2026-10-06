import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ReminderCard({ title, date, detail }) {
  return <View style={styles.card}><View style={styles.icon}><Text style={styles.iconText}>⌁</Text></View><View style={styles.details}><Text style={styles.title}>{title}</Text><Text style={styles.detail}>{detail}</Text></View><Text style={styles.date}>{date}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E1E9E1' },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FCE8D7', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#B3682B', fontSize: 20, fontWeight: '800' },
  details: { flex: 1, paddingHorizontal: 10 },
  title: { color: '#173C35', fontWeight: '800', fontSize: 14 },
  detail: { color: '#6B7B72', fontSize: 11, marginTop: 4 },
  date: { color: '#B3682B', fontSize: 11, fontWeight: '800' },
});
