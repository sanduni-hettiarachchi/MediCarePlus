// Firestore & AsyncStorage Real-Time Service for MediCare+
// Shared tables: users, medicines, reminder_times, dose_logs, care_links, alerts, refill_requests, care_notes, refill_summary, access_codes, grants, notifications, access_logs
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseServices } from '../firebase/firebaseConfig';

const ASYNC_STORAGE_KEY = '@medicare_plus_db_v3';

const initialSeedData = {
  users: [
    {
      id: 'usr-patient-1',
      name: 'Mrs. Perera',
      email: 'maya.perera@email.com',
      phone: '+94 77 123 4567',
      role: 'patient',
      password: 'password123',
      gender: 'Female',
      age: '58 years',
      language: 'en',
      largeText: false,
      highContrast: false,
      voiceReminders: true,
    },
    {
      id: 'usr-caregiver-1',
      name: 'Kumari (Daughter)',
      email: 'kumari@email.com',
      phone: '+94 77 987 6543',
      role: 'caregiver',
      password: 'password123',
      patientId: 'usr-patient-1',
    },
    {
      id: 'usr-doctor-1',
      name: 'Dr. K. Silva',
      email: 'dr.silva@hospital.lk',
      phone: '+94 71 234 5678',
      role: 'doctor',
      password: 'password123',
      slmcNumber: '12345',
    },
    {
      id: 'usr-nurse-1',
      name: 'Nurse Dilani',
      email: 'dilani@careteam.lk',
      phone: '+94 76 345 6789',
      role: 'nurse',
      password: 'password123',
      nurseId: 'N-2041',
    },
    {
      id: 'usr-pharmacist-1',
      name: 'Mr. Jayasuriya',
      email: 'jayasuriya@pharmacy.lk',
      phone: '+94 75 456 7890',
      role: 'pharmacist',
      password: 'password123',
      pharmacyRegNo: 'PH-778',
    },
  ],
  medicines: [
    {
      id: 'med-1',
      patientId: 'usr-patient-1',
      name: 'Paracetamol XL2',
      dose: '500 mg',
      mealInstruction: 'After breakfast',
      notes: 'Avoid if fever below 100°F',
      stockDays: 12,
      active: true,
      refillStatus: 'OK',
    },
    {
      id: 'med-2',
      patientId: 'usr-patient-1',
      name: 'Blood pressure tablet',
      dose: '1 tablet',
      mealInstruction: 'After lunch',
      notes: 'Take with full glass of water',
      stockDays: 3,
      active: true,
      refillStatus: 'Refill now',
    },
    {
      id: 'med-3',
      patientId: 'usr-patient-1',
      name: 'DPP-4 Inhibitors',
      dose: '100 mg',
      mealInstruction: 'After dinner',
      notes: 'Take after daily meal',
      stockDays: 5,
      active: true,
      refillStatus: 'Refill soon',
    },
    {
      id: 'med-4',
      patientId: 'usr-patient-1',
      name: 'Atorvastatin',
      dose: '10 mg',
      mealInstruction: 'Before bedtime',
      notes: 'Take at night',
      stockDays: 0,
      active: true,
      refillStatus: 'Out of stock',
    },
  ],
  reminder_times: [
    { id: 'rt-1', medicineId: 'med-1', timeStr: '8:00 AM' },
    { id: 'rt-2', medicineId: 'med-2', timeStr: '1:00 PM' },
    { id: 'rt-3', medicineId: 'med-3', timeStr: '7:00 PM' },
    { id: 'rt-4', medicineId: 'med-4', timeStr: '9:00 PM' },
  ],
  dose_logs: [
    {
      id: 'dl-1',
      medicineId: 'med-1',
      patientId: 'usr-patient-1',
      medicineName: 'Paracetamol XL2',
      dose: '500 mg',
      time: '9:00 AM',
      date: 'Today',
      status: 'Taken',
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'dl-2',
      medicineId: 'med-2',
      patientId: 'usr-patient-1',
      medicineName: 'Blood pressure tablet',
      dose: '1 tablet',
      time: '1:00 PM',
      date: 'Today',
      status: 'Pending',
      timestamp: Date.now(),
    },
    {
      id: 'dl-3',
      medicineId: 'med-3',
      patientId: 'usr-patient-1',
      medicineName: 'DPP-4 Inhibitors',
      dose: '100 mg',
      time: '7:00 PM',
      date: 'Today',
      status: 'Upcoming',
      timestamp: Date.now() + 18000000,
    },
  ],
  care_links: [
    {
      id: 'link-usr-patient-1_usr-caregiver-1',
      patientId: 'usr-patient-1',
      memberId: 'usr-caregiver-1',
      memberName: 'Kumari (Daughter)',
      role: 'caregiver',
      status: 'Active',
      permissions: { viewSchedule: true, viewAdherence: true, receiveAlerts: true, editSchedule: false, viewCareNotes: true, addNotes: false, contact: true },
      createdAt: Date.now() - 86400000,
    },
  ],
  alerts: [
    {
      id: 'alt-1',
      patientId: 'usr-patient-1',
      type: 'missed_dose',
      message: 'Missed 1:00 PM Blood pressure tablet',
      handled: false,
      timestamp: Date.now() - 3600000,
    },
  ],
  refill_requests: [
    {
      id: 'rr-1',
      medicineId: 'med-2',
      patientId: 'usr-patient-1',
      status: 'requested',
      timestamp: Date.now() - 86400000,
    },
  ],
  care_notes: [
    {
      id: 'cn-1',
      patientId: 'usr-patient-1',
      authorId: 'usr-caregiver-1',
      authorRole: 'caregiver',
      text: 'She skips the afternoon dose when visitors come.',
      visibleToPatient: true,
      createdAt: Date.now() - 14400000,
      editedAt: null,
    },
  ],
  access_codes: [],
  grants: [],
  access_logs: [],
  refill_summary: [
    {
      id: 'rs-med-1',
      patientId: 'usr-patient-1',
      medicineId: 'med-1',
      name: 'Paracetamol XL2',
      dose: '500 mg',
      stockDays: 12,
      status: 'OK',
      updatedAt: Date.now(),
    },
    {
      id: 'rs-med-2',
      patientId: 'usr-patient-1',
      medicineId: 'med-2',
      name: 'Blood pressure tablet',
      dose: '1 tablet',
      stockDays: 3,
      status: 'Refill now',
      updatedAt: Date.now(),
    },
    {
      id: 'rs-med-3',
      patientId: 'usr-patient-1',
      medicineId: 'med-3',
      name: 'DPP-4 Inhibitors',
      dose: '100 mg',
      stockDays: 5,
      status: 'Refill soon',
      updatedAt: Date.now(),
    },
    {
      id: 'rs-med-4',
      patientId: 'usr-patient-1',
      medicineId: 'med-4',
      name: 'Atorvastatin',
      dose: '10 mg',
      stockDays: 0,
      status: 'Out of stock',
      updatedAt: Date.now(),
    },
  ],
};

let localCache = JSON.parse(JSON.stringify(initialSeedData));

const persistLocalCache = async () => {
  try {
    if (AsyncStorage && AsyncStorage.setItem) {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(localCache));
    }
  } catch (err) {
    console.warn('[DB] AsyncStorage save warning:', err);
  }
};

const loadLocalCache = async () => {
  try {
    if (AsyncStorage && AsyncStorage.getItem) {
      const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (stored) {
        localCache = JSON.parse(stored);
      }
    }
  } catch (err) {
    console.warn('[DB] AsyncStorage load warning:', err);
  }
};

loadLocalCache();

const getFirestoreDb = () => {
  try {
    const { db } = getFirebaseServices();
    return db;
  } catch (e) {
    return null;
  }
};

const getFirebaseAuth = () => {
  try {
    const { auth } = getFirebaseServices();
    return auth;
  } catch (e) {
    return null;
  }
};

export const dbService = {
  // FIREBASE AUTH & USER PROFILE STORE
  async signInFirebase(email, password, role) {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const firestoreDb = getFirestoreDb();
        if (firestoreDb) {
          const profileSnapshot = await getDoc(doc(firestoreDb, 'users', userCred.user.uid));
          if (profileSnapshot.exists()) {
            return { id: userCred.user.uid, ...profileSnapshot.data() };
          }
        }
        const userDoc = this.getUserById(userCred.user.uid) || this.findUserByCredentials(email, password, role);
        return userDoc ? { ...userDoc, id: userCred.user.uid } : { id: userCred.user.uid, email, role };
      } catch (err) {
        if (err.code === 'auth/network-request-failed') {
          return this.findUserByCredentials(email, password, role);
        }
        throw err;
      }
    }
    return this.findUserByCredentials(email, password, role);
  },

  async signInProfessionalFirebase(email, password) {
    const { auth, db } = getFirebaseServices();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profileSnapshot = await getDoc(doc(db, 'users', credential.user.uid));
    if (!profileSnapshot.exists()) {
      throw new Error('Professional account profile not found. Contact your administrator.');
    }
    return { id: credential.user.uid, ...profileSnapshot.data() };
  },

  async signUpFirebase(userData) {
    if (userData.role !== 'patient' && userData.role !== 'caregiver') {
      throw new Error('Only patient and caregiver accounts can be created here.');
    }
    const auth = getFirebaseAuth();
    let userId = `usr-${Date.now()}`;
    if (auth) {
      const userCred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      userId = userCred.user.uid;
    }
    const newUser = {
      id: userId,
      language: 'en',
      largeText: false,
      highContrast: false,
      voiceReminders: true,
      ...userData,
      role: userData.role,
    };
    localCache.users.push(newUser);
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb && auth) {
      await setDoc(doc(firestoreDb, 'users', userId), newUser);
    }
    return newUser;
  },

  async signOutFirebase() {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {}
    }
  },

  // USERS
  getUsers() {
    return localCache.users;
  },
  getUserById(id) {
    return localCache.users.find((u) => u.id === id) || null;
  },
  findUserByCredentials(emailOrPhone, password, role) {
    return localCache.users.find((u) => {
      const matchIdentity = u.email === emailOrPhone || u.phone === emailOrPhone;
      const matchPass = u.password === password;
      const matchRole = role ? u.role === role : true;
      return matchIdentity && matchPass && matchRole;
    }) || null;
  },
  createUser(userData) {
    const newUser = {
      id: userData.id || `usr-${Date.now()}`,
      language: 'en',
      largeText: false,
      highContrast: false,
      voiceReminders: true,
      ...userData,
    };
    localCache.users.push(newUser);
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'users', newUser.id), newUser).catch((e) =>
        console.warn('Firestore sync user error:', e)
      );
    }
    return newUser;
  },
  updateUser(id, updates) {
    const idx = localCache.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      localCache.users[idx] = { ...localCache.users[idx], ...updates };
      persistLocalCache();

      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        updateDoc(doc(firestoreDb, 'users', id), updates).catch((e) =>
          console.warn('Firestore update user error:', e)
        );
      }
      return localCache.users[idx];
    }
    return null;
  },

  updateCareNote(id, updates) {
    const idx = localCache.care_notes.findIndex((cn) => cn.id === id);
    if (idx !== -1) {
      localCache.care_notes[idx] = { ...localCache.care_notes[idx], ...updates, editedAt: Date.now() };
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        updateDoc(doc(firestoreDb, 'care_notes', id), {
          ...updates,
          editedAt: serverTimestamp(),
        });
      }
    }
  },

  deleteCareNote(id) {
    const idx = localCache.care_notes.findIndex((cn) => cn.id === id);
    if (idx !== -1) {
      localCache.care_notes.splice(idx, 1);
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        deleteDoc(doc(firestoreDb, 'care_notes', id));
      }
    }
  },

  // MEDICINES & REMINDER TIMES
  getMedicines(patientId = 'usr-patient-1') {
    return localCache.medicines.filter((m) => m.patientId === patientId && !m.deleted);
  },
  getMedicineById(id) {
    return localCache.medicines.find((m) => m.id === id && !m.deleted) || null;
  },
  getReminderTimes(medicineId) {
    return localCache.reminder_times.filter((rt) => rt.medicineId === medicineId);
  },
  addMedicine(medData, timesList = []) {
    const medId = `med-${Date.now()}`;
    const patientId = medData.patientId || 'usr-patient-1';
    const newMed = {
      id: medId,
      patientId,
      stockDays: 30,
      active: true,
      refillStatus: 'OK',
      deleted: false,
      deletedAt: null,
      ...medData,
    };
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) newMed.firestoreId = doc(collection(firestoreDb, 'medicines')).id;
    
    // Create reminder time entries
    const timeEntries = timesList.map((timeStr, idx) => ({
      id: `rt-${Date.now()}-${idx}`,
      medicineId: medId,
      timeStr,
    }));

    // Add to local cache
    localCache.medicines.push(newMed);
    timeEntries.forEach((te) => localCache.reminder_times.push(te));
    persistLocalCache();

    // Sync to refill_summary
    this.syncRefillSummary(newMed);

    // Save to Firestore with transaction if available
    if (firestoreDb) {
      return runTransaction(firestoreDb, async (transaction) => {
        transaction.set(doc(firestoreDb, 'medicines', newMed.firestoreId), newMed);
        timeEntries.forEach((te) => {
          const timeDocRef = doc(collection(firestoreDb, 'reminder_times'));
          transaction.set(timeDocRef, te);
        });
      }).then(() => ({ medicine: newMed, times: timeEntries }))
        .catch((e) => {
          console.warn('Firestore transaction error:', e);
          // Rollback local cache on error
          localCache.medicines = localCache.medicines.filter((m) => m.id !== medId);
          localCache.reminder_times = localCache.reminder_times.filter((rt) => rt.medicineId !== medId);
          persistLocalCache();
          throw e;
        });
    }
    
    return { medicine: newMed, times: timeEntries };
  },
  async updateMedicine(id, updates, timesList = null) {
    const idx = localCache.medicines.findIndex((m) => m.id === id);
    if (idx !== -1) {
      localCache.medicines[idx] = { ...localCache.medicines[idx], ...updates };
      if (timesList !== null) {
        localCache.reminder_times = localCache.reminder_times.filter((rt) => rt.medicineId !== id);
        timesList.forEach((timeStr, i) => {
          localCache.reminder_times.push({
            id: `rt-${Date.now()}-${i}`,
            medicineId: id,
            timeStr,
          });
        });
      }
      persistLocalCache();
      
      // Sync to refill_summary
      await this.syncRefillSummary(localCache.medicines[idx]);
      
      return localCache.medicines[idx];
    }
    return null;
  },
  async deleteMedicine(id) {
    const deletedMed = localCache.medicines.find((m) => m.id === id);
    const deletedTimes = localCache.reminder_times.filter((rt) => rt.medicineId === id);
    if (!deletedMed) return { medicine: null, times: deletedTimes };
    deletedMed.deleted = true;
    deletedMed.deletedAt = Date.now();

    persistLocalCache();
    
    // Delete from refill_summary
    await this.deleteRefillSummary(id);
    
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      updateDoc(doc(firestoreDb, 'medicines', deletedMed.firestoreId || deletedMed.id), {
        deleted: true,
        deletedAt: serverTimestamp(),
      }).catch((e) => console.warn('Firestore soft-delete medicine error:', e));
    }
    return { medicine: { ...deletedMed, deleted: false, deletedAt: null }, times: deletedTimes };
  },
  restoreMedicine(medicine, times = []) {
    if (medicine) {
      const restored = { ...medicine, deleted: false, deletedAt: null };
      const index = localCache.medicines.findIndex((item) => item.id === medicine.id);
      if (index < 0) localCache.medicines.push(restored);
      else localCache.medicines[index] = restored;
      if (times.length) {
        localCache.reminder_times = localCache.reminder_times.filter((time) => time.medicineId !== medicine.id);
        times.forEach((time) => localCache.reminder_times.push(time));
      }
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        updateDoc(doc(firestoreDb, 'medicines', medicine.firestoreId || medicine.id), {
          deleted: false,
          deletedAt: null,
        }).catch((e) => console.warn('Firestore restore medicine error:', e));
      }
    }
  },

  // DOSE LOGS
  getDoseLogs(patientId = 'usr-patient-1') {
    return localCache.dose_logs.filter((dl) => dl.patientId === patientId);
  },
  addDoseLog(logData) {
    const newLog = {
      id: `dl-${Date.now()}`,
      patientId: 'usr-patient-1',
      timestamp: Date.now(),
      ...logData,
    };
    localCache.dose_logs.push(newLog);
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'dose_logs', newLog.id), newLog).catch((e) =>
        console.warn('Firestore add dose_log error:', e)
      );
    }
    return newLog;
  },
  updateDoseLog(id, status) {
    const index = localCache.dose_logs.findIndex((log) => log.id === id);
    if (index < 0) return null;
    localCache.dose_logs[index] = { ...localCache.dose_logs[index], status, timestamp: Date.now() };
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      updateDoc(doc(firestoreDb, 'dose_logs', localCache.dose_logs[index].firestoreId || id), {
        status,
        timestamp: Date.now(),
      }).catch((error) => console.warn('Firestore update dose log error:', error));
    }
    return localCache.dose_logs[index];
  },

  // REAL-TIME FIRESTORE LISTENERS FOR LIVE MULTI-PHONE UPDATES
  subscribeToDoseLogs(patientId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'dose_logs'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        localCache.dose_logs = localCache.dose_logs
          .filter((log) => log.patientId !== patientId)
          .concat(logs);
        callback(logs);
      }, onError);
    }
    callback(this.getDoseLogs(patientId));
    return () => {};
  },
  subscribeToMedicines(patientId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'medicines'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map((item) => ({ id: item.data().id || item.id, firestoreId: item.id, ...item.data() }));
        localCache.medicines = localCache.medicines.filter((medicine) => medicine.patientId !== patientId).concat(records);
        callback(records.filter((medicine) => !medicine.deleted));
      }, onError);
    }
    callback(this.getMedicines(patientId));
    return () => {};
  },
  getAdherenceSummary(patientId, logs = this.getDoseLogs(patientId)) {
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter((log) => {
      const time = log.timestamp?.toMillis?.() || Number(log.timestamp);
      return !Number.isFinite(time) || time >= weekStart;
    });
    const taken = recentLogs.filter((log) => ['taken', 'completed'].includes(String(log.status).toLowerCase())).length;
    const missedLogs = recentLogs.filter((log) => ['missed', 'skipped'].includes(String(log.status).toLowerCase()));
    const total = taken + missedLogs.length;
    const missedCounts = new Map();
    const missedDetails = new Map();
    missedLogs.forEach((log) => {
      const medicine = log.medicineName || this.getMedicineById(log.medicineId)?.name || 'Medicine';
      missedCounts.set(medicine, (missedCounts.get(medicine) || 0) + 1);
      missedDetails.set(medicine, [...(missedDetails.get(medicine) || []), log]);
    });
    const mostMissed = [...missedCounts.entries()].sort((left, right) => right[1] - left[1])[0];
    const mostMissedLog = mostMissed ? missedDetails.get(mostMissed[0])?.[0] : null;
    const timeText = String(mostMissedLog?.time || '').toLowerCase();
    const hour = Number(timeText.match(/\d{1,2}/)?.[0] || 0);
    const isPm = timeText.includes('pm');
    const hour24 = isPm && hour < 12 ? hour + 12 : hour;
    const mostMissedTimeOfDay = mostMissedLog
      ? (hour24 >= 12 && hour24 < 17 ? 'afternoon' : hour24 >= 17 ? 'evening' : 'morning')
      : '—';
    return {
      adherence: total ? Math.round((taken / total) * 100) : 0,
      mostMissedMedicine: mostMissed?.[0] || '—',
      mostMissedCount: mostMissed?.[1] || 0,
      mostMissedTimeOfDay,
      missedLogs,
    };
  },

  async getDoseSnoozeCount(patientId, medicineId) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(
        collection(firestoreDb, 'dose_logs'),
        where('patientId', '==', patientId),
        where('medicineId', '==', medicineId),
        where('date', '==', 'Today')
      );
      const snapshot = await getDocs(q);
      const latest = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0))[0];
      return { snoozeCount: latest?.snoozeCount || 0, doseLogId: latest?.id || null };
    }
    const local = localCache.dose_logs.find((log) => log.patientId === patientId && log.medicineId === medicineId && log.date === 'Today');
    return { snoozeCount: local?.snoozeCount || 0, doseLogId: local?.id || null };
  },

  async recordDoseSnooze({ patientId, medicineId, medicine, time }) {
    const firestoreDb = getFirestoreDb();
    let doseLog = null;
    if (firestoreDb) {
      const current = await this.getDoseSnoozeCount(patientId, medicineId);
      const snoozeCount = current.snoozeCount + 1;
      if (current.doseLogId) {
        await updateDoc(doc(firestoreDb, 'dose_logs', current.doseLogId), {
          snoozeCount,
          date: 'Today',
          status: 'Pending',
          timestamp: Date.now(),
        });
        doseLog = { id: current.doseLogId, patientId, medicineId, medicine, time, date: 'Today', status: 'Pending', snoozeCount, timestamp: Date.now() };
      } else {
        const log = { patientId, medicineId, medicine, time, date: 'Today', status: 'Pending', snoozeCount, timestamp: Date.now() };
        const created = await addDoc(collection(firestoreDb, 'dose_logs'), log);
        doseLog = { id: created.id, ...log };
      }
      localCache.dose_logs = localCache.dose_logs.filter((log) => !(log.patientId === patientId && log.medicineId === medicineId && log.date === 'Today')).concat(doseLog);
      persistLocalCache();
      if (snoozeCount >= 2) {
        const alertExists = localCache.alerts.some((alert) => alert.patientId === patientId && alert.type === 'snooze_limit' && alert.medicine === medicine && alert.status === 'open');
        if (!alertExists) this.addAlert({ patientId, type: 'snooze_limit', medicine, status: 'open', createdAt: serverTimestamp(), message: `${medicine}: both snoozes used. The alert is staying on screen.` });
      }
      return { snoozeCount, doseLogId: doseLog.id };
    }

    const local = localCache.dose_logs.find((log) => log.patientId === patientId && log.medicineId === medicineId && log.date === 'Today');
    const snoozeCount = (local?.snoozeCount || 0) + 1;
    if (local) Object.assign(local, { snoozeCount, status: 'Pending' });
    else {
      doseLog = { id: `dl-${Date.now()}`, patientId, medicineId, medicine, time, date: 'Today', status: 'Pending', snoozeCount, timestamp: Date.now() };
      localCache.dose_logs.push(doseLog);
    }
    persistLocalCache();
    if (snoozeCount >= 2) this.addAlert({ patientId, type: 'snooze_limit', medicine, status: 'open', createdAt: Date.now(), message: `${medicine}: both snoozes used. The alert is staying on screen.` });
    return { snoozeCount, doseLogId: local?.id || doseLog?.id };
  },

  subscribeToAlerts(patientId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'alerts'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const alertsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        localCache.alerts = localCache.alerts.filter((alert) => alert.patientId !== patientId).concat(alertsList);
        callback(alertsList);
      }, onError);
    }
    callback(this.getAlerts(patientId));
    return () => {};
  },

  subscribeToRefillRequests(patientId, callback) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'refill_requests'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        localCache.refill_requests = localCache.refill_requests
          .filter((request) => request.patientId !== patientId)
          .concat(reqs);
        callback(reqs);
      });
    }
    callback(this.getRefillRequests(patientId));
    return () => {};
  },

  createPrescription(data) {
    const firestoreDb = getFirestoreDb();
    if (!firestoreDb) {
      throw new Error('Firebase is not configured. Cannot save the prescription.');
    }
    const documentData = { ...data, createdAt: serverTimestamp() };
    if (data.imageUrl?.startsWith('data:image/') && new TextEncoder().encode(JSON.stringify({ ...data, createdAt: null })).length > 1_000_000) {
      throw new Error('Prescription image and details exceed the 1 MB document limit. Choose a smaller image.');
    }
    return addDoc(collection(firestoreDb, 'prescriptions'), documentData);
  },
  subscribeToPrescriptions(patientId, status, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (!firestoreDb) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(firestoreDb, 'prescriptions'),
      where('patientId', '==', patientId),
      where('status', '==', status)
    );
    return onSnapshot(
      q,
      (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (error) => onError?.(error)
    );
  },

  // CARE_LINKS
  subscribeToCareLinks(patientId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'care_links'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        localCache.care_links = localCache.care_links.filter((item) => item.patientId !== patientId).concat(records);
        callback(records);
      }, onError);
    }
    callback(this.getCareLinks(patientId));
    return () => {};
  },
  getCareLinks(patientId = 'usr-patient-1') {
    return localCache.care_links.filter((c) => c.patientId === patientId);
  },
  getCareLinksForMember(memberId) {
    return localCache.care_links.filter((c) => c.memberId === memberId);
  },
  async addCareLink({ patientId, memberId, memberName, role, permissions = {}, status = 'Pending' }) {
    const id = `${patientId}_${memberId}`;
    const link = { id, patientId, memberId, memberName, role, status, permissions, createdAt: Date.now() };
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, 'care_links', id), {
        ...link,
        createdAt: serverTimestamp(),
      });
    }
    localCache.care_links = localCache.care_links.filter((c) => c.id !== id).concat(link);
    persistLocalCache();
    return link;
  },
  async findUserByEmail(email) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }
    return localCache.users.find((u) => u.email === email) || null;
  },
  async updateCareLink(id, updates) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await updateDoc(doc(firestoreDb, 'care_links', id), updates);
    }
    localCache.care_links = localCache.care_links.map((c) => c.id === id ? { ...c, ...updates } : c);
    persistLocalCache();
  },
  async removeCareLink(id) {
    const link = localCache.care_links.find((c) => c.id === id);
    localCache.care_links = localCache.care_links.filter((item) => item.id !== id);
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb && link) await deleteDoc(doc(firestoreDb, 'care_links', id));
    return link;
  },
  async restoreCareLink(link) {
    if (link) {
      localCache.care_links = localCache.care_links.filter((item) => item.id !== link.id).concat(link);
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, 'care_links', link.id), {
          ...link,
          createdAt: serverTimestamp(),
        });
      }
    }
  },

  // ALERTS
  getAlerts(patientId = 'usr-patient-1') {
    return localCache.alerts.filter((a) => a.patientId === patientId);
  },
  addAlert(alertData) {
    const newAlert = {
      id: `alt-${Date.now()}`,
      patientId: 'usr-patient-1',
      handled: false,
      timestamp: Date.now(),
      ...alertData,
    };
    localCache.alerts.push(newAlert);
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      addDoc(collection(firestoreDb, 'alerts'), newAlert).catch((e) =>
        console.warn('Firestore add alert error:', e)
      );
    }
    return newAlert;
  },
  async markAlertHandled(id, handledBy) {
    const idx = localCache.alerts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      localCache.alerts[idx] = {
        ...localCache.alerts[idx],
        handled: true,
        status: 'handled',
        ...(handledBy ? { handledBy } : {}),
        handledAt: Date.now(),
      };
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'alerts', id), {
          handled: true,
          status: 'handled',
          ...(handledBy ? { handledBy } : {}),
          handledAt: serverTimestamp(),
        });
      }
      return localCache.alerts[idx];
    }
    return null;
  },

  // ACCESS LOGS
  async addAccessLog({ patientId, granteeId, granteeRole, scope }) {
    const firestoreDb = getFirestoreDb();
    if (!firestoreDb) {
      console.warn('Firestore not available for access log');
      return null;
    }
    const logData = {
      patientId,
      granteeId,
      granteeRole,
      scope,
      scannedAt: serverTimestamp(),
    };
    const created = await addDoc(collection(firestoreDb, 'access_logs'), logData);
    return { id: created.id, ...logData };
  },

  // REFILL REQUESTS
  getRefillRequests(patientId = 'usr-patient-1') {
    return localCache.refill_requests.filter((r) => r.patientId === patientId);
  },
  createRefillRequest(medicineId) {
    const newReq = {
      id: `rr-${Date.now()}`,
      medicineId,
      patientId: 'usr-patient-1',
      status: 'requested',
      timestamp: Date.now(),
    };
    localCache.refill_requests.push(newReq);
    this.updateMedicine(medicineId, { refillStatus: 'Refill now' });
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      addDoc(collection(firestoreDb, 'refill_requests'), newReq).catch((e) =>
        console.warn('Firestore add refill request error:', e)
      );
    }
    return newReq;
  },
  async markRefilled(medicineId, pharmacist) {
    const firestoreDb = getFirestoreDb();
    const medicine = this.getMedicineById(medicineId);
    if (!medicine) return false;

    // Update medicine
    await this.updateMedicine(medicineId, { stockDays: 30, refillStatus: 'OK' });

    // Find or create refill request
    let existingRequest = localCache.refill_requests.find((rr) => rr.medicineId === medicineId);
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'refill_requests'), where('medicineId', '==', medicineId), where('status', 'in', ['requested', 'notified']));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        existingRequest = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    }

    const updateData = {
      status: 'refilled',
      refilledBy: pharmacist?.id || pharmacist?.pharmacyRegNo || 'unknown',
      refilledByName: pharmacist?.name || 'Unknown Pharmacist',
      pharmacyName: pharmacist?.pharmacyName || 'Unknown Pharmacy',
      refilledAt: serverTimestamp(),
    };

    if (existingRequest) {
      // Update existing request
      localCache.refill_requests = localCache.refill_requests.map((rr) =>
        rr.medicineId === medicineId ? { ...rr, ...updateData } : rr
      );
      persistLocalCache();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'refill_requests', existingRequest.id), updateData);
      }
    } else {
      // Create new request with status 'refilled'
      const newReq = {
        id: `rr-${Date.now()}`,
        medicineId,
        medicineName: medicine.name,
        patientId: medicine.patientId,
        status: 'refilled',
        requestedBy: 'pharmacist',
        ...updateData,
      };
      localCache.refill_requests.push(newReq);
      persistLocalCache();
      if (firestoreDb) {
        const created = await addDoc(collection(firestoreDb, 'refill_requests'), {
          ...newReq,
          refilledAt: serverTimestamp(),
        });
        newReq.id = created.id;
      }
    }
    return true;
  },

  // CARE NOTES
  getCareNotes(patientId = 'usr-patient-1') {
    return localCache.care_notes.filter((cn) => cn.patientId === patientId);
  },
  
  // NOTIFICATIONS
  getNotifications(userId) {
    return localCache.notifications.filter((n) => n.userId === userId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
  markNotificationAsRead(notificationId) {
    const idx = localCache.notifications.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      localCache.notifications[idx].read = true;
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        updateDoc(doc(firestoreDb, 'notifications', notificationId), { read: true }).catch((e) =>
          console.warn('Firestore mark notification read error:', e)
        );
      }
    }
  },
  subscribeToNotifications(userId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        localCache.notifications = localCache.notifications.filter((item) => item.userId !== userId).concat(records);
        callback(records);
      }, onError);
    }
    callback(this.getNotifications(userId));
    return () => {};
  },
  getPatientVisibleNotes(patientId = 'usr-patient-1') {
    return localCache.care_notes.filter((cn) => 
      cn.patientId === patientId && 
      cn.visibleToPatient === true
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
  addCareNote(noteData) {
    const newNote = {
      id: `cn-${Date.now()}`,
      patientId: noteData.patientId || 'usr-patient-1',
      authorId: noteData.authorId || this.getCurrentUser?.()?.id || 'unknown',
      authorRole: noteData.authorRole || 'nurse',
      text: noteData.text || noteData.note || '',
      visibleToPatient: noteData.visibleToPatient !== undefined ? noteData.visibleToPatient : false,
      createdAt: Date.now(),
      editedAt: null,
    };
    localCache.care_notes.push(newNote);
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      addDoc(collection(firestoreDb, 'care_notes'), {
        ...newNote,
        createdAt: serverTimestamp(),
      }).catch((e) =>
        console.warn('Firestore add care note error:', e)
      );
    }

    // Create notification if visible to patient
    if (newNote.visibleToPatient) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: newNote.patientId,
        patientId: newNote.patientId,
        type: 'care_note',
        title: 'New care note added',
        body: `${newNote.authorRole === 'nurse' ? 'Nurse' : 'Caregiver'} added a note for you`,
        read: false,
        createdBy: newNote.authorId,
        createdAt: Date.now(),
        relatedId: newNote.id,
      };
      localCache.notifications.push(notification);
      persistLocalCache();
      if (firestoreDb) {
        addDoc(collection(firestoreDb, 'notifications'), {
          ...notification,
          createdAt: serverTimestamp(),
        }).catch((e) => console.warn('Firestore add notification error:', e));
      }

      // Also create notifications for caregivers with viewCareNotes permission
      const careLinks = this.getCareLinks(newNote.patientId);
      careLinks.forEach((link) => {
        if (link.status === 'Active' && link.role === 'caregiver' && link.permissions?.viewCareNotes) {
          const caregiverNotification = {
            id: `notif-${Date.now()}-${link.memberId}`,
            userId: link.memberId,
            patientId: newNote.patientId,
            type: 'care_note',
            title: 'New care note added',
            body: `A new care note was added for your patient`,
            read: false,
            createdBy: newNote.authorId,
            createdAt: Date.now(),
            relatedId: newNote.id,
          };
          localCache.notifications.push(caregiverNotification);
          persistLocalCache();
          if (firestoreDb) {
            addDoc(collection(firestoreDb, 'notifications'), {
              ...caregiverNotification,
              createdAt: serverTimestamp(),
            }).catch((e) => console.warn('Firestore add caregiver notification error:', e));
          }
        }
      });
    }

    return newNote;
  },
  updateCareNote(id, updates) {
    const idx = localCache.care_notes.findIndex((cn) => cn.id === id);
    if (idx !== -1) {
      localCache.care_notes[idx] = { ...localCache.care_notes[idx], ...updates, editedAt: Date.now() };
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        updateDoc(doc(firestoreDb, 'care_notes', id), {
          ...updates,
          editedAt: serverTimestamp(),
        });
      }
      return localCache.care_notes[idx];
    }
    return null;
  },

  // ACCESS CODES
  async generateAccessCode(patientId, scope) {
    // Generate 8-character code without O/I/0/1
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      else code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Hash the code (requires expo-crypto, fallback to simple hash)
    let codeHash;
    try {
      const { CryptoDigestAlgorithm } = require('expo-crypto');
      const digest = await CryptoDigestAlgorithm.digestStringAsync(
        CryptoDigestAlgorithm.SHA256,
        code
      );
      codeHash = digest;
    } catch (e) {
      // Fallback simple hash if expo-crypto not available
      codeHash = btoa(code).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString(16);
    }
    
    const expiresAt = Date.now() + 1800000; // 30 minutes
    const accessCode = {
      id: codeHash,
      patientId,
      scope,
      status: 'Active',
      expiresAt,
      createdAt: Date.now(),
    };
    
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, 'access_codes', codeHash), {
        ...accessCode,
        expiresAt: Timestamp.fromMillis(expiresAt),
        createdAt: serverTimestamp(),
      });
    }
    localCache.access_codes = localCache.access_codes.filter((ac) => ac.id !== codeHash).concat(accessCode);
    persistLocalCache();
    
    return { code, codeHash, expiresAt };
  },
  async verifyAccessCode(code, userRole) {
    // Normalize code
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Hash the code
    let codeHash;
    try {
      const { CryptoDigestAlgorithm } = require('expo-crypto');
      const digest = await CryptoDigestAlgorithm.digestStringAsync(
        CryptoDigestAlgorithm.SHA256,
        normalizedCode
      );
      codeHash = digest;
    } catch (e) {
      codeHash = btoa(normalizedCode).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString(16);
    }
    
    const accessCode = localCache.access_codes.find((ac) => ac.id === codeHash);
    const firestoreDb = getFirestoreDb();
    if (firestoreDb && !accessCode) {
      const snapshot = await getDoc(doc(firestoreDb, 'access_codes', codeHash));
      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          valid: data.status === 'Active' && Date.now() < (data.expiresAt?.toMillis?.() || Number(data.expiresAt)),
          accessCode: { id: snapshot.id, ...data },
          reason: data.status !== 'Active' ? 'revoked' : Date.now() >= (data.expiresAt?.toMillis?.() || Number(data.expiresAt)) ? 'expired' : null,
        };
      }
    }
    
    if (!accessCode) return { valid: false, reason: 'not_found' };
    if (accessCode.status !== 'Active') return { valid: false, reason: 'revoked', accessCode };
    if (Date.now() > accessCode.expiresAt) return { valid: false, reason: 'expired', accessCode };
    if (accessCode.scope !== userRole) return { valid: false, reason: 'scope_mismatch', accessCode };
    
    return { valid: true, accessCode };
  },
  async revokeAccessCode(codeHash) {
    localCache.access_codes = localCache.access_codes.map((ac) => 
      ac.id === codeHash ? { ...ac, status: 'Revoked' } : ac
    );
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await updateDoc(doc(firestoreDb, 'access_codes', codeHash), { status: 'Revoked' });
    }
    // Also revoke all grants for this code
    const grantsToRevoke = localCache.grants.filter((g) => g.codeHash === codeHash);
    for (const grant of grantsToRevoke) {
      await this.revokeGrant(grant.id);
    }
  },

  // GRANTS
  async createGrant(patientId, granteeId, granteeRole, scope, codeHash) {
    const id = `${patientId}_${granteeId}`;
    const expiresAt = Date.now() + 1800000; // 30 minutes
    const grant = {
      id,
      patientId,
      granteeId,
      granteeRole,
      scope,
      status: 'Active',
      codeHash,
      expiresAt,
      createdAt: Date.now(),
    };
    
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, 'grants', id), {
        ...grant,
        expiresAt: Timestamp.fromMillis(expiresAt),
        createdAt: serverTimestamp(),
      });
    }
    localCache.grants = localCache.grants.filter((g) => g.id !== id).concat(grant);
    persistLocalCache();
    
    return grant;
  },
  async getGrantsForGrantee(granteeId) {
    return localCache.grants.filter((g) => g.granteeId === granteeId && g.status === 'Active');
  },
  async revokeGrant(grantId) {
    localCache.grants = localCache.grants.map((g) => 
      g.id === grantId ? { ...g, status: 'Revoked' } : g
    );
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await updateDoc(doc(firestoreDb, 'grants', grantId), { status: 'Revoked' });
    }
  },
  async addAccessLog(patientId, granteeId, granteeRole, scope) {
    const log = {
      id: `al-${Date.now()}`,
      patientId,
      granteeId,
      granteeRole,
      scope,
      scannedAt: Date.now(),
    };
    
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await addDoc(collection(firestoreDb, 'access_logs'), {
        ...log,
        scannedAt: serverTimestamp(),
      });
    }
    localCache.access_logs.push(log);
    persistLocalCache();
    
    return log;
  },

  // REFILL SUMMARY
  getRefillSummary(patientId = 'usr-patient-1') {
    return localCache.refill_summary.filter((rs) => rs.patientId === patientId);
  },
  subscribeToRefillSummary(patientId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'refill_summary'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        localCache.refill_summary = localCache.refill_summary.filter((item) => item.patientId !== patientId).concat(records);
        callback(records);
      }, onError);
    }
    callback(this.getRefillSummary(patientId));
    return () => {};
  },
  async syncRefillSummary(medicine) {
    const summaryId = `rs-${medicine.id}`;
    const summary = {
      id: summaryId,
      patientId: medicine.patientId,
      medicineId: medicine.id,
      name: medicine.name,
      dose: medicine.dose,
      stockDays: medicine.stockDays || 0,
      status: medicine.refillStatus || 'OK',
      updatedAt: Date.now(),
    };
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, 'refill_summary', summaryId), {
        ...summary,
        updatedAt: serverTimestamp(),
      });
    }
    localCache.refill_summary = localCache.refill_summary.filter((rs) => rs.id !== summaryId).concat(summary);
    persistLocalCache();
  },
  async deleteRefillSummary(medicineId) {
    const summaryId = `rs-${medicineId}`;
    localCache.refill_summary = localCache.refill_summary.filter((rs) => rs.id !== summaryId);
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await deleteDoc(doc(firestoreDb, 'refill_summary', summaryId));
    }
  },
  async markRefilled(medicineId, pharmacistId, pharmacistName) {
    const summaryId = `rs-${medicineId}`;
    const summary = localCache.refill_summary.find((rs) => rs.id === summaryId);
    if (summary) {
      const updates = {
        stockDays: 30,
        status: 'OK',
        refilledBy: pharmacistId,
        refilledByName: pharmacistName,
        refilledAt: Date.now(),
        updatedAt: Date.now(),
      };
      localCache.refill_summary = localCache.refill_summary.map((rs) => rs.id === summaryId ? { ...rs, ...updates } : rs);
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'refill_summary', summaryId), {
          ...updates,
          refilledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  },
};

export default dbService;
