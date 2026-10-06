import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HealthSummaryCard({ bmi, category, detailed = false }) {
  return <View style={styles.card}><View style={styles.metric}><Text style={styles.label}>BMI</Text><Text style={styles.value}>{bmi}</Text></View><View style={styles.divider} /><View style={styles.summary}><Text style={styles.category}>{category}</Text><Text style={styles.note}>{detailed ? 'Calculated from your latest height and weight.' : 'Based on your latest health profile'}</Text></View></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#E4F0E5', borderRadius: 14, padding: 17, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  metric: { alignItems: 'center', width: 68 },
  label: { color: '#527166', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  value: { color: '#173C35', fontSize: 27, fontWeight: '900', marginTop: 4 },
  divider: { width: 1, height: 45, backgroundColor: '#BBD6C1', marginHorizontal: 15 },
  summary: { flex: 1 },
  category: { color: '#1D8062', fontSize: 15, fontWeight: '800' },
  note: { color: '#527166', fontSize: 12, lineHeight: 17, marginTop: 4 },
});
