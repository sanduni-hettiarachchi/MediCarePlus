import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Header from '../../components/Header';
import UndoSnackbar from '../../components/UndoSnackbar';
import Button from '../../components/Button';
import dbService from '../../services/db';
import Text from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';

export default function ManageAccessScreen({ navigation, currentUser }) {
  const t = useT();
  const patientId = currentUser?.id || 'usr-patient-1';
  const [accessLinks, setAccessLinks] = useState([]);
  const [targetConsent, setTargetConsent] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [undoBackup, setUndoBackup] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPersonScreen, setShowAddPersonScreen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});

  useEffect(() => {
    return dbService.subscribeToCareLinks(patientId, 'patient', (list) => setAccessLinks(list.filter((item) => item.status !== 'Revoked')));
  }, [patientId]);

  const handleOpenRemoveSheet = (consentItem) => {
    setTargetConsent(consentItem);
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!targetConsent) return;

    setShowConfirmModal(false);

    const backup = await dbService.removeCareLink(targetConsent.id);
    setUndoBackup(backup);
    setSnackbarMsg(t('removedAccess', { name: targetConsent.memberName }));
    setAccessLinks((current) => current.filter((item) => item.id !== targetConsent.id));
  };

  const handleUndoRemove = async () => {
    if (undoBackup) {
      await dbService.restoreCareLink(undoBackup);
      setUndoBackup(null);
      setSnackbarMsg('');
      setAccessLinks((current) => [...current, undoBackup]);
    }
  };

  const handleEditPermissions = (link) => {
    setEditingLink(link);
    setEditPermissions(link.permissions || {});
  };

  const handleSavePermissions = async () => {
    if (!editingLink) return;
    await dbService.updateCareLink(editingLink.id, { permissions: editPermissions });
    setAccessLinks((current) => current.map((c) => c.id === editingLink.id ? { ...c, permissions: editPermissions } : c));
    setEditingLink(null);
    setEditPermissions({});
  };

  const toggleEditPermission = (key) => {
    setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };


  return (
    <View style={styles.container}>
      <Header
        title={t('manageAccess')}
        subtitle={t('accessSubtitle')}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Caregivers Section */}
        <Text style={styles.sectionHeader}>CAREGIVERS</Text>
        <View style={styles.listCard}>
          {accessLinks.filter(c => c.role === 'caregiver').map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.memberName || 'C').charAt(0)}
                </Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.memberName}</Text>
                <Text style={styles.roleText}>{item.role === 'caregiver' ? 'Caregiver' : item.role}</Text>
                {item.status === 'Pending' && (
                  <View style={styles.pendingTag}>
                    <Text style={styles.pendingTagText}>Pending</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                {item.status === 'Active' && (
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEditPermissions(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleOpenRemoveSheet(item)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {accessLinks.filter(c => c.role === 'caregiver').length === 0 && (
            <Text style={styles.emptyText}>No caregivers added yet</Text>
          )}
        </View>

        {/* Nurses Section */}
        <Text style={styles.sectionHeader}>NURSES</Text>
        <View style={styles.listCard}>
          {accessLinks.filter(c => c.role === 'nurse').map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.memberName || 'N').charAt(0)}
                </Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.memberName}</Text>
                <Text style={styles.roleText}>{item.role === 'nurse' ? 'Nurse' : item.role}</Text>
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleOpenRemoveSheet(item)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          {accessLinks.filter(c => c.role === 'nurse').length === 0 && (
            <Text style={styles.emptyText}>No nurses added yet</Text>
          )}
        </View>

        {/* Doctors & Pharmacists Section */}
        <Text style={styles.sectionHeader}>DOCTORS & PHARMACISTS</Text>
        <View style={styles.listCard}>
          {accessLinks.filter(c => c.role === 'doctor' || c.role === 'pharmacist').map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.memberName || 'D').charAt(0)}
                </Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.memberName}</Text>
                <Text style={styles.roleText}>{item.role === 'doctor' ? 'Doctor' : item.role === 'pharmacist' ? 'Pharmacist' : item.role}</Text>
                <Text style={styles.accessTag}>Active · read-only, via QR</Text>
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleOpenRemoveSheet(item)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          {accessLinks.filter(c => c.role === 'doctor' || c.role === 'pharmacist').length === 0 && (
            <Text style={styles.emptyText}>No doctors or pharmacists have scanned your QR code yet</Text>
          )}
        </View>

        <Button
          title="+ Add person"
          onPress={() => setShowAddPersonScreen(true)}
          style={styles.addBtn}
          variant="outline"
        />
      </ScrollView>

      {/* Add Person Screen */}
      {showAddPersonScreen && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.addPersonScreen}>
            <View style={styles.addPersonHeader}>
              <TouchableOpacity onPress={() => setShowAddPersonScreen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.addPersonTitle}>Add person</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.addPersonContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.roleCard} onPress={() => navigation?.navigate('InviteCaregiver', { patientId, onAdd: () => setShowAddPersonScreen(false) })}>
                <View style={styles.roleCardIcon}>
                  <Text style={styles.roleCardIconText}>👨‍👩‍👧</Text>
                </View>
                <Text style={styles.roleCardTitle}>Caregiver</Text>
                <Text style={styles.roleCardDesc}>Family member or friend who helps with daily care and medication reminders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.roleCard} onPress={() => navigation?.navigate('InviteNurse', { patientId, onAdd: () => setShowAddPersonScreen(false) })}>
                <View style={[styles.roleCardIcon, styles.nurseIcon]}>
                  <Text style={styles.roleCardIconText}>👩‍⚕️</Text>
                </View>
                <Text style={styles.roleCardTitle}>Nurse</Text>
                <Text style={styles.roleCardDesc}>Professional nurse who can view adherence and add care notes</Text>
              </TouchableOpacity>

              <View style={styles.noteBox}>
                <Text style={styles.noteText}>Doctors and pharmacists cannot be added here. Show them your QR code from Share with Doctor.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Confirmation Bottom Sheet */}
      <BottomSheetConfirmation
        visible={showConfirmModal}
        title={t('removeAccessTitle')}
        message={targetConsent ? t('removeAccessMessage', { name: targetConsent.granteeName }) : ''}
        confirmLabel={t('remove')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmRemove}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* 6-Second Undo Snackbar (UI-07) */}
      <UndoSnackbar
        message={snackbarMsg}
        onUndo={handleUndoRemove}
        onDismiss={() => setSnackbarMsg('')}
      />

      {/* Edit Permissions Modal */}
      {editingLink && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.editPermissionsModal}>
            <View style={styles.editPermissionsHeader}>
              <TouchableOpacity onPress={() => { setEditingLink(null); setEditPermissions({}); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editPermissionsTitle}>Edit permissions</Text>
              <TouchableOpacity onPress={handleSavePermissions}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.editPermissionsContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.editFor}>For {editingLink.memberName}</Text>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('viewSchedule')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>View medication schedule</Text>
                  <Text style={styles.permissionDesc}>Can see when medicines are due</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.viewSchedule && styles.checkboxChecked]}>
                  {editPermissions.viewSchedule && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('viewAdherence')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>View adherence history</Text>
                  <Text style={styles.permissionDesc}>Can see dose logs and calendar</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.viewAdherence && styles.checkboxChecked]}>
                  {editPermissions.viewAdherence && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('receiveAlerts')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Receive missed-dose alerts</Text>
                  <Text style={styles.permissionDesc}>Notified when doses are missed</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.receiveAlerts && styles.checkboxChecked]}>
                  {editPermissions.receiveAlerts && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('editSchedule')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Edit medication schedule</Text>
                  <Text style={styles.permissionDesc}>Can add, edit, or remove medicines</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.editSchedule && styles.checkboxChecked]}>
                  {editPermissions.editSchedule && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('viewCareNotes')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>View care notes</Text>
                  <Text style={styles.permissionDesc}>Can see notes from nurses and doctors</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.viewCareNotes && styles.checkboxChecked]}>
                  {editPermissions.viewCareNotes && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('addNotes')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Add care notes</Text>
                  <Text style={styles.permissionDesc}>Can document observations and recommendations</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.addNotes && styles.checkboxChecked]}>
                  {editPermissions.addNotes && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permissionRow} onPress={() => toggleEditPermission('contact')}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Contact patient</Text>
                  <Text style={styles.permissionDesc}>Can call or message the patient</Text>
                </View>
                <View style={[styles.checkbox, editPermissions.contact && styles.checkboxChecked]}>
                  {editPermissions.contact && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
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
  listCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  activeTag: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  pendingTag: {
    backgroundColor: '#FEF3C7',
  },
  pendingTagText: {
    color: '#92400E',
  },
  roleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  accessTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    paddingVertical: 20,
    textAlign: 'center',
  },
  pendingTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  pendingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  addPersonScreen: {
    flex: 1,
  },
  addPersonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
  },
  addPersonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  addPersonContent: {
    padding: 20,
  },
  roleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nurseIcon: {
    backgroundColor: '#EFF6FF',
  },
  roleCardIconText: {
    fontSize: 28,
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  roleCardDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  editPermissionsModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editPermissionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  editPermissionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D8F7A',
  },
  editPermissionsContent: {
    padding: 20,
  },
  editFor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  permissionDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0D8F7A',
    borderColor: '#0D8F7A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: '#EAF5F2',
    borderWidth: 2,
    borderColor: '#0D8F7A',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedRoleText: {
    color: '#0D8F7A',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
    marginBottom: 8,
  },
  modalBtn: {
    marginTop: 12,
  },
});
