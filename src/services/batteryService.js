// ==========================================================
// MyCrew - Real Device Battery Service
// Integrates with expo-battery for physical hardware battery telemetry
// ==========================================================

import * as Battery from 'expo-battery';
import { Platform } from 'react-native';

class BatteryService {
  constructor() {
    this.lastKnownLevel = null;
    this.subscription = null;
  }

  /**
   * Retrieves the current device battery percentage (0 - 100).
   * Returns null if hardware sensor is unavailable.
   */
  async getBatteryLevel() {
    try {
      const level = await Battery.getBatteryLevelAsync();
      // On real devices, getBatteryLevelAsync returns a float 0.0 - 1.0 (e.g. 0.82 -> 82%)
      // If unsupported or unknown, it returns -1
      if (typeof level === 'number' && level >= 0 && level <= 1) {
        const percentage = Math.round(level * 100);
        this.lastKnownLevel = percentage;
        return percentage;
      }
      return this.lastKnownLevel ?? null;
    } catch (e) {
      // In web browsers or unsupported simulators, fail gracefully
      return this.lastKnownLevel ?? null;
    }
  }

  /**
   * Retrieves battery state (charging, unplugged, full, unknown)
   */
  async getBatteryState() {
    try {
      const state = await Battery.getBatteryStateAsync();
      return state;
    } catch (e) {
      return Battery.BatteryState.UNKNOWN;
    }
  }
}

export const batteryService = new BatteryService();
