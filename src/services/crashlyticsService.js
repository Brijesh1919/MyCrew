// ==========================================================
// MyCrew - Firebase Crashlytics Service
// Production error monitoring with safe fallbacks for Expo Go & Web
// ==========================================================

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

let nativeCrashlytics = null;

function getCrashlyticsInstance() {
  if (nativeCrashlytics) return nativeCrashlytics;
  if (isExpoGo || Platform.OS === 'web') return null;

  try {
    const crashlyticsModule = require('@react-native-firebase/crashlytics').default;
    nativeCrashlytics = crashlyticsModule();
    return nativeCrashlytics;
  } catch (err) {
    return null;
  }
}

class CrashlyticsService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initializes Crashlytics and configures global error handlers
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const crashlytics = getCrashlyticsInstance();
    if (crashlytics) {
      try {
        crashlytics.setCrashlyticsCollectionEnabled(true);
        this.log('Crashlytics service initialized in native runtime.');
      } catch (e) {
        console.warn('[Crashlytics] Initialization error:', e?.message);
      }
    } else {
      if (__DEV__) {
        console.log('[Crashlytics]: Running in Expo Go / Web mode (native reporting disabled)');
      }
    }

    // Set up global error handler to capture unhandled JS errors in production
    this._setupGlobalErrorHandler();
  }

  _setupGlobalErrorHandler() {
    if (typeof global !== 'undefined' && global.ErrorUtils && !__DEV__) {
      const defaultHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.recordError(error, isFatal ? 'Fatal JavaScript Error' : 'Unhandled JavaScript Error');
        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }
  }

  /**
   * Record a non-fatal error in Crashlytics
   */
  recordError(error, context = '') {
    try {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const crashlytics = getCrashlyticsInstance();

      if (crashlytics) {
        if (context) {
          crashlytics.log(`[Context]: ${context}`);
        }
        crashlytics.recordError(errObj);
      } else {
        if (__DEV__) {
          console.warn(`[Crashlytics Non-Fatal] (${context}):`, errObj);
        }
      }
    } catch (e) {
      console.warn('[Crashlytics] Failed to record error:', e?.message);
    }
  }

  /**
   * Append a breadcrumb log message to Crashlytics
   */
  log(message) {
    try {
      const crashlytics = getCrashlyticsInstance();
      if (crashlytics) {
        crashlytics.log(String(message));
      } else {
        if (__DEV__) {
          console.log(`[Crashlytics Log]: ${message}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Set user ID for crash reports
   */
  setUserId(userId) {
    try {
      const crashlytics = getCrashlyticsInstance();
      if (crashlytics) {
        crashlytics.setUserId(userId ? String(userId) : '');
      }
    } catch (e) {
      console.warn('[Crashlytics] Failed to set user ID:', e?.message);
    }
  }

  /**
   * Set custom key-value attribute
   */
  setAttribute(key, value) {
    try {
      const crashlytics = getCrashlyticsInstance();
      if (crashlytics) {
        crashlytics.setAttribute(key, String(value));
      }
    } catch (e) {
      console.warn(`[Crashlytics] Failed to set attribute "${key}":`, e?.message);
    }
  }

  /**
   * Set multiple attributes at once
   */
  setAttributes(attributes = {}) {
    try {
      const crashlytics = getCrashlyticsInstance();
      if (crashlytics) {
        crashlytics.setAttributes(
          Object.fromEntries(
            Object.entries(attributes).map(([k, v]) => [k, String(v)])
          )
        );
      }
    } catch (e) {
      console.warn('[Crashlytics] Failed to set attributes:', e?.message);
    }
  }
}

export const crashlytics = new CrashlyticsService();
