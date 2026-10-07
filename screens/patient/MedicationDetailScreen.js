import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Text from '../../components/PatientText';
import UndoSnackbar from '../../components/UndoSnackbar';
import { useT } from '../../i18n/LanguageContext';
import dbService, { getActivePatientId } from '../../services/db';

export default function MedicationDetailScreen({ navigation, route, currentUser }) {
  const t = useT();
  const patientId = getActivePatientId(currentUser);
  const medicineId = route?.params?.medicineId || 'med-1';
  const [medicine, setMedicine] = useState(null);
  const [timesList, setTimesList] = useState([]);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [errorText, setErrorText] = useState(null);
  const [undoData, setUndoData] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [undoTimer, setUndoTimer] = useState(null);

  useEffect(() => {
    const med = dbService.getMedicineById(medicineId);
    if (med) {
      setMedicine(med);
      const rTimes = dbService.getReminderTimes(med.id);
      setTimesList(rTimes.map((rt) => rt.timeStr));
    }
  }, [medicineId]);

  if (!medicine) return null;

  const handleMarkTaken = () => {
    dbService.addDoseLog({
      patientId,
      medicineId: medicine.id,
      time: timesList[0] || '1:00 PM',
      date: 'Today',
      status: 'Taken',
    });
    navigation?.navigate('TodaysSchedule');
  };

  const handleConfirmDelete = async () => {
    try {
      setShowDeleteSheet(false);
      setErrorText(null);
      const pid = getActivePatientId(currentUser);
      const res = await dbService.deleteMedicine(medicine.id, pid);
      setUndoData(res);
      setSnackbarMsg(`Deleted ${medicine.name}`);
      try {
        const Notifications = require('expo-notifications');
        if (Notifications?.cancelScheduledNotificationAsync) {
          timesList.forEach(async (t) => {
            await Notifications.cancelScheduledNotificationAsync(`med-${medicine.id}-${t}`);
          });
        }
      } catch (e) {
        // Notifications fallback ignore
      }

      const timer = setTimeout(() => {
        setSnackbarMsg('');
        setUndoData(null);
        navigation?.goBack();
      }, 6000);
      setUndoTimer(timer);
    } catch (err) {
      console.error('Error deleting medicine:', err);
      setErrorText(err.code ? `${err.code}: ${err.message}` : String(err?.message || err));
    }
  };

  const handleUndoDelete = async () => {
    if (undoTimer) clearTimeout(undoTimer);
    if (undoData) {
      await dbService.restoreMedicine(undoData);
      setUndoData(null);
      setSnackbarMsg('');
    }
  };

  const handleSnackbarDismiss = () => {
    if (undoTimer) clearTimeout(undoTimer);
    setSnackbarMsg('');
    setUndoData(null);
    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        onBack={() => navigation?.goBack()}
        rightElement={
          <View style={styles.headerRightRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation?.navigate('EditDeleteMedicine', { medicineId: medicine.id })}
            >
              <Text style={styles.editText}>{t('edit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => setShowDeleteSheet(true)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Centered Image & Name Header */}
        <View style={styles.topHeaderGroup}>
          <View style={styles.imageCircle}>
            <Text style={styles.imageIcon}>💊</Text>
          </View>
          <Text style={styles.titleName}>{medicine.name}</Text>
          <Text style={styles.subtitleDose}>{medicine.dose} · Tablet</Text>
        </View>

        {/* Section 1: DOSE */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('dose')}</Text>
          <Text style={styles.sectionValue}>{medicine.dose}</Text>
        </View>

        {/* Section 2: TIME */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('time')}</Text>
          <Text style={styles.sectionValue}>
            {timesList.length > 0 ? timesList.join(' · ') : t('defaultTimes')}
          </Text>
        </View>

        {/* Section 3: WHEN */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('when')}</Text>
          <Text style={styles.sectionValue}>{medicine.mealInstruction || t('afterMeals')}</Text>
        </View>

        {/* Section 4: PURPOSE */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('purpose')}</Text>
          <Text style={styles.sectionValue}>{t('painRelief')}</Text>
        </View>

        {/* Section 5: INSTRUCTIONS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('instructions')}</Text>
          <Text style={styles.sectionValue}>{medicine.notes || t('takeWater')}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title={t('markTaken')} onPress={handleMarkTaken} />
      </View>

      <BottomSheetConfirmation
        visible={showDeleteSheet}
        title={`Delete ${medicine.name}?`}
        message="This will remove it and its reminders from your schedule."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteSheet(false)}
      />

      <UndoSnackbar message={snackbarMsg} onUndo={handleUndoDelete} onDismiss={handleSnackbarDismiss} />
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
    paddingBottom: 20,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EAF5F2',
  },
  editText: {
    color: '#0D8F7A',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  topHeaderGroup: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  imageCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imageIcon: {
    fontSize: 44,
  },
  titleName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleDose: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  errorBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
});
