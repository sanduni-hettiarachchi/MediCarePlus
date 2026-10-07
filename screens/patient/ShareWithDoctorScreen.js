import React, { useEffect, useState } from 'react';
import { Clipboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Button from '../../components/Button';
import BottomSheetConfirmation from '../../components/BottomSheetConfirmation';
import Header from '../../components/Header';
import PatientText from '../../components/PatientText';
import UndoSnackbar from '../../components/UndoSnackbar';
import dbService from '../../services/db';
import { useT } from '../../i18n/LanguageContext';

export default function ShareWithDoctorScreen({ navigation, currentUser }) {
  const t = useT();
  const [consentRecord, setConsentRecord] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(30 * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [scope, setScope] = useState('doctor');
  const [showRevokeSheet, setShowRevokeSheet] = useState(false);
  const [undoConsent, setUndoConsent] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const patientId = currentUser?.id || 'usr-patient-1';
  const patientName = currentUser?.name || 'Mrs. Perera';

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const setupTimer = (consentObj) => {
      if (intervalId) clearInterval(intervalId);
      const expiry = consentObj?.expiresAt?.toMillis?.() || Number(consentObj?.expiresAt);
      
      intervalId = setInterval(async () => {
        const currentNow = Date.now();
        const newRemaining = Math.max(0, Math.floor((expiry - currentNow) / 1000));
        if (mounted) {
          setTimeLeftSeconds(newRemaining);
          if (newRemaining <= 0) {
            setIsExpired(true);
            if (intervalId) clearInterval(intervalId);
            // Automatically regenerate fresh access code
            try {
              const fresh = await dbService.generateAccessCode(patientId, scope);
              if (mounted && fresh) {
                setAccessCode(fresh.code);
                setConsentRecord({ accessCode: fresh.code, expiresAt: fresh.expiresAt, patientId, scope });
                setIsExpired(false);
                setupTimer({ accessCode: fresh.code, expiresAt: fresh.expiresAt });
              }
            } catch (err) {
              console.warn('[ShareWithDoctorScreen] Regeneration error:', err);
            }
          }
        }
      }, 1000);
    };

    const loadConsent = async () => {
      const generated = await dbService.generateAccessCode(patientId, scope);
      if (!mounted) return;

      const now = Date.now();
      const expiry = generated.expiresAt;
      setAccessCode(generated.code);
      setConsentRecord({ accessCode: generated.code, expiresAt: expiry, patientId, scope });
      const remainingSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeftSeconds(remainingSeconds);
      setIsExpired(remainingSeconds === 0);

      setupTimer({ accessCode: generated.code, expiresAt: expiry });
    };

    loadConsent().catch((err) => {
      console.warn('[ShareWithDoctorScreen] loadConsent error:', err);
      if (mounted) setConsentRecord(null);
    });

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [patientId, patientName, scope]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(accessCode);
      setSnackbarMessage('Code copied to clipboard');
      setTimeout(() => setSnackbarMessage(''), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!consentRecord) return;
    const revoked = await dbService.removeConsent(consentRecord.id);
    setUndoConsent(revoked);
    setConsentRecord(null);
    setSnackbarMessage(t('accessRevoked'));
    setShowRevokeSheet(false);
  };

  const handleUndoRevoke = async () => {
    if (!undoConsent) return;
    await dbService.restoreConsent(undoConsent);
    setConsentRecord(undoConsent);
    setUndoConsent(null);
    setSnackbarMessage('');
  };

  const handleSnackbarDismiss = () => {
    setSnackbarMessage('');
    setUndoConsent(null);
    if (!consentRecord) navigation?.goBack();
  };

  const qrPayload = JSON.stringify({
    accessCode: consentRecord?.accessCode || accessCode,
    patientId,
    patientName,
    scope,
    expiresAt: consentRecord?.expiresAt?.toMillis?.() || consentRecord?.expiresAt,
  });

  return (
    <View style={styles.container}>
      <Header
        title={t('shareWithProfessional')}
        subtitle={t('shareSubtitle')}
        onBack={() => navigation?.goBack()}
      />

      <View style={styles.content}>
        <View style={styles.scopeSwitch}>
          {[{ key: 'doctor', label: t('doctor') }, { key: 'pharmacist', label: t('pharmacist') }].map((option) => (
            <TouchableOpacity key={option.key} style={[styles.scopeOption, scope === option.key && styles.selectedScopeOption]} onPress={() => { setConsentRecord(null); setScope(option.key); }}>
              <PatientText style={[styles.scopeOptionText, scope === option.key && styles.selectedScopeOptionText]}>{option.label}</PatientText>
            </TouchableOpacity>
          ))}
        </View>
        {/* Real QR Code SVG Box */}
        <View style={[styles.qrCard, isExpired && styles.qrCardDisabled]}>
          <View style={styles.qrWrapper}>
            {isExpired ? (
              <View style={styles.expiredOverlay}>
                <PatientText style={styles.expiredText}>Expired</PatientText>
              </View>
            ) : null}
            <QRCode
              value={consentRecord ? qrPayload : 'Loading access code'}
              size={180}
              color={isExpired ? '#CBD5E1' : '#0F172A'}
              backgroundColor="#FFFFFF"
            />
          </View>

          <View style={[styles.timerBadge, isExpired && styles.timerBadgeExpired]}>
            <PatientText style={styles.timerIcon}>⏱️</PatientText>
            <PatientText style={styles.timerText}>{isExpired ? 'Expired' : formatTime(timeLeftSeconds)}</PatientText>
          </View>

          <View style={styles.codeSection}>
            <PatientText style={styles.codeLabel}>Or give this code</PatientText>
            <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode} disabled={isExpired}>
              <PatientText style={[styles.codeText, isExpired && styles.codeTextDisabled]}>{accessCode || 'Loading...'}</PatientText>
              <PatientText style={styles.copyIcon}>📋</PatientText>
            </TouchableOpacity>
          </View>
        </View>

        <PatientText style={styles.instructionText}>
          {t(scope === 'doctor' ? 'shareDoctorInstruction' : 'sharePharmacistInstruction')}
        </PatientText>

        <Button
          title={t('revokeAccess')}
          style={styles.revokeBtn}
          textStyle={styles.revokeBtnText}
          onPress={() => setShowRevokeSheet(true)}
          disabled={isExpired}
        />
      </View>
      <BottomSheetConfirmation visible={showRevokeSheet} title={t('revokeConfirmTitle')} message={t('revokeConfirmMessage')} confirmLabel={t('revokeAccess')} cancelLabel={t('cancel')} onConfirm={handleConfirmRevoke} onCancel={() => setShowRevokeSheet(false)} />
      <UndoSnackbar message={snackbarMessage} onUndo={handleUndoRevoke} onDismiss={handleSnackbarDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeSwitch: {
    flexDirection: 'row',
    width: '100%',
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  scopeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  selectedScopeOption: {
    backgroundColor: '#0B7666',
  },
  scopeOptionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  selectedScopeOptionText: {
    color: '#FFFFFF',
  },
  qrCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    width: '100%',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  timerBadgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  codeSection: {
    width: '100%',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 2,
    marginRight: 12,
  },
  codeTextDisabled: {
    color: '#CBD5E1',
  },
  copyIcon: {
    fontSize: 20,
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  expiredText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
  },
  qrCardDisabled: {
    opacity: 0.6,
  },
  instructionText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 28,
  },
  revokeBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  revokeBtnText: {
    color: '#EF4444',
  },
});
