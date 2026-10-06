import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import dbService from '../../services/db';
import PatientText from '../../components/PatientText';

const Text = PatientText;

export default function PatientHistoryScreen({ navigation, route }) {
  const patient = route?.params?.patient || { name: 'Mrs. Perera', id: 'usr-patient-1' };
  const patientId = patient.id || 'usr-patient-1';
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [doseLogs, setDoseLogs] = useState([]);
  const [groupedLogs, setGroupedLogs] = useState({});

  useEffect(() => {
    const unsubscribe = dbService.subscribeToDoseLogs(patientId, (logs) => {
      setDoseLogs(logs || []);
    });
    return () => unsubscribe();
  }, [patientId]);

  useEffect(() => {
    if (doseLogs.length === 0) {
      setGroupedLogs({});
      return;
    }

    const days = selectedPeriod === '7days' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter by period and sort newest first
    const sortedLogs = [...doseLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const filtered = sortedLogs.filter(log => {
      const logDate = new Date(log.timestamp || Date.now());
      return logDate >= cutoffDate;
    });

    const grouped = {};
    filtered.forEach(log => {
      const logDate = new Date(log.timestamp || Date.now());
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey;
      if (logDate.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (logDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });

    setGroupedLogs(grouped);
  }, [doseLogs, selectedPeriod]);

  const getStatusBgStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'taken') return styles.statusTakenBg;
    if (s === 'missed') return styles.statusMissedBg;
    return styles.statusSkippedBg;
  };

  const getStatusTextStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'taken') return styles.statusTakenText;
    if (s === 'missed') return styles.statusMissedText;
    return styles.statusSkippedText;
  };

  const getStatusText = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'taken') return '✓ Taken';
    if (s === 'missed') return '× Missed';
    if (s === 'skipped') return 'Skipped';
    return status;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Patient History"
        subtitle={patient.name || 'Mrs. Perera'}
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, selectedPeriod === '7days' && styles.activeTab]}
            onPress={() => setSelectedPeriod('7days')}
          >
            <Text style={[styles.tabText, selectedPeriod === '7days' && styles.activeTabText]}>7 days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedPeriod === '30days' && styles.activeTab]}
            onPress={() => setSelectedPeriod('30days')}
          >
            <Text style={[styles.tabText, selectedPeriod === '30days' && styles.activeTabText]}>30 days</Text>
          </TouchableOpacity>
        </View>

        {Object.keys(groupedLogs).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No dose logs found for this period</Text>
          </View>
        ) : (
          Object.entries(groupedLogs).map(([dateKey, logs]) => (
            <View key={dateKey} style={styles.daySection}>
              <Text style={styles.dayHeader}>{dateKey}</Text>
              {logs.map((log, idx) => (
                <View key={log.id || idx} style={styles.logRow}>
                  <View style={styles.logInfo}>
                    <Text style={styles.medicineName}>{log.medicineName || 'Medicine'}</Text>
                    <Text style={styles.doseInfo}>{log.dose || 'Standard dose'} · {log.time || 'Today'}</Text>
                  </View>
                  <View style={[styles.statusTag, getStatusBgStyle(log.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(log.status)]}>
                      {getStatusText(log.status)}
                    </Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#007AFF',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  doseInfo: {
    fontSize: 13,
    color: '#64748B',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTakenBg: {
    backgroundColor: '#D1FAE5',
  },
  statusMissedBg: {
    backgroundColor: '#FEE2E2',
  },
  statusSkippedBg: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTakenText: {
    color: '#065F46',
  },
  statusMissedText: {
    color: '#991B1B',
  },
  statusSkippedText: {
    color: '#92400E',
  },
});
