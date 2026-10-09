// ==========================================================
// MyCrew - Firebase Performance Monitoring Service
// Safe tracing & metrics with graceful fallbacks for Expo Go & Web
// ==========================================================

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

let nativePerf = null;

function getPerfInstance() {
  if (nativePerf) return nativePerf;
  if (isExpoGo || Platform.OS === 'web') return null;

  try {
    const perfModule = require('@react-native-firebase/perf').default;
    nativePerf = perfModule();
    return nativePerf;
  } catch (err) {
    return null;
  }
}

class PerfService {
  constructor() {
    this.activeTraces = new Map();
  }

  /**
   * Start a custom trace
   * @param {string} traceName
   * @returns {Promise<object>} trace controller with putMetric, putAttribute, stop
   */
  async startTrace(traceName) {
    const perf = getPerfInstance();
    const startTime = Date.now();

    if (perf) {
      try {
        const trace = await perf.startTrace(traceName);
        return {
          putMetric: (metricName, value) => {
            try {
              trace.putMetric(metricName, Number(value));
            } catch (e) {
              // ignore
            }
          },
          incrementMetric: (metricName, incrementBy = 1) => {
            try {
              trace.incrementMetric(metricName, Number(incrementBy));
            } catch (e) {
              // ignore
            }
          },
          putAttribute: (attr, value) => {
            try {
              trace.putAttribute(attr, String(value));
            } catch (e) {
              // ignore
            }
          },
          stop: async () => {
            try {
              await trace.stop();
            } catch (e) {
              // ignore
            }
          },
        };
      } catch (err) {
        console.warn(`[Perf] Failed to start native trace "${traceName}":`, err?.message);
      }
    }

    // Fallback for Expo Go / Web
    if (__DEV__) {
      console.log(`[Firebase Perf (Dev)]: Started trace "${traceName}"`);
    }

    return {
      putMetric: (m, v) => {
        if (__DEV__) console.log(`[Firebase Perf (Dev)] Trace "${traceName}" metric ${m}=${v}`);
      },
      incrementMetric: (m, inc) => {
        if (__DEV__) console.log(`[Firebase Perf (Dev)] Trace "${traceName}" increment metric ${m}+=${inc}`);
      },
      putAttribute: (a, v) => {
        if (__DEV__) console.log(`[Firebase Perf (Dev)] Trace "${traceName}" attr ${a}=${v}`);
      },
      stop: async () => {
        const duration = Date.now() - startTime;
        if (__DEV__) {
          console.log(`[Firebase Perf (Dev)]: Stopped trace "${traceName}" (${duration}ms)`);
        }
      },
    };
  }

  /**
   * Wrap an async operation with automated start/stop trace measurement
   * @param {string} traceName
   * @param {Function} asyncFn
   */
  async trace(traceName, asyncFn) {
    const trace = await this.startTrace(traceName);
    try {
      const result = await asyncFn(trace);
      return result;
    } catch (err) {
      trace.putAttribute('has_error', 'true');
      trace.putAttribute('error_name', err?.name || 'Error');
      throw err;
    } finally {
      await trace.stop();
    }
  }

  /**
   * Create an HTTP metric tracker (for manual HTTP timing if desired)
   */
  async createHttpMetric(url, httpMethod = 'GET') {
    const perf = getPerfInstance();
    if (perf) {
      try {
        return await perf.newHttpMetric(url, httpMethod);
      } catch (e) {
        // fallback
      }
    }
    return null;
  }
}

export const perfService = new PerfService();
