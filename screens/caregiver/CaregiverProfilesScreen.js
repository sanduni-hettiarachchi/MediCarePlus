import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
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
  const [careLinks, setCareLinks] = useState([]);
  const [patientDataMap, setPatientDataMap] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientLink, setSelectedPatientLink] = useState(null);
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
    const caregiverId = currentUser?.id || profileUser?.id || 'usr-caregiver-1';
    console.log('[CaregiverProfilesScreen] Loading care_links for memberId:', caregiverId);
    
    const unsubscribe = dbService.subscribeToCareLinksForMember(caregiverId, async (links) => {
      console.log('[CaregiverProfilesScreen] Found', links.length, 'care_links');
      setCareLinks(links);
      
      // Fetch patient data for each link from users doc
      const firestoreDb = dbService.getFirestoreDb?.();
      const patientMap = {};
      
      for (const link of links) {
        try {
          if (firestoreDb) {
            const patientDoc = await getDoc(doc(firestoreDb, 'users', link.patientId));
            if (patientDoc.exists()) {
              patientMap[link.patientId] = { id: patientDoc.id, ...patientDoc.data() };
            }
          } else {
            // Fallback to local cache
            const patient = dbService.getUserById(link.patientId);
            if (patient) {
              patientMap[link.patientId] = patient;
            }
          }
        } catch (err) {
          console.warn('[CaregiverProfilesScreen] Failed to load patient data for', link.patientId, err.code);
        }
      }
      
      setPatientDataMap(patientMap);
      
      // Set selected patient to first active link if available
      const activeLink = links.find((l) => l.status === 'Active');
      if (activeLink && patientMap[activeLink.patientId]) {
        setSelectedPatient(patientMap[activeLink.patientId]);
        setSelectedPatientLink(activeLink);
      } else {
        setSelectedPatient(null);
        setSelectedPatientLink(null);
      }
    }, (error) => {
      console.error('[CaregiverProfilesScreen] care_links error:', error.code, error.message);
      setPatientError('Failed to load patient links: ' + (error.message || 'Please try again.'));
    });
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser, profileUser]);

  const handleStartEdit = () => {
    setEditName(profileUser.name || '');
    setEditPhone(profileUser.phone || '');
    setEditEmail(profileUser.email || '');
    setEditError('');
    setIsEditing(true);
  };

  const handleAcceptInvite = async (linkId) => {
    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_links', linkId), {
          status: 'Active'
        });
        console.log('[CaregiverProfilesScreen] Accepted invite:', linkId);
      } else {
        await dbService.updateCareLink(linkId, { status: 'Active' });
      }
    } catch (err) {
      console.error('[CaregiverProfilesScreen] Error accepting invite:', err.code, err.message);
      setPatientError('Failed to accept invite: ' + (err.message || 'Please try again.'));
    }
  };

  const handleDeclineInvite = async (linkId) => {
    try {
      const firestoreDb = dbService.getFirestoreDb?.();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_links', linkId), {
          status: 'Declined'
        });
        console.log('[CaregiverProfilesScreen] Declined invite:', linkId);
      } else {
        await dbService.updateCareLink(linkId, { status: 'Declined' });
      }
    } catch (err) {
      console.error('[CaregiverProfilesScreen] Error declining invite:', err.code, err.message);
      setPatientError('Failed to decline invite: ' + (err.message || 'Please try again.'));
    }
  };

  const handleSelectPatient = (link) => {
    // Toggle selection: if already selected, deselect
    if (selectedPatientLink?.id === link.id) {
      console.log('[CaregiverProfiles] Deselected patient:', link.patientId);
      setSelectedPatient(null);
      setSelectedPatientLink(null);
    } else {
      console.log('[CaregiverProfiles] Selected patient:', link.patientId, 'name:', link.patientName);
      const patientRecord = dbService.getUserById(link.patientId);
      setSelectedPatient(patientRecord || { id: link.patientId, name: link.patientName || 'Patient' });
      setSelectedPatientLink(link);
    }
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

        {/* My Patients Section */}
        <Text style={styles.sectionHeader}>MY PATIENTS</Text>

        {patientError ? (
          <View style={styles.emptyPatientCard}>
            <Text style={styles.errorText}>{patientError}</Text>
          </View>
        ) : careLinks.length === 0 ? (
          <View style={styles.emptyPatientCard}>
            <Text style={styles.emptyPatientTitle}>No patients linked yet</Text>
            <Text style={styles.emptyPatientSub}>
              Patient invites will appear here once sent.
            </Text>
          </View>
        ) : (
          careLinks.map((link) => {
            const patient = patientDataMap[link.patientId];
            const patientName = patient?.name || 'Patient';
            const patientGender = patient?.gender;
            const patientAge = patient?.age;
            const patientPhone = patient?.phone;
            const isSelected = selectedPatientLink?.id === link.id;
            
            // Build permissions labels for Pending links
            const permLabels = [];
            if (link.permissions?.viewSchedule) permLabels.push('View Schedule');
            if (link.permissions?.editSchedule) permLabels.push('Edit Schedule');
            if (link.permissions?.viewAdherence) permLabels.push('View Adherence');
            if (link.permissions?.viewCareNotes) permLabels.push('View Notes');
            if (link.permissions?.addNotes) permLabels.push('Add Notes');
            const permText = permLabels.length > 0 ? permLabels.join(', ') : 'No specific permissions';
            
            return (
              <View key={link.id} style={styles.patientLinkCard}>
                <TouchableOpacity
                  style={[styles.patientCard, isSelected && styles.selectedPatientCard]}
                  onPress={() => link.status === 'Active' && handleSelectPatient(link)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {patientName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.patientSub}>
                      {link.status === 'Pending' ? 'Pending invite' : link.status}
                      {patientGender && ` · ${patientGender}`}
                      {patientAge && ` · ${patientAge}`}
                    </Text>
                    {patientPhone && <Text style={styles.patientPhone}>{patientPhone}</Text>}
                    {link.status === 'Pending' && (
                      <Text style={styles.permissionsText}>{permText}</Text>
                    )}
                  </View>
                  {link.status === 'Active' && <Text style={styles.chevron}>›</Text>}
                </TouchableOpacity>
                
                {link.status === 'Pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAcceptInvite(link.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => handleDeclineInvite(link.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {link.status === 'Active' && (
                  <TouchableOpacity
                    style={[styles.selectBtn, isSelected && styles.selectedBtn]}
                    onPress={() => handleSelectPatient(link)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectBtnText}>
                      {isSelected ? 'Selected ✓' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Remote Management */}
        <Text style={styles.sectionHeader}>REMOTE MANAGEMENT</Text>

        {!selectedPatient ? (
          <View style={styles.disabledCardGroup}>
            <TouchableOpacity style={[styles.actionRow, styles.disabledActionRow]}>
              <Text style={styles.actionIcon}>📜</Text>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>My Prescriptions</Text>
                <Text style={styles.actionSub}>View and add prescriptions</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, styles.disabledActionRow]}>
              <Text style={styles.actionIcon}>📅</Text>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Manage patient's schedule</Text>
                <Text style={styles.actionSub}>View or change dose times</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.disabledExplanation}>
              <Text style={styles.disabledExplanationText}>
                Select an Active patient above to manage their prescriptions and schedule.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => selectedPatient && navigation?.navigate('MyPrescriptions', { patientId: selectedPatient.id })}
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
              onPress={() => selectedPatient && navigation?.navigate('ManagePatientSchedule', { patientId: selectedPatient.id })}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Manage patient's schedule</Text>
                <Text style={styles.actionSub}>View or change dose times</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

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
  selectedPatientCard: {
    borderColor: '#0D8F7A',
    borderWidth: 2,
    backgroundColor: '#F0FDF9',
  },
  patientLinkCard: {
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#0D8F7A',
  },
  declineBtn: {
    backgroundColor: '#FEE2E2',
  },
  selectBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#0D8F7A',
  },
  selectedBtn: {
    backgroundColor: '#065F46',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
  permissionsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
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
  disabledCardGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledActionRow: {
    opacity: 0.5,
  },
  disabledExplanation: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  disabledExplanationText: {
    fontSize: 13,
    color: '#92400E',
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
