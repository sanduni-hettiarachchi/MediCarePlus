import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import PatientText from '../../components/PatientText';

const Text = PatientText;

export default function NursePatientDetailScreen({ navigation, route }) {
  const patient = route?.params?.patient || { name: 'Mrs. Perera', age: '72 y' };
  const patientId = patient.id || route?.params?.patientId || 'usr-patient-1';
  const nurse = route?.params?.nurse;
  const [careNotes, setCareNotes] = useState([]);
  const [summary, setSummary] = useState({ adherence: 0, mostMissedMedicine: '—', mostMissedTimeOfDay: '—', mostMissedCount: 0, dailyData: [] });

  const loadCareNotes = () => {
    const list = dbService.getCareNotes(patientId);
    // Sort by timestamp descending (newest first)
    const sorted = list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    setCareNotes(sorted);
  };

  useEffect(() => {
    loadCareNotes();
  }, []);

  useEffect(() => dbService.subscribeToDoseLogs(patientId, (logs) => {
    const summaryData = dbService.getAdherenceSummary(patientId, logs);
    // Compute daily adherence for the chart
    const dailyData = computeDailyAdherence(logs);
    setSummary({ ...summaryData, dailyData });
  }), [patientId]);

  const [deletedNote, setDeletedNote] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  const handleDeleteNote = async (note) => {
    // Store for undo
    setDeletedNote(note);
    dbService.deleteCareNote(note.id);
    setShowUndoToast(true);
    
    // Reload notes
    loadCareNotes();
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setShowUndoToast(false);
      setDeletedNote(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (deletedNote) {
      dbService.addCareNote(deletedNote);
      setDeletedNote(null);
      setShowUndoToast(false);
      loadCareNotes();
    }
  };

  const computeDailyAdherence = (logs) => {
    const days = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp || Date.now());
        return logDate.toDateString() === dateStr;
      });
      
      const taken = dayLogs.filter(log => ['taken', 'completed'].includes(String(log.status).toLowerCase())).length;
      const missed = dayLogs.filter(log => ['missed', 'skipped'].includes(String(log.status).toLowerCase())).length;
      const total = taken + missed;
      const adherence = total > 0 ? (taken / total) * 100 : 0;
      const hasMissed = missed > 0;
      
      days.push({
        day: dayNames[date.getDay()],
        height: total > 0 ? `${Math.max(20, adherence)}%` : '0%',
        missed: hasMissed,
      });
    }
    
    return days;
  };

  return (
    <View style={styles.container}>
      <Header
        title={patient.name || 'Mrs. Perera'}
        subtitle="Patient clinical overview"
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBanner}>
          {summary.dailyData.length > 0 ? (
            <Text style={styles.summaryBannerText}>Adherence {summary.adherence}% this week · Most missed: {summary.mostMissedMedicine} ({summary.mostMissedTimeOfDay})</Text>
          ) : (
            <Text style={styles.summaryBannerText}>No data yet</Text>
          )}
        </View>

        <View style={styles.adherenceCard}>
          <Text style={styles.adherenceLabel}>LAST 7 DAYS ADHERENCE</Text>
          <Text style={styles.adherenceValue}>{summary.dailyData.length > 0 ? `${summary.adherence}%` : 'No data yet'}</Text>

          {/* 7-Day Bar Chart */}
          <View style={styles.barChartContainer}>
            {summary.dailyData.map((bar, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: bar.height },
                      bar.missed && styles.barFillMissed,
                    ]}
                  />
                </View>
                <Text style={styles.barDayText}>{bar.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section: REPEATEDLY MISSED */}
        {summary.mostMissedCount > 0 && (
          <>
            <Text style={styles.sectionHeader}>REPEATEDLY MISSED</Text>
            <View style={styles.missedCard}>
              <View style={styles.missedRow}>
                <Text style={styles.missedIcon}>⚠️</Text>
                <View style={styles.missedCol}>
                  <Text style={styles.missedMedName}>{summary.mostMissedMedicine}</Text>
                  <Text style={styles.missedMedSub}>{summary.mostMissedCount} missed doses · {summary.mostMissedTimeOfDay}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Undo Toast for deleted notes */}
        {showUndoToast && (
          <View style={styles.undoToast}>
            <Text style={styles.undoToastText}>Note deleted</Text>
            <TouchableOpacity onPress={handleUndoDelete}>
              <Text style={styles.undoLink}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Side-by-side action buttons */}
        <View style={styles.actionsRow}>
          <Button
            title="View History"
            variant="outline"
            colorScheme="blue"
            onPress={() => navigation?.navigate('PatientHistory', { patient, nurse })}
            style={styles.actionBtn}
          />
          <Button
            title="+ Add Note"
            colorScheme="blue"
            onPress={() => navigation?.navigate('AddCareNote', { patient, nurse })}
            style={styles.actionBtn}
          />
        </View>

        {/* Section: RECENT NOTES */}
        <Text style={styles.sectionHeader}>RECENT NOTES</Text>

        {careNotes.length === 0 ? <Text style={styles.emptyNotes}>No care notes yet.</Text> : null}
        {careNotes.map((cn) => {
          const isAuthor = cn.authorId === nurse?.nurseId || cn.authorId === 'usr-nurse-1';
          return (
            <View key={cn.id} style={styles.noteCard}>
              <View style={styles.noteTopRow}>
                <Text style={styles.noteAuthor}>{cn.authorName || cn.authorRole || 'Care team'}</Text>
                <Text style={styles.noteDate}>{cn.date || 'Today'}</Text>
              </View>
              <Text style={styles.noteText}>{cn.note}</Text>
              {cn.edited && <Text style={styles.editedLabel}>Edited</Text>}
              {isAuthor ? (
                <View style={styles.noteActions}>
                  <TouchableOpacity onPress={() => navigation?.navigate('EditCareNote', { patient, nurse, existingNote: cn })}>
                    <Text style={styles.actionLink}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteNote(cn)}>
                    <Text style={[styles.actionLink, styles.deleteLink]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.readOnlyText}>Only the author can edit this note</Text>
              )}
            </View>
          );
        })}
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
  summaryBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryBannerText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  emptyNotes: { color: '#4B5563', fontSize: 14, marginBottom: 12 },
  adherenceCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  adherenceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  adherenceValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#007AFF',
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 14,
    height: 64,
    backgroundColor: '#DBEAFE',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 7,
  },
  barFillMissed: {
    backgroundColor: '#EF4444',
  },
  barDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  missedCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 20,
  },
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missedIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  missedCol: {
    flex: 1,
  },
  missedMedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  missedMedSub: {
    fontSize: 14,
    color: '#7F1D1D',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    marginBottom: 0,
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  noteDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  noteText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 18,
  },
  editedLabel: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteLink: {
    color: '#EF4444',
  },
  readOnlyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  undoToast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  undoToastText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  undoLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
