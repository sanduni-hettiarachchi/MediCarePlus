import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import PatientText from '../../components/PatientText';

const Text = PatientText;

export default function AddCareNoteScreen({ navigation, route }) {
  const patient = route?.params?.patient || { name: 'Mrs. Perera', id: 'usr-patient-1' };
  const nurse = route?.params?.nurse || { name: 'Nurse Dilani', nurseId: 'usr-nurse-1' };
  const existingNote = route?.params?.existingNote;
  const patientId = patient.id || 'usr-patient-1';

  const [noteText, setNoteText] = useState(existingNote ? existingNote.text || existingNote.note : '');
  const [dateTimeStr, setDateTimeStr] = useState('');
  const [shareWithPatient, setShareWithPatient] = useState(existingNote ? existingNote.visibleToPatient : false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
                      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setDateTimeStr(formatted);
  }, []);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    const noteData = {
      patientId,
      authorId: nurse.nurseId || 'usr-nurse-1',
      authorRole: 'nurse',
      text: noteText.trim(),
      visibleToPatient: shareWithPatient,
    };

    if (existingNote) {
      dbService.updateCareNote(existingNote.id, { text: noteText.trim(), visibleToPatient: shareWithPatient });
    } else {
      dbService.addCareNote(noteData);
    }

    setSavedSuccess(true);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
      navigation?.goBack();
    }, 1500);
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

        <View style={styles.card}>
          <Text style={styles.label}>NOTE</Text>
          <TextInput
            style={styles.textArea}
            value={noteText}
            onChangeText={setNoteText}
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
            title="Save Note"
            colorScheme="blue"
            onPress={handleSaveNote}
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
