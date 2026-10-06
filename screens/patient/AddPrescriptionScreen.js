import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { getFirebaseServices } from '../../firebase/firebaseConfig';
import dbService from '../../services/db';

const todayString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

async function prepareImage(uri, width, quality = 0.5) {
  const actions = width > 800 ? [{ resize: { width: 800 } }] : [];
  return ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
}

async function savePrescriptionImage(image, patientId) {
  const prepared = await prepareImage(image.uri, image.width);
  try {
    const { storage } = getFirebaseServices();
    const response = await fetch(prepared.uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `prescriptions/${patientId}/${Date.now()}.jpg`);
    await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
    return await getDownloadURL(imageRef);
  } catch (error) {
    let fallback = prepared;
    if (!fallback.base64 || fallback.base64.length > 900_000) {
      fallback = await prepareImage(image.uri, image.width, 0.25);
    }
    if (!fallback.base64 || fallback.base64.length > 900_000) {
      throw new Error('Image is too large to store. Choose a smaller image.');
    }
    return `data:image/jpeg;base64,${fallback.base64}`;
  }
}

export default function AddPrescriptionScreen({ navigation, currentUser }) {
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState(todayString());
  const [medicines, setMedicines] = useState(['']);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const chooseImage = async (source) => {
    const picker = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await picker({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    try {
      const prepared = await prepareImage(asset.uri, asset.width);
      setImage({ uri: prepared.uri, width: prepared.width });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Could not prepare the selected image.');
    }
  };

  const handleSave = async () => {
    const cleanMedicines = medicines.map((line) => line.trim()).filter(Boolean);
    if (cleanMedicines.length === 0 && !image) {
      setErrorMessage('Add at least one medicine or attach an image.');
      return;
    }
    const patientId = currentUser?.role === 'patient' ? currentUser.id : currentUser?.patientId;
    if (!patientId || !currentUser?.id) {
      setErrorMessage('Could not identify the patient or signed-in user.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const imageUrl = image ? await savePrescriptionImage(image, patientId) : null;
      await dbService.createPrescription({
        patientId,
        // DEVIATION (not in PDF): creator UID and role are stored for auditability.
        addedBy: currentUser.id,
        addedByRole: currentUser.role,
        doctorName: doctorName.trim(),
        date: date.trim(),
        medicines: cleanMedicines,
        notes: notes.trim(),
        imageUrl,
        status: 'active',
      });
      navigation?.navigate('MyPrescriptions', { prescriptionAdded: true });
    } catch (error) {
      setErrorMessage(error.message || 'Could not save the prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add prescription" onBack={() => navigation?.navigate('MyPrescriptions')} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>DOCTOR NAME</Text>
          <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} placeholder="Doctor name" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>DATE</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>MEDICINES</Text>
          {/* DEVIATION (not in PDF): medicines are entered as editable text-box lines. */}
          {medicines.map((medicine, index) => (
            <View key={index} style={styles.medicineRow}>
              <TextInput
                style={[styles.input, styles.medicineInput]}
                value={medicine}
                onChangeText={(value) => setMedicines((current) => current.map((line, lineIndex) => lineIndex === index ? value : line))}
                placeholder="Paracetamol XL2 500mg (when needed for fever)"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setMedicines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                accessibilityLabel="Remove medicine line"
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addLineButton} onPress={() => setMedicines((current) => [...current, ''])}>
            <Text style={styles.addLineText}>+ Add another medicine</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            multiline
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>IMAGE (OPTIONAL)</Text>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageButton} onPress={() => chooseImage('camera')}>
              <Text style={styles.imageButtonText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={() => chooseImage('gallery')}>
              <Text style={styles.imageButtonText}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
          {image ? (
            <View style={styles.previewRow}>
              <Image source={{ uri: image.uri }} style={styles.thumbnail} />
              <TouchableOpacity onPress={() => setImage(null)} accessibilityLabel="Remove image">
                <Text style={styles.removeImageText}>Remove image</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Button title={saving ? 'Saving...' : 'Save prescription'} onPress={handleSave} disabled={saving} style={styles.saveButton} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  errorText: { color: '#C0392B', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0F172A', backgroundColor: '#F8FAFC' },
  medicineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  medicineInput: { flex: 1 },
  removeButton: { paddingHorizontal: 14, paddingVertical: 8 },
  removeButtonText: { color: '#C0392B', fontSize: 24, fontWeight: '700' },
  addLineButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  addLineText: { color: '#0D8F7A', fontSize: 14, fontWeight: '700' },
  notesInput: { minHeight: 88, textAlignVertical: 'top' },
  imageActions: { flexDirection: 'row', gap: 10 },
  imageButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#0D8F7A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  imageButtonText: { color: '#0D8F7A', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  thumbnail: { width: 88, height: 88, borderRadius: 8, marginRight: 12 },
  removeImageText: { color: '#C0392B', fontWeight: '700' },
  saveButton: { marginTop: 4 },
});
