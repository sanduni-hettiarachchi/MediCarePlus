import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';

import dbService from '../../services/db';

export default function CaregiverInsightsScreen({
  navigation,
  onNavigateTab,
  userPreferences = {},
  hasAlertBadge = false,
  currentUser,
}) {
  const caregiverId = currentUser?.id || 'usr-caregiver-1';
  const links = dbService.getCareLinksForMember(caregiverId);
  const activeLink = links.find((l) => l.status === 'Active');
  const permissions = activeLink?.permissions || { viewAdherence: true };
  const canViewAdherence = permissions.viewAdherence !== false;

  return (
    <View style={styles.container}>
      <Header
        title="Insights"
        subtitle="Your health overview"
        rightElement={
          <TouchableOpacity
            style={{ padding: 6 }}
            onPress={() => navigation?.navigate('Notifications')}
          >
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!canViewAdherence ? (
          <View style={styles.restrictedBox}>
            <Text style={styles.restrictedText}>🔒 Viewing adherence history and health insights is disabled by patient permissions.</Text>
          </View>
        ) : (
          <>
            {/* Weekly Adherence Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>WEEKLY ADHERENCE</Text>
              <Text style={styles.adherenceValue}>86%</Text>
              <Text style={styles.adherenceSub}>Overall adherence this week</Text>

              {/* 7-Day Bar Chart Representation */}
              <View style={styles.barChartContainer}>
                {[
                  { day: 'M', height: '90%', active: true },
                  { day: 'T', height: '100%', active: true },
                  { day: 'W', height: '60%', active: false },
                  { day: 'T', height: '100%', active: true },
                  { day: 'F', height: '85%', active: true },
                  { day: 'S', height: '100%', active: true },
                  { day: 'S', height: '70%', active: true },
                ].map((bar, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: bar.height },
                          !bar.active && styles.barFillMissed,
                        ]}
                      />
                    </View>
                    <Text style={styles.barDayText}>{bar.day}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Most Missed Medicine Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>MOST MISSED MEDICINE</Text>
              <View style={styles.missedRow}>
                <Text style={styles.missedIcon}>⚠️</Text>
                <View style={styles.missedCol}>
                  <Text style={styles.missedMedName}>Metformin 500mg</Text>
                  <Text style={styles.missedMedDetail}>2 missed doses this week (afternoon)</Text>
                </View>
              </View>
            </View>

            {/* Vitals Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>VITALS</Text>
              <View style={styles.vitalRow}>
                <Text style={styles.vitalIcon}>🫀</Text>
                <View style={styles.vitalCol}>
                  <Text style={styles.vitalTitle}>Blood Pressure</Text>
                  <Text style={styles.vitalValue}>120/80 mmHg · As of today</Text>
                </View>
              </View>
            </View>

            {/* View Full Adherence Calendar Button */}
            <Button
              title="View Full Adherence Calendar"
              variant="outline"
              onPress={() => navigation?.navigate('AdherenceCalendar')}
              style={styles.calendarBtn}
            />
          </>
        )}
      </ScrollView>

      <FiveTabBottomBar
        activeTab="insights"
        onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)}
        language={userPreferences.language}
        isLargeText={userPreferences.largeText}
        hasAlertBadge={hasAlertBadge}
        profileLabel="Profiles"
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  adherenceValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0D8F7A',
  },
  adherenceSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0D8F7A',
    borderRadius: 7,
  },
  barFillMissed: {
    backgroundColor: '#EF4444',
  },
  barDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  missedIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  missedCol: {
    flex: 1,
  },
  missedMedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  missedMedDetail: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 2,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vitalIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  vitalCol: {
    flex: 1,
  },
  vitalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  vitalValue: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  calendarBtn: {
    marginTop: 4,
    marginBottom: 20,
  },
  restrictedBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  restrictedText: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
