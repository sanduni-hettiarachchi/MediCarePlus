import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCKOUT_KEY = 'medicare_access_lockout';
const FAILED_ATTEMPTS_KEY = 'medicare_failed_attempts';

export async function getFailedAttempts() {
  try {
    const attempts = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
    return attempts ? parseInt(attempts, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export async function incrementFailedAttempts() {
  try {
    const current = await getFailedAttempts();
    const newCount = current + 1;
    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, newCount.toString());
    
    // Lock out after 5 failed attempts
    if (newCount >= 5) {
      const lockoutUntil = Date.now() + 300000; // 5 minutes
      await AsyncStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
      return { locked: true, lockoutUntil };
    }
    
    return { locked: false, attempts: newCount };
  } catch (e) {
    return { locked: false, attempts: 0 };
  }
}

export async function resetFailedAttempts() {
  try {
    await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
  } catch (e) {
    // Ignore
  }
}

export async function isLockedOut() {
  try {
    const lockoutUntilStr = await AsyncStorage.getItem(LOCKOUT_KEY);
    if (!lockoutUntilStr) return { locked: false };
    
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    if (Date.now() >= lockoutUntil) {
      // Lockout expired
      await AsyncStorage.removeItem(LOCKOUT_KEY);
      return { locked: false };
    }
    
    const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return { locked: true, remainingSeconds };
  } catch (e) {
    return { locked: false };
  }
}

export async function clearLockout() {
  try {
    await AsyncStorage.removeItem(LOCKOUT_KEY);
    await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
  } catch (e) {
    // Ignore
  }
}
