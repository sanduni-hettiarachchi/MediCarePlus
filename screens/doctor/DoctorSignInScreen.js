// Doctor and pharmacist accounts are provisioned by an administrator in Firebase Auth and users.
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import dbService from '../../services/db';

export default function DoctorSignInScreen({ navigation, onDoctorSignIn }) {
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [email, setEmail] = useState('dr.silva@hospital.lk');
  const [password, setPassword] = useState('password123');
  const [doctorRegNumber, setDoctorRegNumber] = useState('12345');
  const [pharmacyRegNumber, setPharmacyRegNumber] = useState('PH-778');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    setErrorMsg('');

    const registrationNumber = selectedRole === 'doctor' ? doctorRegNumber : pharmacyRegNumber;
    if (!email.trim() || !password.trim() || !registrationNumber.trim()) {
      setErrorMsg(`Email, password and ${selectedRole === 'doctor' ? 'SLMC' : 'pharmacy'} registration number are all required.`);
      return;
    }

    try {
      const user = await dbService.signInProfessionalFirebase(email.trim(), password.trim());
      if (user.role !== selectedRole) {
        await dbService.signOutFirebase();
        setErrorMsg(`This account is not registered as a ${selectedRole}.`);
        return;
      }
      const savedRegistration = selectedRole === 'doctor' ? user.slmcNumber : user.pharmacyRegNo;
      if (String(savedRegistration || '') !== registrationNumber.trim()) {
        setErrorMsg('Invalid professional credentials, role or registration number.');
        return;
      }
      if (onDoctorSignIn) {
        onDoctorSignIn(user);
      } else if (user.role === 'pharmacist') {
        navigation?.navigate('PharmacistPatientMedicines', { pharmacist: user });
      } else {
        navigation?.navigate('ScanQRCode', { doctor: user });
      }
    } catch (error) {
      setErrorMsg('Invalid email or password.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={selectedRole === 'doctor' ? 'Doctor sign in' : 'Pharmacist sign in'}
        subtitle="Use your verified professional account to access a patient who has shared their QR code."
        onBack={() => navigation?.navigate('Landing')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.roleRow}>
          {[
            { value: 'doctor', label: 'Doctor' },
            { value: 'pharmacist', label: 'Pharmacist' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.roleChip, selectedRole === option.value && styles.selectedRoleChip]}
              onPress={() => {
                setSelectedRole(option.value);
                setErrorMsg('');
              }}
            >
              <Text style={[styles.roleChipText, selectedRole === option.value && styles.selectedRoleChipText]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{selectedRole === 'doctor' ? 'DOCTOR EMAIL' : 'PHARMACIST EMAIL'}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="dr.silva@hospital.lk"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{selectedRole === 'doctor' ? 'SLMC REGISTRATION NUMBER' : 'PHARMACY REGISTRATION NUMBER'}</Text>
          <TextInput
            style={styles.input}
            value={selectedRole === 'doctor' ? doctorRegNumber : pharmacyRegNumber}
            onChangeText={selectedRole === 'doctor' ? setDoctorRegNumber : setPharmacyRegNumber}
            placeholder={selectedRole === 'doctor' ? 'SLMC registration number (e.g. 12345)' : 'Pharmacy registration number (e.g. PH-778)'}
          />
        </View>

        <Button title="Sign in securely" onPress={handleSignIn} style={styles.signInBtn} />

        <View style={styles.signUpRow}>
          <Text style={styles.signUpQuestion}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('SignUp', { role: selectedRole })}>
            <Text style={styles.signUpLink}>Sign up as a {selectedRole === 'doctor' ? 'Doctor' : 'Pharmacist'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            {selectedRole === 'doctor'
              ? 'Doctors cannot create patients. The patient must share access from their MediCare+ app.'
              : 'You can only see medicine stock and refill status for patients who shared their QR code.'}
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  selectedRoleChip: {
    backgroundColor: '#0D8F7A',
    borderColor: '#0D8F7A',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  selectedRoleChipText: {
    color: '#FFFFFF',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  infoBanner: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  signInBtn: {
    marginBottom: 14,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  signUpQuestion: {
    fontSize: 14,
    color: '#64748B',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  noticeBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
});
