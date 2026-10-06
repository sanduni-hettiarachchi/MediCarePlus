import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Button from '../../components/Button';
import Header from '../../components/Header';
import authService from '../../services/authService';
import dbService from '../../services/db';

export default function NurseProfileScreen({ navigation, route, onLogout }) {
  const nurse = route?.params?.nurse || {
    id: 'usr-nurse-1',
    name: 'Nurse Dilani',
    age: '34',
    email: 'dilani@careteam.lk',
    phone: '+94 77 123 4567',
    nurseId: 'N-2041',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(nurse.name || '');
  const [age, setAge] = useState(nurse.age || '');
  const [email, setEmail] = useState(nurse.email || '');
  const [phone, setPhone] = useState(nurse.phone || '');
  const [nurseId, setNurseId] = useState(nurse.nurseId || '');
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSaveDetails = () => {
    setFormError('');
    
    // Validation
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setFormError('Please enter a valid phone number');
      return;
    }
    
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      setFormError('Age must be between 18 and 100');
      return;
    }

    dbService.updateUser(nurse.id, {
      name: name.trim(),
      age: age.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    
    setSavedSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCancelEdit = () => {
    setName(nurse.name || '');
    setAge(nurse.age || '');
    setEmail(nurse.email || '');
    setPhone(nurse.phone || '');
    setFormError('');
    setIsEditing(false);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutSheet(false);
    await authService.logout(navigation);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Nurse profile"
        subtitle="Manage care team profile"
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Profile details updated successfully!</Text>
          </View>
        )}

        {/* Avatar & Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>N</Text>
          </View>
          <Text style={styles.name}>{nurse.name || 'Nurse Dilani'}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>Nurse · Care team</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formCard}>
          {isEditing ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>AGE</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>NURSE ID</Text>
                <View style={styles.lockedField}>
                  <TextInput
                    style={[styles.input, styles.lockedInput]]
                    value={nurseId}
                    editable={false}
                  />
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              </View>

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <View style={styles.editActionsRow}>
                <Button
                  title="Save changes"
                  colorScheme="blue"
                  onPress={handleSaveDetails}
                  style={styles.saveBtn}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  colorScheme="blue"
                  onPress={handleCancelEdit}
                  style={styles.cancelBtn}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <Text style={styles.value}>{nurse.name || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>AGE</Text>
                <Text style={styles.value}>{nurse.age || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <Text style={styles.value}>{nurse.email || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <Text style={styles.value}>{nurse.phone || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>NURSE ID</Text>
                <View style={styles.lockedField}>
                  <Text style={[styles.value, styles.lockedValue]}>{nurse.nurseId || '—'}</Text>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              </View>

              <Button
                title="Edit details"
                variant="outline"
                colorScheme="blue"
                onPress={() => setIsEditing(true)}
                style={styles.editBtn}
              />
            </>
          )}
        </View>

        <Button
          title="Log out"
          style={styles.logoutBtn}
          textStyle={styles.logoutBtnText}
          onPress={() => setShowLogoutSheet(true)}
        />
      </ScrollView>

      {/* Logout Confirmation Sheet */}
      <BottomSheetConfirmation
        visible={showLogoutSheet}
        title="Log out of Nurse Portal?"
        message="You will need to sign back in with your Nurse ID."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        colorScheme="blue"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutSheet(false)}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
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
  },
  value: {
    fontSize: 15,
    color: '#0F172A',
  },
  lockedField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  lockedValue: {
    flex: 1,
    color: '#64748B',
  },
  lockIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 12,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    marginBottom: 0,
  },
  cancelBtn: {
    flex: 1,
    marginBottom: 0,
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
  },
});
