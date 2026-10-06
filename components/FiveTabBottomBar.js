import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLanguage, useT } from '../i18n/LanguageContext';
import Text from './PatientText';
import { colors } from '../theme/colors';

export default function FiveTabBottomBar({
  activeTab,
  onSelectTab,
  language = 'en',
  isLargeText = false,
  hasAlertBadge = false,
  profileLabel,
}) {
  const t = useT();
  const activeLanguage = useLanguage() || language;

  const tabs = [
    { key: 'schedule', label: t('schedule'), iconName: 'calendar-outline' },
    { key: 'medicines', label: t('medicines'), iconName: 'medkit-outline' },
    { key: 'insights', label: t('insights'), iconName: 'bar-chart-outline' },
    { key: 'activity', label: t('activity'), iconName: 'pulse-outline' },
    { key: 'profile', label: profileLabel || t('profile'), iconName: 'person-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const color = isActive ? colors.background.green : '#6B7280';
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onSelectTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={tab.iconName} size={24} color={color} style={styles.icon} />
              {tab.key === 'activity' && hasAlertBadge && (
                <View style={styles.redBadgeDot} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color },
                isLargeText && styles.largeLabelText,
                isActive && styles.activeLabel,
              ]}
              numberOfLines={activeLanguage === 'si' ? 2 : 1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 4,
  },
  iconWrapper: {
    position: 'relative',
  },
  redBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  largeLabelText: {
    fontSize: 13,
  },
  activeLabel: {
    color: colors.background.green,
    fontWeight: '700',
  },
});
