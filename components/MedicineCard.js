import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './PatientText';
import { useT } from '../i18n/LanguageContext';

export default function MedicineCard({
  medicine,
  onPress,
  onTaken,
  onSkip,
  onMarkRefilled,
  showRefillStatus = false,
  showStockDays = false,
  showTime = true,
  refillRequest = null,
}) {
  const t = useT();
  const getRefillBadge = (status, days) => {
    if (status === 'Refill now' || days <= 3) {
      return { label: t('refillNow'), bg: '#FEE2E2', color: '#991B1B' };
    }
    if (status === 'Refill soon' || (days > 3 && days <= 7)) {
      return { label: t('refillSoon'), bg: '#FEF3C7', color: '#92400E' };
    }
    if (status === 'Out of stock' || days === 0) {
      return { label: t('outOfStock'), bg: '#FEE2E2', color: '#991B1B' };
    }
    return { label: t('ok'), bg: '#E6F4F1', color: '#0D8F7A' };
  };

  const badge = getRefillBadge(medicine.refillStatus, medicine.stockDays ?? 30);

  const getRefillRequestText = () => {
    if (!refillRequest) return null;
    if (refillRequest.status === 'refilled') {
      const date = refillRequest.refilledAt?.toDate?.() || new Date(refillRequest.refilledAt);
      return `Refilled by ${refillRequest.refilledByName || 'Pharmacist'} · ${date.toLocaleDateString()}`;
    }
    if (refillRequest.status === 'requested') {
      return 'Refill requested';
    }
    if (refillRequest.status === 'notified') {
      return 'Pharmacy notified';
    }
    return null;
  };

  const refillRequestText = getRefillRequestText();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>💊</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.details}>
          {medicine.dose}
          {medicine.mealInstruction ? ` · ${medicine.mealInstruction}` : ''}
          {showTime && medicine.time ? ` · ${medicine.time}` : ''}
        </Text>

        {showStockDays && (
          <View style={styles.stockRow}>
            <View style={styles.stockBarBg}>
              <View
                style={[
                  styles.stockBarFill,
                  { width: `${Math.min(100, (medicine.stockDays / 30) * 100)}%` },
                  medicine.stockDays <= 3 ? styles.lowStockFill :
                  medicine.stockDays <= 7 ? styles.mediumStockFill : null,
                ]}
              />
            </View>
            <Text style={styles.stockText}>
              {medicine.stockDays === 0 ? t('noneLeft') : t('daysLeft', { days: medicine.stockDays })}
            </Text>
          </View>
        )}
        {refillRequestText && (
          <Text style={styles.refillRequestText}>{refillRequestText}</Text>
        )}
      </View>

      {showRefillStatus ? (
        <View style={styles.rightColumn}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          {onMarkRefilled && (medicine.stockDays <= 7 || medicine.refillStatus !== 'OK') ? (
            <TouchableOpacity style={styles.markRefilledBtn} onPress={onMarkRefilled}>
              <Text style={styles.markRefilledText}>{t('markRefilled')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        onPress && <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  details: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  stockRow: {
    marginTop: 6,
  },
  stockBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },
  stockBarFill: {
    height: '100%',
    backgroundColor: '#0D8F7A',
    borderRadius: 3,
  },
  lowStockFill: {
    backgroundColor: '#EF4444',
  },
  mediumStockFill: {
    backgroundColor: '#F59E0B',
  },
  stockText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  refillRequestText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  markRefilledBtn: {
    marginTop: 8,
    backgroundColor: '#0D8F7A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  markRefilledText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 22,
    color: '#CBD5E1',
    fontWeight: '400',
  },
});
