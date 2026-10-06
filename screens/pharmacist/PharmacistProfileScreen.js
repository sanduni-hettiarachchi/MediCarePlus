import React, { useState } from 'react';
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
import authService from '../../services/authService';
import dbService from '../../services/db';

export default function PharmacistProfileScreen({ navigation, route, onLogout }) {
  const pharmacist = route?.params?.pharmacist || {
    id: 'usr-pharmacist-1',
    name: 'Mr. Jayasuriya',
    age: '38',
    email: 'jayasuriya@pharmacy.lk',
    phone: '+94 77 345 6789',
    pharmacyRegNo: 'PH-778',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(pharmacist.name || '');
  const [age, setAge] = useState(pharmacist.age || '');
  const [email, setEmail] = useState(pharmacist.email || '');
  const [phone, setPhone] = useState(pharmacist.phone || '');
  const [pharmacyRegNo, setPharmacyRegNo] = useState(pharmacist.pharmacyRegNo || '');
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSaveDetails = () => {
    setFormError('');
    
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

    dbService.updateUser(pharmacist.id, {
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
    setName(pharmacist.name || '');
    setAge(pharmacist.age || '');
    setEmail(pharmacist.email || '');
    setPhone(pharmacist.phone || '');
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
        title="Pharmacist profile"
        subtitle="Manage pharmacy registration"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Profile details updated successfully!</Text>
          </View>
        )}

        {/* Pharmacist Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <Text style={styles.name}>{pharmacist.name || 'Mr. Jayasuriya'}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>Pharmacist · Verified</Text>
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
                <Text style={styles.label}>PHARMACY REGISTRATION NO.</Text>
                <View style={styles.lockedField}>
                  <TextInput
                    style={[styles.input, styles.lockedInput]}
                    value={pharmacyRegNo}
                    editable={false}
                  />
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              </View>

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <View style={styles.editActionsRow}>
                <Button
                  title="Save changes"
                  onPress={handleSaveDetails}
                  style={styles.saveBtn}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleCancelEdit}
                  style={styles.cancelBtn}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <Text style={styles.value}>{pharmacist.name || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>AGE</Text>
                <Text style={styles.value}>{pharmacist.age || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <Text style={styles.value}>{pharmacist.email || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <Text style={styles.value}>{pharmacist.phone || '—'}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PHARMACY REGISTRATION NO.</Text>
                <View style={styles.lockedField}>
                  <Text style={[styles.value, styles.lockedValue]}>{pharmacist.pharmacyRegNo || '—'}</Text>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Access is read-only and limited to patients who shared their QR code.
                </Text>
              </View>

              <Button
                title="Edit details"
                variant="outline"
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
        title="Log out of Pharmacist Portal?"
        message="You will need to scan patient QR code again after signing back in."
        confirmLabel="Log out"
        cancelLabel="Cancel"
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
    backgroundColor: '#E6F4F1',
    borderColor: '#0D8F7A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  successText: {
    color: '#0D8F7A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D8F7A',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D8F7A',
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
  infoBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  editBtn: {
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
