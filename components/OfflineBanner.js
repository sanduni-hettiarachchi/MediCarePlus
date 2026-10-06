import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useT } from '../i18n/LanguageContext';
import Text from './PatientText';

export default function OfflineBanner({ onRetry, visible = true }) {
  const t = useT();
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.contentRow}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textColumn}>
          <Text style={styles.title}>{t('offlineTitle')}</Text>
          <Text style={styles.subtitle}>{t('offlineMessage')}</Text>
        </View>
      </View>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  subtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  retryBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#0D8F7A',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D8F7A',
  },
});
