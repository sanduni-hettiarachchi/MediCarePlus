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

export default function CallOutcomeLogScreen({ navigation, route }) {
  const alert = route?.params?.alert;
  const [noteText, setNoteText] = useState('Patient said she took her afternoon dose late at 1:30 PM.');
  const [pastNotes, setPastNotes] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadNotes = () => {
    const list = dbService.getCareNotes();
    setPastNotes(list);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    dbService.addCareNote({
      authorRole: 'Caregiver',
      note: noteText.trim(),
    });

    if (alert) {
      dbService.markAlertHandled(alert.id);
    }

    setSavedSuccess(true);
    setNoteText('');
    loadNotes();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Call Outcome Log"
        subtitle="Record call outcome for Mrs. Perera"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
