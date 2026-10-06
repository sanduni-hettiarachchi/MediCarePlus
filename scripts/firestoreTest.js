import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(scriptDir, '../.env');

try {
  const envText = readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*(EXPO_PUBLIC_FIREBASE_[A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
} catch (error) {
  console.error(`ENV_READ_ERROR ${error.code || 'UNKNOWN'}: ${error.message}`);
}

const printError = (label, error) => {
  console.error(`${label} ${error.code || 'UNKNOWN'}: ${error.message}`);
};

let db;
try {
  const { getFirebaseServices } = await import('../firebase/firebaseConfig.js');
  ({ db } = getFirebaseServices());
} catch (error) {
  printError('FIRESTORE_INIT_ERROR', error);
}

if (db) {
  try {
    const testRef = doc(collection(db, '_connection_test'));
    await setDoc(testRef, {
      ok: true,
      at: serverTimestamp(),
      from: 'vscode',
    });
    const snapshot = await getDoc(testRef);
    if (!snapshot.exists()) throw new Error('Write returned but the document could not be read back.');
    console.log('FIRESTORE_WRITE_OK');
    console.log(JSON.stringify(snapshot.data(), null, 2));
  } catch (error) {
    printError('FIRESTORE_WRITE_ERROR', error);
  }

  try {
    const medicines = await getDocs(query(collection(db, 'medicines'), limit(1)));
    console.log('MEDICINES_READ_OK');
    console.log(JSON.stringify(medicines.docs.map((item) => ({ id: item.id, ...item.data() })), null, 2));
  } catch (error) {
    printError('MEDICINES_READ_ERROR', error);
  }
} else {
  console.error('FIRESTORE_WRITE_ERROR UNKNOWN: Firestore db could not be initialized.');
  console.error('MEDICINES_READ_ERROR UNKNOWN: Firestore db could not be initialized.');
  process.exitCode = 1;
}
