import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';
import MedicineCard from '../../components/MedicineCard';
import dbService from '../../services/db';
import Text from '../../components/PatientText';
import OfflineBanner from '../../components/OfflineBanner';
import { useT } from '../../i18n/LanguageContext';

export default function YourMedicinesScreen({
  navigation,
  onNavigateTab,
  userPreferences = {},
  currentUser,
  isOffline = false,
  onRetryOffline,
}) {
  const t = useT();
  const patientId = currentUser?.id || 'usr-patient-1';
  const [medicines, setMedicines] = useState([]);
  const [lowStockMed, setLowStockMed] = useState(null);
  const [refillRequests, setRefillRequests] = useState([]);

  const setMedicineList = (list) => {
    // Filter out deleted medicines
    const activeList = list.filter(m => !m.deleted);
    setMedicines(activeList);
    const low = activeList.find((m) => m.stockDays <= 7 || m.refillStatus === 'Refill now');
    setLowStockMed(low || null);
  };

  const loadMedicines = () => {
    const meds = dbService.getMedicines(patientId);
    setMedicineList(meds);
  };

  useEffect(() => {
    loadMedicines();
    const stopMedicines = dbService.subscribeToMedicines(patientId, setMedicineList, () => {});
    const stopRefills = dbService.subscribeToRefillRequests(patientId, setRefillRequests);
    return () => { stopMedicines?.(); stopRefills?.(); };
  }, [patientId]);

  // Refresh when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', loadMedicines);
    return () => unsubscribe?.();
  }, [navigation, patientId]);

  // Calculate active reminders based on actual times
  const activeCount = medicines.reduce((count, med) => {
    const times = dbService.getReminderTimes(med.id);
    return count + times.length;
  }, 0);

  return (
    <View style={styles.container}>
      <Header
        title={t('yourMedicines')}
        subtitle={t('activeReminders', { count: activeCount })}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isOffline ? <OfflineBanner onRetry={onRetryOffline} /> : null}
        {/* Refill Due Alert Banner */}
        {lowStockMed ? (
          <TouchableOpacity
            style={styles.refillBanner}
            onPress={() => navigation?.navigate('RefillNotification', { medicine: lowStockMed })}
          >
            <Text style={styles.refillIcon}>⚠️</Text>
            <View style={styles.refillTextCol}>
              <Text style={styles.refillTitle}>{t('refillDue', { days: lowStockMed.stockDays })}</Text>
              <Text style={styles.refillSubtitle}>{t('tapRequestRefill')}</Text>
            </View>
            <Text style={styles.refillChevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        {/* Empty State (UI-04) */}
        {medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyIcon}>�</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('noMedicines')}</Text>
            <Text style={styles.emptySubtitle}>{t('addFirstMedicine')}</Text>
            <Button
              title="+ Add medicine"
              onPress={() => navigation?.navigate('AddMedicineDetails')}
              style={styles.emptyAddBtn}
            />
          </View>
        ) : (
          <View style={styles.listSection}>
            {medicines.map((med) => {
              const request = refillRequests.find((rr) => rr.medicineId === med.id);
              return (
                <MedicineCard
                  key={med.id}
                  medicine={med}
                  showStockDays
                  refillRequest={request}
                  onPress={() => navigation?.navigate('MedicationDetail', { medicineId: med.id })}
                />
              );
            })}
          </View>
        )}

        {/* My Prescriptions Link */}
        {medicines.length > 0 && (
          <TouchableOpacity
            style={styles.prescriptionsRow}
            onPress={() => navigation?.navigate('MyPrescriptions')}
          >
            <Text style={styles.prescriptionsIcon}>📜</Text>
            <Text style={styles.prescriptionsText}>{t('myPrescriptions')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Floating Add Medicine "+" Button */}
      {medicines.length > 0 && (
        <TouchableOpacity
          style={styles.fabAdd}
          onPress={() => navigation?.navigate('AddMedicineDetails')}
          accessibilityLabel="Add Medicine"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <FiveTabBottomBar
        activeTab="medicines"
        onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)}
        language={userPreferences.language}
        isLargeText={userPreferences.largeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  refillBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  refillIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  refillTextCol: {
    flex: 1,
  },
  refillTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  refillSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  refillChevron: {
    fontSize: 20,
    color: '#92400E',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddBtn: {
    width: '80%',
  },
  listSection: {
    marginBottom: 10,
  },
  prescriptionsRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  prescriptionsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  prescriptionsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  fabAdd: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B7666',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});
