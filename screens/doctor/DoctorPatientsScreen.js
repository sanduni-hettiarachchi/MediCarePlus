import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Text from '../../components/PatientText';

export default function DoctorPatientsScreen({ navigation, route, currentUser }) {
  const doctor = route?.params?.doctor || { name: 'Dr. K. Silva' };
  const [careLinks, setCareLinks] = useState([]);
  const [patientDataMap, setPatientDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const doctorId = currentUser?.id;
    if (!doctorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const firestoreDb = require('../../services/db').getFirestoreDb?.();
    if (!firestoreDb) {
      console.error('[DoctorPatientsScreen] Firestore not available');
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestoreDb, 'care_links'),
      where('memberId', '==', doctorId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const links = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log('[DoctorPatientsScreen] Found', links.length, 'care_links');
      setCareLinks(links);

      // Fetch patient data for each link
      const patientMap = {};
      links.forEach((link) => {
        if (link.patientId && !patientMap[link.patientId]) {
          const patientDoc = require('../../services/db').getUserById(link.patientId);
          patientMap[link.patientId] = patientDoc || { id: link.patientId, name: 'Patient' };
        }
      });
      setPatientDataMap(patientMap);
      setLoading(false);
    }, (err) => {
      console.error('[DoctorPatientsScreen] care_links error:', err.code, err.message);
      setError('Failed to load patients: ' + (err.message || 'Please try again.'));
      setLoading(false);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.id]);

  const pendingLinks = careLinks.filter((l) => l.status === 'Pending');
  const activeLinks = careLinks.filter((l) => l.status === 'Active');

  const handleAcceptInvite = async (linkId) => {
    try {
      const firestoreDb = require('../../services/db').getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_links', linkId), { status: 'Active' });
        console.log('[DoctorPatientsScreen] Accepted invite:', linkId);
      }
    } catch (err) {
      console.error('[DoctorPatientsScreen] Error accepting invite:', err.code, err.message);
      setError('Failed to accept invite: ' + (err.message || 'Please try again.'));
    }
  };

  const handleDeclineInvite = async (linkId) => {
    try {
      const firestoreDb = require('../../services/db').getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_links', linkId), { status: 'Declined' });
        console.log('[DoctorPatientsScreen] Declined invite:', linkId);
      }
    } catch (err) {
      console.error('[DoctorPatientsScreen] Error declining invite:', err.code, err.message);
      setError('Failed to decline invite: ' + (err.message || 'Please try again.'));
    }
  };

  const handleSelectPatient = (link) => {
    const patient = patientDataMap[link.patientId] || { id: link.patientId, name: 'Patient' };
    navigation?.navigate('DoctorPatientHub', { patient, doctor, currentUser });
  };

  return (
    <View style={styles.container}>
      <Header
        title="My patients"
        subtitle={doctor.name}
        onBack={() => navigation?.goBack()}
        colorScheme="green"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {pendingLinks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending invites ({pendingLinks.length})</Text>
                {pendingLinks.map((link) => {
                  const patient = patientDataMap[link.patientId] || { id: link.patientId, name: 'Patient' };
                  return (
                    <View key={link.id} style={styles.card}>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <View style={styles.buttonRow}>
                        <Button
                          title="Accept"
                          colorScheme="green"
                          onPress={() => handleAcceptInvite(link.id)}
                          style={styles.acceptBtn}
                        />
                        <Button
                          title="Decline"
                          variant="outline"
                          colorScheme="green"
                          onPress={() => handleDeclineInvite(link.id)}
                          style={styles.declineBtn}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active patients ({activeLinks.length})</Text>
              {activeLinks.length === 0 ? (
                <Text style={styles.emptyText}>No patients linked yet. Patients invite you from their app.</Text>
              ) : (
                activeLinks.map((link) => {
                  const patient = patientDataMap[link.patientId] || { id: link.patientId, name: 'Patient' };
                  return (
                    <TouchableOpacity
                      key={link.id}
                      style={styles.card}
                      onPress={() => handleSelectPatient(link)}
                    >
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.selectText}>Select</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
  },
  declineBtn: {
    flex: 1,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D8F7A',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
