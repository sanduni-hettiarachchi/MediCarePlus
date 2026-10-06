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

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('patient'); // 'patient' or 'caregiver'
  const [emailOrPhone, setEmailOrPhone] = useState('maya.perera@email.com');
  const [password, setPassword] = useState('password123');
  const [hasError, setHasError] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSignIn = async () => {
    setHasError(false);
    setErrorText('');

    if (!emailOrPhone.trim() || !password.trim()) {
      setHasError(true);
      setErrorText("That password doesn't match. Check it and try again.");
      return;
    }

    try {
      const user = await dbService.signInFirebase(
        emailOrPhone.trim(),
        password.trim(),
        activeRole
      );

      if (user) {
        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else {
          if (user.role === 'caregiver') {
            navigation?.navigate('CaregiverProfiles');
          } else {
            navigation?.navigate('TodaysSchedule');
          }
        }
        return;
      }
      setHasError(true);
      setErrorText("That password doesn't match. Check it and try again.");
    } catch (error) {
      const messages = {
        'auth/wrong-password': "That password doesn't match. Check it and try again.",
        'auth/invalid-credential': "That password doesn't match. Check it and try again.",
        'auth/user-not-found': "That password doesn't match. Check it and try again.",
        'auth/too-many-requests': 'Too many sign-in attempts. Wait a moment and try again.',
        'auth/network-request-failed': "You're offline. Check your connection and try again.",
      };
      setHasError(true);
      setErrorText(messages[error.code] || 'Something went wrong. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Welcome back"
        subtitle="Sign in to your account"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Role Selector Tabs (Patient / Caregiver) */}
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'patient' && styles.activeRoleTab]}
            onPress={() => {
              setActiveRole('patient');
              setEmailOrPhone('maya.perera@email.com');
            }}
          >
            <Text style={[styles.roleTabText, activeRole === 'patient' && styles.activeRoleTabText]}>
              Patient
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'caregiver' && styles.activeRoleTab]}
            onPress={() => {
              setActiveRole('caregiver');
              setEmailOrPhone('kumari@email.com');
            }}
          >
            <Text style={[styles.roleTabText, activeRole === 'caregiver' && styles.activeRoleTabText]}>
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email or Phone */}
        <View style={styles.fieldGroup}>
          <TextInput
            style={styles.input}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder="Email or phone number"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setHasError(false);
            }}
            placeholder="Password"
            secureTextEntry
          />

          {/* Plain error text under field (UI-04) */}
          {hasError && (
            <View style={styles.errorRow}>
              <Text style={styles.errorIcon}>🔒</Text>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Button title="Sign in" onPress={handleSignIn} style={styles.signInBtn} />

        <View style={styles.signUpRow}>
          <Text style={styles.signUpQuestion}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign up</Text>
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
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeRoleTab: {
    backgroundColor: '#0D8F7A',
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  activeRoleTabText: {
    color: '#FFFFFF',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: '#FFF5F5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D8F7A',
  },
  signInBtn: {
    marginTop: 12,
    marginBottom: 20,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
});
