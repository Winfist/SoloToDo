import { Capacitor, registerPlugin } from '@capacitor/core';

const ScreenTimeNative = registerPlugin('ScreenTimePlugin');

const DEFAULT_CAPABILITIES = {
  nativeAvailable: false,
  authorizationStatus: 'unavailable',
  dataAccessAvailable: false,
  canExportDurations: false,
  reason: 'screen-time-native-unavailable',
};

const CALL_TIMEOUT = 10000;

function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function isIOS() {
  try {
    return Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
}

function withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms / 1000}s)`)), ms)
    ),
  ]);
}

function normalizeCapabilities(raw = {}) {
  return {
    ...DEFAULT_CAPABILITIES,
    ...raw,
    nativeAvailable: raw.nativeAvailable === true,
    dataAccessAvailable: raw.dataAccessAvailable === true,
    canExportDurations: raw.canExportDurations === true,
    authorizationStatus: raw.authorizationStatus || DEFAULT_CAPABILITIES.authorizationStatus,
    reason: raw.reason || DEFAULT_CAPABILITIES.reason,
  };
}

function normalizeDay(raw = {}, fallbackDate) {
  const totalMinutes = Math.max(0, Math.floor(Number(raw.totalMinutes) || 0));
  return {
    date: raw.date || fallbackDate,
    totalMinutes,
    source: raw.source || 'native-screen-time',
    apps: Array.isArray(raw.apps) ? raw.apps : undefined,
    categories: Array.isArray(raw.categories) ? raw.categories : undefined,
  };
}

function normalizeHistory(raw = {}) {
  const days = Array.isArray(raw.days) ? raw.days : Array.isArray(raw.history) ? raw.history : [];
  return {
    ...raw,
    days: days
      .map(row => normalizeDay(row))
      .filter(row => row.date && row.totalMinutes > 0),
    capabilities: normalizeCapabilities(raw.capabilities || raw),
  };
}

async function callNative(method, payload, onLog) {
  if (!isNative()) {
    onLog?.('Web: Native Bildschirmzeit ist nicht verfuegbar.');
    return null;
  }
  if (!isIOS()) {
    onLog?.('Nur iOS ist fuer native Bildschirmzeit aktiviert.');
    throw new Error('ios-only');
  }
  try {
    onLog?.(`ScreenTimePlugin.${method}()`);
    return await withTimeout(ScreenTimeNative[method](payload || {}), CALL_TIMEOUT, method);
  } catch (err) {
    onLog?.(`ScreenTimePlugin.${method} fehlgeschlagen: ${err?.message || err}`);
    throw err;
  }
}

export const screenTimeService = {
  async getCapabilities(onLog) {
    if (!isNative()) {
      return {
        ...DEFAULT_CAPABILITIES,
        reason: 'web-platform',
      };
    }
    if (!isIOS()) {
      return {
        ...DEFAULT_CAPABILITIES,
        reason: 'ios-only',
      };
    }
    try {
      const result = await callNative('getCapabilities', {}, onLog);
      return normalizeCapabilities(result);
    } catch (err) {
      return {
        ...DEFAULT_CAPABILITIES,
        nativeAvailable: true,
        reason: err?.message || 'native-capability-check-failed',
      };
    }
  },

  async requestAuthorization(onLog) {
    if (!isNative()) {
      return {
        ...DEFAULT_CAPABILITIES,
        reason: 'web-platform',
      };
    }
    if (!isIOS()) {
      return {
        ...DEFAULT_CAPABILITIES,
        reason: 'ios-only',
      };
    }
    try {
      const result = await callNative('requestAuthorization', {}, onLog);
      return normalizeCapabilities(result);
    } catch (err) {
      return {
        ...DEFAULT_CAPABILITIES,
        nativeAvailable: true,
        reason: err?.message || 'screen-time-authorization-failed',
      };
    }
  },

  async syncToday(onLog) {
    const capabilities = await this.getCapabilities(onLog);
    if (!capabilities.canExportDurations) {
      return {
        capabilities,
        day: null,
        reason: capabilities.reason,
      };
    }
    const result = await callNative('syncToday', {}, onLog);
    return {
      ...result,
      capabilities: normalizeCapabilities(result?.capabilities || capabilities),
      day: normalizeDay(result?.day || result, result?.date),
    };
  },

  async syncHistory(days = 14, onLog) {
    const safeDays = Math.min(Math.max(Math.floor(Number(days) || 14), 1), 90);
    const capabilities = await this.getCapabilities(onLog);
    if (!capabilities.canExportDurations) {
      return {
        capabilities,
        days: [],
        reason: capabilities.reason,
      };
    }
    const result = await callNative('syncHistory', { days: safeDays }, onLog);
    return normalizeHistory({
      ...result,
      capabilities: result?.capabilities || capabilities,
    });
  },
};
