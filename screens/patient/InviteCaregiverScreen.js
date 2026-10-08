import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';
import Text from '../../components/PatientText';

export default function InviteCaregiverScreen({ navigation, route, currentUser }) {
  const patientId = route?.params?.patientId || currentUser?.id;
  const onAdd = route?.params?.onAdd;
  const patientName = currentUser?.name || 'Patient';
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [permissions, setPermissions] = useState({
    viewSchedule: true,
    viewAdherence: true,
    receiveAlerts: true,
    editSchedule: false,
    viewCareNotes: true,
    addNotes: false,
    contact: true,
  });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser !== undefined && currentUser !== null) {
      setIsLoadingAuth(false);
    }
  }, [currentUser]);

  const handleAddCaregiver = async () => {
    setLoading(true);
    setFormError('');

    try {
      const email = searchQuery.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setFormError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const user = await dbService.findUserByEmail(email);
      if (!user) {
        setFormError('No account with this email. Ask them to sign up first.');
        setLoading(false);
        return;
      }

      if (user.role !== 'caregiver') {
        setFormError('This user is not a caregiver.');
        setLoading(false);
        return;
      }

      if (!patientId || !currentUser?.id) {
        setFormError('Patient ID or user ID not available. Please try again.');
        setLoading(false);
        return;
      }

      const careLinkPayload = {
        patientId,
        memberId: user.id,
        memberName: user.name,
        role: 'caregiver',
        status: 'Pending',
        permissions,
        email: user.email,
        addedBy: patientName,
      };

      console.log('[InviteCaregiverScreen] addCareLink payload:', careLinkPayload);
      console.log('[InviteCaregiverScreen] currentUser.id:', currentUser.id, 'patientId:', patientId, 'patientId === currentUser.id:', patientId === currentUser.id);

      await dbService.addCareLink(careLinkPayload);

      setFormError('');
      setSearchQuery('');
      if (onAdd) onAdd(careLinkPayload);
      navigation?.goBack();
    } catch (error) {
      console.error('[InviteCaregiverScreen] error:', error);
      setFormError(error?.message || 'Failed to add caregiver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Invite a caregiver"
        subtitle="Add a family member or friend"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Search by email</Text>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Enter email address"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />


        <Text style={styles.sectionHeader}>PERMISSIONS</Text>

        <View style={styles.permissionsCard}>
          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('viewSchedule')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>View medication schedule</Text>
              <Text style={styles.permissionDesc}>Can see when medicines are due</Text>
            </View>
            <View style={[styles.checkbox, permissions.viewSchedule && styles.checkboxChecked]}>
              {permissions.viewSchedule && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('viewAdherence')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>View adherence history</Text>
              <Text style={styles.permissionDesc}>Can see dose logs and calendar</Text>
            </View>
            <View style={[styles.checkbox, permissions.viewAdherence && styles.checkboxChecked]}>
              {permissions.viewAdherence && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('receiveAlerts')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Receive missed-dose alerts</Text>
              <Text style={styles.permissionDesc}>Notified when doses are missed</Text>
            </View>
            <View style={[styles.checkbox, permissions.receiveAlerts && styles.checkboxChecked]}>
              {permissions.receiveAlerts && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('editSchedule')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Edit medication schedule</Text>
              <Text style={styles.permissionDesc}>Can add, edit, or remove medicines</Text>
            </View>
            <View style={[styles.checkbox, permissions.editSchedule && styles.checkboxChecked]}>
              {permissions.editSchedule && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('viewCareNotes')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>View care notes</Text>
              <Text style={styles.permissionDesc}>Can see notes from nurses and doctors</Text>
            </View>
            <View style={[styles.checkbox, permissions.viewCareNotes && styles.checkboxChecked]}>
              {permissions.viewCareNotes && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('addNotes')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Add care notes</Text>
              <Text style={styles.permissionDesc}>Can document observations and recommendations</Text>
            </View>
            <View style={[styles.checkbox, permissions.addNotes && styles.checkboxChecked]}>
              {permissions.addNotes && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionRow} onPress={() => togglePermission('contact')}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Contact patient</Text>
              <Text style={styles.permissionDesc}>Can call or message the patient</Text>
            </View>
            <View style={[styles.checkbox, permissions.contact && styles.checkboxChecked]}>
              {permissions.contact && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Button title="Add caregiver" onPress={handleAddCaregiver} style={styles.addBtn} disabled={loading || isLoadingAuth} />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    marginBottom: 12,
  },
  linkBtn: {
    marginBottom: 24,
  },
  linkBtnText: {
    fontSize: 15,
    color: '#0D8F7A',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  permissionsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  addBtn: {
    marginBottom: 0,
  },
});
