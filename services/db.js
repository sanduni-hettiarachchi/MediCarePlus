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
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseServices } from '../firebase/firebaseConfig';

const ASYNC_STORAGE_KEY = '@medicare_plus_db_v3';

const initialSeedData = {
  users: [],
  medicines: [],
  reminder_times: [],
  dose_logs: [],
  care_links: [],
  alerts: [],
  refill_requests: [],
  care_notes: [],
  refill_summary: [],
  access_codes: [],
  grants: [],
  notifications: [],
  access_logs: [],
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

// Build a consistent user object with Firebase uid as id and uid
const buildCurrentUser = (firebaseUser, profileDoc = {}) => {
  const uid = firebaseUser?.uid || firebaseUser?.id;
  if (!uid) {
    console.warn('[buildCurrentUser] No uid provided');
    return null;
  }
  // Spread profile first, then set id and uid to ensure Firebase uid is never overwritten
  return {
    ...profileDoc,
    id: uid,
    uid: uid,
  };
};

export { buildCurrentUser };

export function getActivePatientId(currentUser) {
  if (!currentUser) return null;
  if (currentUser.role === 'patient' || !currentUser.role) {
    return currentUser.id;
  }
  if (currentUser.role === 'caregiver') {
    if (currentUser.patientId) return currentUser.patientId;
    const activeLink = localCache.care_links?.find(
      (c) => c.memberId === currentUser.id && c.status === 'Active'
    );
    if (activeLink?.patientId) return activeLink.patientId;
    return currentUser.patientId || currentUser.id;
  }
  return currentUser.id;
}

export const dbService = {
  getFirestoreDb() {
    return getFirestoreDb();
  },

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
    return buildCurrentUser(credential.user, profileSnapshot.data());
  },

  async signUpFirebase(userData) {
    const validRoles = ['patient', 'caregiver', 'nurse', 'doctor', 'pharmacist'];
    const role = userData.role || 'patient';
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role '${role}'.`);
    }
    const auth = getFirebaseAuth();
    let userId = `usr-${role}-${Date.now()}`;
    if (auth) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        userId = userCred.user.uid;
      } catch (err) {
        if (err.code !== 'auth/network-request-failed' && err.code !== 'auth/email-already-in-use') {
          throw err;
        }
      }
    }
    const newUser = {
      id: userId,
      language: 'en',
      largeText: false,
      highContrast: false,
      voiceReminders: true,
      ...userData,
      role,
    };
    // Remove undefined values to avoid writing them to Firestore
    Object.keys(newUser).forEach(key => {
      if (newUser[key] === undefined) {
        delete newUser[key];
      }
    });
    localCache.users = localCache.users.filter((u) => u.id !== userId && u.email !== userData.email).concat(newUser);
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'users', userId), newUser);
      } catch (err) {
        console.warn('[DB] signUpFirebase firestore error:', err);
      }
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
  async getUserProfileById(id) {
    if (!id) return null;
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const snapshot = await getDoc(doc(firestoreDb, 'users', id));
      if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    }
    return this.getUserById(id);
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
  async updateUser(id, updates) {
    const idx = localCache.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      localCache.users[idx] = { ...localCache.users[idx], ...updates };
      persistLocalCache();

      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'users', id), updates);
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
  getMedicines(patientId) {
    if (!patientId) return [];
    return localCache.medicines.filter((m) => m.patientId === patientId);
  },
  getMedicineById(id) {
    return localCache.medicines.find((m) => m.id === id && !m.deleted) || null;
  },
  getReminderTimes(medicineId) {
    return localCache.reminder_times.filter((rt) => rt.medicineId === medicineId);
  },
  addMedicine(medData, timesList = [], options = {}) {
    const medId = `med-${Date.now()}`;
    const patientId = medData.patientId;
    if (!patientId) {
      throw new Error('patientId is required to add medicine');
    }
    console.log('[dbService.addMedicine] Adding medicine:', medId, 'patientId:', patientId);

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
    const firestoreDb = options.localOnly ? null : getFirestoreDb();
    if (firestoreDb) newMed.firestoreId = doc(collection(firestoreDb, 'medicines')).id;

    // Create one reminder_times document per time, with enabled: true, patientId, medicineId, time
    const timeEntries = timesList.map((timeStr, idx) => ({
      id: `rt-${Date.now()}-${idx}`,
      medicineId: medId,
      patientId,
      time: timeStr,
      timeStr,
      enabled: true,
      createdAt: Date.now(),
    }));
    console.log('[dbService.addMedicine] Creating', timeEntries.length, 'reminder_times for medicine:', medId);

    // Add to local cache
    localCache.medicines.push(newMed);
    timeEntries.forEach((te) => localCache.reminder_times.push(te));
    persistLocalCache();

    // Sync to refill_summary
    this.syncRefillSummary(newMed, options);

    // Save to Firestore with transaction if available
    if (firestoreDb) {
      return runTransaction(firestoreDb, async (transaction) => {
        console.log('[dbService.addMedicine] Transaction set: medicines/', newMed.firestoreId || newMed.id, 'patientId:', patientId);
        transaction.set(doc(firestoreDb, 'medicines', newMed.firestoreId || newMed.id), newMed);
        timeEntries.forEach((te) => {
          const timeDocRef = doc(firestoreDb, 'reminder_times', te.id);
          console.log('[dbService.addMedicine] Transaction set: reminder_times/', te.id, 'patientId:', te.patientId);
          transaction.set(timeDocRef, {
            ...te,
            createdAt: serverTimestamp(),
          });
        });
      }).then(() => {
        console.log('[dbService.addMedicine] Transaction committed successfully');
        return { medicine: newMed, times: timeEntries };
      })
        .catch((e) => {
          console.error('[dbService.addMedicine] Transaction error:', e?.code, e?.message);
          // Rollback local cache on error
          localCache.medicines = localCache.medicines.filter((m) => m.id !== medId);
          localCache.reminder_times = localCache.reminder_times.filter((rt) => rt.medicineId !== medId);
          persistLocalCache();
          throw e;
        });
    }

    return { medicine: newMed, times: timeEntries };
  },
  async updateMedicine(id, updates, timesList = null, options = {}) {
    const idx = localCache.medicines.findIndex((m) => m.id === id);
    if (idx !== -1) {
      console.log('[dbService.updateMedicine] Updating medicine:', id, 'patientId:', localCache.medicines[idx].patientId);
      localCache.medicines[idx] = { ...localCache.medicines[idx], ...updates };
      let newTimes = [];

      if (timesList !== null) {
        localCache.reminder_times = localCache.reminder_times.filter((rt) => rt.medicineId !== id);
        newTimes = timesList.map((timeStr, i) => ({
          id: `rt-${Date.now()}-${i}`,
          medicineId: id,
          patientId: localCache.medicines[idx].patientId,
          time: timeStr,
          timeStr,
          enabled: true,
          createdAt: Date.now(),
        }));
        newTimes.forEach((t) => localCache.reminder_times.push(t));
      }
      persistLocalCache();

      const firestoreDb = options.localOnly ? null : getFirestoreDb();
      if (firestoreDb) {
        try {
          console.log('[dbService.updateMedicine] Update: medicines/', localCache.medicines[idx].firestoreId || id);
          await updateDoc(doc(firestoreDb, 'medicines', localCache.medicines[idx].firestoreId || id), updates);

          if (timesList !== null) {
            const patientId = localCache.medicines[idx].patientId;
            if (!patientId) {
              throw new Error('patientId is required to update medicine times');
            }
            // Delete old reminder_times for this medicine from Firestore
            console.log('[dbService.updateMedicine] Query: reminder_times where patientId ==', patientId, 'AND medicineId ==', id);
            const rSnap = await getDocs(
              query(
                collection(firestoreDb, 'reminder_times'),
                where('patientId', '==', patientId),
                where('medicineId', '==', id)
              )
            );
            console.log('[dbService.updateMedicine] Found', rSnap.docs.length, 'reminder_times to delete');
            for (const rDoc of rSnap.docs) {
              console.log('[dbService.updateMedicine] Delete: reminder_times/', rDoc.id, 'patientId:', rDoc.data().patientId);
              await deleteDoc(doc(firestoreDb, 'reminder_times', rDoc.id));
            }
            // Add new reminder_times
            for (const nt of newTimes) {
              console.log('[dbService.updateMedicine] Create: reminder_times/', nt.id, 'patientId:', nt.patientId);
              await setDoc(doc(firestoreDb, 'reminder_times', nt.id), {
                ...nt,
                createdAt: serverTimestamp(),
              });
            }
          }
        } catch (e) {
          console.error('[dbService.updateMedicine] error:', e?.code, e?.message);
          throw e;
        }
      }

      // Sync to refill_summary
      await this.syncRefillSummary(localCache.medicines[idx], options);

      return localCache.medicines[idx];
    }
    return null;
  },
  async deleteMedicine(id, targetPatientId = null, options = {}) {
    const deletedMed = localCache.medicines.find((m) => m.id === id);
    const deletedTimes = localCache.reminder_times.filter((rt) => rt.medicineId === id);
    const deletedDoseLogs = localCache.dose_logs.filter((dl) => dl.medicineId === id);
    const deletedRefillSummary = localCache.refill_summary?.find((rs) => rs.medicineId === id || rs.id === `rs-${id}`);

    const pId = targetPatientId || deletedMed?.patientId;
    if (!pId) {
      throw new Error('patientId is required to delete medicine');
    }

    console.log('[dbService.deleteMedicine] Deleting medicine:', id, 'patientId:', pId, 'deletedMed.patientId:', deletedMed?.patientId);

    // Remove from localCache
    localCache.medicines = localCache.medicines.filter((m) => m.id !== id);
    localCache.reminder_times = localCache.reminder_times.filter((rt) => rt.medicineId !== id);
    localCache.dose_logs = localCache.dose_logs.filter((dl) => dl.medicineId !== id);
    if (localCache.refill_summary) {
      localCache.refill_summary = localCache.refill_summary.filter((rs) => rs.medicineId !== id && rs.id !== `rs-${id}`);
    }
    persistLocalCache();

    const firestoreDb = options.localOnly ? null : getFirestoreDb();
    if (firestoreDb) {
      try {
        const batch = writeBatch(firestoreDb);

        // Delete medicines/{id}
        const medRef = doc(firestoreDb, 'medicines', deletedMed?.firestoreId || id);
        console.log('[dbService.deleteMedicine] Batch delete: medicines/', deletedMed?.firestoreId || id, 'patientId:', deletedMed?.patientId);
        batch.delete(medRef);

        // Delete reminder_times docs where patientId == pId AND medicineId == id
        console.log('[dbService.deleteMedicine] Query: reminder_times where patientId ==', pId, 'AND medicineId ==', id);
        const rSnap = await getDocs(
          query(
            collection(firestoreDb, 'reminder_times'),
            where('patientId', '==', pId),
            where('medicineId', '==', id)
          )
        );
        console.log('[dbService.deleteMedicine] Found', rSnap.docs.length, 'reminder_times to delete');
        rSnap.docs.forEach((dDoc) => {
          console.log('[dbService.deleteMedicine] Batch delete: reminder_times/', dDoc.id, 'patientId:', dDoc.data().patientId);
          batch.delete(dDoc.ref);
        });

        // Delete dose_logs docs where patientId == pId AND medicineId == id
        console.log('[dbService.deleteMedicine] Query: dose_logs where patientId ==', pId, 'AND medicineId ==', id);
        const dlSnap = await getDocs(
          query(
            collection(firestoreDb, 'dose_logs'),
            where('patientId', '==', pId),
            where('medicineId', '==', id)
          )
        );
        console.log('[dbService.deleteMedicine] Found', dlSnap.docs.length, 'dose_logs to delete');
        dlSnap.docs.forEach((dDoc) => {
          console.log('[dbService.deleteMedicine] Batch delete: dose_logs/', dDoc.id, 'patientId:', dDoc.data().patientId);
          batch.delete(dDoc.ref);
        });

        // Delete refill_summary/rs-{id}
        const rsRef = doc(firestoreDb, 'refill_summary', `rs-${id}`);
        console.log('[dbService.deleteMedicine] Batch delete: refill_summary/rs-', id);
        batch.delete(rsRef);

        await batch.commit();
        console.log('[dbService.deleteMedicine] Batch committed successfully');
      } catch (e) {
        console.error('[dbService.deleteMedicine] error:', e?.code, e?.message);
        throw e;
      }
    }
    return {
      medicine: deletedMed ? { ...deletedMed, deleted: false, deletedAt: null } : null,
      times: deletedTimes,
      doseLogs: deletedDoseLogs,
      refillSummary: deletedRefillSummary,
    };
  },
  async ensureDailyDoseLogs(patientId, userRole = 'patient', targetDateKey = null) {
    if (userRole === 'nurse' || userRole === 'doctor' || userRole === 'pharmacist') {
      return;
    }
    if (!patientId) return;

    const todayStr = targetDateKey || new Date().toISOString().slice(0, 10);
    const medicines = this.getMedicines(patientId).filter((m) => m.active !== false && !m.deleted);
    const firestoreDb = getFirestoreDb();

    let rTimes = localCache.reminder_times.filter((rt) => rt.patientId === patientId);
    let existingLogs = localCache.dose_logs.filter((dl) => dl.patientId === patientId && (dl.date === todayStr || dl.date === 'Today'));

    if (firestoreDb) {
      try {
        const rSnap = await getDocs(
          query(collection(firestoreDb, 'reminder_times'), where('patientId', '==', patientId))
        );
        if (!rSnap.empty) {
          const fetchedTimes = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          localCache.reminder_times = localCache.reminder_times
            .filter((rt) => rt.patientId !== patientId)
            .concat(fetchedTimes);
          rTimes = fetchedTimes;
        }

        const lSnap = await getDocs(
          query(
            collection(firestoreDb, 'dose_logs'),
            where('patientId', '==', patientId),
            where('date', '==', todayStr)
          )
        );
        if (!lSnap.empty) {
          const fetchedLogs = lSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          localCache.dose_logs = localCache.dose_logs
            .filter((dl) => !(dl.patientId === patientId && dl.date === todayStr))
            .concat(fetchedLogs);
          existingLogs = fetchedLogs;
        }
      } catch (err) {
        console.warn('ensureDailyDoseLogs fetch error:', err);
      }
    }

    const newLogsToCreate = [];

    medicines.forEach((med) => {
      const timesForMed = rTimes.filter((rt) => rt.medicineId === med.id && rt.enabled !== false);
      const timeStrs = timesForMed.length > 0 ? timesForMed.map((t) => t.time || t.timeStr) : ['9:00 AM'];

      timeStrs.forEach((tStr) => {
        const alreadyExists = existingLogs.some(
          (l) =>
            l.medicineId === med.id &&
            (l.time === tStr || l.timeStr === tStr) &&
            (l.date === todayStr || l.date === 'Today')
        );

        if (!alreadyExists) {
          const cleanTime = String(tStr).replace(/[^a-zA-Z0-9]/g, '');
          const logId = `dl-${todayStr}-${med.id}-${cleanTime}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newLog = {
            id: logId,
            patientId,
            medicineId: med.id,
            medicineName: med.name,
            dose: med.dose,
            time: tStr,
            timeStr: tStr,
            date: todayStr,
            status: 'Upcoming',
            timestamp: Date.now(),
          };
          newLogsToCreate.push(newLog);
          existingLogs.push(newLog);
        }
      });
    });

    if (newLogsToCreate.length > 0) {
      newLogsToCreate.forEach((log) => localCache.dose_logs.push(log));
      persistLocalCache();

      if (firestoreDb) {
        for (const log of newLogsToCreate) {
          try {
            await setDoc(doc(firestoreDb, 'dose_logs', log.id), {
              ...log,
              timestamp: serverTimestamp(),
            });
          } catch (e) {
            console.warn('Error setting doseLog in Firestore:', e);
          }
        }
      }
    }
  },
  async cleanupDuplicateRemindersAndLogs(patientId) {
    if (!patientId) return;
    const firestoreDb = getFirestoreDb();
    if (!firestoreDb) return;

    try {
      // 1. Cleanup duplicate reminder_times
      const rSnap = await getDocs(
        query(collection(firestoreDb, 'reminder_times'), where('patientId', '==', patientId))
      );
      const rMap = {};
      for (const dDoc of rSnap.docs) {
        const data = dDoc.data();
        const key = `${data.medicineId}_${data.time || data.timeStr}`;
        if (rMap[key]) {
          await deleteDoc(doc(firestoreDb, 'reminder_times', dDoc.id));
        } else {
          rMap[key] = dDoc.id;
        }
      }

      // 2. Cleanup duplicate dose_logs
      const lSnap = await getDocs(query(collection(firestoreDb, 'dose_logs'), where('patientId', '==', patientId)));
      const lMap = {};
      for (const dDoc of lSnap.docs) {
        const data = dDoc.data();
        const key = `${data.medicineId}_${data.time || data.timeStr}_${data.date}`;
        if (lMap[key]) {
          const existingDocId = lMap[key].id;
          if (data.status === 'Taken' || data.status === 'Skipped') {
            await deleteDoc(doc(firestoreDb, 'dose_logs', existingDocId));
            lMap[key] = { id: dDoc.id, status: data.status };
          } else {
            await deleteDoc(doc(firestoreDb, 'dose_logs', dDoc.id));
          }
        } else {
          lMap[key] = { id: dDoc.id, status: data.status };
        }
      }
    } catch (err) {
      console.warn('Cleanup error:', err);
    }
  },
  async restoreMedicine(medicineOrBackup, timesList = []) {
    let medicine = null;
    let times = [];
    let doseLogs = [];
    let refillSummary = null;

    if (medicineOrBackup && medicineOrBackup.medicine !== undefined) {
      medicine = medicineOrBackup.medicine;
      times = medicineOrBackup.times || [];
      doseLogs = medicineOrBackup.doseLogs || [];
      refillSummary = medicineOrBackup.refillSummary || null;
    } else {
      medicine = medicineOrBackup;
      times = timesList;
    }

    if (!medicine) return;

    const restored = { ...medicine, deleted: false, deletedAt: null };
    const index = localCache.medicines.findIndex((item) => item.id === medicine.id);
    if (index < 0) localCache.medicines.push(restored);
    else localCache.medicines[index] = restored;

    if (times.length) {
      localCache.reminder_times = localCache.reminder_times.filter((time) => time.medicineId !== medicine.id);
      times.forEach((time) => localCache.reminder_times.push(time));
    }
    if (doseLogs.length) {
      localCache.dose_logs = localCache.dose_logs.filter((dl) => dl.medicineId !== medicine.id);
      doseLogs.forEach((dl) => localCache.dose_logs.push(dl));
    }
    if (refillSummary) {
      if (!localCache.refill_summary) localCache.refill_summary = [];
      localCache.refill_summary = localCache.refill_summary.filter((rs) => rs.medicineId !== medicine.id && rs.id !== `rs-${medicine.id}`);
      localCache.refill_summary.push(refillSummary);
    }
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        const batch = writeBatch(firestoreDb);
        batch.set(doc(firestoreDb, 'medicines', medicine.firestoreId || medicine.id), restored);

        times.forEach((t) => {
          batch.set(doc(firestoreDb, 'reminder_times', t.id), t);
        });
        doseLogs.forEach((dl) => {
          batch.set(doc(firestoreDb, 'dose_logs', dl.id), dl);
        });
        if (refillSummary) {
          batch.set(doc(firestoreDb, 'refill_summary', refillSummary.id || `rs-${medicine.id}`), refillSummary);
        }
        await batch.commit();
      } catch (e) {
        console.error('[DB] restoreMedicine batch error:', e);
      }
    }
  },

  // DOSE LOGS
  getDoseLogs(patientId) {
    if (!patientId) return [];
    return localCache.dose_logs.filter((d) => d.patientId === patientId);
  },
  async addDoseLog(logData) {
    if (!logData.patientId) {
      console.warn('[DB] addDoseLog: patientId is required');
      return null;
    }
    const newLog = {
      id: `dl-${Date.now()}`,
      patientId: logData.patientId,
      timestamp: Date.now(),
      ...logData,
    };
    localCache.dose_logs.push(newLog);
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await setDoc(doc(firestoreDb, 'dose_logs', newLog.id), newLog);
    }
    return newLog;
  },
  async updateDoseLog(id, status) {
    const index = localCache.dose_logs.findIndex((log) => log.id === id);
    if (index < 0) return null;
    localCache.dose_logs[index] = { ...localCache.dose_logs[index], status, timestamp: Date.now() };
    persistLocalCache();
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await updateDoc(doc(firestoreDb, 'dose_logs', localCache.dose_logs[index].firestoreId || id), {
        status,
        timestamp: Date.now(),
      });
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
      }, (err) => {
        if (onError) onError(err);
        callback(this.getDoseLogs(patientId));
      });
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

  async getDoseSnoozeCount(patientId, medicineId, dateKey = null) {
    const todayStr = dateKey || new Date().toISOString().slice(0, 10);
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(
        collection(firestoreDb, 'dose_logs'),
        where('patientId', '==', patientId),
        where('medicineId', '==', medicineId),
        where('date', '==', todayStr)
      );
      const snapshot = await getDocs(q);
      const latest = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0))[0];
      return { snoozeCount: latest?.snoozeCount || 0, doseLogId: latest?.id || null };
    }
    const local = localCache.dose_logs.find((log) => log.patientId === patientId && log.medicineId === medicineId && log.date === todayStr);
    return { snoozeCount: local?.snoozeCount || 0, doseLogId: local?.id || null };
  },

  async recordDoseSnooze({ patientId, medicineId, medicine, time }) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const firestoreDb = getFirestoreDb();
    let doseLog = null;
    if (firestoreDb) {
      const current = await this.getDoseSnoozeCount(patientId, medicineId, todayStr);
      const snoozeCount = current.snoozeCount + 1;
      if (current.doseLogId) {
        await updateDoc(doc(firestoreDb, 'dose_logs', current.doseLogId), {
          snoozeCount,
          date: todayStr,
          status: 'Pending',
          timestamp: Date.now(),
        });
        doseLog = { id: current.doseLogId, patientId, medicineId, medicine, time, date: todayStr, status: 'Pending', snoozeCount, timestamp: Date.now() };
      } else {
        const log = { patientId, medicineId, medicine, time, date: todayStr, status: 'Pending', snoozeCount, timestamp: Date.now() };
        const created = await addDoc(collection(firestoreDb, 'dose_logs'), log);
        doseLog = { id: created.id, ...log };
      }
      localCache.dose_logs = localCache.dose_logs.filter((log) => !(log.patientId === patientId && log.medicineId === medicineId && (log.date === todayStr || log.date === 'Today'))).concat(doseLog);
      persistLocalCache();
      if (snoozeCount >= 2) {
        const alertExists = localCache.alerts.some((alert) => alert.patientId === patientId && alert.type === 'snooze_limit' && alert.medicine === medicine && alert.status === 'open');
        if (!alertExists) this.addAlert({ patientId, type: 'snooze_limit', medicine, status: 'open', createdAt: serverTimestamp(), message: `${medicine}: both snoozes used. The alert is staying on screen.` });
      }
      return { snoozeCount, doseLogId: doseLog.id };
    }

    const local = localCache.dose_logs.find((log) => log.patientId === patientId && log.medicineId === medicineId && (log.date === todayStr || log.date === 'Today'));
    const snoozeCount = (local?.snoozeCount || 0) + 1;
    if (local) Object.assign(local, { snoozeCount, status: 'Pending' });
    else {
      doseLog = { id: `dl-${Date.now()}`, patientId, medicineId, medicine, time, date: todayStr, status: 'Pending', snoozeCount, timestamp: Date.now() };
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
      }, (err) => {
        if (onError) onError(err);
        callback(this.getAlerts(patientId));
      });
    }
    callback(this.getAlerts(patientId));
    return () => {};
  },

  subscribeToRefillRequests(patientId, callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'refill_requests'), where('patientId', '==', patientId));
      return onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        localCache.refill_requests = localCache.refill_requests
          .filter((request) => request.patientId !== patientId)
          .concat(reqs);
        callback(reqs);
      }, (error) => {
        onError?.(error);
        callback(this.getRefillRequests(patientId));
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

  async deletePrescription(prescriptionId) {
    const firestoreDb = getFirestoreDb();
    if (!firestoreDb) {
      throw new Error('Firebase is not configured. Cannot delete the prescription.');
    }
    
    try {
      // Get the prescription first to check for image URL
      const docRef = doc(firestoreDb, 'prescriptions', prescriptionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Prescription not found');
      }
      
      const prescription = { id: docSnap.id, ...docSnap.data() };
      
      // Delete from Firestore
      await deleteDoc(docRef);
      
      // Delete from Storage if it's a Storage URL (not base64)
      if (prescription.imageUrl && !prescription.imageUrl.startsWith('data:')) {
        try {
          const { storage, ref, deleteObject } = await import('firebase/storage');
          if (storage && ref && deleteObject) {
            const imageRef = ref(storage, prescription.imageUrl);
            await deleteObject(imageRef);
          }
        } catch (storageError) {
          // Ignore storage deletion errors - the document is already deleted
          console.warn('[dbService.deletePrescription] Storage deletion failed (non-critical):', storageError?.message);
        }
      }
      
      // Remove from local cache
      localCache.prescriptions = localCache.prescriptions?.filter(p => p.id !== prescriptionId) || [];
      persistLocalCache();
      
      return prescription;
    } catch (error) {
      console.error('[dbService.deletePrescription] error:', error?.code, error?.message);
      throw error;
    }
  },

  // CARE_LINKS
  subscribeToCareLinks(userId, role = 'patient', callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      let q;
      if (role === 'caregiver' || role === 'nurse') {
        q = query(collection(firestoreDb, 'care_links'), where('memberId', '==', userId));
      } else {
        q = query(collection(firestoreDb, 'care_links'), where('patientId', '==', userId));
      }
      return onSnapshot(
        q,
        (snapshot) => {
          const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          if (role === 'caregiver' || role === 'nurse') {
            localCache.care_links = localCache.care_links
              .filter((item) => item.memberId !== userId)
              .concat(records);
          } else {
            localCache.care_links = localCache.care_links
              .filter((item) => item.patientId !== userId)
              .concat(records);
          }
          callback(records);
        },
        (err) => {
          if (onError) onError(err);
          if (role === 'caregiver' || role === 'nurse') {
            callback(this.getCareLinksForMember(userId));
          } else {
            callback(this.getCareLinks(userId));
          }
        }
      );
    }
    if (role === 'caregiver' || role === 'nurse') {
      callback(this.getCareLinksForMember(userId));
    } else {
      callback(this.getCareLinks(userId));
    }
    return () => {};
  },
  getCareLinks(patientId) {
    if (!patientId) return [];
    return localCache.care_links.filter((c) => c.patientId === patientId);
  },
  getCareLinksForMember(memberId) {
    return localCache.care_links.filter((c) => c.memberId === memberId);
  },
  subscribeToCareLinksForMember(memberId, callback, onError) {
    if (!memberId) {
      console.warn('[dbService.subscribeToCareLinksForMember] memberId is undefined, skipping query');
      if (onError) onError({ code: 'invalid-argument', message: 'memberId is required' });
      return () => {};
    }
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const q = query(collection(firestoreDb, 'care_links'), where('memberId', '==', memberId));
      return onSnapshot(q, (snapshot) => {
        const links = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        localCache.care_links = localCache.care_links.filter((c) => c.memberId !== memberId).concat(links);
        persistLocalCache();
        callback(links);
      }, (err) => {
        console.error('[dbService.subscribeToCareLinksForMember] error:', err.code, err.message);
        if (onError) onError(err);
      });
    }
    callback(this.getCareLinksForMember(memberId));
    return () => {};
  },
  async addCareLink({ patientId, memberId, memberName, role, permissions = {}, status = 'Active', email = null, addedBy = null }) {
    const id = `${patientId}_${memberId}`;
    const link = { id, patientId, memberId, memberName, role, status, permissions, email, addedBy, createdAt: Date.now() };
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
      try {
        const q = query(
          collection(firestoreDb, 'users'),
          where('email', '==', email),
          where('role', 'in', ['nurse', 'caregiver', 'doctor'])
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      } catch (error) {
        console.error('[dbService.findUserByEmail] error:', error?.code, error?.message);
        throw error;
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
  getAlerts(patientId) {
    if (!patientId) return [];
    return localCache.alerts.filter((a) => a.patientId === patientId);
  },
  addAlert(alertData) {
    if (!alertData.patientId) {
      console.warn('[DB] addAlert: patientId is required');
      return null;
    }
    const newAlert = {
      id: `alt-${Date.now()}`,
      patientId: alertData.patientId,
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
  getRefillRequests(patientId) {
    if (!patientId) return [];
    return localCache.refill_requests.filter((r) => r.patientId === patientId);
  },
  createRefillRequest(medicineId, patientId) {
    if (!patientId) {
      console.warn('[DB] createRefillRequest: patientId is required');
      return null;
    }
    const newReq = {
      id: `rr-${Date.now()}`,
      medicineId,
      patientId,
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
      refilledBy: pharmacist?.id || 'unknown',
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
  getCareNotes(patientId) {
    if (!patientId) return [];
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
  getPatientVisibleNotes(patientId) {
    if (!patientId) return [];
    return localCache.care_notes.filter((cn) => 
      cn.patientId === patientId && 
      (cn.visibleToPatient === true || cn.visibleToPatient === undefined)
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
  subscribeToCareNotes(patientId, role = 'patient', callback, onError) {
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      let q;
      if (role === 'patient') {
        q = query(
          collection(firestoreDb, 'care_notes'),
          where('patientId', '==', patientId),
          where('visibleToPatient', '==', true)
        );
      } else if (role === 'caregiver' || role === 'nurse') {
        q = query(
          collection(firestoreDb, 'care_notes'),
          where('patientId', '==', patientId)
        );
      } else {
        // Doctor and pharmacist read through active grants only
        // This should be called with a valid grant check before subscribing
        q = query(
          collection(firestoreDb, 'care_notes'),
          where('patientId', '==', patientId)
        );
      }
      return onSnapshot(
        q,
        (snapshot) => {
          const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          localCache.care_notes = localCache.care_notes
            .filter((item) => item.patientId !== patientId)
            .concat(records);
          callback(records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        },
        (err) => {
          if (onError) onError(err);
          callback(this.getPatientVisibleNotes(patientId));
        }
      );
    }
    callback(this.getPatientVisibleNotes(patientId));
    return () => {};
  },
  async addCareNote(noteData) {
    if (!noteData.patientId) {
      console.warn('[DB] addCareNote: patientId is required');
      return null;
    }
    const noteText = noteData.text || noteData.note || '';
    const newNote = {
      id: `cn-${Date.now()}`,
      patientId: noteData.patientId,
      authorId: noteData.authorId,
      authorName: noteData.authorName,
      authorRole: noteData.authorRole || 'nurse',
      text: noteText,
      visibleToPatient: noteData.visibleToPatient !== undefined ? noteData.visibleToPatient : true,
      createdAt: Date.now(),
      editedAt: null,
      ...noteData,
    };

    localCache.care_notes.push(newNote);
    persistLocalCache();

    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      const docRef = await addDoc(collection(firestoreDb, 'care_notes'), {
        ...newNote,
        createdAt: serverTimestamp(),
      });
      newNote.firestoreId = docRef.id;
    }

    // Create notifications if visibleToPatient is true
    if (newNote.visibleToPatient) {
      const snippet = noteText.length > 60 ? `${noteText.slice(0, 57)}...` : noteText;

      // 1. Patient Notification
      const patientNotification = {
        id: `notif-${Date.now()}-patient`,
        userId: newNote.patientId,
        patientId: newNote.patientId,
        type: 'update',
        categoryKey: 'updates',
        title: 'New note from your care team',
        body: snippet,
        message: snippet,
        read: false,
        createdBy: newNote.authorId,
        createdAt: Date.now(),
        relatedId: newNote.id,
      };
      localCache.notifications.push(patientNotification);
      persistLocalCache();
      if (firestoreDb) {
        await addDoc(collection(firestoreDb, 'notifications'), {
          ...patientNotification,
          createdAt: serverTimestamp(),
        }).catch((e) => console.warn('Firestore add patient notification error:', e));
      }

      // 2. Caregiver Notifications for linked caregivers
      const careLinks = this.getCareLinks(newNote.patientId);
      for (const link of careLinks) {
        if (link.status === 'Active') {
          const caregiverNotification = {
            id: `notif-${Date.now()}-${link.memberId}`,
            userId: link.memberId,
            patientId: newNote.patientId,
            type: 'update',
            categoryKey: 'updates',
            title: 'New note from care team',
            body: snippet,
            message: snippet,
            read: false,
            createdBy: newNote.authorId,
            createdAt: Date.now(),
            relatedId: newNote.id,
          };
          localCache.notifications.push(caregiverNotification);
          persistLocalCache();
          if (firestoreDb) {
            await addDoc(collection(firestoreDb, 'notifications'), {
              ...caregiverNotification,
              createdAt: serverTimestamp(),
            }).catch((e) => console.warn('Firestore add caregiver notification error:', e));
          }
        }
      }
    }

    return newNote;
  },

  async updateCareNote(id, updates) {
    const idx = localCache.care_notes.findIndex((cn) => cn.id === id);
    if (idx !== -1) {
      localCache.care_notes[idx] = { ...localCache.care_notes[idx], ...updates, editedAt: Date.now() };
      persistLocalCache();
      const firestoreDb = getFirestoreDb();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'care_notes', id), {
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
      try {
        await setDoc(doc(firestoreDb, 'access_codes', codeHash), {
          ...accessCode,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('[dbService.generateAccessCode] error:', error?.code, error?.message);
        throw error;
      }
    }
    return code;
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
  async removeConsent(codeHash) {
    const accessCode = localCache.access_codes.find((ac) => ac.id === codeHash);
    if (!accessCode) return null;
    
    // Backup for undo
    const backup = { ...accessCode };
    
    await this.revokeAccessCode(codeHash);
    return backup;
  },
  async restoreConsent(backupConsent) {
    if (!backupConsent) return;
    
    localCache.access_codes = localCache.access_codes.map((ac) => 
      ac.id === backupConsent.id ? { ...backupConsent, status: 'Active' } : ac
    );
    persistLocalCache();
    
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      await updateDoc(doc(firestoreDb, 'access_codes', backupConsent.id), { 
        status: 'Active',
        expiresAt: Timestamp.fromMillis(backupConsent.expiresAt)
      });
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
  getRefillSummary(patientId) {
    if (!patientId) return [];
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
  async syncRefillSummary(medicine, options = {}) {
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
    const firestoreDb = options.localOnly ? null : getFirestoreDb();
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
  async markRefilled(medicineId, pharmacistId, pharmacistName, options = {}) {
    const medicine = this.getMedicineById(medicineId);
    if (!medicine) return false;
    await this.updateMedicine(medicineId, {
      stockDays: 30,
      refillStatus: 'OK',
      lastRefilledBy: pharmacistId,
      lastRefilledByName: pharmacistName,
      lastRefilledAt: Date.now(),
    }, null, options);

    const pendingRequests = localCache.refill_requests.filter((request) =>
      request.medicineId === medicineId && ['requested', 'notified'].includes(request.status)
    );
    for (const request of pendingRequests) {
      const updates = {
        status: 'refilled',
        refilledBy: pharmacistId,
        refilledByName: pharmacistName,
        refilledAt: Date.now(),
      };
      Object.assign(request, updates);
      const firestoreDb = options.localOnly ? null : getFirestoreDb();
      if (firestoreDb) {
        await updateDoc(doc(firestoreDb, 'refill_requests', request.id), {
          ...updates,
          refilledAt: serverTimestamp(),
        });
      }
    }
    persistLocalCache();
    return true;
  },
};

export default dbService;
