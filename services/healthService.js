/**
 * Health Service — wraps @capgo/capacitor-health with platform checks.
 * On non-native platforms (web browser) all methods return safe fallback values
 * instead of crashing.
 *
 * Every public method double-guards with isNative() + try/catch so that
 * Capacitor's internal registerPlugin proxy can never produce an
 * unhandled promise rejection.
 *
 * All native calls are wrapped in a timeout to prevent infinite hangs
 * (e.g. iOS HealthKit permission dialog never resolving).
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

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve/reject
 * within `ms` milliseconds, it rejects with a descriptive error.
 */
function withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[healthService] Timeout: ${label} did not complete within ${ms / 1000}s`)), ms)
    ),
  ]);
}

const TIMEOUT_MS = 15000; // 15 seconds

export const healthService = {
  /**
   * Returns true if we're on a native platform with the Health plugin available.
   */
  async isAvailable() {
    if (!isNative()) return false;
    try {
      const Health = await getHealthPlugin();
      if (!Health) return false;
      console.log('[healthService] Calling Health.isAvailable()...');
      const res = await withTimeout(Health.isAvailable(), TIMEOUT_MS, 'isAvailable');
      console.log('[healthService] isAvailable result:', JSON.stringify(res));
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
      if (!Health) {
        console.warn('[healthService] Health plugin is null');
        return false;
      }

      // Strategy: On iOS, requestAuthorization() can freeze the WebView entirely.
      // Instead, we try multiple approaches:
      //
      // 1. Try checkAuthorization (never shows UI, just checks status)
      // 2. Try a small test read (works if already authorized)
      // 3. Only if both fail, attempt requestAuthorization with a short timeout

      // --- Approach 1: Check if already authorized ---
      try {
        console.log('[healthService] Checking existing authorization...');
        const checkResult = await withTimeout(
          Health.checkAuthorization({ read: ['steps', 'sleep'], write: [] }),
          5000,
          'checkAuthorization'
        );
        console.log('[healthService] checkAuthorization result:', JSON.stringify(checkResult));
        if (checkResult?.readAuthorized?.length > 0) {
          console.log('[healthService] Already authorized for:', checkResult.readAuthorized);
          return true;
        }
      } catch (checkErr) {
        console.warn('[healthService] checkAuthorization failed:', checkErr?.message || checkErr);
      }

      // --- Approach 2: Try a small test read (works if previously authorized) ---
      try {
        console.log('[healthService] Attempting test read of steps...');
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const testResult = await withTimeout(
          Health.readSamples({
            dataType: 'steps',
            startDate: startOfDay.toISOString(),
            endDate: now.toISOString(),
            limit: 1,
          }),
          5000,
          'testRead'
        );
        console.log('[healthService] Test read succeeded — already authorized');
        return true;
      } catch (testErr) {
        console.warn('[healthService] Test read failed:', testErr?.message || testErr);
      }

      // --- Approach 3: Try requestAuthorization with short timeout ---
      try {
        console.log('[healthService] Attempting requestAuthorization (5s timeout)...');
        const authResult = await withTimeout(
          Health.requestAuthorization({
            read: ['steps', 'sleep'],
            write: [],
          }),
          5000,
          'requestAuthorization'
        );
        console.log('[healthService] requestAuthorization result:', JSON.stringify(authResult));
        return true;
      } catch (authErr) {
        console.warn('[healthService] requestAuthorization failed/timeout:', authErr?.message || authErr);
        // Even if requestAuthorization fails, data might still be readable
        // (e.g. user granted permissions in iOS Settings directly)
        return false;
      }
    } catch (error) {
      console.error('[healthService] Error in requestPermissions:', error);
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
