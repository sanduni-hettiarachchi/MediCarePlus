import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './PatientText';

export default function Header({
  title,
  subtitle,
  onBack,
  showLogo = false,
  colorScheme = 'green', // 'green' or 'blue'
  rightElement,
}) {
  const primaryColor = colorScheme === 'blue' ? '#007AFF' : '#0D8F7A';

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <Text style={[styles.backArrow, { color: primaryColor }]}>‹</Text>
          </TouchableOpacity>
        ) : showLogo ? (
          <Text style={[styles.brand, { color: primaryColor }]}>
            MediCare<Text style={styles.plus}>+</Text>
          </Text>
        ) : null}
        {rightElement ? <View style={styles.rightContainer}>{rightElement}</View> : null}
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '300',
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  plus: {
    color: '#E39A52',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 2,
  },
});
