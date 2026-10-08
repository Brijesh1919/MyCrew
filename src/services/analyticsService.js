// ==========================================================
// MyCrew - Firebase Analytics Service
// Production-ready with safe fallbacks for Expo Go & Web
// ==========================================================

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Check if running in Expo Go where native Firebase modules are not bundled
const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

let nativeAnalytics = null;

function getAnalyticsInstance() {
  if (nativeAnalytics) return nativeAnalytics;
  if (isExpoGo || Platform.OS === 'web') return null;

  try {
    const analyticsModule = require('@react-native-firebase/analytics').default;
    nativeAnalytics = analyticsModule();
    return nativeAnalytics;
  } catch (err) {
    // In environments without native linking, fallback silently
    return null;
  }
}

class AnalyticsService {
  /**
   * Log a custom event to Firebase Analytics
   */
  async logEvent(name, params = {}) {
    try {
      const analytics = getAnalyticsInstance();
      if (analytics) {
        await analytics.logEvent(name, params);
      } else {
        if (__DEV__) {
          console.log(`[Firebase Analytics (Expo Go / Web)]: ${name}`, params);
        }
      }
    } catch (error) {
      console.warn(`[Analytics] Error logging event "${name}":`, error?.message);
    }
  }

  /**
   * Log screen view navigation
   */
  async logScreenView(screenName, screenClass = screenName) {
    try {
      const analytics = getAnalyticsInstance();
      if (analytics) {
        await analytics.logScreenView({
          screen_name: screenName,
          screen_class: screenClass,
        });
      } else {
        if (__DEV__) {
          console.log(`[Firebase Analytics Screen]: ${screenName}`);
        }
      }
    } catch (error) {
      console.warn(`[Analytics] Error logging screen "${screenName}":`, error?.message);
    }
  }

  /**
   * Set user identifier for analytics tracking
   */
  async setUserId(userId) {
    try {
      const analytics = getAnalyticsInstance();
      if (analytics) {
        await analytics.setUserId(userId ? String(userId) : null);
      }
    } catch (error) {
      console.warn('[Analytics] Error setting userId:', error?.message);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperty(name, value) {
    try {
      const analytics = getAnalyticsInstance();
      if (analytics) {
        await analytics.setUserProperty(name, value ? String(value) : null);
      }
    } catch (error) {
      console.warn(`[Analytics] Error setting user property "${name}":`, error?.message);
    }
  }

  /**
   * Standard pre-defined events
   */
  async logAppOpen() {
    return this.logEvent('app_open');
  }

  async logLogin(method = 'email') {
    return this.logEvent('login', { method });
  }

  async logSignUp(method = 'email') {
    return this.logEvent('sign_up', { method });
  }

  async logTripCreated(tripName, durationHours) {
    return this.logEvent('trip_created', {
      trip_name: tripName,
      duration_hours: durationHours,
    });
  }

  async logTripJoined(tripCode) {
    return this.logEvent('trip_joined', { trip_code: tripCode });
  }

  async logMeetingPointSet(pointName) {
    return this.logEvent('meeting_point_set', { point_name: pointName });
  }

  async logEmergencyTriggered() {
    return this.logEvent('emergency_triggered', { timestamp: new Date().toISOString() });
  }
}

export const analytics = new AnalyticsService();
