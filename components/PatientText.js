import React from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize } from '../theme/typography';
import { colors } from '../theme/colors';

function luminance(hex) {
  if (!/^#[\da-f]{6}$/i.test(hex || '')) return null;
  const channels = hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastOnWhite(hex) {
  const value = luminance(hex);
  return value === null ? 21 : 1.05 / (value + 0.05);
}

export default function PatientText({ style, ...props }) {
  const { largeText, highContrast } = useTheme();
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const baseSize = Math.max(Number(flattenedStyle.fontSize) || 16, 14);
  const originalColor = flattenedStyle.color || colors.text.primary;
  const color = highContrast
    ? String(originalColor).toUpperCase() === '#FFFFFF' ? '#FFFFFF' : '#000000'
    : String(originalColor).toUpperCase() === '#FFFFFF'
      ? '#FFFFFF'
      : contrastOnWhite(originalColor) < 4.5 ? colors.text.secondary : originalColor;
  return <NativeText {...props} style={[style, { fontSize: fontSize(baseSize, largeText), color }]} />;
}
