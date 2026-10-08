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

export default function InviteNurseScreen({ navigation }) {
  const [nurseSearch, setNurseSearch] = useState('dilani@careteam.lk');
  const [permissions, setPermissions] = useState({
    viewSchedule: true,
    viewAdherence: true,
    addNotes: true,
    contactCaregiver: false,
  });
  const [addedSuccess, setAddedSuccess] = useState(false);

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddNurse = () => {
    dbService.createUser({
      name: 'Nurse Dilani',
      email: nurseSearch.trim(),
      role: 'nurse',
      nurseId: 'N-2041', // Display field only, not used as ID
    });

    setAddedSuccess(true);
    setTimeout(() => {
      navigation?.goBack();
    }, 800);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Invite a Nurse"
        subtitle="Add visiting nurse to care plan"
        onBack={() => navigation?.goBack()}
        colorScheme="blue"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {addedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Nurse added to care plan!</Text>
          </View>
        )}

        {/* Search Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>SEARCH BY EMAIL OR NURSE ID</Text>
          <TextInput
            style={styles.input}
            value={nurseSearch}
            onChangeText={setNurseSearch}
            placeholder="dilani@careteam.lk or N-2041"
          />
        </View>

        {/* Generate QR Option */}
        <TouchableOpacity style={styles.qrOptionCard}>
          <Text style={styles.qrIcon}>📱</Text>
          <View style={styles.qrTextCol}>
            <Text style={styles.qrTitle}>Or show QR for nurse to scan</Text>
            <Text style={styles.qrSub}>Generate temporary 30-min nurse code</Text>
          </View>
        </TouchableOpacity>

        {/* Checkbox Permissions */}
        <Text style={styles.sectionHeader}>ASSIGN PERMISSIONS</Text>

        <View style={styles.permissionsCard}>
          {[
            { key: 'viewSchedule', label: 'View medication schedule' },
            { key: 'viewAdherence', label: 'View adherence history' },
            { key: 'addNotes', label: 'Add care notes' },
            { key: 'contactCaregiver', label: 'Contact caregiver' },
          ].map((item) => {
            const isChecked = permissions[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => togglePermission(item.key)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked && styles.checkedCheckbox,
                  ]}
                >
                  {isChecked && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Add Nurse"
          colorScheme="blue"
          onPress={handleAddNurse}
          style={styles.addBtn}
        />
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
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
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
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  qrOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 20,
  },
  qrIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  qrTextCol: {
    flex: 1,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  qrSub: {
    fontSize: 12,
    color: '#1D4ED8',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  permissionsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  addBtn: {
    marginTop: 4,
  },
});
