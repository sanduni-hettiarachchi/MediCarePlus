import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../components/Button';
import PatientText from '../../components/PatientText';
import dbService from '../../services/db';
import { useLanguage, useT } from '../../i18n/LanguageContext';
import reminderService from '../../services/reminderService';

export default function ReminderAlertScreen({ navigation, route, currentUser, userPreferences = {} }) {
  const t = useT();
  const contextLanguage = useLanguage();
  const language = userPreferences.language || contextLanguage;
  const medicine = route?.params?.medicine || {
    id: 'med-1',
    name: 'Metformin 500mg',
    dose: '500 mg',
    mealInstruction: 'After lunch',
    time: '1:00 PM',
  };
  const patientId = currentUser?.id;

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Patient ID is required</Text>
      </View>
    );
  }
  const [snoozesUsed, setSnoozesUsed] = useState(0);
  const [caregiverNotified, setCaregiverNotified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const snoozesLeft = Math.max(0, 2 - snoozesUsed);

  useEffect(() => {
    let mounted = true;
    dbService.getDoseSnoozeCount(patientId, medicine.id)
      .then(({ snoozeCount }) => {
        if (mounted) {
          setSnoozesUsed(Math.min(2, snoozeCount));
          setCaregiverNotified(snoozeCount >= 2);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [medicine.id, patientId]);

  const handleTaken = async () => {
    try {
      console.log('[ReminderAlert] handleTaken called for medicine:', medicine.id, 'patientId:', patientId);
      await dbService.addDoseLog({
        patientId,
        medicineId: medicine.id,
        medicineName: medicine.name,
        time: medicine.time || '1:00 PM',
        date: 'Today',
        status: 'Taken',
      });
      console.log('[ReminderAlert] Dose log added successfully');
      navigation?.navigate('TodaysSchedule');
    } catch (error) {
      console.error('[ReminderAlert] handleTaken error:', error);
      setErrorMessage(t('genericError'));
    }
  };

  const handleSnooze = async () => {
    console.log('[ReminderAlert] handleSnooze called, snoozesLeft:', snoozesLeft);
    if (snoozesLeft <= 0) {
      console.log('[ReminderAlert] No snoozes left, returning');
      return;
    }
    try {
      console.log('[ReminderAlert] Recording dose snooze...');
      const result = await dbService.recordDoseSnooze({
        patientId,
        medicineId: medicine.id,
        medicine: medicine.name,
        time: medicine.time || '1:00 PM',
      });
      console.log('[ReminderAlert] Snooze recorded:', result);
      setSnoozesUsed(Math.min(2, result.snoozeCount));
      console.log('[ReminderAlert] Scheduling snooze notification...');
      await reminderService.scheduleSnoozeNotification(medicine.id, medicine.name, 10, language);
      console.log('[ReminderAlert] Snooze notification scheduled');
      if (result.snoozeCount >= 2) setCaregiverNotified(true);
    } catch (error) {
      console.error('[ReminderAlert] handleSnooze error:', error);
      setErrorMessage(t('genericError'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.alertSheet}>
        <View style={styles.handle} />
        <PatientText style={styles.headerTitle}>{t('medicationReminder')}</PatientText>
        <PatientText style={styles.medTitle}>{medicine.name}</PatientText>
        <PatientText style={styles.medDetail}>
          {medicine.mealInstruction || t('afterLunch')} · {medicine.time || '1:00 PM'}
        </PatientText>

        <View style={styles.voiceBanner}>
          <PatientText style={styles.voiceIcon}>🔊</PatientText>
          <PatientText style={styles.voiceText}>{t('voiceReminderPlaying')}</PatientText>
        </View>

        {errorMessage ? <PatientText style={styles.errorText}>{errorMessage}</PatientText> : null}
        <Button title={t('markTaken')} onPress={handleTaken} style={styles.takenBtn} />
        {snoozesLeft > 0 ? (
          <Button title={t('snooze10', { count: snoozesLeft })} variant="outline" onPress={handleSnooze} style={styles.snoozeBtn} />
        ) : (
          <Button title={t('noSnoozes')} variant="secondary" disabled style={styles.snoozeBtn} />
        )}

        {caregiverNotified ? (
          <View style={styles.caregiverNotice}>
            <PatientText style={styles.warningIcon}>⚠️</PatientText>
            <PatientText style={styles.warningText}>{t('noSnoozes')}</PatientText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  alertSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, alignItems: 'center' },
  handle: { width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, marginBottom: 16 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#4B5563', letterSpacing: 0.5, marginBottom: 6 },
  medTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  medDetail: { fontSize: 14, color: '#4B5563', marginTop: 4, marginBottom: 16 },
  voiceBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4F1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, width: '100%', marginBottom: 20 },
  voiceIcon: { fontSize: 16, marginRight: 8 },
  voiceText: { fontSize: 14, fontWeight: '600', color: '#0D8F7A', flex: 1 },
  errorText: { fontSize: 14, color: '#B42318', marginBottom: 8 },
  takenBtn: { minHeight: 56, marginBottom: 12 },
  snoozeBtn: { minHeight: 48, marginBottom: 10 },
  caregiverNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 12, padding: 12, width: '100%', marginTop: 6 },
  warningIcon: { fontSize: 16, marginRight: 8 },
  warningText: { fontSize: 14, fontWeight: '600', color: '#92400E', flex: 1 },
});
