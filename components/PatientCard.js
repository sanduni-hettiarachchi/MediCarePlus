import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PatientCard({ patient, onPress, onMarkReviewed }) {
  const isNeedsAttention = patient.adherence < 70 || patient.statusTag === 'Needs attention';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, isNeedsAttention && styles.attentionCard]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(patient.name || 'P').charAt(0)}</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.topHeaderRow}>
          <Text style={styles.name}>{patient.name}</Text>
          <View
            style={[
              styles.badge,
              isNeedsAttention ? styles.attentionBadge : styles.onTrackBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isNeedsAttention ? styles.attentionBadgeText : styles.onTrackBadgeText,
              ]}
            >
              {isNeedsAttention ? 'Needs attention' : 'On track'}
            </Text>
          </View>
        </View>

        <Text style={styles.details}>
          {patient.age || '72 y'} · {patient.conditions || 'Hypertension, T2 Diabetes'}
        </Text>

        <View style={styles.adherenceRow}>
          <Text style={styles.adherenceText}>
            Adherence {patient.adherence || 64}% this week
          </Text>

          {onMarkReviewed && (
            <TouchableOpacity style={styles.markReviewedBtn} onPress={onMarkReviewed}>
              <Text style={styles.markReviewedText}>
                {patient.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
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
  attentionCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoContainer: {
    flex: 1,
    paddingRight: 8,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  attentionBadge: {
    backgroundColor: '#FEE2E2',
  },
  onTrackBadge: {
    backgroundColor: '#E6F4F1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  attentionBadgeText: {
    color: '#991B1B',
  },
  onTrackBadgeText: {
    color: '#0D8F7A',
  },
  details: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  adherenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  markReviewedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  markReviewedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 22,
    color: '#CBD5E1',
  },
});
