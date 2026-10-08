import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import { useT } from '../../i18n/LanguageContext';
import Text from '../../components/PatientText';

export default function DoseScreen({ navigation, route, currentUser }) {
  const t = useT();
  const patientId = currentUser?.id;

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Patient ID is required</Text>
      </View>
    );
  }
  const medicine = route?.params?.medicine || {
    id: 'med-2',
    name: 'Blood pressure tablet',
    dose: '1 tablet · after lunch',
    time: '1:00 PM',
  };

  const [showSkipSheet, setShowSkipSheet] = useState(false);

  const handleMarkTaken = () => {
    dbService.addDoseLog({
      patientId,
      medicineId: medicine.id,
      time: medicine.time || '1:00 PM',
      date: 'Today',
      status: 'Taken',
    });
    navigation?.navigate('TodaysSchedule');
  };

  const handleConfirmSkip = () => {
    setShowSkipSheet(false);
    dbService.addDoseLog({
      patientId,
      medicineId: medicine.id,
      time: medicine.time || '1:00 PM',
      date: 'Today',
      status: 'Skipped',
    });

    // Notify linked caregiver (Page 43)
    dbService.addAlert({
      patientId,
      type: 'dose_skipped',
      message: `Skipped ${medicine.name} at ${medicine.time || '1:00 PM'}.`,
    });

    navigation?.navigate('TodaysSchedule');
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('doseTodayTime', { time: medicine.time || '1:00 PM' })}
        subtitle={t('doseDate')}
        onBack={() => navigation?.goBack()}
      />

      <View style={styles.content}>
        {/* Medicine Card */}
        <View style={styles.medCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>💊</Text>
          </View>
          <Text style={styles.medName}>{medicine.name}</Text>
          <Text style={styles.medDose}>{medicine.dose}</Text>
        </View>

        {/* Large Taken Button */}
        <Button
          title={t('markTaken')}
          onPress={handleMarkTaken}
          style={styles.takenBtn}
        />

        {/* Skip Button */}
        <Button
          title={t('skipThisDose')}
          variant="outline"
          onPress={() => setShowSkipSheet(true)}
          style={styles.skipBtn}
        />

        <Text style={styles.helpText}>{t('skipHelp')}</Text>
      </View>

      {/* Skip this dose? Modal Sheet (Page 43) */}
      <BottomSheetConfirmation
        visible={showSkipSheet}
        title={t('skipThisDose')}
        message={t('skipConfirm')}
        confirmLabel={t('skipDose')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmSkip}
        onCancel={() => setShowSkipSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 36,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  medName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  medDose: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  takenBtn: {
    minHeight: 56,
    marginBottom: 12,
  },
  skipBtn: {
    minHeight: 48,
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});
