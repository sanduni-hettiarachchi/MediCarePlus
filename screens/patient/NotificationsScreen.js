import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { updateDoc, doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import Header from '../../components/Header';
import NotificationCard from '../../components/NotificationCard';
import Text from '../../components/PatientText';
import OfflineBanner from '../../components/OfflineBanner';
import { useT } from '../../i18n/LanguageContext';
import dbService from '../../services/db';
import * as notificationHelper from '../../services/notificationHelper';

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
  const [notifications, setNotifications] = useState([]);
  const [errorText, setErrorText] = useState(null);
  const userId = currentUser?.id || route?.params?.currentUser?.id;
  const userRole = currentUser?.role || route?.params?.currentUser?.role || 'patient';

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

    const firestoreDb = dbService.getFirestoreDb?.();
    if (!firestoreDb) {
      console.error('[NotificationsScreen] Firestore not available');
      return;
    }

    const q = query(
      collection(firestoreDb, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      const formattedDb = dbNotifs.map((n) => ({
        id: n.id,
        categoryKey: n.type || 'updates',
        title: n.title || 'Notification',
        message: n.body || '',
        time: formatTimeAgo(n.createdAt),
        read: n.read || false,
        createdAt: n.createdAt?.toMillis?.() || Number(n.createdAt) || Date.now(),
        relatedId: n.relatedId,
        patientId: n.patientId,
      }));

      setNotifications(formattedDb);
    }, (err) => {
      console.error('[NotificationsScreen] subscription error:', err.code, err.message);
      setErrorText(err.code ? `${err.code}: ${err.message}` : String(err?.message || err));
    });

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

  const handleMarkRead = async (id) => {
    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'notifications', id), { read: true });
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('[NotificationsScreen] Error marking read:', err.code, err.message);
    }
  };

  const handleNotificationPress = (item) => {
    // Mark as read
    handleMarkRead(item.id);

    // Navigate based on notification type
    if (item.categoryKey === 'care_note' && item.relatedId) {
      // Open care notes screen based on user role
      if (userRole === 'patient') {
        navigation?.navigate('PatientCareNotes', { currentUser });
      } else if (userRole === 'caregiver' && item.patientId) {
        // Need selectedPatientLink from context - for now navigate to profiles
        navigation?.navigate('CaregiverProfiles', { currentUser });
      }
    }
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
          return <NotificationCard key={item.id} notification={notification} onPress={() => handleNotificationPress(item)} />;
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
