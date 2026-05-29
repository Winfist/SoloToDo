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
import { getLocalDateKey } from '../data/dateUtils.js';

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

function normalizeHistoryDays(days) {
  const parsed = Math.floor(Number(days) || 7);
  return Math.min(Math.max(parsed, 1), 180);
}

function getHistoryBounds(days, { sleepWindow = false } = {}) {
  const safeDays = normalizeHistoryDays(days);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - (safeDays - 1));
  start.setHours(sleepWindow ? 18 : 0, 0, 0, 0);

  if (sleepWindow) {
    start.setDate(start.getDate() - 1);
  }

  return { safeDays, start, end };
}

function isAsleepSample(entry) {
  const val = String(entry?.sleepState || entry?.value || '').toLowerCase();
  return val === 'asleep'
    || val.includes('asleep')
    || val === '1'
    || val === 'deep'
    || val === 'light'
    || val === 'rem';
}

function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [];

  for (const iv of sorted) {
    if (!Number.isFinite(iv.start) || !Number.isFinite(iv.end) || iv.end <= iv.start) continue;
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
      if (iv.rawEnd && (!last.rawEnd || iv.end >= last.end)) last.rawEnd = iv.rawEnd;
    } else {
      merged.push({ ...iv });
    }
  }

  return merged;
}

function mapToSortedRows(map, valueKey = 'value') {
  return Object.keys(map).sort().map(date => ({
    date,
    [valueKey]: map[date],
  }));
}

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

      // Step 3 is skipped completely.
      // requestAuthorization causes the iOS WebView to freeze unconditionally.
      // If the above tests failed, we return false.
      // The user must manually grant permissions in iOS Settings -> Health -> Data Access.
      onLog?.('Schritt 3: requestAuthorization übersprungen (verursacht WebView Freeze).');
      return false;
    } catch (error) {
      onLog?.(`KRITISCHER FEHLER: ${error?.message || error}`);
      return false;
    }
  },

  /**
   * Explicitly request authorization. Use this ONLY upon user action to
   * avoid freezing the WebView upon app startup.
   */
  async authorize(onLog) {
    if (!isNative()) return false;
    try {
      const Health = getHealthPlugin();
      if (!Health) return false;
      onLog?.('Explizite Health-Autorisierung gestartet...');
      const authResult = await withTimeout(
        Health.requestAuthorization({
          read: ['steps', 'sleep'],
          write: [],
        }),
        120000, // 2 Minuten Timeout, da der Nutzer manuell Toggles im iOS Popup aktivieren muss
        'requestAuthorization-Modal'
      );
      onLog?.(`requestAuthorization: ${JSON.stringify(authResult)}`);
      return true;
    } catch (err) {
      onLog?.(`Autorisierung fehlgeschlagen: ${err?.message || err}`);
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
   * Get today's steps broken down by hour. Returns a fixed 24-slot array of
   * { hour, value } (hour 0-23, local time). Empty array on failure.
   */
  async getTodayStepsByHour(onLog) {
    if (!isNative()) return [];
    try {
      const Health = getHealthPlugin();
      if (!Health) return [];

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      onLog?.('queryAggregated Stundenverlauf...');
      const result = await withTimeout(
        Health.queryAggregated({
          dataType: 'steps',
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          bucket: 'hour',
          aggregation: 'sum',
        }),
        CALL_TIMEOUT,
        'queryAggregated-steps-hourly'
      );

      const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, value: 0 }));
      if (result?.samples?.length) {
        result.samples.forEach(sample => {
          const h = new Date(sample.startDate).getHours();
          if (h >= 0 && h < 24) hourly[h].value += Math.floor(sample.value || 0);
        });
      }
      onLog?.(`Stundenverlauf: ${hourly.reduce((a, b) => a + b.value, 0)} Schritte über ${hourly.filter(b => b.value > 0).length} Stunden`);
      return hourly;
    } catch (error) {
      onLog?.(`Stundenverlauf FEHLER: ${error?.message || error}`);
      return [];
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

      let intervals = [];
      if (result?.samples) {
        result.samples.forEach(entry => {
          const val = String(entry.sleepState || entry.value || '').toLowerCase();
          if (val === 'asleep' || val.includes('asleep') || val === '1' || val === 'deep' || val === 'light' || val === 'rem') {
            const start = new Date(entry.startDate).getTime();
            const end = new Date(entry.endDate).getTime();
            intervals.push({ start, end });
          }
        });
      }

      // Merge overlapping intervals to prevent double counting
      intervals.sort((a, b) => a.start - b.start);
      let merged = [];
      for (let iv of intervals) {
        if (merged.length === 0) {
          merged.push(iv);
        } else {
          let last = merged[merged.length - 1];
          if (iv.start <= last.end) {
            last.end = Math.max(last.end, iv.end); // Merge overlap
          } else {
            merged.push(iv);
          }
        }
      }

      let totalSleepMs = merged.reduce((acc, iv) => acc + (iv.end - iv.start), 0);
      let totalSleepMinutes = totalSleepMs / (1000 * 60);

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
  },

  /**
   * Get daily steps for the last N days. Returns array of { date, value }
   * with local date keys (YYYY-MM-DD).
   */
  async getStepsHistory(days = 7, onLog) {
    if (!isNative()) return [];
    try {
      const Health = getHealthPlugin();
      if (!Health) return [];

      const { safeDays, start, end } = getHistoryBounds(days);

      onLog?.(`getStepsHistory gestartet (${safeDays} Tage)...`);
      const result = await withTimeout(
        Health.queryAggregated({
          dataType: 'steps',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          bucket: 'day',
          aggregation: 'sum',
        }),
        CALL_TIMEOUT,
        `queryAggregated-steps-${safeDays}d`
      );

      const dailyMap = {};
      if (result?.samples?.length) {
        result.samples.forEach(sample => {
          const dateKey = getLocalDateKey(sample.startDate);
          dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Math.floor(sample.value || 0);
        });
      }

      return mapToSortedRows(dailyMap, 'value');
    } catch (error) {
      onLog?.(`getStepsHistory FEHLER: ${error?.message || error}`);
      return [];
    }
  },

  /**
   * Get steps for the last 7 days. Returns array of { date, value }
   */
  async getWeeklySteps(onLog) {
    return this.getStepsHistory(7, onLog);
  },

  /**
   * Get sleep data for the last N days. Returns array of { date, hours }
   * with local date keys (YYYY-MM-DD).
   */
  async getSleepHistory(days = 7, onLog) {
    if (!isNative()) return [];
    try {
      const Health = getHealthPlugin();
      if (!Health) return [];

      const { safeDays, start, end } = getHistoryBounds(days, { sleepWindow: true });
      const limit = Math.min(2500, Math.max(500, safeDays * 12));

      onLog?.(`getSleepHistory gestartet (${safeDays} Tage)...`);
      const result = await withTimeout(
        Health.readSamples({
          dataType: 'sleep',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          limit,
          ascending: true,
        }),
        CALL_TIMEOUT,
        `readSamples-sleep-${safeDays}d`
      );

      const intervals = [];
      if (result?.samples) {
        result.samples.forEach(entry => {
          if (isAsleepSample(entry)) {
            const start = new Date(entry.startDate).getTime();
            const end = new Date(entry.endDate).getTime();
            intervals.push({ start, end, rawEnd: entry.endDate });
          }
        });
      }

      const merged = mergeIntervals(intervals);

      const dailyMap = {};
      merged.forEach(iv => {
        const dateKey = getLocalDateKey(iv.rawEnd || iv.end);
        if (!dailyMap[dateKey]) dailyMap[dateKey] = 0;
        dailyMap[dateKey] += Math.max(0, iv.end - iv.start);
      });

      return mapToSortedRows(dailyMap, 'hours').map(row => ({
        date: row.date,
        hours: parseFloat((row.hours / (1000 * 60 * 60)).toFixed(1)),
      }));
    } catch (error) {
      onLog?.(`getSleepHistory FEHLER: ${error?.message || error}`);
      return [];
    }
  },

  /**
   * Get sleep data for the last 7 days. Returns array of { date, hours }
   */
  async getWeeklySleep(onLog) {
    return this.getSleepHistory(7, onLog);
  }
};
