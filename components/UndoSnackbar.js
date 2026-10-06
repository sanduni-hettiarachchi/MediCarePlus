import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useT } from '../i18n/LanguageContext';
import Text from './PatientText';

export default function UndoSnackbar({ message, onUndo, onDismiss, duration = 6000 }) {
  const t = useT();
  const [visible, setVisible] = useState(true);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return undefined;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismissRef.current?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!visible || !message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.messageText} numberOfLines={1}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setVisible(false);
          if (onUndo) onUndo();
        }}
        style={styles.undoBtn}
      >
        <Text style={styles.undoText}>{t('undo')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  undoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  undoText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
