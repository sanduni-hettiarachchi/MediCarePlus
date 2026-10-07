import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import NotificationCard from '../../components/NotificationCard';
import Text from '../../components/PatientText';
import OfflineBanner from '../../components/OfflineBanner';
import { useT } from '../../i18n/LanguageContext';
import dbService from '../../services/db';

const initialNotifications = [
  {
    id: 'n1',
    categoryKey: 'medicine',
    titleKey: 'notificationMedicationReminder',
    messageKey: 'notificationReminderMessage',
    timeKey: 'timeTenMinutes',
    read: false,
    createdAt: Date.now() - 600000,
  },
  {
    id: 'n2',
    categoryKey: 'alerts',
    titleKey: 'notificationLowStock',
    messageKey: 'notificationLowStockMessage',
    timeKey: 'timeOneHour',
    read: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'n3',
    categoryKey: 'updates',
    titleKey: 'notificationAppointment',
    messageKey: 'notificationAppointmentMessage',
    timeKey: 'timeThreeHours',
    read: true,
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'n4',
    categoryKey: 'medicine',
    titleKey: 'notificationDoseTaken',
    messageKey: 'notificationDoseMessage',
    timeKey: 'timeFiveHours',
    read: true,
    createdAt: Date.now() - 18000000,
  },
];

export default function NotificationsScreen({ navigation, route, isOffline = false, onRetryOffline, currentUser }) {
  const t = useT();
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState(initialNotifications);
  const [errorText, setErrorText] = useState(null);
  const userId = currentUser?.id || route?.params?.currentUser?.id;

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const millis = timestamp?.toMillis?.() || Number(timestamp);
    if (!Number.isFinite(millis)) return 'Just now';
    const diffMins = Math.floor((Date.now() - millis) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = dbService.subscribeToNotifications(
      userId,
      (dbNotifs) => {
        const formattedDb = dbNotifs.map((n) => ({
          id: n.id,
          categoryKey: n.categoryKey || n.type || 'updates',
          title: n.title || (n.titleKey ? t(n.titleKey) : 'Notification'),
          message: n.body || n.message || (n.messageKey ? t(n.messageKey) : ''),
          time: n.time || formatTimeAgo(n.createdAt),
          read: n.read || false,
          createdAt: n.createdAt?.toMillis?.() || Number(n.createdAt) || Date.now(),
        }));

        // Merge initial sample notifications with real-time notifications
        const mergedMap = new Map();
        initialNotifications.forEach((item) => mergedMap.set(item.id, item));
        formattedDb.forEach((item) => mergedMap.set(item.id, item));

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        setNotifications(mergedList);
      },
      (err) => {
        console.error('[NotificationsScreen] subscription error:', err);
        setErrorText(err.code ? `${err.code}: ${err.message}` : String(err?.message || err));
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userId]);

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    const cat = n.categoryKey || n.type || 'updates';
    if (activeFilter === 'medicine' && (cat === 'medicine' || cat === 'medication')) return true;
    if (activeFilter === 'alerts' && (cat === 'alerts' || cat === 'alert')) return true;
    if (activeFilter === 'updates' && (cat === 'updates' || cat === 'update' || cat === 'care_note')) return true;
    return cat === activeFilter;
  });

  const handleMarkRead = (id) => {
    dbService.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filterTabs = [
    { key: 'all', label: t('all') },
    { key: 'medicine', label: t('medicine') },
    { key: 'alerts', label: t('alerts') },
    { key: 'updates', label: t('updates') },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('notifications')} onBack={() => navigation?.goBack()} />

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filterTabs.map((tab) => {
          const isSel = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isSel && styles.selectedFilterChip]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  isSel && styles.selectedFilterText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isOffline ? <OfflineBanner onRetry={onRetryOffline} /> : null}
        {filtered.length === 0 ? <Text style={styles.emptyText}>{t('noNotifications')}</Text> : null}
        {filtered.map((item) => {
          const notification = {
            ...item,
            category: item.categoryKey ? t(item.categoryKey) : 'Updates',
            title: item.title || (item.titleKey ? t(item.titleKey) : 'Notification'),
            message: item.message || (item.messageKey ? t(item.messageKey) : ''),
            time: item.time || (item.timeKey ? t(item.timeKey) : 'Just now'),
          };
          return <NotificationCard key={item.id} notification={notification} onPress={() => handleMarkRead(item.id)} />;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#0B7666',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  selectedFilterText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyText: {
    padding: 24,
    color: '#4B5563',
    fontSize: 16,
    textAlign: 'center',
  },
  errorBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
});
