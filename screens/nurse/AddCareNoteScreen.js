import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import Text from '../../components/PatientText';

export default function AddCareNoteScreen({ navigation, route, currentUser }) {
  const patient = route?.params?.patient || { name: 'Patient' };
  const patientId = route?.params?.patientId || patient.id;
  const nurse = route?.params?.nurse || { name: currentUser?.name || 'Nurse' };
  const existingNote = route?.params?.existingNote;

  const [noteText, setNoteText] = useState(existingNote ? existingNote.text || existingNote.note : '');
  const [dateTimeStr, setDateTimeStr] = useState('');
  const [shareWithPatient, setShareWithPatient] = useState(existingNote ? existingNote.visibleToPatient : true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
                      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setDateTimeStr(formatted);
  }, []);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveNote = async () => {
    if (!noteText.trim() || saving) return;

    setSaving(true);
    setErrorMessage('');
    setSavedSuccess(false);

    const authorId = currentUser?.id;
    const authorName = currentUser?.name || nurse.name;

    if (!authorId) {
      setErrorMessage('No authenticated user');
      setSaving(false);
      return;
    }

    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (!firestoreDb) {
        throw new Error('Firestore not available');
      }

      if (existingNote) {
        // Edit mode: update text, visibleToPatient, editedAt
        const noteRef = doc(firestoreDb, 'care_notes', existingNote.id);
        await updateDoc(noteRef, {
          text: noteText.trim(),
          visibleToPatient: shareWithPatient,
          editedAt: serverTimestamp()
        });
        console.log('[AddCareNote] Updated note:', existingNote.id);
      } else {
        // Create mode: save note and fan out notifications
        const batch = writeBatch(firestoreDb);
        
        // Create care note
        const noteRef = doc(collection(firestoreDb, 'care_notes'));
        const noteData = {
          patientId,
          authorId,
          authorName,
          authorRole: 'nurse',
          type: 'nurse_note',
          text: noteText.trim(),
          visibleToPatient: shareWithPatient,
          createdAt: serverTimestamp(),
          editedAt: null
        };
        batch.set(noteRef, noteData);
        
        // Fan out notifications if visible to patient
        if (shareWithPatient) {
          // Query active care_links for this patient
          const careLinksQuery = query(
            collection(firestoreDb, 'care_links'),
            where('patientId', '==', patientId),
            where('status', '==', 'Active')
          );
          const careLinksSnapshot = await getDocs(careLinksQuery);
          
          // Add notification for patient
          const patientNotifRef = doc(collection(firestoreDb, 'notifications'));
          batch.set(patientNotifRef, {
            userId: patientId,
            patientId,
            type: 'care_note',
            title: 'New care note',
            body: `${authorName} added a care note`,
            read: false,
            createdBy: authorId,
            createdAt: serverTimestamp(),
            relatedId: noteRef.id
          });
          
          // Add notifications for caregivers with viewCareNotes permission
          careLinksSnapshot.forEach((docSnapshot) => {
            const link = docSnapshot.data();
            if (link.role === 'caregiver' && link.permissions?.viewCareNotes && link.memberId !== authorId) {
              const caregiverNotifRef = doc(collection(firestoreDb, 'notifications'));
              batch.set(caregiverNotifRef, {
                userId: link.memberId,
                patientId,
                type: 'care_note',
                title: 'New care note',
                body: `${authorName} added a care note`,
                read: false,
                createdBy: authorId,
                createdAt: serverTimestamp(),
                relatedId: noteRef.id
              });
            }
          });
        }
        
        await batch.commit();
        console.log('[AddCareNote] Saved note and notifications:', noteRef.id);
      }

      setSavedSuccess(true);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        navigation?.goBack();
      }, 1200);
    } catch (err) {
      console.error('[AddCareNote] Save error:', err.code, err.message);
      setErrorMessage(err.code ? `${err.code}: ${err.message}` : String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Add Care Note"
        subtitle={`Patient: ${patient.name || 'Mrs. Perera'}`}
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Note saved to Recent notes</Text>
          </View>
        )}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>NOTE</Text>
          <TextInput
            style={styles.textArea}
            value={noteText}
            onChangeText={(txt) => { setNoteText(txt); setErrorMessage(''); }}
            placeholder="Type clinical observations or recommendations..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setShareWithPatient(!shareWithPatient)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, shareWithPatient && styles.checkboxChecked]}>
              {shareWithPatient && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Visible to patient and caregivers</Text>
          </TouchableOpacity>

          <Text style={styles.label}>DATE & TIME</Text>
          <TextInput
            style={styles.dateTimeInput}
            value={dateTimeStr}
            onChangeText={setDateTimeStr}
          />

          <Button
            title={saving ? 'Saving...' : 'Save Note'}
            colorScheme="blue"
            onPress={handleSaveNote}
            disabled={saving || !noteText.trim()}
            style={styles.saveBtn}
          />
        </View>
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
  successBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dateTimeInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#0D8F7A',
    borderColor: '#0D8F7A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#475569',
  },
  saveBtn: {
    marginBottom: 12,
  },
});
