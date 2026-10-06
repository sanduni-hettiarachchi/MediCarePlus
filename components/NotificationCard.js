import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './PatientText';

export default function NotificationCard({ notification, onPress }) {
  const getIcon = (type) => {
    switch (type) {
      case 'Medicine':
      case 'medication':
        return '💊';
      case 'Alerts':
      case 'alert':
        return '⚠️';
      case 'Updates':
      case 'update':
        return '🔔';
      default:
        return '📋';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, !notification.read && styles.unreadContainer]}
    >
      <View style={styles.iconSquare}>
        <Text style={styles.iconText}>{getIcon(notification.category || notification.type)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.time}>{notification.time || '10m ago'}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
      </View>

      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unreadContainer: {
    backgroundColor: '#F8FAFC',
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
  },
  message: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D8F7A',
    marginLeft: 4,
  },
});
