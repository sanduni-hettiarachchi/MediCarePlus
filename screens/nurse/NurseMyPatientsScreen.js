import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { updateDoc, doc, serverTimestamp, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import authService from '../../services/authService';
import dbService from '../../services/db';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import PatientCard from '../../components/PatientCard';

export default function NurseMyPatientsScreen({ navigation, route, currentUser }) {
  const nurse = route?.params?.nurse || { name: 'Nurse Dilani', nurseId: 'N-2041' };
  const [careLinks, setCareLinks] = useState([]);
  const [patientDataMap, setPatientDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const nurseId = currentUser?.id;
    console.log('[NurseMyPatientsScreen] Loading care_links for memberId:', nurseId);
    
    if (!nurseId) {
      console.warn('[NurseMyPatientsScreen] No currentUser.id, skipping query');
      setLoading(false);
      setError('User not authenticated. Please sign in again.');
      return;
    }
    
    const unsubscribe = dbService.subscribeToCareLinksForMember(nurseId, async (links) => {
      console.log('[NurseMyPatientsScreen] Found', links.length, 'care_links');
      setCareLinks(links);
      
      // Fetch patient data for each link from users doc
      const firestoreDb = dbService.getFirestoreDb?.();
      const patientMap = {};
      
      for (const link of links) {
        try {
          if (firestoreDb) {
            const patientDoc = await getDoc(doc(firestoreDb, 'users', link.patientId));
            if (patientDoc.exists()) {
              patientMap[link.patientId] = { id: patientDoc.id, ...patientDoc.data() };
            }
          } else {
            const patient = dbService.getUserById(link.patientId);
            if (patient) {
              patientMap[link.patientId] = patient;
            }
          }
        } catch (err) {
          console.warn('[NurseMyPatientsScreen] Failed to load patient data for', link.patientId, err.code);
        }
      }
      
      setPatientDataMap(patientMap);
      setLoading(false);
    }, (err) => {
      console.error('[NurseMyPatientsScreen] care_links error:', err.code, err.message);
      setError('Failed to load patients: ' + (err.message || 'Please try again.'));
      setLoading(false);
    });
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.id]);

  const handleAcceptInvite = async (linkId) => {
    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_links', linkId), { status: 'Active' });
        console.log('[NurseMyPatientsScreen] Accepted invite:', linkId);
      } else {
        await dbService.updateCareLink(linkId, { status: 'Active' });
      }
    } catch (err) {
      console.error('[NurseMyPatientsScreen] Error accepting invite:', err.code, err.message);
      setError('Failed to accept invite: ' + (err.message || 'Please try again.'));
    }
  };

  const handleDeclineInvite = async (linkId) => {
    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_links', linkId), { status: 'Declined' });
        console.log('[NurseMyPatientsScreen] Declined invite:', linkId);
      } else {
        await dbService.updateCareLink(linkId, { status: 'Declined' });
      }
    } catch (err) {
      console.error('[NurseMyPatientsScreen] Error declining invite:', err.code, err.message);
      setError('Failed to decline invite: ' + (err.message || 'Please try again.'));
    }
  };

  const handleMarkReviewed = async (patientId) => {
    // Save care_notes doc instead of toggling local state
    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (firestoreDb) {
        await dbService.addCareNote({
          patientId,
          authorId: currentUser?.id,
          authorName: nurse.name,
          authorRole: 'nurse',
          type: 'reviewed',
          text: 'Reviewed',
          visibleToPatient: false,
        });
        console.log('[NurseMyPatientsScreen] Marked as reviewed:', patientId);
      }
    } catch (err) {
      console.error('[NurseMyPatientsScreen] Error marking reviewed:', err.code, err.message);
      setError('Failed to mark as reviewed: ' + (err.message || 'Please try again.'));
    }
  };

  const pendingLinks = careLinks.filter((l) => l.status === 'Pending');
  const activeLinks = careLinks.filter((l) => l.status === 'Active');
  const needingCount = activeLinks.length; // Will update with real adherence later

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="My Patients"
        subtitle={`${nurse.name || 'Nurse Dilani'} · ${activeLinks.length} patients`}
        colorScheme="blue"
        onProfilePress={() => navigation?.navigate('NurseProfile', { nurse })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {pendingLinks.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>PENDING INVITES</Text>
            {pendingLinks.map((link) => {
              const patient = patientDataMap[link.patientId];
              const patientName = patient?.name || 'Patient';
              
              const permLabels = [];
              if (link.permissions?.viewSchedule) permLabels.push('View Schedule');
              if (link.permissions?.editSchedule) permLabels.push('Edit Schedule');
              if (link.permissions?.viewAdherence) permLabels.push('View Adherence');
              if (link.permissions?.viewCareNotes) permLabels.push('View Notes');
              if (link.permissions?.addNotes) permLabels.push('Add Notes');
              const permText = permLabels.length > 0 ? permLabels.join(', ') : 'No specific permissions';
              
              return (
                <View key={link.id} style={styles.pendingCard}>
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName}>{patientName}</Text>
                    <Text style={styles.pendingPerms}>{permText}</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={[styles.pendingBtn, styles.acceptBtn]}
                      onPress={() => handleAcceptInvite(link.id)}
                    >
                      <Text style={styles.pendingBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pendingBtn, styles.declineBtn]}
                      onPress={() => handleDeclineInvite(link.id)}
                    >
                      <Text style={styles.pendingBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.sectionHeader}>MY PATIENTS</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading patients...</Text>
        ) : activeLinks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No patients linked yet</Text>
            <Text style={styles.emptySub}>
              Patients invite you from their app.
            </Text>
          </View>
        ) : (
          activeLinks.map((link) => {
            const patient = patientDataMap[link.patientId];
            if (!patient) return null;
            
            const patientName = patient.name;
            const patientAge = patient.age ? `${patient.age} y` : null;
            const conditions = patient.conditions || null;
            
            return (
              <PatientCard
                key={link.id}
                patient={{
                  id: link.patientId,
                  name: patientName,
                  age: patientAge,
                  conditions: conditions,
                  adherence: 0, // TODO: Calculate from dose_logs
                  statusTag: 'No data yet',
                  reviewed: false,
                }}
                onPress={() => navigation?.navigate('NursePatientDetail', { 
                  patientId: link.patientId, 
                  permissions: link.permissions,
                  nurse 
                })}
                onMarkReviewed={() => handleMarkReviewed(link.patientId)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pendingInfo: {
    marginBottom: 12,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  pendingPerms: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pendingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#3B82F6',
  },
  declineBtn: {
    backgroundColor: '#FEE2E2',
  },
  pendingBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
