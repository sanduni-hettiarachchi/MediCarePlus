// Nurse accounts are provisioned by an administrator in Firebase Auth and users.
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

export default function NurseSignInScreen({ navigation, onNurseSignIn }) {
  const [email, setEmail] = useState('dilani@careteam.lk');
  const [password, setPassword] = useState('password123');
  const [nurseId, setNurseId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    setErrorMsg('');

    if (!email.trim() || !password.trim() || !nurseId.trim()) {
      setErrorMsg('Email, password and Nurse ID are all required.');
      return;
    }

    try {
      const activeNurse = await dbService.signInProfessionalFirebase(email.trim(), password.trim());
      // Verify role and nurseId from user doc
      if (activeNurse.role !== 'nurse' || String(activeNurse.nurseId ?? '') !== nurseId.trim()) {
        setErrorMsg('Invalid nurse credentials, role or Nurse ID.');
        return;
      }
      // Pass the user object with correct id from buildCurrentUser
      if (onNurseSignIn) {
        onNurseSignIn(activeNurse);
      } else {
        navigation?.navigate('NurseMyPatients', { currentUser: activeNurse });
      }
    } catch (error) {
      setErrorMsg('Invalid nurse credentials, role or Nurse ID.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Nurse portal sign in"
        subtitle="Sign in to your care team account"
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Nurse Icon Badge */}
        <View style={styles.nurseBadgeBox}>
          <View style={styles.nurseCircle}>
            <Text style={styles.nurseIcon}>🩺</Text>
          </View>
          <Text style={styles.badgeLabel}>Nurse Portal</Text>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>NURSE EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="dilani@careteam.lk"
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
          <Text style={styles.label}>NURSE ID</Text>
          <TextInput
            style={styles.input}
            value={nurseId}
            onChangeText={setNurseId}
            placeholder="Nurse ID (e.g. N-2041)"
          />
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <Button
          title="Sign in"
          colorScheme="blue"
          onPress={handleSignIn}
          style={styles.signInBtn}
        />

        <View style={styles.signUpRow}>
          <Text style={styles.signUpQuestion}>Don't have a nurse account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('SignUp', { role: 'nurse' })}>
            <Text style={styles.signUpLink}>Sign up as a Nurse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adminContactBox}>
          <Text style={styles.adminText}>
            Need access? Contact your healthcare facility administrator.
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
  nurseBadgeBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nurseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nurseIcon: {
    fontSize: 32,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  signInBtn: {
    marginBottom: 14,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpQuestion: {
    fontSize: 14,
    color: '#64748B',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  adminContactBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  adminText: {
    fontSize: 12,
    color: '#1D4ED8',
    textAlign: 'center',
  },
});
