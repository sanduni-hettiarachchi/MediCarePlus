import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [profileUser, setProfileUser] = useState(
    currentUser || {
      id: 'usr-caregiver-1',
      name: 'Kumari',
      role: 'caregiver',
      phone: '0771234567',
      email: 'kumari@example.com',
    }
  );
  const [patient, setPatient] = useState(null);
  const [patientError, setPatientError] = useState('');
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profileUser.name || '');
  const [editPhone, setEditPhone] = useState(profileUser.phone || '');
  const [editEmail, setEditEmail] = useState(profileUser.email || '');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadLinkedPatient = async () => {
      try {
        setPatientError('');
        const caregiverId = currentUser?.id || profileUser?.id || 'usr-caregiver-1';
        const links = dbService.getCareLinksForMember(caregiverId);
        const activeLink = links.find((l) => l.status === 'Active');
        let patientRecord = null;
        if (activeLink) {
          patientRecord = dbService.getUserById(activeLink.patientId);
        }
        if (!patientRecord && (currentUser?.patientId || profileUser?.patientId)) {
          const pid = currentUser?.patientId || profileUser?.patientId || 'usr-patient-1';
          patientRecord = dbService.getUserById(pid);
        }
        setPatient(patientRecord || null);
      } catch (err) {
        console.error('CaregiverProfilesScreen error loading linked patient:', err);
        setPatientError('Failed to load linked patient details.');
      }
    };
    loadLinkedPatient();
  }, [currentUser, profileUser]);

  const handleStartEdit = () => {
    setEditName(profileUser.name || '');
    setEditPhone(profileUser.phone || '');
    setEditEmail(profileUser.email || '');
    setEditError('');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Name cannot be empty.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      setEditError('Please enter a valid email address.');
      return;
    }

    setEditError('');
    setIsSaving(true);
    try {
      const updated = await dbService.updateUser(profileUser.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
      });
      if (updated) {
        setProfileUser(updated);
        if (currentUser) {
          currentUser.name = updated.name;
          currentUser.phone = updated.phone;
          currentUser.email = updated.email;
        }
      } else {
        setProfileUser((prev) => ({
          ...prev,
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
        }));
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile in Firestore:', error);
      setEditError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
        {/* Caregiver Personal Information Card Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editBtnRow} onPress={handleStartEdit}>
              <Text style={styles.editBtnIcon}>✏️</Text>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editCard}>
            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
            />

            <Text style={styles.inputLabel}>ROLE (FIXED)</Text>
            <View style={styles.readOnlyRoleRow}>
              <Text style={styles.readOnlyRoleText}>
                {profileUser.role === 'nurse' ? 'Nurse' : 'Caregiver'}
              </Text>
            </View>

            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.editActionsRow}>
              <Button
                title={isSaving ? "Saving..." : "Save changes"}
                onPress={handleSaveProfile}
                style={styles.saveProfileBtn}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsEditing(false)}
                style={styles.cancelProfileBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.patientCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profileUser.name ? profileUser.name.charAt(0) : 'C'}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{profileUser.name}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>
                  {profileUser.role === 'nurse' ? 'Nurse' : 'Caregiver'}
                </Text>
              </View>
              <Text style={styles.patientPhone}>{profileUser.phone}</Text>
              <Text style={styles.patientEmail}>{profileUser.email}</Text>
            </View>
          </View>
        )}

        {/* Linked Patient Section */}
        <Text style={styles.sectionHeader}>LINKED PATIENT</Text>

        {patientError ? (
          <View style={styles.emptyPatientCard}>
            <Text style={styles.errorText}>{patientError}</Text>
          </View>
        ) : patient ? (
          <TouchableOpacity
            style={styles.patientCard}
            onPress={() => navigation?.navigate('ManagePatientSchedule')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {patient.name ? patient.name.charAt(0) : 'P'}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientSub}>
                {patient.gender || 'Female'} · {patient.age || '68'} · Linked Patient
              </Text>
              <Text style={styles.patientPhone}>{patient.phone || '0771234567'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyPatientCard}>
            <Text style={styles.emptyPatientTitle}>No patient linked yet</Text>
            <Text style={styles.emptyPatientSub}>
              Linked patient details will appear here once connected.
            </Text>
          </View>
        )}

        {/* Remote Management */}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  editBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtnIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D8F7A',
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
  emptyPatientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyPatientTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptyPatientSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0D8F7A',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  readOnlyRoleRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyRoleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  editActionsRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
  },
  saveProfileBtn: {
    marginBottom: 0,
  },
  cancelProfileBtn: {
    marginBottom: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
