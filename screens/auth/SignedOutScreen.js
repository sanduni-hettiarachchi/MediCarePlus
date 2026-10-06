import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';

export default function SignedOutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>👋</Text>
        </View>

        <Text style={styles.title}>Signed out</Text>
        <Text style={styles.subtitle}>
          You have been signed out of MediCare+. Your medication reminders will continue to ring locally on your device.
        </Text>

        <Button
          title="Sign in again"
          onPress={() => navigation?.navigate('Login')}
          style={styles.signInBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  signInBtn: {
    width: '100%',
  },
});
