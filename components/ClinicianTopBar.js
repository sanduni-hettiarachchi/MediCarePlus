import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ClinicianTopBar({
  title,
  subtitle,
  onProfilePress,
  onLogoutPress,
  onBackPress,
  colorScheme = 'green', // 'green' for Doctor/Pharmacist, 'blue' for Nurse
}) {
  const isBlue = colorScheme === 'blue';

  return (
    <View style={[styles.container, isBlue && styles.blueContainer]}>
      {onBackPress && (
        <TouchableOpacity
          onPress={onBackPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={isBlue ? '#007AFF' : '#0D8F7A'} />
        </TouchableOpacity>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.pillButton, isBlue ? styles.bluePill : styles.greenPill]}
          onPress={onProfilePress}
        >
          <Text style={[styles.pillText, isBlue ? styles.bluePillText : styles.greenPillText]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pillButton, styles.logoutPill]}
          onPress={onLogoutPress}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    marginRight: 10,
    padding: 2,
  },
  blueContainer: {
    borderBottomColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 6,
    borderWidth: 1,
  },
  greenPill: {
    borderColor: '#0D8F7A',
    backgroundColor: '#F0FDF4',
  },
  bluePill: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  logoutPill: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  greenPillText: {
    color: '#0D8F7A',
  },
  bluePillText: {
    color: '#007AFF',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});
