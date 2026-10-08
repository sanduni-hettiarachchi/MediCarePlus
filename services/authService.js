import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationHelper from './notificationHelper';
import { Platform } from 'react-native';
import { signOut as firebaseSignOut, getAuth } from 'firebase/auth';

// Track active unsubscribe functions for cleanup
let activeUnsubscribers = [];

export const authService = {
	async signIn(email, password) { return { email, password, role: 'patient' }; },
	async signUp(profile) { return profile; },

	registerUnsubscriber(unsubscribeFn) {
		activeUnsubscribers.push(unsubscribeFn);
	},

	async logout(navigation) {
		// 1. Unsubscribe all active onSnapshot listeners
		activeUnsubscribers.forEach((fn) => {
			try { fn(); } catch (e) {}
		});
		activeUnsubscribers = [];

		// 2. Call Firebase signOut
		const auth = getAuth();
		if (auth) {
			try {
				await firebaseSignOut(auth);
			} catch (e) {
				console.warn('Firebase signOut error:', e);
			}
		}

		// 3. Clear app state from AsyncStorage
		try {
			await AsyncStorage.multiRemove([
				'@mediCare_user',
				'@mediCare_preferences',
				'@mediCare_reminders',
				'@mediCare_login',
			]);
		} catch (e) {
			console.warn('AsyncStorage clear error:', e);
		}

		// 4. Cancel pending local notifications (not available on web)
		await notificationHelper.cancelAllScheduledNotificationsAsync();

		// 5. Navigate to Landing screen (works with custom navigation in App.js)
		if (navigation) {
			if (navigation.navigate) {
				navigation.navigate('Landing');
			} else if (navigation.reset) {
				navigation.reset({
					index: 0,
					routes: [{ name: 'Landing' }],
				});
			}
		}
	},
};

export default authService;
