import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import Text from '../../components/PatientText';

export default function PatientCareNotesScreen({ navigation, route, currentUser }) {
  const patientId = currentUser?.id || 'usr-patient-1';
  const [careNotes, setCareNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotes = () => {
    setLoading(true);
    const notes = dbService.getPatientVisibleNotes(patientId);
    setCareNotes(notes);
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, [patientId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotes();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Care notes"
        subtitle="Notes from your care team"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : careNotes.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyIcon}>📝</Text>
            </View>
            <Text style={styles.emptyTitle}>No care notes yet</Text>
            <Text style={styles.emptySubtitle}>
              Your care team can share notes with you here
            </Text>
          </View>
        ) : (
          careNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{note.authorName || 'Care team'}</Text>
                  <View style={[styles.roleTag, note.authorRole === 'Doctor' ? styles.doctorTag : styles.nurseTag]}>
                    <Text style={styles.roleTagText}>{note.authorRole || 'Nurse'}</Text>
                  </View>
                </View>
                <Text style={styles.noteDate}>{note.date || (note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Today')}</Text>
              </View>
              <Text style={styles.noteText}>{note.text || note.note}</Text>
              {note.editedAt && <Text style={styles.editedLabel}>Edited</Text>}
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
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nurseTag: {
    backgroundColor: '#DBEAFE',
  },
  doctorTag: {
    backgroundColor: '#FEE2E2',
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  noteDate: {
    fontSize: 12,
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
});
