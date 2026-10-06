/**
 * SEED PROFESSIONAL ACCOUNTS FOR MEDICARE+
 * 
 * This script prints the exact Firebase Auth users and Firestore documents
 * that need to be created manually in the Firebase Console.
 * 
 * Firebase Console does not allow creating Auth users from client code for security reasons.
 * You must create these users manually in Firebase Console → Authentication → Users
 * 
 * INSTRUCTIONS:
 * 1. Go to Firebase Console → Authentication → Users
 * 2. Click "Add user" for each account below
 * 3. Copy the User UID after creation
 * 4. Go to Firestore Database → users
 * 5. Add a document with Document ID = the User UID
 * 6. Paste the fields exactly as shown below
 */

const professionals = [
  {
    role: 'doctor',
    name: 'Dr. K. Silva',
    email: 'dr.silva@hospital.lk',
    password: 'Test@1234',
    firestoreFields: {
      role: 'doctor',
      name: 'Dr. K. Silva',
      email: 'dr.silva@hospital.lk',
      slmcNumber: '12345',
      phone: '07xxxxxxxx',
      specialty: 'General Practitioner',
      hospital: 'City General Hospital',
    },
  },
  {
    role: 'nurse',
    name: 'Nurse Dilani',
    email: 'dilani@careteam.lk',
    password: 'Test@1234',
    firestoreFields: {
      role: 'nurse',
      name: 'Nurse Dilani',
      email: 'dilani@careteam.lk',
      nurseId: 'N-2041',
      phone: '07xxxxxxxx',
      workplace: 'City General Hospital',
      ward: 'Ward 3A',
    },
  },
  {
    role: 'pharmacist',
    name: 'Mr. Jayasuriya',
    email: 'jayasuriya@pharmacy.lk',
    password: 'Test@1234',
    firestoreFields: {
      role: 'pharmacist',
      name: 'Mr. Jayasuriya',
      email: 'jayasuriya@pharmacy.lk',
      pharmacyName: 'City Pharmacy',
      pharmacyRegNo: 'PH-778',
      phone: '07xxxxxxxx',
      address: '123 Main Street, Colombo',
    },
  },
  {
    role: 'pharmacist',
    name: 'Ms. Perera',
    email: 'perera@pharmacy.lk',
    password: 'Test@1234',
    firestoreFields: {
      role: 'pharmacist',
      name: 'Ms. Perera',
      email: 'perera@pharmacy.lk',
      pharmacyName: 'Care Pharmacy',
      pharmacyRegNo: 'PH-779',
      phone: '07xxxxxxxx',
      address: '456 Hospital Road, Colombo',
    },
  },
];

console.log('=== MEDICARE+ PROFESSIONAL ACCOUNTS ===\n');
console.log('Create these users in Firebase Console → Authentication → Users\n');

professionals.forEach((prof, index) => {
  console.log(`--- ${index + 1}. ${prof.role.toUpperCase()}: ${prof.name} ---`);
  console.log(`Email: ${prof.email}`);
  console.log(`Password: ${prof.password}`);
  console.log(`\nAfter creating the user, copy the User UID and create a Firestore document:`);
  console.log(`Firestore Database → users → Add document (Document ID = User UID)`);
  console.log('\nFields:');
  console.log(JSON.stringify(prof.firestoreFields, null, 2));
  console.log('\n');
});

console.log('=== CAREGIVER LINK INSTRUCTIONS ===');
console.log('To link a caregiver to a patient:');
console.log('1. Copy the Patient UID from Firebase Console → Authentication → Users');
console.log('2. Go to Firestore → users → caregiver document');
console.log('3. Add field: patientId = <Patient UID>');
console.log('\n=== END ===');
