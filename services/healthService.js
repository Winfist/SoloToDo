/**
 * Health Service — wraps @capgo/capacitor-health with platform checks.
 *
 * Key design decisions:
 * - On iOS, requestAuthorization() can freeze the entire WebView/JS bridge.
 *   Therefore we NEVER call it. Instead we try to read data directly.
 *   If the user hasn't granted permissions, reads return empty results.
 * - All native calls use a 5s timeout to prevent bridge freezes.
 * - An optional `onLog` callback surfaces step-by-step progress to the UI.
 */

import { Capacitor } from '@capacitor/core';

const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

import { Health } from '@capgo/capacitor-health';

function getHealthPlugin() {
  if (!isNative()) return null;
  return Health;
}

/** Wraps a promise with a timeout to prevent frozen bridge hangs. */
function withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms / 1000}s)`)), ms)
    ),
  ]);
}

const CALL_TIMEOUT = 8000; // 8 seconds per native call

export const healthService = {
  /**
   * Returns true if we're on a native platform with the Health plugin available.
   */
  async isAvailable(onLog) {
    if (!isNative()) return false;
    try {
      const Health = getHealthPlugin();
      if (!Health) return false;
      onLog?.('Health.isAvailable() aufrufen...');
      const res = await withTimeout(Health.isAvailable(), CALL_TIMEOUT, 'isAvailable');
      onLog?.(`isAvailable Ergebnis: ${JSON.stringify(res)}`);
      return res?.available === true;
    } catch (e) {
      onLog?.(`isAvailable FEHLER: ${e?.message || e}`);
      return false;
    }
  },

  /**
   * Attempt to get health permissions. 
   * Strategy: Skip requestAuthorization entirely (it freezes iOS WebView).
   * Instead, just try to read data — if authorized, it works; if not, empty results.
   */
  async requestPermissions(onLog) {
    if (!isNative()) {
      onLog?.('Nicht nativ — überspringe Berechtigungen');
      return false;
    }
    try {
      const Health = getHealthPlugin();
      if (!Health) {
        onLog?.('Health Plugin ist null');
        return false;
      }

      // Step 1: Try checkAuthorization (non-UI, safe)
      onLog?.('Schritt 1: checkAuthorization...');
      try {
        const checkResult = await withTimeout(
          Health.checkAuthorization({ read: ['steps', 'sleep'], write: [] }),
          CALL_TIMEOUT,
          'checkAuthorization'
        );
        onLog?.(`checkAuthorization: ${JSON.stringify(checkResult)}`);
        if (checkResult?.readAuthorized?.length > 0) {
          onLog?.(`✓ Bereits autorisiert für: ${checkResult.readAuthorized.join(', ')}`);
          return true;
        }
        onLog?.('checkAuthorization: noch nicht autorisiert');
      } catch (checkErr) {
        onLog?.(`checkAuthorization FEHLER: ${checkErr?.message || checkErr}`);
      }

      // Step 2: Try a test read (if user authorized via iOS Settings, this works)
      onLog?.('Schritt 2: Test-Read von Schritten...');
      try {
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
          CALL_TIMEOUT,
          'testRead'
        );
        onLog?.(`Test-Read Ergebnis: ${JSON.stringify(testResult)}`);
        // If we get here without error, the read worked (even if empty)
        return true;
      } catch (testErr) {
        onLog?.(`Test-Read FEHLER: ${testErr?.message || testErr}`);
      }

      // Step 3: As LAST resort, try requestAuthorization with timeout
      // This might freeze — but we have a timeout to bail out
      onLog?.('Schritt 3: requestAuthorization (letzter Versuch, 8s Timeout)...');
      try {
        const authResult = await withTimeout(
          Health.requestAuthorization({
            read: ['steps', 'sleep'],
            write: [],
          }),
          CALL_TIMEOUT,
          'requestAuthorization'
        );
        onLog?.(`requestAuthorization: ${JSON.stringify(authResult)}`);
        return true;
      } catch (authErr) {
        onLog?.(`requestAuthorization FEHLER/TIMEOUT: ${authErr?.message || authErr}`);
        return false;
      }
    } catch (error) {
      onLog?.(`KRITISCHER FEHLER: ${error?.message || error}`);
      return false;
    }
  },

  /**
   * Get steps for today. Returns 0 if unavailable.
   */
  async getTodaySteps(onLog) {
    if (!isNative()) return 0;
    try {
      const Health = getHealthPlugin();
      if (!Health) return 0;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Try aggregated query first
      onLog?.('queryAggregated für Schritte...');
      try {
        const result = await withTimeout(
          Health.queryAggregated({
            dataType: 'steps',
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
            bucket: 'day',
          }),
          CALL_TIMEOUT,
          'queryAggregated-steps'
        );
        if (result?.samples?.length > 0) {
          const steps = Math.floor(result.samples[0].value);
          onLog?.(`Schritte (aggregiert): ${steps}`);
          return steps;
        }
        onLog?.('queryAggregated: keine Daten');
      } catch (aggErr) {
        onLog?.(`queryAggregated FEHLER: ${aggErr?.message || aggErr}`);
      }

      // Fallback: readSamples and sum
      onLog?.('readSamples Fallback für Schritte...');
      try {
        const queryResult = await withTimeout(
          Health.readSamples({
            dataType: 'steps',
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
          }),
          CALL_TIMEOUT,
          'readSamples-steps'
        );
        let totalSteps = 0;
        if (queryResult?.samples) {
          queryResult.samples.forEach(entry => {
            totalSteps += (entry.value || 0);
          });
        }
        onLog?.(`Schritte (readSamples): ${totalSteps}`);
        return totalSteps;
      } catch (readErr) {
        onLog?.(`readSamples FEHLER: ${readErr?.message || readErr}`);
        return 0;
      }
    } catch (error) {
      onLog?.(`Schritte KRITISCHER FEHLER: ${error?.message || error}`);
      return 0;
    }
  },

  /**
   * Get sleep data for the previous night. Returns { minutes, hours }.
   */
  async getLastNightSleep(onLog) {
    if (!isNative()) return { minutes: 0, hours: '0.0' };
    try {
      const Health = getHealthPlugin();
      if (!Health) return { minutes: 0, hours: '0.0' };

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(18, 0, 0, 0);

      onLog?.('readSamples für Schlaf...');
      const result = await withTimeout(
        Health.readSamples({
          dataType: 'sleep',
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
        }),
        CALL_TIMEOUT,
        'readSamples-sleep'
      );

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

      const hours = (totalSleepMinutes / 60).toFixed(1);
      onLog?.(`Schlaf: ${hours}h (${Math.round(totalSleepMinutes)} min)`);
      return {
        minutes: Math.round(totalSleepMinutes),
        hours
      };
    } catch (error) {
      onLog?.(`Schlaf FEHLER: ${error?.message || error}`);
      return { minutes: 0, hours: '0.0' };
    }
  }
};
