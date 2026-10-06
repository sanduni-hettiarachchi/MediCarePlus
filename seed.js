/**
 * MEDICARE+ SEED SCRIPT
 * 
 * This script populates Firebase with test data for development.
 * 
 * PREREQUISITES:
 * 1. Download service account key from Firebase Console → Service accounts → Keys
 * 2. Save as serviceAccountKey.json in the project root
 * 3. Run: npm install firebase-admin --save-dev
 * 4. Run: node seed.js
 * 
 * IMPORTANT: After running, delete serviceAccountKey.json and add to .gitignore
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'medicare-plus-144d4',
});

const auth = admin.auth();
const db = admin.firestore();

const testAccounts = [
  {
    email: 'mrs.perera@medicare.test',
    password: 'Test@1234',
    role: 'patient',
    displayName: 'Mrs. Perera',
    firestoreFields: {
      role: 'patient',
      name: 'Mrs. Perera',
      email: 'mrs.perera@medicare.test',
      age: 72,
      gender: 'Female',
      phone: '0771234567',
      address: '123 Temple Road, Colombo',
      emergencyContact: '0777654321 (Son)',
      language: 'en',
      largeText: false,
      highContrast: false,
      voiceReminders: true,
    },
  },
  {
    email: 'kumari@medicare.test',
    password: 'Test@1234',
    role: 'caregiver',
    displayName: 'Kumari',
    firestoreFields: {
      role: 'caregiver',
      name: 'Kumari',
      email: 'kumari@medicare.test',
      relationship: 'Daughter',
      phone: '0779876543',
      patientId: null, // Will be set after patient creation
    },
  },
  {
    email: 'dr.silva@hospital.lk',
    password: 'Test@1234',
    role: 'doctor',
    displayName: 'Dr. K. Silva',
    firestoreFields: {
      role: 'doctor',
      name: 'Dr. K. Silva',
      email: 'dr.silva@hospital.lk',
      slmcNumber: '12345',
      phone: '0772345678',
      specialty: 'General Practitioner',
      hospital: 'City General Hospital',
    },
  },
  {
    email: 'dilani@careteam.lk',
    password: 'Test@1234',
    role: 'nurse',
    displayName: 'Nurse Dilani',
    firestoreFields: {
      role: 'nurse',
      name: 'Nurse Dilani',
      email: 'dilani@careteam.lk',
      nurseId: 'N-2041',
      phone: '0773456789',
      workplace: 'City General Hospital',
      ward: 'Ward 3A',
    },
  },
  {
    email: 'jayasuriya@pharmacy.lk',
    password: 'Test@1234',
    role: 'pharmacist',
    displayName: 'Mr. Jayasuriya',
    firestoreFields: {
      role: 'pharmacist',
      name: 'Mr. Jayasuriya',
      email: 'jayasuriya@pharmacy.lk',
      pharmacyName: 'City Pharmacy',
      pharmacyRegNo: 'PH-778',
      phone: '0774567890',
      address: '123 Main Street, Colombo',
    },
  },
  {
    email: 'perera@pharmacy.lk',
    password: 'Test@1234',
    role: 'pharmacist',
    displayName: 'Ms. Perera',
    firestoreFields: {
      role: 'pharmacist',
      name: 'Ms. Perera',
      email: 'perera@pharmacy.lk',
      pharmacyName: 'Care Pharmacy',
      pharmacyRegNo: 'PH-779',
      phone: '0775678901',
      address: '456 Hospital Road, Colombo',
    },
  },
];

async function createAuthUser(email, password, displayName) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });
    console.log(`✓ Created Auth user: ${email} (UID: ${userRecord.uid})`);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`- Auth user already exists: ${email}`);
      const user = await auth.getUserByEmail(email);
      return user;
    }
    throw error;
  }
}

async function seed() {
  console.log('🌱 Starting MediCare+ seed...\n');

  const createdUsers = {};

  // Step 1: Create Auth users and Firestore user documents
  for (const account of testAccounts) {
    const authUser = await createAuthUser(account.email, account.password, account.displayName);
    createdUsers[account.email] = authUser;

    await db.collection('users').doc(authUser.uid).set({
      ...account.firestoreFields,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`✓ Created Firestore user document: ${account.role}\n`);
  }

  const patientId = createdUsers['mrs.perera@medicare.test'].uid;
  const caregiverId = createdUsers['kumari@medicare.test'].uid;
  const doctorId = createdUsers['dr.silva@hospital.lk'].uid;
  const nurseId = createdUsers['dilani@careteam.lk'].uid;
  const pharmacist1Id = createdUsers['jayasuriya@pharmacy.lk'].uid;

  // Link caregiver to patient
  await db.collection('users').doc(caregiverId).update({ patientId });
  console.log('✓ Linked caregiver to patient\n');

  // Step 2: Create medicines
  const medicines = [
    { id: 'med-1', name: 'Amlodipine 5mg', dose: '1 tablet', mealInstruction: 'After breakfast', time: '08:00', stockDays: 25, refillStatus: 'OK', active: true },
    { id: 'med-2', name: 'Metformin 500mg', dose: '2 tablets', mealInstruction: 'After lunch', time: '13:00', stockDays: 5, refillStatus: 'Refill soon', active: true },
    { id: 'med-3', name: 'Insulin Glargine', dose: '10 units', mealInstruction: 'Before dinner', time: '19:00', stockDays: 2, refillStatus: 'Refill now', active: true },
  ];

  for (const med of medicines) {
    await db.collection('medicines').doc(med.id).set({
      ...med,
      patientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Created ${medicines.length} medicines\n`);

  // Step 3: Create reminder_times
  for (const med of medicines) {
    await db.collection('reminder_times').doc(`rem-${med.id}`).set({
      medicineId: med.id,
      patientId,
      time: med.time,
      enabled: true,
    });
  }
  console.log(`✓ Created ${medicines.length} reminder_times\n`);

  // Step 4: Create dose_logs (sample data)
  const today = new Date();
  const doseLogs = [
    { medicineId: 'med-1', status: 'Taken', timestamp: new Date(today.setHours(8, 0, 0, 0)) },
    { medicineId: 'med-2', status: 'Taken', timestamp: new Date(today.setHours(13, 0, 0, 0)) },
    { medicineId: 'med-3', status: 'Skipped', timestamp: new Date(today.setHours(19, 0, 0, 0)) },
  ];

  for (const log of doseLogs) {
    await db.collection('dose_logs').add({
      ...log,
      patientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Created ${doseLogs.length} dose_logs\n`);

  // Step 5: Create consents
  const consents = [
    { id: `${patientId}_doctor`, patientId, granteeId: doctorId, granteeRole: 'doctor', scope: 'doctor', status: 'Active', expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    { id: `${patientId}_pharmacist`, patientId, granteeId: pharmacist1Id, granteeRole: 'pharmacist', scope: 'pharmacist', status: 'Active', expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
  ];

  for (const consent of consents) {
    await db.collection('consents').doc(consent.id).set({
      ...consent,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Created ${consents.length} consents\n`);

  // Step 6: Create alerts
  await db.collection('alerts').add({
    patientId,
    type: 'missed_dose',
    message: 'Missed insulin dose at 19:00',
    handled: false,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✓ Created 1 alert\n');

  // Step 7: Create refill_requests
  await db.collection('refill_requests').add({
    medicineId: 'med-3',
    medicineName: 'Insulin Glargine',
    patientId,
    status: 'requested',
    requestedBy: 'patient',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✓ Created 1 refill_request\n');

  // Step 8: Create care_notes
  await db.collection('care_notes').add({
    patientId,
    authorId: nurseId,
    authorRole: 'nurse',
    note: 'Patient reported mild dizziness after morning medication.',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    reviewed: false,
  });
  console.log('✓ Created 1 care_note\n');

  // Step 9: Create prescriptions
  await db.collection('prescriptions').add({
    patientId,
    addedBy: doctorId,
    addedByRole: 'doctor',
    status: 'active',
    doctorName: 'Dr. K. Silva',
    medicines: ['Amlodipine 5mg', 'Metformin 500mg'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✓ Created 1 prescription\n');

  console.log('✅ SEED DONE.');
  console.log(`📋 patientId = ${patientId}`);
  console.log('\n🔐 Test Accounts:');
  console.log('Patient: mrs.perera@medicare.test / Test@1234');
  console.log('Caregiver: kumari@medicare.test / Test@1234');
  console.log('Doctor: dr.silva@hospital.lk (SLMC 12345) / Test@1234');
  console.log('Nurse: dilani@careteam.lk (N-2041) / Test@1234');
  console.log('Pharmacist: jayasuriya@pharmacy.lk (PH-778) / Test@1234');
  console.log('\n⚠️  IMPORTANT: Delete serviceAccountKey.json after verification!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
