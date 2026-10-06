import React from 'react';
import { Modal, StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import Button from './Button';
import { useT } from '../i18n/LanguageContext';
import Text from './PatientText';

export default function BottomSheetConfirmation({
  visible,
  title,
  message,
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  onConfirm,
  onCancel,
  colorScheme = 'green',
}) {
  const t = useT();
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheetContainer}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.buttonsContainer}>
          {/* Cancel is default safe action */}
          <Button
            title={t(cancelLabel)}
            variant="outline"
            colorScheme={colorScheme}
            onPress={onCancel}
            style={styles.cancelBtn}
          />
          <Button
            title={t(confirmLabel)}
            variant="danger-outline"
            onPress={onConfirm}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  buttonsContainer: {
    width: '100%',
  },
  confirmBtn: {
    marginBottom: 10,
  },
  cancelBtn: {
    marginBottom: 0,
  },
});
