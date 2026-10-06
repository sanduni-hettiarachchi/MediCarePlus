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
import Header from '../../components/Header';
import UndoSnackbar from '../../components/UndoSnackbar';
import dbService from '../../services/db';

export default function ManageLinkedCaregiversScreen({ navigation, currentUser }) {
  const [caregivers, setCaregivers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [undoBackup, setUndoBackup] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [patientId, setPatientId] = useState('usr-patient-1');

  useEffect(() => {
    const links = dbService.getCareLinksForMember(currentUser?.id);
    const activeLink = links.find(l => l.status === 'Active');
    if (activeLink) {
      setPatientId(activeLink.patientId);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    return dbService.subscribeToCareLinks(patientId, (records) => {
      const linked = records.filter((record) => record.status === 'Active' && ['caregiver', 'nurse'].includes(record.role));
      setCaregivers(linked.map((record) => ({
        ...(dbService.getUserById(record.memberId) || {}),
        consentId: record.id,
      })));
    });
  }, [patientId]);

  const handleInviteCaregiver = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const invited = dbService.createUser({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: 'caregiver',
      patientId,
    });
    await dbService.addCareLink({
      patientId,
      memberId: invited.id,
      memberName: invited.name,
      role: 'caregiver',
      status: 'Active',
    });

    setInviteName('');
    setInviteEmail('');
    setShowInviteForm(false);
  };

  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;

    const link = dbService.getCareLinks(patientId).find((record) => record.id === deleteTarget.consentId);
    if (link) await dbService.removeCareLink(link.id);
    setCaregivers((current) => current.filter((member) => member.id !== deleteTarget.id));
    setUndoBackup({ member: deleteTarget, link });
    setSnackbarMsg(`Removed ${deleteTarget.name}`);
    setDeleteTarget(null);
  };

  const handleUndoRemove = async () => {
    if (undoBackup) {
      if (undoBackup.link) await dbService.restoreCareLink(undoBackup.link);
      setCaregivers((current) => [...current, undoBackup.member]);
      setUndoBackup(null);
      setSnackbarMsg('');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Care Circle"
        subtitle="Manage linked caregivers & visiting nurse"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>LINKED CAREGIVERS & NURSES</Text>

        <View style={styles.cardGroup}>
          {caregivers.map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.roleSub}>
                  {item.role === 'nurse' ? 'Visiting Nurse' : 'Family Caregiver'} · {item.email}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setDeleteTarget(item)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Invite Caregiver Toggle Form */}
        {!showInviteForm ? (
          <Button
            title="+ Invite a caregiver"
            variant="outline"
            onPress={() => setShowInviteForm(true)}
            style={styles.inviteBtn}
          />
        ) : (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Invite new caregiver</Text>
            <TextInput
              style={styles.input}
              value={inviteName}
              onChangeText={setInviteName}
              placeholder="Caregiver Name (e.g. Sister / Son)"
            />
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Caregiver Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.formBtnRow}>
              <Button
                title="Send Invite"
                onPress={handleInviteCaregiver}
                style={styles.sendInviteBtn}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowInviteForm(false)}
                style={styles.cancelInviteBtn}
              />
            </View>
          </View>
        )}

        {/* Link to Invite Nurse Screen */}
        <Button
          title="+ Invite Nurse (Care Plan)"
          colorScheme="blue"
          onPress={() => navigation?.navigate('InviteNurse')}
          style={styles.inviteNurseBtn}
        />
      </ScrollView>

      {/* Remove Confirmation Modal Sheet */}
      <BottomSheetConfirmation
        visible={Boolean(deleteTarget)}
        title="Remove caregiver?"
        message={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.name} from care circle?`
            : ''
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 6-Second Undo Bar (UI-07) */}
      <UndoSnackbar
        message={snackbarMsg}
        onUndo={handleUndoRemove}
        onDismiss={() => setSnackbarMsg('')}
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  cardGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  inviteBtn: {
    marginBottom: 12,
  },
  inviteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  formBtnRow: {
    gap: 8,
    marginTop: 4,
  },
  sendInviteBtn: {
    marginBottom: 0,
  },
  cancelInviteBtn: {
    marginBottom: 0,
  },
  inviteNurseBtn: {
    marginTop: 4,
  },
});
