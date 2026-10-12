// ==========================================================
// MyCrew - Notification Service
// Integrates with expo-notifications for high-priority trip alerts
// Handles Emergency SOS, Meeting Points, and Battery alerts
// ==========================================================

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Determine if running inside Expo Go client
let isExpoGo = false;
try {
  const { isRunningInExpoGo } = require('expo');
  isExpoGo = typeof isRunningInExpoGo === 'function' ? isRunningInExpoGo() : false;
} catch {
  // ignore
}
if (!isExpoGo) {
  isExpoGo =
    Constants?.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants?.appOwnership === 'expo';
}

let Notifications = null;

// Only load expo-notifications when NOT running on Android Expo Go
// (Expo SDK 53+ removed remote notifications from Android Expo Go, throwing an uncaught fatal error on import)
if (Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo)) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
        }),
      });
    }
  } catch (err) {
    console.warn('[NotificationService] expo-notifications unavailable in current runtime:', err?.message);
    Notifications = null;
  }
}

class NotificationService {
  constructor() {
    this.hasPermission = false;
  }

  /**
   * Requests system push / local notification permissions
   */
  async requestPermissions() {
    if (!Notifications) return false;

    try {
      if (Platform.OS === 'web') return false;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === 'granted';

      // Setup Android notification channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('emergency_alerts', {
          name: 'Emergency & SOS Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#EF4444',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('trip_updates', {
          name: 'Trip & Regroup Updates',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      return this.hasPermission;
    } catch (e) {
      console.warn('Failed to request notification permissions:', e);
      return false;
    }
  }

  /**
   * Fires an immediate high-priority Emergency SOS notification
   */
  async showEmergencyAlert({ senderName = 'A crew member', message = 'Needs immediate help!' }) {
    if (!Notifications) {
      console.log(`[NotificationService:ExpoGo] 🚨 Emergency SOS: ${senderName} - ${message}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 EMERGENCY SOS: ${senderName}`,
          body: message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: 'emergency_alerts',
        },
        trigger: null, // immediate
      });
    } catch (e) {
      console.warn('Failed to schedule emergency notification:', e);
    }
  }

  /**
   * Fires an alert when a new meeting point is set
   */
  async showMeetingPointAlert({ pointName, creatorName }) {
    if (!Notifications) {
      console.log(`[NotificationService:ExpoGo] 📍 Meeting Point: ${pointName} by ${creatorName}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 New Regroup Point Set',
          body: `${creatorName || 'Your crew'} set a meeting point: ${pointName || 'Regroup Spot'}`,
          sound: 'default',
          channelId: 'trip_updates',
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Failed to schedule meeting point notification:', e);
    }
  }

  /**
   * Fires an alert when a friend's battery drops to critically low
   */
  async showLowBatteryAlert({ memberName, level }) {
    if (!Notifications) {
      console.log(`[NotificationService:ExpoGo] ⚠️ Low Battery: ${memberName} (${level}%)`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Low Battery Warning: ${memberName}`,
          body: `${memberName}'s phone battery is at ${level}%. They might go offline soon.`,
          sound: 'default',
          channelId: 'trip_updates',
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Failed to schedule low battery notification:', e);
    }
  }
}

export const notificationService = new NotificationService();
