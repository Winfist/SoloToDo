import React, { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import { locationService } from '../services/locationService';

const IS_NATIVE = typeof window !== 'undefined' &&
  window.Capacitor &&
  window.Capacitor.isNativePlatform();

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

  // Check availability on mount
  useEffect(() => {
    healthService.isAvailable().then(setHealthAvailable);
  }, []);

  const loadNativeData = useCallback(async () => {
    setLoading(true);
    setError('');
    setSyncSuccess(false);

    let fetchedSteps = 0;
    let fetchedSleep = { hours: '0.0', minutes: 0 };
    let fetchedLocation = null;

    try {
      // 1. Health Data
      const healthGranted = await healthService.requestPermissions();
      if (healthGranted) {
        fetchedSteps = await healthService.getTodaySteps();
        fetchedSleep = await healthService.getLastNightSleep();
        setSteps(fetchedSteps);
        setSleep(fetchedSleep);
      } else if (IS_NATIVE) {
        setError('Health-Berechtigungen nicht gewährt. Bitte erlaube den Zugriff in den Geräte-Einstellungen.');
      }

      // 2. Location Data
      try {
        const locationGranted = await locationService.requestPermissions();
        if (locationGranted) {
          fetchedLocation = await locationService.getCurrentPosition();
          setLocation(fetchedLocation);
        }
      } catch (locErr) {
        console.warn('[NativeStatsDashboard] Location error:', locErr);
        // Location is optional, don't break the whole sync
      }

      const now = new Date().toLocaleString('de-DE');
      setLastSyncTime(now);
      setSyncSuccess(true);

      return { steps: fetchedSteps, sleep: fetchedSleep, location: fetchedLocation };
    } catch (err) {
      console.error('[NativeStatsDashboard] Sync error:', err);
      setError('Fehler beim Laden der Sensordaten: ' + (err.message || String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncAndReward = async () => {
    try {
      const data = await loadNativeData();
      if (!data) return; // error was already set

      const fetchedSteps = data.steps;
      const now = new Date().toLocaleString('de-DE');

      if (fetchedSteps > 0 && state && persist) {
        // Save sync timestamp
        persist({ ...state, lastNativeSync: now });
      }

      // Show result
      if (!IS_NATIVE) {
        setError('');
        // On web, show info that real data only works on the phone
      }
    } catch (err) {
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
    </div>
  );
}
