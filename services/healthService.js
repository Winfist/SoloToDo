/**
 * Health Service — wraps @capgo/capacitor-health with platform checks.
 * On non-native platforms (web browser) all methods return safe fallback values
 * instead of crashing.
 *
 * Every public method double-guards with isNative() + try/catch so that
 * Capacitor's internal registerPlugin proxy can never produce an
 * unhandled promise rejection.
 */

import { Capacitor } from '@capacitor/core';

const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

import { Health } from '@capgo/capacitor-health';

function getHealthPlugin() {
  if (!isNative()) return Promise.resolve(null);
  return Promise.resolve(Health);
}

export const healthService = {
  /**
   * Returns true if we're on a native platform with the Health plugin available.
   */
  async isAvailable() {
    if (!isNative()) return false;
    try {
      const Health = await getHealthPlugin();
      if (!Health) return false;
      const res = await Health.isAvailable();
      return res?.available === true;
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
    if (!isNative()) {
      console.log('[healthService] Not on native platform — skipping permission request');
      return false;
    }
    try {
      const Health = await getHealthPlugin();
      if (!Health) return false;
      await Health.requestAuthorization({
        read: ['steps', 'sleep'],
        write: [],
      });
      // On iOS, HealthKit requestAuthorization always resolves even if user denies.
      // Actual denial only shows when reading data.
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
    if (!isNative()) return 0;
    try {
      const Health = await getHealthPlugin();
      if (!Health) return 0;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Try aggregated query first
      try {
        const result = await Health.queryAggregated({
          dataType: 'steps',
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          bucket: 'day',
        });
        if (result?.samples?.length > 0) {
          return Math.floor(result.samples[0].value);
        }
      } catch (aggErr) {
        console.warn('[healthService] queryAggregated failed, trying readSamples:', aggErr);
      }

      // Fallback: readSamples and sum
      try {
        const queryResult = await Health.readSamples({
          dataType: 'steps',
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        });
        let totalSteps = 0;
        if (queryResult?.samples) {
          queryResult.samples.forEach(entry => {
            totalSteps += (entry.value || 0);
          });
        }
        return totalSteps;
      } catch (readErr) {
        console.warn('[healthService] readSamples fallback also failed:', readErr);
        return 0;
      }
    } catch (error) {
      console.error('[healthService] Error fetching steps:', error);
      return 0;
    }
  },

  /**
   * Get sleep data for the previous night. Returns { minutes, hours }.
   */
  async getLastNightSleep() {
    if (!isNative()) return { minutes: 0, hours: '0.0' };
    try {
      const Health = await getHealthPlugin();
      if (!Health) return { minutes: 0, hours: '0.0' };

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(18, 0, 0, 0);

      const result = await Health.readSamples({
        dataType: 'sleep',
        startDate: yesterday.toISOString(),
        endDate: now.toISOString(),
      });

      let totalSleepMinutes = 0;
      if (result?.samples) {
        result.samples.forEach(entry => {
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
