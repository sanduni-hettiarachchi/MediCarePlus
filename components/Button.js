import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import Text from './PatientText';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  colorScheme = 'green', // 'green' or 'blue'
  disabled = false,
  style,
  textStyle,
}) {
  const getBackgroundColor = () => {
    if (disabled) return '#C5D6CF';
    if (variant === 'danger') return '#D93838';
    if (variant === 'secondary' || variant === 'outline') return 'transparent';
    if (variant === 'mint') return '#EAF5F2';
    if (variant === 'text') return 'transparent';
    return colorScheme === 'blue' ? '#007AFF' : colors.background.green;
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      if (disabled) return '#C5D6CF';
      if (colorScheme === 'blue') return '#007AFF';
      return colors.background.green;
    }
    if (variant === 'danger-outline') return '#D93838';
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return '#7C8E87';
    if (variant === 'danger') return '#FFFFFF';
    if (variant === 'danger-outline') return '#D93838';
    if (variant === 'outline' || variant === 'secondary') {
      return colorScheme === 'blue' ? '#007AFF' : colors.background.green;
    }
    if (variant === 'mint') return colorScheme === 'blue' ? '#007AFF' : colors.background.green;
    if (variant === 'text') return colorScheme === 'blue' ? '#007AFF' : colors.background.green;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'danger-outline' ? 1.5 : 0,
        },
        variant === 'text' && styles.textButton,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.label, { color: getTextColor() }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 6,
  },
  textButton: {
    minHeight: 40,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginVertical: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
