import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import dbService from '../../services/db';

export default function RefillSummaryScreen({ navigation, route }) {
  const pharmacist = route?.params?.pharmacist || { name: 'Mr. Jayasuriya', role: 'pharmacist' };
  const patientId = route?.params?.patientId;

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Patient ID is required</Text>
      </View>
    );
  }
  const patientName = route?.params?.patientName || 'Mrs. Perera';
  
  const [medicines, setMedicines] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'needs-refill'
  
  useEffect(() => {
    const meds = dbService.getMedicines(patientId);
    setMedicines(meds.filter(m => !m.deleted));
  }, [patientId]);

  const filteredMedicines = filter === 'needs-refill' 
    ? medicines.filter(m => m.refillStatus !== 'OK')
    : medicines;

  const needsRefillCount = medicines.filter(m => m.refillStatus !== 'OK').length;

  const getStockStatus = (medicine) => {
    const daysLeft = medicine.stockDays || 30;
    if (daysLeft <= 0) return { label: 'Out of stock', color: '#EF4444', bgColor: '#FEE2E2' };
    if (daysLeft <= 7) return { label: 'Refill now', color: '#DC2626', bgColor: '#FEE2E2' };
    if (daysLeft <= 14) return { label: 'Refill soon', color: '#D97706', bgColor: '#FEF3C7' };
    return { label: 'OK', color: '#059669', bgColor: '#D1FAE5' };
  };

  const handleMarkRefilled = async (medicine) => {
    await dbService.updateMedicine(medicine.id, { 
      refillStatus: 'OK',
      stockDays: 30 
    });
    const updated = dbService.getMedicines(patientId).filter(m => !m.deleted);
    setMedicines(updated);
  };

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title="Refill Summary"
        subtitle={patientName}
        onProfilePress={() => navigation?.navigate('PharmacistProfile', { pharmacist })}
        onLogoutPress={() => {}}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Refill Status</Text>
          <Text style={styles.summaryCount}>
            {needsRefillCount} medicine{needsRefillCount !== 1 ? 's' : ''} need{needsRefillCount === 1 ? 's' : ''} a refill
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'needs-refill' && styles.activeFilterTab]}
            onPress={() => setFilter('needs-refill')}
          >
            <Text style={[styles.filterTabText, filter === 'needs-refill' && styles.activeFilterTabText]}>Needs refill</Text>
          </TouchableOpacity>
        </View>

        {/* Medicine Cards */}
        {filteredMedicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No medicines to display</Text>
          </View>
        ) : (
          filteredMedicines.map((medicine) => {
            const status = getStockStatus(medicine);
            const needsRefill = medicine.refillStatus !== 'OK';
            
            return (
              <View key={medicine.id} style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <View style={[styles.statusTag, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.statusTagText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                
                <View style={styles.medicineDetails}>
                  <Text style={styles.detailText}>Dose: {medicine.dose}</Text>
                  <Text style={styles.detailText}>Days of stock: {medicine.stockDays || 30}</Text>
                </View>

                {medicine.refillRequested && (
                  <View style={styles.requestedTag}>
                    <Text style={styles.requestedTagText}>Patient requested refill</Text>
                  </View>
                )}

                {needsRefill && (
                  <Button
                    title="Mark refilled"
                    onPress={() => handleMarkRefilled(medicine)}
                    style={styles.refillBtn}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#EAF5F2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0D8F7A',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#0D8F7A',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  medicineCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  medicineDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  requestedTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  requestedTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  refillBtn: {
    marginBottom: 0,
  },
});
