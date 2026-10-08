// Voice reminders and daily repeating alarms using expo-speech and expo-notifications
import * as Speech from 'expo-speech';
import * as notificationHelper from './notificationHelper';

notificationHelper.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper to parse time string like "8:00 AM" or "1:00 PM" or "20:00" into 24-hour hour and minute
export function parseTimeString(timeStr) {
  if (!timeStr) return { hour: 9, minute: 0 };

  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');

  const clean = str.replace('AM', '').replace('PM', '').trim();
  const parts = clean.split(':');

  let hour = parseInt(parts[0], 10) || 9;
  const minute = parseInt(parts[1], 10) || 0;

  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  return { hour, minute };
}

export const reminderService = {
  // Spoken voice reminder (UI-01 / NFR5)
  async playVoiceReminder(medicineName, language = 'en') {
    const isSinhala = language === 'si';
    const text = isSinhala
      ? `කරුණාකර ඔබේ ${medicineName} ඖෂධය ලබාගන්න.`
      : `It is time to take your ${medicineName}. Please take your medicine.`;

    console.log('[EXPO_SPEECH_PLAYING]:', text);

    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      Speech.speak(text, {
        language: isSinhala ? 'si-LK' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (err) {
      console.warn('[EXPO_SPEECH_WARN] Voice synthesis error:', err);
    }

    return text;
  },

  // Schedule a DAILY repeating notification per reminder_time using trigger { hour, minute, repeats: true }
  async scheduleDailyRepeatingNotification(medicineId, medicineName, timeStr) {
    const { hour, minute } = parseTimeString(timeStr);
    const identifier = `notif-${medicineId}-${hour}-${minute}`;

    try {
      // Cancel existing if rescheduling
      await this.cancelNotification(identifier);

      const scheduledId = await notificationHelper.scheduleNotificationAsync({
        identifier,
        content: {
          title: '💊 Daily Medication Reminder',
          body: `It is time to take your ${medicineName} scheduled for ${timeStr}.`,
          sound: true,
          data: { medicineId, medicineName, timeStr },
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`[DAILY_NOTIFICATION_SCHEDULED] ID: ${scheduledId} (${hour}:${minute} daily)`);
      return scheduledId;
    } catch (err) {
      console.warn('[NOTIFICATIONS_WARN] Daily schedule error:', err);
      return identifier;
    }
  },

  async scheduleSnoozeNotification(medicineId, medicineName, delayMinutes = 10, language = 'en') {
    try {
      return await notificationHelper.scheduleNotificationAsync({
        content: {
          title: language === 'si' ? 'ඖෂධ මතක් කිරීම' : 'Medication reminder',
          body: language === 'si'
            ? `${medicineName} ඖෂධය දැන් ගන්න.`
            : `It is time to take ${medicineName}.`,
          sound: true,
          data: { medicineId, medicineName, snoozed: true },
        },
        trigger: { seconds: delayMinutes * 60 },
      });
    } catch (error) {
      console.warn('[NOTIFICATIONS_WARN] Snooze schedule error:', error);
      return null;
    }
  },

  // Cancel notification for a deleted or modified medicine
  async cancelNotification(notificationId) {
    try {
      await notificationHelper.cancelScheduledNotificationAsync(notificationId);
      console.log(`[NOTIFICATION_CANCELLED] ID: ${notificationId}`);
    } catch (err) {
      console.warn('[NOTIFICATIONS_WARN] Cancel error:', err);
    }
  },

  // Reschedule all daily reminder times for an edited medicine
  async rescheduleMedicineReminders(medicineId, medicineName, newTimesList = []) {
    try {
      const allScheduled = await notificationHelper.getAllScheduledNotificationsAsync();
      const prefix = `notif-${medicineId}-`;

      for (const notif of allScheduled) {
        if (notif.identifier && notif.identifier.startsWith(prefix)) {
          await notificationHelper.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      for (const timeStr of newTimesList) {
        await this.scheduleDailyRepeatingNotification(medicineId, medicineName, timeStr);
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS_WARN] Reschedule error:', err);
    }
  },

  async stopVoiceReminder() {
    try {
      await Speech.stop();
    } catch (e) {}
  },
};

export default reminderService;
