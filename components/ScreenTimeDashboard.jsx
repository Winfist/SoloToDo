import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { screenTimeService } from '../services/screenTimeService.js';
import { addLocalDays, getLocalDateKey, getToday, getYesterdayKey } from '../data/dateUtils.js';

const DEFAULT_LIMIT = 180;
const HISTORY_RANGES = [
  { key: '7d', label: '7T', days: 7 },
  { key: '14d', label: '14T', days: 14 },
  { key: '30d', label: '30T', days: 30 },
];
const DAY_LABELS = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];

const SCREEN_TIME_CSS = `
@keyframes screenTimeSpin { to { transform: rotate(360deg); } }
@keyframes screenTimeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

function getLimit(state) {
  return Math.max(1, Math.floor(Number(state?.screenTimePreferences?.dailyLimitMinutes) || DEFAULT_LIMIT));
}

function formatMinutes(total = 0) {
  const minutes = Math.max(0, Math.floor(Number(total) || 0));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateShort(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '--';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

function getRangeConfig(key) {
  return HISTORY_RANGES.find(r => r.key === key) || HISTORY_RANGES[0];
}

function getHistoryMap(state) {
  const history = { ...(state?.screenTimeDailyHistory || {}) };
  const todayKey = getToday();
  if (!history[todayKey] && Number.isFinite(Number(state?.dailyScreenTimeMinutes))) {
    history[todayKey] = {
      date: todayKey,
      totalMinutes: Math.max(0, Math.floor(Number(state.dailyScreenTimeMinutes) || 0)),
      limitMinutes: getLimit(state),
      underLimit: Math.max(0, Math.floor(Number(state.dailyScreenTimeMinutes) || 0)) <= getLimit(state),
      source: 'cache',
    };
  }
  return history;
}

function buildRows(state, days = 7, offsetDays = 0) {
  const history = getHistoryMap(state);
  const limit = getLimit(state);
  const labelEvery = days <= 14 ? 1 : 5;
  const rows = [];
  for (let i = days - 1 + offsetDays; i >= offsetDays; i--) {
    const date = addLocalDays(new Date(), -i);
    const dateKey = getLocalDateKey(date);
    const saved = history[dateKey] || {};
    const totalMinutes = Math.max(0, Math.floor(Number(saved.totalMinutes) || 0));
    const showLabel = i === 0 || (i - offsetDays) % labelEvery === 0;
    rows.push({
      date: dateKey,
      label: i === 0 ? 'HEUTE' : (days <= 14 ? DAY_LABELS[date.getDay()] : formatDateShort(dateKey)),
      totalMinutes,
      limitMinutes: Math.max(1, Math.floor(Number(saved.limitMinutes) || limit)),
      underLimit: saved.underLimit ?? (totalMinutes <= limit),
      source: saved.source || null,
      syncedAt: saved.syncedAt || null,
      apps: saved.apps || [],
      categories: saved.categories || [],
      confidence: saved.confidence,
      showLabel,
    });
  }
  return rows;
}

function summarize(rows) {
  const total = rows.reduce((sum, row) => sum + (Number(row.totalMinutes) || 0), 0);
  const avg = rows.length ? Math.round(total / rows.length) : 0;
  const underLimitDays = rows.filter(row => row.totalMinutes > 0 && row.underLimit).length;
  const dataDays = rows.filter(row => row.totalMinutes > 0).length;
  return { total, avg, underLimitDays, dataDays };
}

function getTrendLabel(currentTotal, previousTotal) {
  if (!previousTotal) return currentTotal > 0 ? 'NEU' : '0%';
  const pct = ((currentTotal - previousTotal) / previousTotal) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

function ProgressRing({ progress, color, children }) {
  const radius = 48;
  const stroke = 5;
  const normalized = radius - stroke;
  const circumference = normalized * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: radius * 2, height: radius * 2, flexShrink: 0 }}>
      <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={radius} cy={radius} r={normalized} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={radius}
          cy={radius}
          r={normalized}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function ScreenTimeBars({ rows, color }) {
  const maxValue = Math.max(...rows.map(row => row.totalMinutes), 1);
  return (
    <div style={{ height: 150, position: 'relative', padding: '14px 0 0' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, borderTop: '1px dashed rgba(255,255,255,0.06)' }} />
      <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 24 }}>
        {rows.map((row, index) => {
          const height = row.totalMinutes > 0 ? Math.max(6, (row.totalMinutes / maxValue) * 100) : 4;
          const isToday = row.date === getToday();
          const rowColor = row.underLimit ? color : '#ef4444';
          return (
            <div key={row.date} style={{ flex: '1 1 0', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', animation: `screenTimeSlideUp 0.35s ease ${Math.min(index, 12) * 0.035}s both` }}>
              <div style={{ height: 12, fontSize: 7, color: isToday ? '#fff' : 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
                {row.totalMinutes > 0 && (isToday || rows.length <= 14) ? formatMinutes(row.totalMinutes) : ''}
              </div>
              <div
                title={`${row.date}: ${formatMinutes(row.totalMinutes)}`}
                style={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${height}%`,
                  minHeight: 4,
                  borderRadius: '6px 6px 2px 2px',
                  background: row.totalMinutes > 0 ? `linear-gradient(180deg, ${rowColor}, ${rowColor}66)` : `${color}14`,
                  boxShadow: isToday && row.totalMinutes > 0 ? `0 0 14px ${rowColor}55` : 'none',
                  opacity: row.totalMinutes > 0 ? 1 : 0.45,
                }}
              />
              <div style={{ height: 12, fontSize: 8, color: isToday ? '#fff' : '#64748b', fontFamily: "'JetBrains Mono',monospace", marginTop: 6, fontWeight: isToday ? 800 : 500 }}>
                {row.showLabel ? row.label : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BreakdownList({ title, items = [], color }) {
  const visible = (items || []).filter(item => item?.name).slice(0, 5);
  if (!visible.length) return null;
  const max = Math.max(...visible.map(item => item.minutes || 0), 1);
  return (
    <div style={{ background: 'rgba(0,0,0,0.28)', border: `1px solid ${color}22`, borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 9, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {visible.map(item => (
          <div key={item.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, color: '#cbd5e1', marginBottom: 4 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              <span style={{ color }}>{formatMinutes(item.minutes)}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (item.minutes / max) * 100)}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScreenTimeDashboard({ state, persist, updateScreenTimeData, claimScreenTimeReward, geminiAI }) {
  const prefs = state?.screenTimePreferences || {};
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [diagLog, setDiagLog] = useState([]);
  const [fallbackFile, setFallbackFile] = useState(null);
  const [fallbackDate, setFallbackDate] = useState(getToday());
  const [localLimit, setLocalLimit] = useState(getLimit(state));
  const lastPersistKey = useRef('');

  const color = '#f59e0b';
  const danger = '#ef4444';
  const historyRange = prefs.screenTimeHistoryRange || '7d';
  const range = getRangeConfig(historyRange);
  const rows = useMemo(() => buildRows(state, range.days, 0), [state?.screenTimeDailyHistory, state?.dailyScreenTimeMinutes, state?.screenTimePreferences, range.days]);
  const previousRows = useMemo(() => buildRows(state, 7, 7), [state?.screenTimeDailyHistory, state?.screenTimePreferences]);
  const currentWeek = useMemo(() => summarize(buildRows(state, 7, 0)), [state?.screenTimeDailyHistory, state?.screenTimePreferences]);
  const previousWeek = useMemo(() => summarize(previousRows), [previousRows]);
  const today = rows[rows.length - 1] || { totalMinutes: 0, limitMinutes: getLimit(state), underLimit: true };
  const limit = getLimit(state);
  const progress = Math.min(100, (today.totalMinutes / limit) * 100);
  const statusColor = today.totalMinutes > limit ? danger : color;
  const capabilities = prefs.lastCapability || null;
  const canExport = capabilities?.canExportDurations === true;
  const nativeBlocked = capabilities && capabilities.canExportDurations !== true;
  const fallbackAvailable = nativeBlocked && (state?.ai?.enabled ?? true) && typeof geminiAI?.extractScreenTimeScreenshot === 'function';
  const yesterdayKey = getYesterdayKey();
  const yesterday = state?.screenTimeDailyHistory?.[yesterdayKey] || null;
  const yesterdayRewardKey = `screen_time_${yesterdayKey}`;
  const canClaimYesterday = yesterday?.underLimit === true && !state?.screenTimeRewardsClaimed?.[yesterdayRewardKey];

  useEffect(() => {
    setLocalLimit(getLimit(state));
  }, [state?.screenTimePreferences?.dailyLimitMinutes]);

  const addLog = useCallback((msg) => {
    setDiagLog(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString('de-DE')}] ${msg}`]);
  }, []);

  const persistPrefs = useCallback((patch) => {
    const nextPrefs = {
      ...(state?.screenTimePreferences || {}),
      ...patch,
    };
    persist?.({
      ...state,
      screenTimePreferences: nextPrefs,
    });
  }, [persist, state]);

  const handleCapabilities = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const cap = await screenTimeService.getCapabilities(addLog);
      persistPrefs({ lastCapability: { ...cap, checkedAt: new Date().toLocaleString('de-DE') } });
      setSuccess(cap.canExportDurations ? 'Native Minutenwerte verfuegbar.' : 'Native Minutenwerte derzeit nicht exportierbar.');
      return cap;
    } finally {
      setLoading(false);
    }
  }, [addLog, persistPrefs]);

  const handleAuthorize = useCallback(async () => {
    setAuthLoading(true);
    setError('');
    setSuccess('');
    try {
      const cap = await screenTimeService.requestAuthorization(addLog);
      persistPrefs({ enabled: true, lastCapability: { ...cap, checkedAt: new Date().toLocaleString('de-DE') } });
      setSuccess(cap.canExportDurations ? 'Freigabe aktiv. Sync kann starten.' : 'Freigabe geprueft, aber kein exportierbarer Minutenpfad.');
      return cap;
    } catch (err) {
      setError(err?.message || String(err));
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [addLog, persistPrefs]);

  const syncToday = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await screenTimeService.syncToday(addLog);
      persistPrefs({ enabled: true, lastCapability: { ...(result.capabilities || {}), checkedAt: new Date().toLocaleString('de-DE') } });
      if (!result?.capabilities?.canExportDurations) {
        setSuccess('Native Quelle geprueft. Direkter Minutenexport ist nicht verfuegbar.');
        return;
      }
      const day = result.day || result;
      const totalMinutes = Math.max(0, Math.floor(Number(day?.totalMinutes) || 0));
      updateScreenTimeData?.(totalMinutes, {
        dateKey: day?.date || getToday(),
        limitMinutes: limit,
        source: day?.source || 'native-screen-time',
        apps: day?.apps,
        categories: day?.categories,
        capabilities: result.capabilities,
      });
      setSuccess(`Heute synchronisiert: ${formatMinutes(totalMinutes)}.`);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [addLog, limit, persistPrefs, updateScreenTimeData]);

  const syncHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await screenTimeService.syncHistory(range.days * 2, addLog);
      persistPrefs({ enabled: true, lastCapability: { ...(result.capabilities || {}), checkedAt: new Date().toLocaleString('de-DE') } });
      if (!result?.capabilities?.canExportDurations) {
        setSuccess('Verlauf geprueft. Direkter Minutenexport ist nicht verfuegbar.');
        return;
      }
      const days = Array.isArray(result.days) ? result.days : [];
      if (!days.length) {
        setSuccess('Keine Bildschirmzeitwerte im Verlauf gefunden.');
        return;
      }
      const persistKey = days.map(day => `${day.date}:${day.totalMinutes}`).join('|');
      if (lastPersistKey.current !== persistKey) {
        lastPersistKey.current = persistKey;
        updateScreenTimeData?.(undefined, {
          history: days.map(day => ({ ...day, limitMinutes: limit, source: day.source || 'native-screen-time' })),
          capabilities: result.capabilities,
        });
      }
      setSuccess(`${days.length} Tageswerte synchronisiert.`);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [addLog, limit, persistPrefs, range.days, updateScreenTimeData]);

  const saveLimit = () => {
    const nextLimit = Math.max(30, Math.min(1440, Math.floor(Number(localLimit) || DEFAULT_LIMIT)));
    persistPrefs({ dailyLimitMinutes: nextLimit });
    updateScreenTimeData?.(undefined, { preferences: { dailyLimitMinutes: nextLimit } });
    setLocalLimit(nextLimit);
    setSuccess(`Tageslimit gespeichert: ${formatMinutes(nextLimit)}.`);
  };

  const uploadFallback = async () => {
    if (!fallbackFile || !fallbackAvailable || geminiAI?.isRateLimited?.()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await geminiAI.extractScreenTimeScreenshot(fallbackFile);
      if (!result?.valid || !Number.isFinite(Number(result.totalMinutes)) || Number(result.confidence || 0) < 60) {
        setError(result?.reason || 'Screenshot konnte nicht sicher als Bildschirmzeit erkannt werden.');
        return;
      }
      const dateKey = result.date || fallbackDate || getToday();
      updateScreenTimeData?.(Math.max(0, Math.floor(Number(result.totalMinutes) || 0)), {
        dateKey,
        limitMinutes: limit,
        source: 'screenshot-ai',
        confidence: result.confidence,
        apps: result.apps,
        categories: result.categories,
      });
      persistPrefs({ fallbackEnabled: true });
      setFallbackFile(null);
      setSuccess(`Fallback gespeichert: ${formatMinutes(result.totalMinutes)} fuer ${formatDateShort(dateKey)}.`);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: '#e2e8f0', fontFamily: "'Outfit',sans-serif" }}>
      <style>{SCREEN_TIME_CSS}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>SCREEN TIME GATE</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif" }}>Bildschirmzeit & Fokus</div>
        </div>
        {loading && <div style={{ width: 18, height: 18, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: '50%', animation: 'screenTimeSpin 0.8s linear infinite' }} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
        {[
          { key: 'overview', label: 'Heute' },
          { key: 'history', label: 'Verlauf' },
          { key: 'system', label: 'System' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              padding: '9px 8px',
              borderRadius: 10,
              border: `1px solid ${tab === item.key ? color + '66' : 'rgba(255,255,255,0.07)'}`,
              background: tab === item.key ? `${color}18` : 'rgba(255,255,255,0.03)',
              color: tab === item.key ? color : '#94a3b8',
              fontSize: 10,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: 1.5,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5', borderRadius: 12, fontSize: 10, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', color: '#86efac', borderRadius: 12, fontSize: 10, marginBottom: 12 }}>{success}</div>}

      {tab === 'overview' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg, ${color}12, rgba(0,0,0,0.25))`, border: `1px solid ${statusColor}33`, borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <ProgressRing progress={progress} color={statusColor}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{formatMinutes(today.totalMinutes)}</div>
                <div style={{ fontSize: 7, color: statusColor, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>HEUTE</div>
              </div>
            </ProgressRing>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>TAGESLIMIT</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif" }}>{formatMinutes(limit)}</div>
              <div style={{ fontSize: 11, color: today.totalMinutes > limit ? '#fca5a5' : '#86efac', marginTop: 4 }}>
                {today.totalMinutes > limit ? `${formatMinutes(today.totalMinutes - limit)} ueber Limit` : `${formatMinutes(limit - today.totalMinutes)} Puffer`}
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 12 }}>
                <div style={{ width: `${progress}%`, maxWidth: '100%', height: '100%', background: statusColor, borderRadius: 3 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}22`, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>7T SCHNITT</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", marginTop: 4 }}>{formatMinutes(currentWeek.avg)}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${currentWeek.total <= previousWeek.total ? '#22c55e33' : '#ef444433'}`, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>TREND VS 7T</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: currentWeek.total <= previousWeek.total ? '#22c55e' : '#ef4444', fontFamily: "'Cinzel',serif", marginTop: 4 }}>{getTrendLabel(currentWeek.total, previousWeek.total)}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800 }}>VORTAGS-QUEST</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                  {yesterday ? `${formatDateShort(yesterdayKey)} - ${formatMinutes(yesterday.totalMinutes)} / ${formatMinutes(yesterday.limitMinutes || limit)}` : 'Noch kein Vortagswert vorhanden.'}
                </div>
              </div>
              <button
                onClick={() => claimScreenTimeReward?.(yesterdayKey)}
                disabled={!canClaimYesterday}
                style={{
                  padding: '9px 11px',
                  borderRadius: 9,
                  border: `1px solid ${canClaimYesterday ? '#22c55e55' : 'rgba(255,255,255,0.07)'}`,
                  background: canClaimYesterday ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                  color: canClaimYesterday ? '#86efac' : '#475569',
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono',monospace",
                  cursor: canClaimYesterday ? 'pointer' : 'default',
                  letterSpacing: 1,
                }}
              >
                {state?.screenTimeRewardsClaimed?.[yesterdayRewardKey] ? 'ERLEDIGT' : 'CLAIM'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={syncToday} disabled={loading} style={{ padding: 12, borderRadius: 12, border: `1px solid ${color}44`, background: `${color}14`, color, fontWeight: 900, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, cursor: loading ? 'default' : 'pointer' }}>HEUTE SYNC</button>
            <button onClick={syncHistory} disabled={loading} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontWeight: 900, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, cursor: loading ? 'default' : 'pointer' }}>VERLAUF SYNC</button>
          </div>

          <BreakdownList title="APPS" items={today.apps} color={color} />
          <BreakdownList title="KATEGORIEN" items={today.categories} color="#38bdf8" />
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {HISTORY_RANGES.map(item => (
              <button
                key={item.key}
                onClick={() => persistPrefs({ screenTimeHistoryRange: item.key })}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: 9,
                  border: `1px solid ${historyRange === item.key ? color + '66' : 'rgba(255,255,255,0.07)'}`,
                  background: historyRange === item.key ? `${color}16` : 'rgba(255,255,255,0.03)',
                  color: historyRange === item.key ? color : '#64748b',
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono',monospace",
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}22`, borderRadius: 16, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>
              <span>GESAMT {formatMinutes(summarize(rows).total)}</span>
              <span>{summarize(rows).underLimitDays}/{summarize(rows).dataDays || rows.length} UNTER LIMIT</span>
            </div>
            <ScreenTimeBars rows={rows} color={color} />
          </div>
        </div>
      )}

      {tab === 'system' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 12 }}>NATIVE CAPABILITY GATE</div>
            <div style={{ display: 'grid', gap: 8, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Native</span><span style={{ color: capabilities?.nativeAvailable ? '#86efac' : '#fca5a5' }}>{String(capabilities?.nativeAvailable ?? false)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Authorization</span><span style={{ color: '#cbd5e1' }}>{capabilities?.authorizationStatus || 'unbekannt'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Data Access</span><span style={{ color: capabilities?.dataAccessAvailable ? '#86efac' : '#fca5a5' }}>{String(capabilities?.dataAccessAvailable ?? false)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Minutenexport</span><span style={{ color: canExport ? '#86efac' : '#fca5a5' }}>{String(canExport)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Grund</span><span style={{ color: '#cbd5e1', textAlign: 'right' }}>{capabilities?.reason || 'noch nicht geprueft'}</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              <button onClick={handleCapabilities} disabled={loading} style={{ padding: 11, borderRadius: 10, border: `1px solid ${color}44`, background: `${color}12`, color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: loading ? 'default' : 'pointer' }}>PRUEFEN</button>
              <button onClick={handleAuthorize} disabled={authLoading} style={{ padding: 11, borderRadius: 10, border: '1px solid rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.1)', color: '#7dd3fc', fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: authLoading ? 'default' : 'pointer' }}>FREIGABE</button>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 10 }}>TAGESLIMIT</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min="30"
                max="1440"
                value={localLimit}
                onChange={e => setLocalLimit(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}
              />
              <button onClick={saveLimit} style={{ padding: '11px 12px', borderRadius: 10, border: `1px solid ${color}44`, background: `${color}12`, color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>SPEICHERN</button>
            </div>
          </div>

          {fallbackAvailable && (
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 6 }}>LETZTER FALLBACK</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
                Nur aktiv, weil das native Gate keine exportierbaren Minuten liefert. Das Bild wird an die bestehende Gemini-Bildpipeline geschickt.
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input type="date" value={fallbackDate} onChange={e => setFallbackDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 12 }} />
                <input type="file" accept="image/*" onChange={e => setFallbackFile(e.target.files?.[0] || null)} style={{ color: '#94a3b8', fontSize: 11 }} />
                <button onClick={uploadFallback} disabled={!fallbackFile || loading || geminiAI?.isLoading || geminiAI?.isRateLimited?.()} style={{ padding: 12, borderRadius: 10, border: `1px solid ${fallbackFile ? color + '44' : 'rgba(255,255,255,0.07)'}`, background: fallbackFile ? `${color}12` : 'rgba(255,255,255,0.03)', color: fallbackFile ? color : '#475569', fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: fallbackFile ? 'pointer' : 'default' }}>SCREENSHOT PRUEFEN</button>
              </div>
            </div>
          )}

          {diagLog.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6 }}>
              {diagLog.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
