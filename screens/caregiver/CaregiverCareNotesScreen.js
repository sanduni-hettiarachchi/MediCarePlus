import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Header from '../../components/Header';
import dbService from '../../services/db';
import Text from '../../components/PatientText';

export default function CaregiverCareNotesScreen({ navigation, route, currentUser }) {
  const selectedPatientLink = route?.params?.selectedPatientLink;
  const patientId = selectedPatientLink?.patientId;
  const permissions = selectedPatientLink?.permissions || {};
  const canViewCareNotes = permissions.viewCareNotes;
  const [careNotes, setCareNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!patientId || !canViewCareNotes) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const firestoreDb = dbService.getFirestoreDb?.();
    if (!firestoreDb) {
      console.error('[CaregiverCareNotesScreen] Firestore not available');
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestoreDb, 'care_notes'),
      where('patientId', '==', patientId),
      where('visibleToPatient', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCareNotes(notes);
      setLoading(false);
    }, (err) => {
      console.error('[CaregiverCareNotesScreen] Subscription error:', err.code, err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId, canViewCareNotes]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Care notes"
        subtitle="Notes from the care team"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!canViewCareNotes ? (
          <View style={styles.centerContainer}>
            <View style={styles.permissionCircle}>
              <Text style={styles.permissionIcon}>🔒</Text>
            </View>
            <Text style={styles.permissionTitle}>Not shared by the patient</Text>
            <Text style={styles.permissionSubtitle}>
              The patient has not shared care notes with you
            </Text>
          </View>
        ) : loading ? (
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
              The care team can share notes here
            </Text>
          </View>
        ) : (
          careNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{note.authorName || 'Care team'}</Text>
                  <View style={[
                    styles.roleTag,
                    note.authorRole === 'Doctor' ? styles.doctorTag :
                    note.authorRole === 'Caregiver' ? styles.caregiverTag :
                    styles.nurseTag
                  ]}>
                    <Text style={styles.roleTagText}>{note.authorRole || 'Nurse'}</Text>
                  </View>
                </View>
                <Text style={styles.noteDate}>
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(note.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Today'}
                </Text>
              </View>
              <Text style={styles.noteText}>{note.text}</Text>
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
  permissionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionIcon: {
    fontSize: 36,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
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
  caregiverTag: {
    backgroundColor: '#DCFCE7',
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
