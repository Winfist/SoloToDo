/**
 * Health Service — wraps @capgo/capacitor-health with platform checks.
 * On non-native platforms (web browser) all methods return safe fallback values
 * instead of crashing.
 */

import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

let _Health = null;

async function getHealth() {
  if (_Health) return _Health;
  if (!isNative()) return null;
  try {
    const mod = await import('@capgo/capacitor-health');
    _Health = mod.Health;
    return _Health;
  } catch (e) {
    console.warn('[healthService] Could not load Health plugin:', e);
    return null;
  }
}

export const healthService = {
  /**
   * Returns true if we're on a native platform with the Health plugin available.
   */
  async isAvailable() {
    const Health = await getHealth();
    if (!Health) return false;
    try {
      const res = await Health.isAvailable();
      return res.available;
    } catch (e) {
      console.warn('[healthService] isAvailable error:', e);
      return false;
    }
  },

  /**
   * Request permissions for Step Count and Sleep Analysis.
   * Returns true on success, false if unavailable or denied.
   */
  async requestPermissions() {
    const Health = await getHealth();
    if (!Health) {
      console.log('[healthService] Not on native platform — skipping permission request');
      return false;
    }
    try {
      await Health.requestAuthorization({
        read: ['steps', 'sleep'],
        write: [],
      });
      return true;
    } catch (error) {
      console.error('[healthService] Error requesting health permissions:', error);
      return false;
    }
  },

  /**
   * Get steps for today. Returns 0 if unavailable.
   */
  async getTodaySteps() {
    const Health = await getHealth();
    if (!Health) return 0;
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const result = await Health.queryAggregated({
        dataType: 'steps',
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        bucket: 'day',
      });

      // queryAggregated typically returns { samples: [] }
      if (result && result.samples && result.samples.length > 0) {
        return Math.floor(result.samples[0].value);
      }

      // Fallback: try readSamples() and sum
      const queryResult = await Health.readSamples({
        dataType: 'steps',
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      });

      let totalSteps = 0;
      if (queryResult && queryResult.samples) {
        queryResult.samples.forEach(entry => {
          totalSteps += (entry.value || 0);
        });
      }
      return totalSteps;
    } catch (error) {
      console.error('[healthService] Error fetching steps:', error);
      return 0;
    }
  },

  /**
   * Get sleep data for the previous night. Returns { minutes, hours }.
   */
  async getLastNightSleep() {
    const Health = await getHealth();
    if (!Health) return { minutes: 0, hours: '0.0' };
    try {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(18, 0, 0, 0); // Check from 6 PM yesterday

      const result = await Health.readSamples({
        dataType: 'sleep',
        startDate: yesterday.toISOString(),
        endDate: now.toISOString(),
      });

      let totalSleepMinutes = 0;
      if (result && result.samples) {
        result.samples.forEach(entry => {
          // Check sleepState for Capgo plugin
          const val = String(entry.sleepState || entry.value || '').toLowerCase();
          if (val === 'asleep' || val.includes('asleep') || val === '1' || val === 'deep' || val === 'light' || val === 'rem') {
            const start = new Date(entry.startDate);
            const end = new Date(entry.endDate);
            totalSleepMinutes += (end - start) / (1000 * 60);
          }
        });
      }

      return {
        minutes: Math.round(totalSleepMinutes),
        hours: (totalSleepMinutes / 60).toFixed(1)
      };
    } catch (error) {
      console.error('[healthService] Error fetching sleep data:', error);
      return { minutes: 0, hours: '0.0' };
    }
  }
};
