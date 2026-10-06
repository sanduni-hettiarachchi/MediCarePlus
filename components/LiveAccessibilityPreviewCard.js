import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useT } from '../i18n/LanguageContext';
import Text from './PatientText';

export default function LiveAccessibilityPreviewCard({ isLargeText, isHighContrast, language = 'en' }) {
  const t = useT(language);
  const containerBg = isHighContrast ? '#000000' : '#FFFFFF';
  const cardBg = isHighContrast ? '#111111' : '#F8FAFC';
  const textColor = isHighContrast ? '#FFFFFF' : '#0F172A';
  const subtitleColor = isHighContrast ? '#E2E8F0' : '#4B5563';
  const badgeBg = isHighContrast ? '#FFFF00' : '#E6F4F1';
  const badgeTextColor = isHighContrast ? '#000000' : '#0B6155';

  const baseFontSize = 16;
  const subtitleFontSize = 14;

  return (
    <View style={[styles.wrapper, { backgroundColor: containerBg }]}>
      <Text style={[styles.previewLabel, { color: subtitleColor }]}>{t('previewTitle')}</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: isHighContrast ? '#FFFFFF' : '#E2E8F0' }]}>
        <View style={styles.row}>
          <View style={styles.textGroup}>
            <Text style={[styles.medName, { color: textColor, fontSize: baseFontSize }]}>
              {t('previewMedicine')}
            </Text>
            <Text style={[styles.medDetail, { color: subtitleColor, fontSize: subtitleFontSize }]}>
              {t('previewDoseDetail')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeTextColor, fontSize: subtitleFontSize }]}>
              {t('previewTaken')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
    marginRight: 8,
  },
  medName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  medDetail: {
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '700',
  },
});
