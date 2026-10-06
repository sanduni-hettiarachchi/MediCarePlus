import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import Text from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';

export default function MedicationDetailScreen({ navigation, route, currentUser }) {
  const t = useT();
  const patientId = currentUser?.id || 'usr-patient-1';
  const medicineId = route?.params?.medicineId || 'med-1';
  const [medicine, setMedicine] = useState(null);
  const [timesList, setTimesList] = useState([]);

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

  return (
    <View style={styles.container}>
      <Header
        onBack={() => navigation?.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation?.navigate('EditDeleteMedicine', { medicineId: medicine.id })}
          >
            <Text style={styles.editText}>{t('edit')}</Text>
          </TouchableOpacity>
        }
      />

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
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EAF5F2',
  },
  editText: {
    color: '#0D8F7A',
    fontSize: 14,
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
});
