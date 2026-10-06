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
import { useT } from '../../i18n/LanguageContext';

export default function RefillNotificationScreen({ navigation, route, onNavigateTab, hasAlertBadge = false, currentUser }) {
  const t = useT();
  const medicineParam = route?.params?.medicine;
  const [patientId, setPatientId] = useState('usr-patient-1');

  useEffect(() => {
    const links = dbService.getCareLinksForMember(currentUser?.id);
    const activeLink = links.find(l => l.status === 'Active');
    if (activeLink) {
      setPatientId(activeLink.patientId);
    }
  }, [currentUser?.id]);
  const [medicines, setMedicines] = useState([]);
  const [targetMed, setTargetMed] = useState(null);
  const [isNotified, setIsNotified] = useState(false);
  const [refillRequests, setRefillRequests] = useState([]);

  const setMedicineList = (list) => {
    setMedicines(list);
    const low = list.find((m) => m.stockDays <= 7 || m.refillStatus === 'Refill now');
    setTargetMed(low || null);
  };

  useEffect(() => {
    const stopMedicines = dbService.subscribeToMedicines(patientId, setMedicineList, () => {});
    const stopRefills = dbService.subscribeToRefillRequests(patientId, setRefillRequests);
    return () => { stopMedicines?.(); stopRefills?.(); };
  }, [patientId]);

  const activeCount = medicines.filter((m) => m.active).length;

  const handleNotifyPharmacy = () => {
    if (targetMed) {
      dbService.createRefillRequest(targetMed.id);
      setIsNotified(true);
    }
  };

  const handleDismiss = () => {
    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('yourMedicines')}
        subtitle={t('activeReminders', { count: activeCount })}
        onBack={() => navigation?.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation?.navigate('Notifications')}
          >
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Refill Due Alert Banner */}
        {targetMed ? (
          <TouchableOpacity
            style={styles.refillBanner}
            onPress={() => navigation?.navigate('RefillNotification', { medicine: targetMed })}
          >
            <Text style={styles.refillIcon}>⚠️</Text>
            <View style={styles.refillTextCol}>
              <Text style={styles.refillTitle}>{t('refillDue', { days: targetMed.stockDays })}</Text>
              <Text style={styles.refillSubtitle}>{t('tapRequestRefill')}</Text>
            </View>
            <Text style={styles.refillChevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        {/* Empty State */}
        {medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyIcon}>🔗</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('noMedicines')}</Text>
            <Text style={styles.emptySubtitle}>{t('addFirstMedicine')}</Text>
            <Button
              title={t('addMedicine')}
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

        <View style={styles.divider} />

        {/* Refill Reminder Card */}
        {targetMed ? (
          <View style={styles.refillCard}>
            <Text style={styles.refillHeaderLabel}>REFILL REMINDER</Text>
            <Text style={styles.refillMedName}>{targetMed.name}</Text>
            <Text style={styles.refillStockText}>
              {targetMed.stockDays} days of stock remaining
            </Text>

            {isNotified ? (
              <View style={styles.notifiedBanner}>
                <Text style={styles.notifiedText}>
                  ✓ Pharmacy has been notified for refill!
                </Text>
              </View>
            ) : (
              <View style={styles.actionContainer}>
                <Text style={styles.questionText}>Notify pharmacy?</Text>

                <Button
                  title="Notify pharmacy"
                  onPress={handleNotifyPharmacy}
                  style={styles.notifyBtn}
                />

                <Button
                  title="Dismiss"
                  variant="outline"
                  onPress={handleDismiss}
                  style={styles.dismissBtn}
                />
              </View>
            )}
          </View>
        ) : null}

        {/* Add Medicine Button */}
        <Button
          title={t('addMedicine')}
          onPress={() => navigation?.navigate('AddMedicineDetails')}
          style={styles.addMedicineBtn}
          variant="outline"
        />
      </ScrollView>

      <FiveTabBottomBar
        activeTab="medicines"
        onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)}
        hasAlertBadge={hasAlertBadge}
        profileLabel="Profiles"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bellBtn: {
    padding: 6,
  },
  bellIcon: {
    fontSize: 22,
  },
  refillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 16,
  },
  refillIcon: {
    fontSize: 20,
    marginRight: 12,
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
    color: '#92400E',
    marginTop: 2,
  },
  refillChevron: {
    fontSize: 20,
    color: '#92400E',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyAddBtn: {
    width: 200,
  },
  listSection: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  refillCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refillHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  refillMedName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  refillStockText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  notifyBtn: {
    backgroundColor: '#0F172A',
    marginBottom: 10,
  },
  dismissBtn: {
    marginBottom: 0,
  },
  notifiedBanner: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D8F7A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  notifiedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  addMedicineBtn: {
    marginTop: 16,
  },
});
