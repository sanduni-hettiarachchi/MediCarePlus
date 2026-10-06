import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';

export default function AccessGrantedScreen({ navigation, route }) {
  const doctor = route?.params?.doctor || route?.params?.professional;
  const isPharmacist = doctor?.role === 'pharmacist';
  const patientName = route?.params?.patientName || 'Mrs. Perera';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Access granted</Text>
        <Text style={styles.subtitle}>
          {isPharmacist 
            ? `You now have temporary access for ${patientName}.`
            : `You now have temporary read-only access for ${patientName}.`
          }
        </Text>

        <View style={styles.patientCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{patientName.charAt(0)}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            {isPharmacist ? null : (
              <Text style={styles.patientDetail}>Female · 58 years</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <Button
          title={isPharmacist ? 'Go to refill summary' : 'Go to patient summary'}
          onPress={() => isPharmacist
            ? navigation?.navigate('RefillSummary', { pharmacist: doctor, patientId: route?.params?.patientId, patientName })
            : navigation?.navigate('HomeVisitSummary', { doctor, patientId: route?.params?.patientId })}
          style={styles.goBtn}
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
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 36,
    color: '#0D8F7A',
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  patientCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D8F7A',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientDetail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginBottom: 24,
  },
  goBtn: {
    width: '100%',
  },
});
