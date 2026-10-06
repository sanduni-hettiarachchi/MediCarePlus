import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';
import dbService from '../../services/db';

const isHandled = (alert) => alert.status === 'handled' || alert.handled;
const isTodayLog = (log) => {
  if (log.date === 'Today' || log.date === new Date().toISOString().slice(0, 10)) return true;
  const date = log.timestamp?.toDate?.() || (log.timestamp ? new Date(log.timestamp) : null);
  return Boolean(date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10));
};
const medicineName = (item) => item.medicineName || item.medicine || item.medicationName || 'Medicine';
const hoursOverdue = (item) => {
  if (Number.isFinite(Number(item.overdueHours))) return Math.max(1, Math.floor(Number(item.overdueHours)));
  const timestamp = item.timestamp?.toMillis?.() || Number(item.timestamp) || Date.parse(item.timestamp);
  return Number.isFinite(timestamp) ? Math.max(1, Math.floor((Date.now() - timestamp) / 3600000)) : 1;
};

export default function CaregiverActivityScreen({ navigation, onNavigateTab, userPreferences = {}, hasAlertBadge = false, currentUser }) {
  const [alerts, setAlerts] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [errorMessage, setErrorMessage] = useState('');
  const [patientId, setPatientId] = useState('usr-patient-1');

  useEffect(() => {
    const links = dbService.getCareLinksForMember(currentUser?.id);
    const activeLink = links.find(l => l.status === 'Active');
    if (activeLink) {
      setPatientId(activeLink.patientId);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const stopAlerts = dbService.subscribeToAlerts(patientId, setAlerts, (error) => setErrorMessage('Something went wrong. Try again.'));
    const stopLogs = dbService.subscribeToDoseLogs(patientId, (logs) => setTodayLogs(logs.filter(isTodayLog)), (error) => setErrorMessage('Something went wrong. Try again.'));
    return () => { stopAlerts?.(); stopLogs?.(); };
  }, [patientId]);

  const handleMarkHandled = async (alert) => {
    try {
      await dbService.markAlertHandled(alert.id, currentUser?.id);
      setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, status: 'handled', handled: true, handledBy: currentUser?.id } : item));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Something went wrong. Try again.');
    }
  };

  const handleCall = async (alert) => {
    const links = dbService.getCareLinksForMember(currentUser?.id);
    const activeLink = links.find(l => l.status === 'Active');
    const phone = activeLink ? dbService.getUserById(activeLink.patientId)?.phone : alert.patientPhone;
    if (phone) {
      try { await Linking.openURL(`tel:${phone}`); } catch (error) { setErrorMessage('Phone calling is not available on this device.'); }
    } else {
      setErrorMessage('Patient phone number is unavailable.');
    }
    navigation?.navigate('CallOutcomeLog', { alert });
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'Handled') return isHandled(alert);
    if (activeFilter === 'Missed') return !isHandled(alert) && ['missed_dose', 'snooze_limit'].includes(alert.type);
    return true;
  });

  const statusForLog = (log) => {
    const status = String(log.status || '').toLowerCase();
    if (['taken', 'completed'].includes(status)) return { label: 'Taken', icon: '✓', style: styles.takenStatus };
    if (['missed', 'skipped'].includes(status)) return { label: 'Missed', icon: '×', style: styles.missedStatus };
    return { label: 'Upcoming', icon: '◷', style: styles.upcomingStatus };
  };

  return (
    <View style={styles.container}>
      <Header title="Activity" subtitle="Call Mrs. Perera" rightElement={<TouchableOpacity style={styles.bellButton} onPress={() => navigation?.navigate('Notifications')}><Text style={styles.bellIcon}>🔔</Text></TouchableOpacity>} />
      <View style={styles.filterRow}>
        {['All', 'Missed', 'Handled'].map((filter) => (
          <TouchableOpacity key={filter} style={[styles.filterTab, activeFilter === filter && styles.selectedFilterTab]} onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.filterText, activeFilter === filter && styles.selectedFilterText]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <Text style={styles.sectionHeader}>ALERTS</Text>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No alerts right now. All doses are on track.</Text></View>
        ) : filteredAlerts.map((alert) => {
          const handled = isHandled(alert);
          const snoozeLimit = alert.type === 'snooze_limit';
          const medicine = medicineName(alert);
          const overdue = hoursOverdue(alert);
          return (
            <View key={alert.id} style={[styles.alertCard, snoozeLimit && styles.snoozeCard, handled && styles.handledCard]}>
              <Text style={[styles.alertTitle, snoozeLimit && styles.snoozeText]}>{snoozeLimit ? 'Snooze limit reached' : 'Missed dose'}</Text>
              <Text style={[styles.alertMessage, snoozeLimit && styles.snoozeText]}>
                {snoozeLimit ? `${medicine}: both snoozes used. The alert is staying on screen.` : `${medicine} not confirmed`}
              </Text>
              {!snoozeLimit ? <Text style={styles.overdueText}>{overdue} {overdue === 1 ? 'hour' : 'hours'} overdue</Text> : null}
              {handled ? <Text style={styles.handledText}>Handled</Text> : (
                <View style={styles.actionsRow}>
                  <Button title="Call now" onPress={() => handleCall(alert)} style={styles.callButton} />
                  <TouchableOpacity style={styles.markHandledButton} onPress={() => handleMarkHandled(alert)}><Text style={styles.markHandledText}>Mark handled</Text></TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {activeFilter === 'All' ? (
          <View>
            <Text style={styles.sectionHeader}>LOGGED TODAY</Text>
            {todayLogs.map((log) => {
              const status = statusForLog(log);
              const med = dbService.getMedicineById(log.medicineId);
              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logDetails}>
                    <Text style={styles.logMedicine}>{log.medicineName || med?.name || 'Medicine'}</Text>
                    <Text style={styles.logTime}>{log.time || log.timeStr || 'Today'}</Text>
                  </View>
                  <Text style={[styles.logStatus, status.style]}>{status.icon} {status.label}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
      <FiveTabBottomBar activeTab="activity" onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)} language={userPreferences.language} isLargeText={userPreferences.largeText} hasAlertBadge={hasAlertBadge} profileLabel="Profiles" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  bellButton: { padding: 6 },
  bellIcon: { fontSize: 22 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, marginHorizontal: 4, backgroundColor: '#F1F5F9' },
  selectedFilterTab: { backgroundColor: '#0D8F7A' },
  filterText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  selectedFilterText: { color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#4B5563', marginTop: 14, marginBottom: 10 },
  errorText: { color: '#991B1B', fontSize: 14, marginBottom: 10 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 16, color: '#374151', textAlign: 'center' },
  alertCard: { backgroundColor: '#FDECEA', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F5C2BD' },
  snoozeCard: { backgroundColor: '#FFF4E0', borderColor: '#E5B95C' },
  handledCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  alertTitle: { fontSize: 16, fontWeight: '700', color: '#B42318' },
  snoozeText: { color: '#7A4B00' },
  alertMessage: { fontSize: 14, color: '#9B1C1C', marginTop: 4 },
  overdueText: { fontSize: 14, color: '#9B1C1C', marginTop: 4 },
  handledText: { color: '#374151', fontSize: 14, fontWeight: '700', marginTop: 10 },
  actionsRow: { marginTop: 12 },
  callButton: { backgroundColor: '#D93838', marginBottom: 8 },
  markHandledButton: { minHeight: 44, borderWidth: 1.5, borderColor: '#0D8F7A', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  markHandledText: { color: '#0D8F7A', fontSize: 14, fontWeight: '700' },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  logDetails: { flex: 1 },
  logMedicine: { color: '#1F2937', fontSize: 14, fontWeight: '600' },
  logTime: { color: '#4B5563', fontSize: 14, marginTop: 3 },
  logStatus: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  takenStatus: { color: '#2F6B52' },
  missedStatus: { color: '#B42318' },
  upcomingStatus: { color: '#4B5563' },
});
