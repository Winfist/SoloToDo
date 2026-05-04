import React, { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import { locationService } from '../services/locationService';

import { Capacitor } from '@capacitor/core';

const IS_NATIVE = Capacitor.isNativePlatform();

// ─── SCREEN TIME OCR ──────────────────────────────────────────
// Lazy-loaded only when user uploads a file
function ScreenTimeSection({ onTimeParsed }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState('');

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setResultText('');

    try {
      const imageUrl = URL.createObjectURL(file);

      // Dynamic import so Tesseract only loads when needed
      const Tesseract = (await import('tesseract.js')).default;

      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'deu',
        { logger: m => console.log('[OCR]', m.status, Math.round((m.progress || 0) * 100) + '%') }
      );

      // Parse patterns like "4h 30m", "4 Std. 30 Min.", "2:45"
      const timeRegex = /(\d+)\s*(h|std\.?|stunden?)\s*(?:(\d+)\s*(m|min\.?|minuten?))?/i;
      const colonRegex = /(\d{1,2}):(\d{2})/;
      let match = text.match(timeRegex);

      if (match) {
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[3] || '0', 10);
        const totalMinutes = (hours * 60) + minutes;
        setResultText(`✅ Erkannt: ${hours}h ${minutes}m (${totalMinutes} Minuten)`);
        if (onTimeParsed) onTimeParsed(totalMinutes);
      } else {
        match = text.match(colonRegex);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const totalMinutes = (hours * 60) + minutes;
          setResultText(`✅ Erkannt: ${hours}h ${minutes}m (${totalMinutes} Minuten)`);
          if (onTimeParsed) onTimeParsed(totalMinutes);
        } else {
          setError('Konnte keine Bildschirmzeit erkennen. Achte darauf, dass die Dauer gut lesbar ist.');
        }
      }
    } catch (err) {
      console.error('[ScreenTimeSection]', err);
      setError('Fehler bei der Bildverarbeitung: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
        BILDSCHIRMZEIT (OCR)
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
        Lade einen Screenshot deiner Bildschirmzeit hoch. Die Zeit wird per OCR ausgelesen.
      </div>
      <label style={{
        display: 'block', padding: '12px', borderRadius: 10,
        background: 'rgba(167,139,250,0.08)', border: '1px dashed rgba(167,139,250,0.3)',
        color: '#a78bfa', fontSize: 11, fontWeight: 700, textAlign: 'center',
        fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
        {isProcessing ? '⏳ Wird analysiert...' : '📷 SCREENSHOT HOCHLADEN'}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />
      </label>
      {error && <div style={{ marginTop: 8, fontSize: 11, color: '#f87171' }}>❌ {error}</div>}
      {resultText && <div style={{ marginTop: 8, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{resultText}</div>}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ icon, label, value, subtext, color }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '14px 12px',
      border: `1px solid ${color}18`, textAlign: 'center',
      transition: 'border-color 0.3s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "'Cinzel',serif" }}>{value}</div>
      <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", marginTop: 3, letterSpacing: 1 }}>{label}</div>
      {subtext && <div style={{ fontSize: 9, color: '#475569', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{subtext}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function NativeStatsDashboard({ state, persist }) {
  const [steps, setSteps] = useState(0);
  const [sleep, setSleep] = useState({ hours: '0.0', minutes: 0 });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(state?.lastNativeSync || null);
  const [healthAvailable, setHealthAvailable] = useState(null); // null = unknown
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [diagLog, setDiagLog] = useState([]);

  const addLog = useCallback((msg) => {
    setDiagLog(prev => [...prev, `[${new Date().toLocaleTimeString('de-DE')}] ${msg}`]);
  }, []);

  // Check availability on mount
  useEffect(() => {
    addLog(`Platform: ${IS_NATIVE ? 'NATIVE' : 'WEB'}`);
    healthService.isAvailable()
      .then(avail => {
        addLog(`Health available: ${avail}`);
        setHealthAvailable(avail);
      })
      .catch(err => {
        addLog(`Health check ERROR: ${err?.message || err}`);
        setHealthAvailable(false);
      });
  }, [addLog]);

  const loadNativeData = useCallback(async () => {
    setLoading(true);
    setError('');
    setSyncSuccess(false);
    setDiagLog([]);
    addLog('Sync gestartet...');
    addLog(`isNative: ${IS_NATIVE}`);
    addLog(`Platform: ${Capacitor.getPlatform()}`);

    let fetchedSteps = 0;
    let fetchedSleep = { hours: '0.0', minutes: 0 };
    let fetchedLocation = null;

    try {
      // 1. Health Data
      addLog('Requesting health permissions...');
      const t0 = Date.now();
      let healthGranted = false;
      try {
        healthGranted = await healthService.requestPermissions();
        addLog(`Health permissions COMPLETED in ${Date.now() - t0}ms → ${healthGranted}`);
      } catch (permErr) {
        const elapsed = Date.now() - t0;
        const isTimeout = permErr?.message?.includes('Timeout');
        addLog(`Health permissions ${isTimeout ? 'TIMEOUT' : 'ERROR'} after ${elapsed}ms: ${permErr?.message || permErr}`);
        if (isTimeout) {
          setError('HealthKit-Berechtigung Timeout. Bitte öffne die iOS Health-App → SoloToDo, prüfe die Berechtigungen und versuche es erneut.');
        }
      }

      if (healthGranted) {
        addLog('Fetching steps...');
        try {
          fetchedSteps = await healthService.getTodaySteps();
          addLog(`Steps: ${fetchedSteps}`);
        } catch (stepErr) {
          addLog(`Steps ERROR: ${stepErr?.message || stepErr}`);
        }

        addLog('Fetching sleep...');
        try {
          fetchedSleep = await healthService.getLastNightSleep();
          addLog(`Sleep: ${fetchedSleep.hours}h`);
        } catch (sleepErr) {
          addLog(`Sleep ERROR: ${sleepErr?.message || sleepErr}`);
        }

        setSteps(fetchedSteps);
        setSleep(fetchedSleep);
      } else if (IS_NATIVE) {
        addLog('Health permissions DENIED or plugin not available');
        if (!error) {
          setError('Health-Berechtigungen nicht gewährt. Bitte erlaube den Zugriff in den Geräte-Einstellungen.');
        }
      } else {
        addLog('Not native — skipping health data');
      }

      // 2. Location Data
      try {
        addLog('Requesting location...');
        const locationGranted = await locationService.requestPermissions();
        addLog(`Location permission: ${locationGranted}`);
        if (locationGranted) {
          fetchedLocation = await locationService.getCurrentPosition();
          addLog(`Location: ${fetchedLocation?.lat?.toFixed(4)}, ${fetchedLocation?.lng?.toFixed(4)}`);
          setLocation(fetchedLocation);
        }
      } catch (locErr) {
        addLog(`Location error: ${locErr?.message || locErr}`);
      }

      const now = new Date().toLocaleString('de-DE');
      setLastSyncTime(now);
      setSyncSuccess(true);
      addLog('Sync abgeschlossen ✓');

      return { steps: fetchedSteps, sleep: fetchedSleep, location: fetchedLocation };
    } catch (err) {
      addLog(`SYNC ERROR: ${err?.message || err}`);
      console.error('[NativeStatsDashboard] Sync error:', err);
      setError('Fehler beim Laden der Sensordaten: ' + (err.message || String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [addLog, error]);

  const syncAndReward = async () => {
    try {
      const data = await loadNativeData();
      if (!data) return;

      const fetchedSteps = data.steps;
      const now = new Date().toLocaleString('de-DE');

      if (fetchedSteps > 0 && state && persist) {
        persist({ ...state, lastNativeSync: now });
      }

      if (!IS_NATIVE) {
        setError('');
      }
    } catch (err) {
      addLog(`syncAndReward ERROR: ${err?.message || err}`);
      console.error('[NativeStatsDashboard] syncAndReward error:', err);
      setError('Sync fehlgeschlagen: ' + (err.message || String(err)));
    }
  };

  const handleScreenTimeParsed = (minutes) => {
    console.log('[NativeStatsDashboard] Screen time parsed:', minutes, 'minutes');
    if (minutes < 240 && state && persist) {
      // Under 4 hours = reward
      setSyncSuccess(true);
    }
  };

  // ─── Platform status badge ───
  const renderPlatformBadge = () => {
    if (healthAvailable === null) return null;

    if (healthAvailable) {
      return (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          fontSize: 9, color: '#22c55e', fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: 1,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          HEALTH CONNECTED
        </div>
      );
    }

    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20,
        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
        fontSize: 9, color: '#f59e0b', fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: 1,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
        WEB MODUS
      </div>
    );
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
            NATIVE SENSOREN
          </div>
        </div>
        {renderPlatformBadge()}
      </div>

      {/* Web-Info wenn nicht nativ */}
      {healthAvailable === false && (
        <div style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
          fontSize: 11, color: '#f59e0b', lineHeight: 1.5,
        }}>
          <strong>📱 Web-Modus aktiv.</strong> Health-Daten (Schritte, Schlaf) sind nur auf dem Smartphone über die native App verfügbar.
          Standort kann im Browser abgefragt werden.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 11, color: '#f87171', lineHeight: 1.4,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <StatCard
          icon="👟"
          label="SCHRITTE"
          value={steps.toLocaleString()}
          subtext={steps > 0 ? `+${Math.floor(steps / 1000)} Ausdauer` : null}
          color="#38bdf8"
        />
        <StatCard
          icon="💤"
          label="SCHLAF"
          value={`${sleep.hours}h`}
          subtext={parseFloat(sleep.hours) >= 7 ? '+10% HP Regen' : null}
          color="#a78bfa"
        />
      </div>

      {/* Location */}
      <div style={{
        padding: '12px 14px', borderRadius: 12, marginBottom: 14,
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>
          STANDORT
        </div>
        <div style={{ fontSize: 12, color: location ? '#22c55e' : '#475569', fontFamily: "'JetBrains Mono',monospace" }}>
          {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Noch nicht abgefragt'}
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>
          (Wird für Erkundungs-Quests genutzt)
        </div>
      </div>

      {/* Screen Time Upload */}
      <ScreenTimeSection onTimeParsed={handleScreenTimeParsed} />

      {/* Sync Button */}
      <button
        onClick={syncAndReward}
        disabled={loading}
        style={{
          marginTop: 16, width: '100%', padding: '14px', borderRadius: 12,
          background: loading
            ? 'rgba(34,197,94,0.15)'
            : syncSuccess
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(34,197,94,0.08)',
          border: `1px solid rgba(34,197,94,${loading ? '0.4' : '0.25'})`,
          color: '#22c55e', fontSize: 11, fontWeight: 700,
          fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
            SYNCHRONISIERUNG...
          </>
        ) : syncSuccess ? (
          <>✅ DATEN AKTUALISIERT</>
        ) : (
          <>🔄 DATEN SYNCHRONISIEREN</>
        )}
      </button>

      {/* Last sync info */}
      {lastSyncTime && (
        <div style={{
          textAlign: 'center', marginTop: 8,
          fontSize: 9, color: '#475569', fontFamily: "'JetBrains Mono',monospace",
        }}>
          Letzter Sync: {lastSyncTime}
        </div>
      )}

      {/* ── Diagnostic Log ── */}
      {diagLog.length > 0 && (
        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 12,
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(99,102,241,0.2)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, color: '#6366f1',
            fontFamily: "'JetBrains Mono',monospace", marginBottom: 8,
          }}>
            DIAGNOSE LOG
          </div>
          {diagLog.map((line, i) => (
            <div key={i} style={{
              fontSize: 9, color: line.includes('ERROR') || line.includes('DENIED')
                ? '#f87171'
                : line.includes('✓')
                  ? '#22c55e'
                  : '#94a3b8',
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1.6,
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              padding: '2px 0',
            }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
