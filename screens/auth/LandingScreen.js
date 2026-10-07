import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LandingScreen({ navigation, onSelectRole }) {
  const [selectedRole, setSelectedRole] = useState('patient'); // 'patient', 'nurse', 'doctor'

  const handleGetStarted = () => {
    if (onSelectRole) onSelectRole(selectedRole);

    if (selectedRole === 'nurse') {
      navigation?.navigate('NurseSignIn');
    } else if (selectedRole === 'doctor') {
      navigation?.navigate('DoctorSignIn');
    } else {
      navigation?.navigate('Login');
    }
  };

  const handleAlreadyAccount = () => {
    if (onSelectRole) onSelectRole(selectedRole);

    if (selectedRole === 'nurse') {
      navigation?.navigate('NurseSignIn');
    } else if (selectedRole === 'doctor') {
      navigation?.navigate('DoctorSignIn');
    } else {
      navigation?.navigate('Login');
    }
  };

  const roles = [
    {
      key: 'patient',
      title: 'Patient / Caregiver',
      desc: 'Manage medications and schedules',
    },
    {
      key: 'nurse',
      title: 'Nurse',
      desc: 'Access patient records and update care plans',
    },
    {
      key: 'doctor',
      title: 'Doctor / Pharmacist',
      desc: 'View patient records and prescriptions',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO IMAGE CONTAINER */}
      <View style={styles.heroContainer}>
        <Image
          source={require('../../assets/images/login.jpg')}
          style={styles.heroImage}
          resizeMode="contain"
        />
        {/* Soft concave curve overlay at bottom of hero */}
        <View style={styles.concaveCurve} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>

        <View style={styles.rolesContainer}>
          {roles.map((role) => {
            const isSelected = selectedRole === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleCard,
                  isSelected ? styles.selectedRoleCard : styles.unselectedRoleCard,
                ]}
                onPress={() => setSelectedRole(role.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAlreadyAccount}
            activeOpacity={0.8}
            style={styles.alreadyAccountBtn}
          >
            <Text style={styles.alreadyAccountText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 2292 / 1856,
    overflow: 'hidden',
    alignSelf: 'stretch',
    position: 'relative',
    backgroundColor: '#F4F6F3',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: 'auto',
  },
  concaveCurve: {
    position: 'absolute',
    bottom: -30,
    left: '-10%',
    width: '120%',
    height: 60,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2A37',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  rolesContainer: {
    gap: 10,
    marginBottom: 12,
  },
  roleCard: {
    padding: 12,
    borderRadius: 16,
    justifyContent: 'center',
  },
  unselectedRoleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9DEE3',
  },
  selectedRoleCard: {
    backgroundColor: '#EEF5F0',
    borderWidth: 2,
    borderColor: '#4F7A63',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A37',
  },
  roleDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  getStartedBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#587A63',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bottomActions: {
    marginTop: 'auto',
  },
  getStartedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  alreadyAccountBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  alreadyAccountText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
  },
});
