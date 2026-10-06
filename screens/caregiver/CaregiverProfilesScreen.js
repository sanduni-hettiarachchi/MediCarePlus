import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Button from '../../components/Button';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';
import authService from '../../services/authService';
import dbService from '../../services/db';

export default function CaregiverProfilesScreen({
  navigation,
  onNavigateTab,
  onLogout,
  userPreferences = {},
  hasAlertBadge = false,
  currentUser,
}) {
  const [patient, setPatient] = useState(null);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  useEffect(() => {
    const links = dbService.getCareLinksForMember(currentUser?.id);
    const activeLink = links.find(l => l.status === 'Active');
    if (activeLink) {
      const p = dbService.getUserById(activeLink.patientId);
      setPatient(p);
    }
  }, [currentUser?.id]);

  const handleLogoutConfirm = async () => {
    setShowLogoutSheet(false);
    await authService.logout(navigation);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Profiles"
        subtitle="Caregiver portal"
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
        {/* Caregiver Personal Information Card */}
        <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>

        {currentUser ? (
          <View style={styles.patientCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser.name.charAt(0)}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{currentUser.name}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{currentUser.role === 'nurse' ? 'Nurse' : 'Caregiver'}</Text>
              </View>
              <Text style={styles.patientPhone}>{currentUser.phone}</Text>
              <Text style={styles.patientEmail}>{currentUser.email}</Text>
            </View>
          </View>
        ) : null}

        {/* Linked Patient Card */}
        <Text style={styles.sectionHeader}>LINKED PATIENT</Text>

        {patient ? (
          <View style={styles.patientCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientSub}>
                {patient.gender} · {patient.age}
              </Text>
              <Text style={styles.patientPhone}>{patient.phone}</Text>
            </View>
          </View>
        ) : null}

        {/* Management Actions */}
        <Text style={styles.sectionHeader}>REMOTE MANAGEMENT</Text>

        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation?.navigate('MyPrescriptions')}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>My Prescriptions</Text>
              <Text style={styles.actionSub}>View and add prescriptions</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation?.navigate('ManagePatientSchedule')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Manage patient's schedule</Text>
              <Text style={styles.actionSub}>View or change dose times</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation?.navigate('ManageLinkedCaregivers')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Manage linked caregivers</Text>
              <Text style={styles.actionSub}>Care circle & nurse permissions</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Log out"
          variant="danger-outline"
          onPress={() => setShowLogoutSheet(true)}
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Logout Confirmation Sheet */}
      <BottomSheetConfirmation
        visible={showLogoutSheet}
        title="Log out of MediCare+?"
        message="You will need to sign in again to monitor your patient."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutSheet(false)}
      />

      <FiveTabBottomBar
        activeTab="profile"
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#EAF5F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  patientSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  patientPhone: {
    fontSize: 12,
    color: '#0D8F7A',
    fontWeight: '600',
    marginTop: 2,
  },
  patientEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  logoutBtn: {
    marginTop: 28,
  },
});
