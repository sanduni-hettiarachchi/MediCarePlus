import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import LiveAccessibilityPreviewCard from '../../components/LiveAccessibilityPreviewCard';
import dbService from '../../services/db';
import { useT } from '../../i18n/LanguageContext';
import Text from '../../components/PatientText';

export default function AccessibilityDisplayScreen({
  navigation,
  userPreferences = {},
  currentUser,
  onSavePreferences,
}) {
  const t = useT();
  const [largeText, setLargeText] = useState(userPreferences.largeText || false);
  const [highContrast, setHighContrast] = useState(userPreferences.highContrast || false);
  const [voiceReminders, setVoiceReminders] = useState(
    userPreferences.voiceReminders !== false
  );
  const [language, setLanguage] = useState(userPreferences.language || 'en');

  const handleSave = () => {
    dbService.updateUser(currentUser?.id, {
      largeText,
      highContrast,
      voiceReminders,
      language,
    });

    if (onSavePreferences) {
      onSavePreferences({
        largeText,
        highContrast,
        voiceReminders,
        language,
      });
    }

    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('accessibilityTitle')}
        subtitle={t('customizeAppearance')}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Live Preview Card (UI-02 / UI-05) */}
        <LiveAccessibilityPreviewCard
          isLargeText={largeText}
          isHighContrast={highContrast}
          language={language}
        />

        {/* Display Settings Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{t('display')}</Text>

          <View style={styles.toggleRow}>
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>{t('largeTextMode')}</Text>
              <Text style={styles.rowSub}>{t('enlargeContent')}</Text>
            </View>
            <Switch
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ false: '#CBD5E1', true: '#0B7666' }}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>{t('highContrastMode')}</Text>
              <Text style={styles.rowSub}>{t('maximumLegibility')}</Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: '#CBD5E1', true: '#0B7666' }}
            />
          </View>
        </View>

        {/* Reminders Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{t('reminders')}</Text>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>{t('voiceReminders')}</Text>
              <Text style={styles.rowSub}>{t('spokenAlerts')}</Text>
            </View>
            <Switch
              value={voiceReminders}
              onValueChange={setVoiceReminders}
              trackColor={{ false: '#CBD5E1', true: '#0B7666' }}
            />
          </View>
        </View>

        {/* Language Section (UI-01) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{t('reminderLanguage')}</Text>

          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'si' && styles.selectedLangBtn]}
              onPress={() => setLanguage('si')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === 'si' && styles.selectedLangBtnText,
                ]}
              >
                සිංහල
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.selectedLangBtn]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === 'en' && styles.selectedLangBtnText,
                ]}
              >
                {t('english')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button title={t('savePreferences')} onPress={handleSave} style={styles.saveBtn} />
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
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  textCol: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedLangBtn: {
    backgroundColor: '#0B7666',
    borderColor: '#0B7666',
  },
  langBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  selectedLangBtnText: {
    color: '#FFFFFF',
  },
  saveBtn: {
    marginTop: 10,
  },
});
