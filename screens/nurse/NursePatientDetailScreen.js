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
import { computeAdherenceStats } from '../../utils/dateUtils';

const Text = PatientText;

export default function NursePatientDetailScreen({ navigation, route }) {
  const patient = route?.params?.patient || { name: 'Mrs. Perera', age: '72 y' };
  const patientId = patient.id || route?.params?.patientId || 'usr-patient-1';
  const nurse = route?.params?.nurse;
  const [careNotes, setCareNotes] = useState([]);
  const [summary, setSummary] = useState({
    adherencePercent: 0,
    mostMissedMedName: '—',
    mostMissedCount: 0,
    dailyStats: [],
  });

  const loadCareNotes = () => {
    const list = dbService.getCareNotes(patientId);
    // Sort by timestamp descending (newest first)
    const sorted = list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    setCareNotes(sorted);
  };

  useEffect(() => {
    loadCareNotes();
  }, [patientId]);

  useEffect(() => {
    const unsubscribe = dbService.subscribeToDoseLogs(patientId, (logs) => {
      const medicines = dbService.getMedicines(patientId);
      const stats = computeAdherenceStats(logs, medicines, 7);
      setSummary(stats);
    });
    return () => unsubscribe();
  }, [patientId]);

  const [deletedNote, setDeletedNote] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  const handleDeleteNote = async (note) => {
    setDeletedNote(note);
    dbService.deleteCareNote(note.id);
    setShowUndoToast(true);
    loadCareNotes();
    
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
          <Text style={styles.summaryBannerText}>
            Adherence {summary.adherencePercent}% this week · Most missed: {summary.mostMissedMedName}
          </Text>
        </View>

        <View style={styles.adherenceCard}>
          <Text style={styles.adherenceLabel}>LAST 7 DAYS ADHERENCE</Text>
          <Text style={styles.adherenceValue}>{summary.adherencePercent}%</Text>

          {/* 7-Day Bar Chart */}
          <View style={styles.barChartContainer}>
            {summary.dailyStats.map((bar, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max(bar.percentage, 15)}%` },
                      bar.percentage < 50 && styles.barFillMissed,
                    ]}
                  />
                </View>
                <Text style={styles.barDayText}>{bar.dayName}</Text>
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
                  <Text style={styles.missedMedName}>{summary.mostMissedMedName}</Text>
                  <Text style={styles.missedMedSub}>{summary.mostMissedCount} missed doses this week</Text>
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
          const isAuthor = cn.authorId === nurse?.id || cn.authorId === currentUser?.id;
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
    fontSize: 32,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 12,
    height: 80,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },
  barFillMissed: {
    backgroundColor: '#DC2626',
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  missedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missedIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  missedCol: {
    flex: 1,
  },
  missedMedName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  missedMedSub: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  noteDate: {
    fontSize: 12,
    color: '#64748B',
  },
  noteText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  editedLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  deleteLink: {
    color: '#EF4444',
  },
  readOnlyText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  undoToast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  undoToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  undoLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
