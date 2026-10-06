import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../components/Button';
import PatientText from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';

export default function MedicineAddedScreen({ navigation, route }) {
  const t = useT();
  const medicine = route?.params?.medicine || {
    name: 'Metformin 500mg',
    mealInstruction: 'After meals',
    notes: 'Daily',
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        {/* Circle with checkmark */}
        <View style={styles.checkCircle}>
          <PatientText style={styles.checkIcon}>✓</PatientText>
        </View>

        <PatientText style={styles.title}>{t('medicineAdded')}</PatientText>

        {/* Medication Card */}
        <View style={styles.card}>
          <PatientText style={styles.medIcon}>💊</PatientText>
          <View style={styles.medInfo}>
            <PatientText style={styles.medName}>{medicine.name}</PatientText>
            <PatientText style={styles.medSub}>
              {medicine.dose || '500mg'} · {medicine.mealInstruction || t('afterMeals')}
            </PatientText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Back to schedule button - outlined */}
        <Button
          title={t('backToSchedule')}
          variant="outline"
          onPress={() => navigation?.navigate('YourMedicines')}
          style={styles.backBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentBox: {
    width: '100%',
    alignItems: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 36,
    color: '#0D8F7A',
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  medIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  medSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginBottom: 24,
  },
  backBtn: {
    width: '100%',
  },
});
