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

export default function SignUpScreen({ navigation, route, onSignUpSuccess }) {
  const routeRole = route?.params?.role;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(routeRole || 'patient');
  const [nurseId, setNurseId] = useState('N-2041');
  const [slmcNumber, setSlmcNumber] = useState('12345');
  const [pharmacyRegNo, setPharmacyRegNo] = useState('PH-778');
  const [errorMsg, setErrorMsg] = useState('');

  const accountRole = role;

  // Filter available roles based on route param
  const getAvailableRoles = () => {
    if (routeRole === 'patient' || routeRole === 'caregiver') {
      return [
        { key: 'patient', label: 'Patient' },
        { key: 'caregiver', label: 'Caregiver' },
      ];
    }
    if (routeRole === 'doctor' || routeRole === 'pharmacist') {
      return [
        { key: 'doctor', label: 'Doctor' },
        { key: 'pharmacist', label: 'Pharmacist' },
      ];
    }
    // Show all roles if no specific route role (default behavior)
    return [
      { key: 'patient', label: 'Patient' },
      { key: 'caregiver', label: 'Caregiver' },
      { key: 'nurse', label: 'Nurse' },
      { key: 'doctor', label: 'Doctor' },
      { key: 'pharmacist', label: 'Pharmacist' },
    ];
  };

  const availableRoles = getAvailableRoles();

  const handleCreateAccount = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Name, email, and password are required.');
      return;
    }

    if (accountRole === 'nurse' && !nurseId.trim()) {
      setErrorMsg('Nurse ID is required.');
      return;
    }
    if (accountRole === 'doctor' && !slmcNumber.trim()) {
      setErrorMsg('SLMC Registration Number is required.');
      return;
    }
    if (accountRole === 'pharmacist' && !pharmacyRegNo.trim()) {
      setErrorMsg('Pharmacy Registration Number is required.');
      return;
    }

    try {
      const newUser = await dbService.signUpFirebase({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role: accountRole,
        nurseId: accountRole === 'nurse' ? nurseId.trim() : undefined,
        slmcNumber: accountRole === 'doctor' ? slmcNumber.trim() : undefined,
        pharmacyRegNo: accountRole === 'pharmacist' ? pharmacyRegNo.trim() : undefined,
      });

      if (onSignUpSuccess) {
        onSignUpSuccess(newUser);
      } else {
        if (accountRole === 'nurse') {
          navigation?.navigate('NurseMyPatients', { nurse: newUser });
        } else if (accountRole === 'doctor') {
          navigation?.navigate('ScanQRCode', { doctor: newUser });
        } else if (accountRole === 'pharmacist') {
          navigation?.navigate('PharmacistPatientMedicines', { pharmacist: newUser });
        } else if (accountRole === 'caregiver') {
          navigation?.navigate('CaregiverProfiles');
        } else {
          navigation?.navigate('TodaysSchedule');
        }
      }
    } catch (error) {
      setErrorMsg(error.message || 'Could not create the account.');
    }
  };

  const getHeaderTitle = () => {
    switch (accountRole) {
      case 'nurse': return 'Nurse sign up';
      case 'doctor': return 'Doctor sign up';
      case 'pharmacist': return 'Pharmacist sign up';
      case 'caregiver': return 'Caregiver sign up';
      default: return 'Create account';
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={getHeaderTitle()}
        subtitle="Sign up for your new account"
        onBack={() => navigation?.goBack()}
        colorScheme={accountRole === 'nurse' ? 'blue' : 'default'}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={accountRole === 'doctor' ? 'Dr. K. Silva' : accountRole === 'nurse' ? 'Nurse Dilani' : 'Maya Perera'}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="user@example.com"
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
            placeholder="+94 77 123 4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create password"
            secureTextEntry
          />
        </View>

        {accountRole === 'nurse' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>NURSE ID</Text>
            <TextInput
              style={styles.input}
              value={nurseId}
              onChangeText={setNurseId}
              placeholder="e.g. N-2041"
            />
          </View>
        )}

        {accountRole === 'doctor' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SLMC REGISTRATION NUMBER</Text>
            <TextInput
              style={styles.input}
              value={slmcNumber}
              onChangeText={setSlmcNumber}
              placeholder="e.g. 12345"
            />
          </View>
        )}

        {accountRole === 'pharmacist' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PHARMACY REGISTRATION NUMBER</Text>
            <TextInput
              style={styles.input}
              value={pharmacyRegNo}
              onChangeText={setPharmacyRegNo}
              placeholder="e.g. PH-778"
            />
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>I AM A</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>
            {availableRoles.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.roleChip, role === item.key && styles.selectedRoleChip]}
                onPress={() => setRole(item.key)}
              >
                <Text style={[styles.roleChipText, role === item.key && styles.selectedRoleChipText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Button
          title="Create account"
          onPress={handleCreateAccount}
          style={styles.createBtn}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginQuestion}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
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
    marginBottom: 12,
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
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
  createBtn: {
    marginTop: 12,
    marginBottom: 20,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginQuestion: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8F7A',
  },
});
