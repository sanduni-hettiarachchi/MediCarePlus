import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import dbService from '../../services/db';
import PatientText from '../../components/PatientText';

const Text = PatientText;

export default function PatientActivityScreen({ navigation, currentUser }) {
  const patientId = currentUser?.id || 'usr-patient-1';
  const [doseLogs, setDoseLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dbService.subscribeToDoseLogs(patientId, (logs) => {
      setDoseLogs(logs || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [patientId]);

  const filteredLogs = doseLogs.filter((log) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Taken') return log.status === 'Taken';
    if (activeFilter === 'Skipped') return log.status === 'Missed';
    if (activeFilter === 'Missed') return log.status === 'Missed';
    return true;
  });

  const groupedByDay = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.timestamp || Date.now()).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <View style={styles.container}>
      <Header
        title="Activity"
        subtitle="Your medication history"
        onBack={() => navigation?.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {['All', 'Taken', 'Skipped', 'Missed'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.tabBtn, activeFilter === filter && styles.selectedTabBtn]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.tabText, activeFilter === filter && styles.selectedTabText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : sortedDays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptySubtitle}>Your dose history will appear here</Text>
          </View>
        ) : (
          sortedDays.map((day) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.dayHeader}>{day}</Text>
              {groupedByDay[day].map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logInfo}>
                    <Text style={styles.medicineName}>{log.medicineName || 'Medicine'}</Text>
                    <Text style={styles.dose}>{log.dose || ''}</Text>
                    <Text style={styles.time}>{log.time || ''}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    log.status === 'Taken' && styles.takenBadge,
                    log.status === 'Missed' && styles.missedBadge,
                    log.status === 'Skipped' && styles.skippedBadge,
                  ]}>
                    <Text style={styles.statusText}>{log.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  selectedTabBtn: {
    backgroundColor: '#0D8F7A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  dayGroup: {
    marginBottom: 24,
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  dose: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  takenBadge: {
    backgroundColor: '#E6F4F1',
  },
  missedBadge: {
    backgroundColor: '#FEE2E2',
  },
  skippedBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
