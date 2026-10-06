import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import dbService from '../../services/db';
import Text from '../../components/PatientText';

export default function EditCareNoteScreen({ navigation, route }) {
  const patient = route?.params?.patient || { name: 'Mrs. Perera', id: 'usr-patient-1' };
  const nurse = route?.params?.nurse || { name: 'Nurse Dilani', nurseId: 'usr-nurse-1' };
  const existingNote = route?.params?.existingNote;
  const patientId = patient.id || 'usr-patient-1';

  const [noteText, setNoteText] = useState(existingNote ? existingNote.text || existingNote.note : '');
  const [dateTimeStr, setDateTimeStr] = useState('');
  const [shareWithPatient, setShareWithPatient] = useState(existingNote ? existingNote.visibleToPatient : false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  useEffect(() => {
    if (existingNote) {
      const date = existingNote.createdAt || existingNote.timestamp;
      if (date) {
        const d = new Date(date);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
                          d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setDateTimeStr(formatted);
      }
    }
  }, [existingNote]);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    if (existingNote) {
      dbService.updateCareNote(existingNote.id, { text: noteText.trim(), visibleToPatient: shareWithPatient });
    } else {
      const noteData = {
        patientId,
        authorId: nurse.nurseId || 'usr-nurse-1',
        authorRole: 'nurse',
        text: noteText.trim(),
        visibleToPatient: shareWithPatient,
      };
      dbService.addCareNote(noteData);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      navigation?.goBack();
    }, 1500);
  };

  const handleDeleteNote = () => {
    if (existingNote) {
      dbService.deleteCareNote(existingNote.id);
      navigation?.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={existingNote ? 'Edit Care Note' : 'Add Care Note'}
        subtitle={`Patient: ${patient.name || 'Mrs. Perera'}`}
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Note saved</Text>
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
            editable={false}
          />
        </View>

        <Button
          title="Save changes"
          colorScheme="blue"
          onPress={handleSaveNote}
          style={styles.saveBtn}
        />

        {existingNote && (
          <Button
            title="Delete note"
            variant="outline"
            colorScheme="blue"
            onPress={() => setShowDeleteSheet(true)}
            style={styles.deleteBtn}
          />
        )}
      </ScrollView>

      <BottomSheetConfirmation
        visible={showDeleteSheet}
        title="Delete this note?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteNote}
        onCancel={() => setShowDeleteSheet(false)}
      />
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
    backgroundColor: '#E6F4F1',
    borderColor: '#0D8F7A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#0D8F7A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dateTimeInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
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
  deleteBtn: {
    marginBottom: 20,
  },
});
