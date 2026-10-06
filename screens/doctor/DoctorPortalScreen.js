import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/Button';

export default function DoctorPortalScreen() {
  const [stage, setStage] = useState('login');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [patientToken, setPatientToken] = useState('');
  const [action, setAction] = useState(null);
  const [saved, setSaved] = useState(false);

  if (stage === 'login') {
    return <PortalShell><Text style={styles.eyebrow}>MEDICARE+ DOCTOR PORTAL</Text><Text style={styles.title}>Doctor sign in</Text><Text style={styles.subtitle}>Use your verified professional account to access a patient who has shared their QR code.</Text><TextInput style={styles.input} placeholder="Doctor email" placeholderTextColor="#9AA8A0" /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9AA8A0" secureTextEntry /><TextInput style={styles.input} placeholder="SLMC registration number" placeholderTextColor="#9AA8A0" value={registrationNumber} onChangeText={setRegistrationNumber} /><Text style={styles.helper}>Your SLMC number identifies the doctor responsible for prescriptions and notes. It is stored with every finalized record.</Text><Button title="Sign in securely" onPress={() => registrationNumber.trim() && setStage('access')} /><Text style={styles.portalNote}>Doctors cannot create patients. The patient must share access from their MediCare+ app.</Text></PortalShell>;
  }

  if (stage === 'access') {
    return <PortalShell><Text style={styles.eyebrow}>PATIENT ACCESS</Text><Text style={styles.title}>Open patient record</Text><Text style={styles.subtitle}>Scan the QR shown by the patient, or enter the temporary access code.</Text><TouchableOpacity style={styles.qrBox} onPress={() => setStage('summary')}><Text style={styles.qrIcon}>▦</Text><Text style={styles.qrText}>Scan patient QR</Text></TouchableOpacity><TextInput style={styles.input} placeholder="Temporary access code" placeholderTextColor="#9AA8A0" value={patientToken} onChangeText={setPatientToken} /><Button title="Open shared record" onPress={() => setStage('summary')} /><Button title="Sign out" variant="text" onPress={() => setStage('login')} /></PortalShell>;
  }

  if (stage === 'summary') {
    return <PortalShell><Text style={styles.eyebrow}>AUTHORIZED PATIENT</Text><Text style={styles.title}>Mrs. Maya Perera</Text><Text style={styles.subtitle}>Access expires in 30 minutes · Read-only history</Text><View style={styles.summaryCard}><Text style={styles.cardTitle}>Patient summary</Text><Text style={styles.body}>Age · 58   BMI · 24.2</Text><Text style={styles.body}>Conditions · Diabetes, Hypertension</Text><Text style={styles.body}>Allergies · None recorded</Text><Text style={styles.body}>Current adherence · 86%</Text></View><View style={styles.summaryCard}><Text style={styles.cardTitle}>Previous treatment history</Text><Text style={styles.body}>Dr. Silva · Metformin · Jan 2026</Text><Text style={styles.body}>Dr. Fernando · Aspirin · Jul 2026</Text><Text style={styles.body}>Recent missed doses · 2 this week</Text></View><View style={styles.summaryCard}><Text style={styles.cardTitle}>Tests and upcoming care</Text><Text style={styles.body}>HbA1c · Due in 5 days</Text><Text style={styles.body}>Blood pressure review · 15 Oct 2026</Text><Text style={styles.body}>Eye examination · 30 Mar 2027</Text></View><Button title="Add prescription" onPress={() => { setAction('prescription'); setSaved(false); }} /><Button title="Add doctor note" onPress={() => { setAction('note'); setSaved(false); }} /><Button title="Add health plan item" variant="secondary" onPress={() => { setAction('plan'); setSaved(false); }} /><Button title="Close patient record" variant="text" onPress={() => setStage('access')} />{action && <DoctorAction action={action} saved={saved} onSave={() => setSaved(true)} onClose={() => setAction(null)} />}</PortalShell>;
  }

  return null;
}

function DoctorAction({ action, saved, onSave, onClose }) {
  const labels = { prescription: 'New prescription', note: 'New doctor note', plan: 'New health plan item' };
  const [photoName, setPhotoName] = useState('');
  async function choosePhoto() {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!result.canceled) setPhotoName(result.assets[0].fileName || 'Prescription photo selected');
  }
  return <View style={styles.actionCard}><Text style={styles.cardTitle}>{labels[action]}</Text>{action === 'prescription' && <><TextInput style={styles.input} placeholder="Medicine name" placeholderTextColor="#9AA8A0" /><TextInput style={styles.input} placeholder="Dose and frequency" placeholderTextColor="#9AA8A0" /><Button title={photoName || 'Choose prescription photo'} variant="secondary" onPress={choosePhoto} /><Text style={styles.helper}>Verify the handwritten image and enter the medicine details manually before saving.</Text><TextInput style={styles.input} placeholder="SLMC registration number" placeholderTextColor="#9AA8A0" /></>}{action === 'note' && <TextInput multiline style={styles.largeInput} placeholder="Clinical observation or recommendation" placeholderTextColor="#9AA8A0" />}{action === 'plan' && <><TextInput style={styles.input} placeholder="Upcoming test or checkup" placeholderTextColor="#9AA8A0" /><TextInput style={styles.input} placeholder="Due date" placeholderTextColor="#9AA8A0" /></>}{saved ? <View style={styles.saved}><Text style={styles.savedTitle}>Saved to patient record</Text><Text style={styles.savedText}>This entry is attributed to the signed-in doctor and cannot be edited by the patient.</Text></View> : <Button title="Finalize and save" onPress={onSave} />}<Button title="Cancel" variant="text" onPress={onClose} /></View>;
}

function PortalShell({ children }) {
  return <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: '#F5F7F2', padding: 22 },
  eyebrow: { color: '#1D8062', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 12 },
  title: { color: '#173C35', fontSize: 29, fontWeight: '900', marginTop: 7 },
  subtitle: { color: '#6B7B72', lineHeight: 20, marginTop: 7, marginBottom: 20 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 10, padding: 13, color: '#173C35', marginBottom: 10 },
  largeInput: { minHeight: 130, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7E3D9', borderRadius: 10, padding: 13, color: '#173C35', textAlignVertical: 'top', marginBottom: 12 },
  helper: { color: '#6B7B72', fontSize: 11, lineHeight: 17, marginBottom: 15 },
  portalNote: { backgroundColor: '#FFF1E9', borderRadius: 12, padding: 13, color: '#8B5428', fontSize: 11, lineHeight: 17 },
  qrBox: { height: 190, backgroundColor: '#173C35', borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  qrIcon: { color: '#B7D8BF', fontSize: 75 },
  qrText: { color: '#FFFFFF', fontWeight: '900', marginTop: 7 },
  summaryCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1E9E1', borderRadius: 14, padding: 16, marginBottom: 11 },
  cardTitle: { color: '#173C35', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  body: { color: '#52665C', lineHeight: 22 },
  actionCard: { backgroundColor: '#E4F0E5', borderRadius: 15, padding: 16, marginTop: 8 },
  saved: { backgroundColor: '#D9ECDD', borderRadius: 10, padding: 12, marginBottom: 10 },
  savedTitle: { color: '#1D8062', fontWeight: '900' },
  savedText: { color: '#527166', fontSize: 11, lineHeight: 17, marginTop: 4 },
});
