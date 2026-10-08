import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Button from '../../components/Button';
import FiveTabBottomBar from '../../components/FiveTabBottomBar';
import Header from '../../components/Header';
import authService from '../../services/authService';
import dbService from '../../services/db';
import Text from '../../components/PatientText';
import { useT } from '../../i18n/LanguageContext';

export default function PatientProfileScreen({
  navigation,
  onNavigateTab,
  onLogout,
  userPreferences = {},
  currentUser,
}) {
  const t = useT();
  const [user, setUser] = useState(null);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  useEffect(() => {
  const u = dbService.getUserById(currentUser?.id) || currentUser;
    if (u) setUser(u);
  }, [currentUser?.id]);

  if (!user) return null;

  const handleConfirmLogout = async () => {
    setShowLogoutSheet(false);
    await authService.logout(navigation);
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('myProfile')}
        subtitle={t('careConnected')}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{t('patientOwner')}</Text>
          </View>
        </View>

        {/* Personal Info Box */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>
          <View style={styles.infoField}>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoValue}>
              {user.gender} · {user.age}
            </Text>
          </View>
        </View>

        {/* Settings Links */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation?.navigate('ShareWithDoctor')}
          >
            <Text style={styles.settingIcon}>📱</Text>
            <Text style={styles.settingText}>{t('shareDoctor')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation?.navigate('MyPrescriptions')}
          >
            <Text style={styles.settingIcon}>📜</Text>
            <Text style={styles.settingText}>{t('myPrescriptions')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation?.navigate('AccessibilityDisplay')}
          >
            <Text style={styles.settingIcon}>⚙️</Text>
            <Text style={styles.settingText}>{t('accessibilitySettings')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation?.navigate('ManageAccess')}
          >
            <Text style={styles.settingIcon}>👥</Text>
            <Text style={styles.settingText}>{t('manageCaregiverAccess')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation?.navigate('PatientCareNotes')}
          >
            <Text style={styles.settingIcon}>📝</Text>
            <Text style={styles.settingText}>Care notes</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Button
          title={t('logOut')}
          variant="danger-outline"
          onPress={() => setShowLogoutSheet(true)}
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Logout Confirmation Sheet */}
      <BottomSheetConfirmation
        visible={showLogoutSheet}
        title={t('logoutConfirmTitle')}
        message={t('logoutPatientMessage')}
        confirmLabel={t('logOut')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutSheet(false)}
      />

      <FiveTabBottomBar
        activeTab="profile"
        onSelectTab={(tabKey) => onNavigateTab && onNavigateTab(tabKey)}
        language={userPreferences.language}
        isLargeText={userPreferences.largeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 8,
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
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  chevron: {
    fontSize: 18,
    color: '#CBD5E1',
  },
  logoutBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
});
