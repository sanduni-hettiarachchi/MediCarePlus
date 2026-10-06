import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';

export default function HealthReportScreen({ navigation, route }) {
  const doctor = route?.params?.doctor;

  return (
    <View style={styles.container}>
      <Header
        title="Health Report"
        subtitle="Patient adherence & clinical summary"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Report Card */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.patientName}>Mrs. Maya Perera</Text>
            <Text style={styles.reportDate}>Report Date: Oct 2026</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>7-Day Adherence Rate</Text>
            <Text style={styles.statValueGreen}>86%</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Most Missed Medicine</Text>
            <Text style={styles.statValueRed}>Metformin (afternoon)</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Blood Pressure Vitals</Text>
            <Text style={styles.statValue}>120/80 mmHg</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.summaryTitle}>CLINICAL SUMMARY</Text>
          <Text style={styles.summaryText}>
            Patient displays high overall medication adherence (86%). Afternoon doses show occasional delays during social visits. Blood pressure remains well-managed.
          </Text>
        </View>

        <Button
          title="Export / Download PDF Report"
          onPress={() => {}}
          style={styles.downloadBtn}
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
  reportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportDate: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D8F7A',
  },
  statValueRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  downloadBtn: {
    marginTop: 4,
  },
});
