import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';

export default function CallOutcomeLogScreen({ navigation, route, currentUser }) {
  const alert = route?.params?.alert;
  const patientId = route?.params?.patientId || alert?.patientId;

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Patient ID is required</Text>
      </View>
    );
  }
  const patientName = route?.params?.patientName || alert?.patientName || 'Mrs. Perera';
  const medicineName = route?.params?.medicineName || alert?.medicineName || alert?.medicine || 'Medicine';

  const [noteText, setNoteText] = useState('');
  const [pastNotes, setPastNotes] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadNotes = () => {
    const list = dbService.getCareNotes(patientId);
    setPastNotes(list);
  };

  useEffect(() => {
    loadNotes();
    const stopSubscribe = dbService.subscribeToCareNotes?.(patientId, setPastNotes, (err) => {
      console.error('CallOutcomeLogScreen care notes error:', err);
    });
    return () => stopSubscribe?.();
  }, [patientId]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    setErrorMsg('');
    try {
      await dbService.addCareNote({
        patientId,
        authorId: currentUser?.id || 'usr-caregiver-1',
        authorName: currentUser?.name || 'Caregiver',
        authorRole: 'Caregiver',
        note: noteText.trim(),
        medicineName,
      });

      if (alert?.id) {
        await dbService.markAlertHandled(alert.id, currentUser?.id);
      }

      setSavedSuccess(true);
      setNoteText('');
      loadNotes();
      setTimeout(() => {
        setSavedSuccess(false);
        navigation?.goBack();
      }, 1000);
    } catch (error) {
      console.error('CallOutcomeLogScreen handleSave ERROR:', error, error?.code, error?.message);
      setErrorMsg(`Failed to save outcome note [${error?.code || 'unknown'}]: ${error?.message || error}. Please try again.`);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Call Outcome Log"
        subtitle={`Record call outcome for ${patientName}`}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}
        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Outcome note saved successfully!</Text>
          </View>
        )}

        {/* Input Form */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>OUTCOME NOTE</Text>
          <TextInput
            style={styles.textArea}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Type what patient said during call..."
            multiline
            numberOfLines={4}
          />
          <Button title="Save outcome note" onPress={handleSaveNote} style={styles.saveBtn} />
        </View>

        {/* Past Outcome Notes (R View earlier notes) */}
        <Text style={styles.sectionHeader}>PAST OUTCOME NOTES</Text>

        {pastNotes.map((item) => (
          <View key={item.id} style={styles.noteCard}>
            <View style={styles.noteTopRow}>
              <Text style={styles.noteAuthor}>{item.authorRole || 'Caregiver'}</Text>
              <Text style={styles.noteDate}>{item.date || 'Today'}</Text>
            </View>
            <Text style={styles.noteContent}>{item.note}</Text>
          </View>
        ))}
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
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D8F7A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  successText: {
    color: '#0D8F7A',
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
    marginVertical: 10,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  saveBtn: {
    marginBottom: 0,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
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
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  noteDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  noteContent: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 19,
  },
});
