import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';

export default function AddMedicineSheet({ navigation }) {
  const t = useT();
  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('addMedicineTitle')}</Text>
        <Text style={styles.subtitle}>{t('chooseAddMethod')}</Text>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => navigation?.navigate('AddMedicineDetails')}
        >
          <Text style={styles.optionIcon}>📷</Text>
          <View style={styles.optionTextCol}>
            <Text style={styles.optionTitle}>{t('scanPrescription')}</Text>
            <Text style={styles.optionSub}>{t('scanMedicationLabel')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => navigation?.navigate('AddMedicineDetails')}
        >
          <Text style={styles.optionIcon}>✍️</Text>
          <View style={styles.optionTextCol}>
            <Text style={styles.optionTitle}>{t('enterManually')}</Text>
            <Text style={styles.optionSub}>{t('typeMedicineDetails')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E1',
  },
});
