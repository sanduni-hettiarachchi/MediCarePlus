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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const routeRole = route?.params?.role;
  const [role, setRole] = useState(
    routeRole === 'patient' || routeRole === 'caregiver' ? routeRole : 'patient'
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateAccount = async () => {
    const accountRole = routeRole ?? role;
    if (accountRole !== 'patient' && accountRole !== 'caregiver') {
      setErrorMsg('Only patient and caregiver accounts can be created here.');
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    try {
      const newUser = await dbService.signUpFirebase({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role: accountRole,
      });

      if (onSignUpSuccess) {
        onSignUpSuccess(newUser);
      } else {
        if (accountRole === 'caregiver') {
          navigation?.navigate('CaregiverProfiles');
        } else {
          navigation?.navigate('TodaysSchedule');
        }
      }
    } catch (error) {
      setErrorMsg(error.message || 'Could not create the account.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create account"
        subtitle="Sign up for your new account"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Mrs. Maya Perera"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="maya.perera@email.com"
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>I AM A</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleChip, role === 'patient' && styles.selectedRoleChip]}
              onPress={() => setRole('patient')}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === 'patient' && styles.selectedRoleChipText,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleChip, role === 'caregiver' && styles.selectedRoleChip]}
              onPress={() => setRole('caregiver')}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === 'caregiver' && styles.selectedRoleChipText,
                ]}
              >
                Caregiver
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Create account"
          onPress={handleCreateAccount}
          style={styles.createBtn}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginQuestion}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
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
