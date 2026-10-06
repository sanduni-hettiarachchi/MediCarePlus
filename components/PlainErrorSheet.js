import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Button from './Button';
import PatientText from './PatientText';
import { useT } from '../i18n/LanguageContext';

export default function PlainErrorSheet({ visible, onRetry, onClose }) {
  const t = useT();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <PatientText style={styles.message}>{t('genericError')}</PatientText>
          <Button title={t('retry')} onPress={onRetry || onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
  message: { color: '#1F2937', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 18 },
});
