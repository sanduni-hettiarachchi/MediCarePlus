import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseServices() {
	if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
		throw new Error('Firebase is not configured. Copy .env.example to .env and add your Firebase web app values.');
	}

	const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
	let storage = null;
	try {
		storage = getStorage(app);
	} catch (error) {
		storage = null;
	}
	return {
		app,
		auth: getAuth(app),
		db: getFirestore(app),
		storage,
	};
}

export default firebaseConfig;
