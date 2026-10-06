/**
 * Seed script to populate dose_logs for the last 14 days
 * Run with: node scripts/seedDoseLogs.js
 * 
 * This script creates dose log entries for demo purposes,
 * consistent with the Adherence Calendar and Insights screens.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');
require('dotenv').config({ path: '.env' });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Patient ID for demo
const PATIENT_ID = 'usr-patient-1';

// Medicine IDs from seed data
const MEDICINE_IDS = ['med-1', 'med-2'];

// Reminder times for each medicine (from seed data)
const MEDICINE_TIMES = {
  'med-1': ['8:00 AM', '1:00 PM', '7:00 PM'], // Paracetamol XL2
  'med-2': ['9:00 AM', '2:00 PM'], // Blood pressure tablet
};

// Generate dose logs for the last 14 days
async function seedDoseLogs() {
  console.log('Starting dose log seeding...');
  
  // Clear existing dose logs for this patient first
  console.log('Clearing existing dose logs...');
  const existingQuery = query(collection(db, 'dose_logs'), where('patientId', '==', PATIENT_ID));
  const existingSnapshot = await getDocs(existingQuery);
  
  for (const docSnapshot of existingSnapshot.docs) {
    await deleteDoc(doc(db, 'dose_logs', docSnapshot.id));
  }
  console.log(`Cleared ${existingSnapshot.docs.length} existing dose logs.`);
  
  // Generate dates for the last 14 days
  const today = new Date();
  const dates = [];
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  // Adherence pattern: mostly Taken, some Missed on specific days
  // This matches the Adherence Calendar showing ~86% adherence
  const missedDates = [
    2, // 2 days ago
    5, // 5 days ago
    9, // 9 days ago
  ];
  
  let totalLogs = 0;
  let takenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;
  
  for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
    const date = dates[dateIndex];
    const dateKey = formatDateKey(date);
    const isMissedDay = missedDates.includes(dateIndex);
    
    console.log(`Processing ${dateKey} (day ${dateIndex + 1} of 14)...`);
    
    for (const medicineId of MEDICINE_IDS) {
      const times = MEDICINE_TIMES[medicineId];
      
      for (const time of times) {
        let status = 'Taken';
        
        // Apply missed pattern
        if (isMissedDay && Math.random() > 0.5) {
          status = 'Missed';
        } else if (Math.random() > 0.95) {
          // Rare skip
          status = 'Skipped';
        }
        
        const doseLog = {
          patientId: PATIENT_ID,
          medicineId: medicineId,
          time: time,
          date: dateKey, // YYYY-MM-DD format
          status: status,
          createdAt: new Date(),
        };
        
        try {
          await addDoc(collection(db, 'dose_logs'), doseLog);
          totalLogs++;
          
          if (status === 'Taken') takenCount++;
          else if (status === 'Missed') missedCount++;
          else if (status === 'Skipped') skippedCount++;
          
        } catch (error) {
          console.error(`Error adding dose log for ${dateKey} ${time}:`, error);
        }
      }
    }
  }
  
  console.log('\n=== Seeding Complete ===');
  console.log(`Total dose logs created: ${totalLogs}`);
  console.log(`Taken: ${takenCount} (${Math.round(takenCount / totalLogs * 100)}%)`);
  console.log(`Missed: ${missedCount} (${Math.round(missedCount / totalLogs * 100)}%)`);
  console.log(`Skipped: ${skippedCount} (${Math.round(skippedCount / totalLogs * 100)}%)`);
  console.log(`Adherence rate: ${Math.round(takenCount / totalLogs * 100)}%`);
}

// Helper to format date as YYYY-MM-DD
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Run the script
seedDoseLogs()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
