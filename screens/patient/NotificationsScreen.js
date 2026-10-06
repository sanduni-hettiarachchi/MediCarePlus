import React, { useState } from 'react';
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

const initialNotifications = [
  {
    id: 'n1',
    categoryKey: 'medicine',
    titleKey: 'notificationMedicationReminder',
    messageKey: 'notificationReminderMessage',
    timeKey: 'timeTenMinutes',
    read: false,
  },
  {
    id: 'n2',
    categoryKey: 'alerts',
    titleKey: 'notificationLowStock',
    messageKey: 'notificationLowStockMessage',
    timeKey: 'timeOneHour',
    read: false,
  },
  {
    id: 'n3',
    categoryKey: 'updates',
    titleKey: 'notificationAppointment',
    messageKey: 'notificationAppointmentMessage',
    timeKey: 'timeThreeHours',
    read: true,
  },
  {
    id: 'n4',
    categoryKey: 'medicine',
    titleKey: 'notificationDoseTaken',
    messageKey: 'notificationDoseMessage',
    timeKey: 'timeFiveHours',
    read: true,
  },
];

export default function NotificationsScreen({ navigation, isOffline = false, onRetryOffline }) {
  const t = useT();
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState(initialNotifications);

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.categoryKey === activeFilter;
  });

  const handleMarkRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
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
            category: t(item.categoryKey),
            title: t(item.titleKey),
            message: t(item.messageKey),
            time: t(item.timeKey),
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
});
