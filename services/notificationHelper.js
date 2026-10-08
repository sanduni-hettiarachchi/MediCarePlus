import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Helper functions for expo-notifications with Platform checks and error handling
// These functions return early on web and log warnings instead of throwing errors

export async function setNotificationHandler(handler) {
  if (Platform.OS === 'web') {
    console.log('[notificationHelper] setNotificationHandler skipped on web');
    return;
  }
  try {
    await Notifications.setNotificationHandler(handler);
  } catch (error) {
    console.warn('[notificationHelper] setNotificationHandler error:', error?.message);
  }
}

export async function scheduleNotificationAsync(notificationRequest) {
  if (Platform.OS === 'web') {
    console.log('[notificationHelper] scheduleNotificationAsync skipped on web');
    return null;
  }
  try {
    return await Notifications.scheduleNotificationAsync(notificationRequest);
  } catch (error) {
    console.warn('[notificationHelper] scheduleNotificationAsync error:', error?.message);
    return null;
  }
}

export async function cancelScheduledNotificationAsync(identifier) {
  if (Platform.OS === 'web') {
    console.log('[notificationHelper] cancelScheduledNotificationAsync skipped on web');
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn('[notificationHelper] cancelScheduledNotificationAsync error:', error?.message);
  }
}

export async function cancelAllScheduledNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('[notificationHelper] cancelAllScheduledNotificationsAsync skipped on web');
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notificationHelper] cancelAllScheduledNotificationsAsync error:', error?.message);
  }
}

export async function getAllScheduledNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('[notificationHelper] getAllScheduledNotificationsAsync skipped on web');
    return [];
  }
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notificationHelper] getAllScheduledNotificationsAsync error:', error?.message);
    return [];
  }
}
