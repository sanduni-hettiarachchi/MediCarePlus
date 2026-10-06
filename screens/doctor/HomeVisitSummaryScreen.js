import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import authService from '../../services/authService';
import Button from '../../components/Button';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import dbService from '../../services/db';
import PatientText from '../../components/PatientText';

const Text = PatientText;

export default function HomeVisitSummaryScreen({ navigation, route }) {
  const doctor = route?.params?.doctor || { name: 'Dr. K. Silva', slmcNumber: '12345' };
  const patientId = route?.params?.patientId || 'usr-patient-1';
  const [activeTab, setActiveTab] = useState('Home visit');

  const [caregiverNotes, setCaregiverNotes] = useState([]);
  const [summary, setSummary] = useState({ adherence: 0, mostMissedMedicine: '—', mostMissedTimeOfDay: '—' });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [counsellingText, setCounsellingText] = useState('');
  const [shareWithPatient, setShareWithPatient] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    const notes = dbService.getCareNotes();
    setCaregiverNotes(notes);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => dbService.subscribeToDoseLogs(patientId, (logs) => {
    setSummary(dbService.getAdherenceSummary(patientId, logs));
  }), [patientId]);

  const handleSaveCounsellingNote = () => {
    if (!counsellingText.trim()) return;

    dbService.addCareNote({
      patientId,
      authorId: doctor.slmcNumber || 'usr-doctor-1',
      authorName: doctor.name || 'Dr. K. Silva',
      authorRole: 'Doctor',
      note: counsellingText.trim(),
      visibleToPatient: shareWithPatient,
    });

    setCounsellingText('');
    setShareWithPatient(true);
    setShowNoteModal(false);
    setSuccessMsg('✓ Counselling note logged successfully!');
    loadData();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Home visit summary"
        subtitle="Mrs. Perera · read-only access"
        onProfilePress={() => navigation?.navigate('DoctorProfile', { doctor })}
        onLogoutPress={() => authService.logout(navigation)}
      />

      {/* Clinician Summary Banner (UI-08) */}
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryTitle}>Adherence {summary.adherence}% this week · Most missed: {summary.mostMissedMedicine} ({summary.mostMissedTimeOfDay})</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Home visit' && styles.selectedTabBtn]}
          onPress={() => setActiveTab('Home visit')}
        >
          <Text style={[styles.tabText, activeTab === 'Home visit' && styles.selectedTabText]}>
            Home visit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Patient visits' && styles.selectedTabBtn]}
          onPress={() => {
            setActiveTab('Patient visits');
            navigation?.navigate('PatientVisits', { doctor });
          }}
        >
          <Text style={[styles.tabText, activeTab === 'Patient visits' && styles.selectedTabText]}>
            Patient visits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Refill status' && styles.selectedTabBtn]}
          onPress={() => {
            setActiveTab('Refill status');
            navigation?.navigate('RefillStatus', { doctor });
          }}
        >
          <Text style={[styles.tabText, activeTab === 'Refill status' && styles.selectedTabText]}>
            Refill status
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {successMsg ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Section 1: DOSES MISSED (R View missed doses) */}
        <Text style={styles.sectionHeader}>DOSES MISSED</Text>

        <View style={styles.missedCard}>
          <View style={styles.missedRow}>
            <Text style={styles.missedMedName}>Blood pressure tablet</Text>
            <View style={styles.missedTag}>
              <Text style={styles.missedTagText}>Missed</Text>
            </View>
          </View>

          <View style={[styles.missedRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.missedMedName}>Paracetamol XL2</Text>
            <View style={styles.missedTag}>
              <Text style={styles.missedTagText}>Missed</Text>
            </View>
          </View>
        </View>

        {/* Section 2: NOTES FROM CAREGIVER */}
        <Text style={styles.sectionHeader}>NOTES FROM CAREGIVER</Text>

        {caregiverNotes.length === 0 ? <Text style={styles.emptyNotes}>No care notes yet.</Text> : null}
        {caregiverNotes.map((cn) => (
          <View key={cn.id} style={styles.noteCard}>
            <Text style={styles.noteHeader}>
              "{cn.authorRole || 'Caregiver'} note · {cn.date || 'Today'}"
            </Text>
            <Text style={styles.noteBody}>"{cn.note}"</Text>
          </View>
        ))}

        {/* Action Button: C Log counselling note */}
        <Button
          title="Log counselling note"
          onPress={() => setShowNoteModal(true)}
          style={styles.logNoteBtn}
        />

        {/* Link to Health Report Screen */}
        <Button
          title="View Full Health Report"
          variant="outline"
          onPress={() => navigation?.navigate('HealthReport', { doctor })}
          style={styles.healthReportBtn}
        />
      </ScrollView>

      {/* Log Counselling Note Modal Sheet */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log counselling note</Text>
            <Text style={styles.modalSub}>
              Record observations or instructions for Mrs. Perera's care team.
            </Text>

            <TextInput
              style={styles.textArea}
              value={counsellingText}
              onChangeText={setCounsellingText}
              placeholder="e.g. Advised patient to take afternoon dose right after lunch."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setShareWithPatient(!shareWithPatient)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, shareWithPatient && styles.checkboxChecked]}>
                {shareWithPatient && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Share this note with the patient</Text>
            </TouchableOpacity>

            <Button
              title="Save counselling note"
              onPress={handleSaveCounsellingNote}
              style={styles.saveNoteBtn}
            />

            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowNoteModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  summaryBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  summarySub: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
  emptyNotes: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
    backgroundColor: '#F1F5F9',
  },
  selectedTabBtn: {
    backgroundColor: '#0D8F7A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D8F7A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#0D8F7A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  missedCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  missedMedName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  missedTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  missedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  noteHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 14,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  logNoteBtn: {
    marginTop: 12,
    marginBottom: 10,
  },
  healthReportBtn: {
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveNoteBtn: {
    marginBottom: 8,
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
});
