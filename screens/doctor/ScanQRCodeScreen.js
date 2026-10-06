import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import authService from '../../services/authService';
import Button from '../../components/Button';
import ClinicianTopBar from '../../components/ClinicianTopBar';
import dbService from '../../services/db';

export default function ScanQRCodeScreen({ navigation, route }) {
  const doctor = route?.params?.doctor || { name: 'Dr. K. Silva', slmcNumber: '12345', role: 'doctor' };
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [scopeMismatch, setScopeMismatch] = useState(false);
  const [otherScope, setOtherScope] = useState('doctor');

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    let parsedQrCode = data;
    let qrExpiresAt = null;

    try {
      if (data.startsWith('{')) {
        const obj = JSON.parse(data);
        parsedQrCode = obj.qrCode || data;
        qrExpiresAt = obj.expiresAt;
      }
    } catch (e) {
      // String format
    }

    const verification = await dbService.verifyConsentQR(parsedQrCode, doctor.role);

    if (verification.reason === 'scope_mismatch') {
      setOtherScope(verification.consent?.scope || (doctor.role === 'doctor' ? 'pharmacist' : 'doctor'));
      setScopeMismatch(true);
      return;
    }

    if (verification.consent && verification.consent.status === 'Revoked') {
      setIsRevoked(true);
      return;
    }

    if (verification.reason === 'expired' || (qrExpiresAt && Date.now() > qrExpiresAt)) {
      setIsExpired(true);
      return;
    }

    // Log the access to access_logs collection
    await dbService.addAccessLog({
      patientId: verification.consent.patientId,
      granteeId: doctor.id || doctor.slmcNumber || 'unknown',
      granteeRole: doctor.role,
      scope: doctor.role === 'pharmacist' ? 'pharmacist' : 'doctor',
    });

    navigation?.navigate('AccessGranted', {
      doctor,
      patientId: verification.consent.patientId,
      patientName: verification.consent.patientName || 'Mrs. Perera',
    });
  };

  const handleManualSubmit = () => {
    setShowManualModal(false);
    handleBarcodeScanned({ data: manualCode || 'PATIENT-PERERA-QR-DOC' });
  };

  return (
    <View style={styles.container}>
      <ClinicianTopBar
        title={doctor.role === 'pharmacist' ? 'Pharmacist' : 'Scan QR Code'}
        subtitle={doctor.name || 'Dr. K. Silva'}
        onProfilePress={() =>
          doctor.role === 'pharmacist'
            ? navigation?.navigate('PharmacistProfile', { pharmacist: doctor })
            : navigation?.navigate('DoctorProfile', { doctor })
        }
        onLogoutPress={() => authService.logout(navigation)}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Scan patient QR code</Text>
        <Text style={styles.subtitle}>Align the QR code within the frame</Text>

        {!permission?.granted ? (
          <View style={styles.permCard}>
            <Text style={styles.permText}>Camera permission is required to scan QR codes.</Text>
            <Button title="Grant Camera Permission" onPress={requestPermission} />
          </View>
        ) : (
          <View style={styles.cameraFrame}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        )}

        {scanned && (
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}

        <Button
          title="Enter code manually"
          variant="outline"
          onPress={() => setShowManualModal(true)}
          style={styles.manualBtn}
        />
      </View>

      {/* Manual Code Modal */}
      <Modal visible={showManualModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Access Code</Text>
            <Text style={styles.modalSub}>Type the 6-digit access code from patient app</Text>

            <TextInput
              style={styles.input}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. PATIENT-PERERA-QR-DOC"
            />

            <Button title="Verify and Access" onPress={handleManualSubmit} style={styles.modalSubmitBtn} />
            <Button title="Cancel" variant="outline" onPress={() => setShowManualModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Expired QR Error Sheet (UI-04) */}
      <Modal visible={isExpired} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.expiredSheet}>
            <View style={styles.expiredIconCircle}>
              <Text style={styles.expiredIcon}>⌛</Text>
            </View>
            <Text style={styles.expiredTitle}>QR code expired</Text>
            <Text style={styles.expiredMessage}>
              This code ran out after 30 minutes. Ask the patient to show a new one.
            </Text>

            <Button
              title="Scan again"
              onPress={() => {
                setIsExpired(false);
                setScanned(false);
              }}
              style={styles.scanAgainBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Access Revoked Sheet */}
      <Modal visible={isRevoked} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.expiredSheet}>
            <View style={[styles.expiredIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.expiredIcon, { color: '#DC2626' }]}>🚫</Text>
            </View>
            <Text style={styles.expiredTitle}>Access revoked</Text>
            <Text style={styles.expiredMessage}>
              The patient has revoked access for this QR code. Please ask the patient to generate a new access code.
            </Text>

            <Button
              title="Scan again"
              onPress={() => {
                setIsRevoked(false);
                setScanned(false);
              }}
              style={styles.scanAgainBtn}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={scopeMismatch} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.expiredSheet}>
            <Text style={styles.expiredMessage}>This code was shared with a {otherScope}.</Text>
            <Button title="Scan again" onPress={() => { setScopeMismatch(false); setScanned(false); }} style={styles.scanAgainBtn} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  permCard: {
    width: 240,
    height: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  cameraFrame: {
    width: 240,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0D8F7A',
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0D8F7A',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0D8F7A',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0D8F7A',
  },
  rescanBtn: {
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  rescanText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  manualBtn: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  modalSubmitBtn: {
    marginBottom: 8,
  },
  expiredSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  expiredIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  expiredIcon: {
    fontSize: 28,
  },
  expiredTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  expiredMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanAgainBtn: {
    width: '100%',
  },
});
