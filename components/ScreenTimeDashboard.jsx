import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { screenTimeService } from '../services/screenTimeService.js';
import { addLocalDays, getLocalDateKey, getToday, getYesterdayKey } from '../data/dateUtils.js';
import { useI18n } from './i18n/I18nProvider.jsx';

const DEFAULT_LIMIT = 180;
const HISTORY_RANGES = [
  { key: '7d', label: '7T', days: 7 },
  { key: '14d', label: '14T', days: 14 },
  { key: '30d', label: '30T', days: 30 },
];
const DAY_LABELS = {
  de: ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'],
  en: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
};

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

function buildRows(state, days = 7, offsetDays = 0, labels = {}) {
  const history = getHistoryMap(state);
  const limit = getLimit(state);
  const todayLabel = labels.today || 'HEUTE';
  const dayLabels = labels.dayLabels || DAY_LABELS.de;
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
      label: i === 0 ? todayLabel : (days <= 14 ? dayLabels[date.getDay()] : formatDateShort(dateKey)),
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

function getTrendLabel(currentTotal, previousTotal, newLabel = 'NEU') {
  if (!previousTotal) return currentTotal > 0 ? newLabel : '0%';
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
  const { t, locale } = useI18n();
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
  // OCR single-image state
  const [ocrFiles, setOcrFiles] = useState([]);
  const [ocrResult, setOcrResult] = useState(null);
  const ocrInputRef = useRef(null);
  const lastPersistKey = useRef('');
  // Overwrite confirmation modal state
  const [overwritePending, setOverwritePending] = useState(null);

  const color = '#f59e0b';
  const danger = '#ef4444';
  const historyRange = prefs.screenTimeHistoryRange || '7d';
  const range = getRangeConfig(historyRange);
  const rowLabels = useMemo(() => ({ today: t('screenTime.today'), dayLabels: DAY_LABELS[locale] || DAY_LABELS.en }), [locale, t]);
  const rows = useMemo(() => buildRows(state, range.days, 0, rowLabels), [state?.screenTimeDailyHistory, state?.dailyScreenTimeMinutes, state?.screenTimePreferences, range.days, rowLabels]);
  const previousRows = useMemo(() => buildRows(state, 7, 7, rowLabels), [state?.screenTimeDailyHistory, state?.screenTimePreferences, rowLabels]);
  const currentWeek = useMemo(() => summarize(buildRows(state, 7, 0, rowLabels)), [state?.screenTimeDailyHistory, state?.screenTimePreferences, rowLabels]);
  const previousWeek = useMemo(() => summarize(previousRows), [previousRows]);
  const today = rows[rows.length - 1] || { totalMinutes: 0, limitMinutes: getLimit(state), underLimit: true };
  const limit = getLimit(state);
  const progress = Math.min(100, (today.totalMinutes / limit) * 100);
  const statusColor = today.totalMinutes > limit ? danger : color;
  const capabilities = prefs.lastCapability || null;
  const canExport = capabilities?.canExportDurations === true;
  const nativeBlocked = capabilities && capabilities.canExportDurations !== true;
  const fallbackAvailable = nativeBlocked && (state?.ai?.enabled ?? true) && typeof geminiAI?.extractScreenTime === 'function';
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
      setSuccess(cap.canExportDurations ? t('screenTime.messages.nativeMinutesAvailable') : t('screenTime.messages.nativeMinutesUnavailable'));
      return cap;
    } finally {
      setLoading(false);
    }
  }, [addLog, persistPrefs, t]);

  const handleAuthorize = useCallback(async () => {
    setAuthLoading(true);
    setError('');
    setSuccess('');
    try {
      const cap = await screenTimeService.requestAuthorization(addLog);
      persistPrefs({ enabled: true, lastCapability: { ...cap, checkedAt: new Date().toLocaleString('de-DE') } });
      setSuccess(cap.canExportDurations ? t('screenTime.messages.authorizationReady') : t('screenTime.messages.authorizationNoExport'));
      return cap;
    } catch (err) {
      setError(err?.message || String(err));
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [addLog, persistPrefs, t]);

  const syncToday = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await screenTimeService.syncToday(addLog);
      persistPrefs({ enabled: true, lastCapability: { ...(result.capabilities || {}), checkedAt: new Date().toLocaleString('de-DE') } });
      if (!result?.capabilities?.canExportDurations) {
        setSuccess(t('screenTime.messages.nativeCheckedNoExport'));
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
      setSuccess(t('screenTime.messages.todaySynced', { time: formatMinutes(totalMinutes) }));
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [addLog, limit, persistPrefs, updateScreenTimeData, t]);

  const syncHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await screenTimeService.syncHistory(range.days * 2, addLog);
      persistPrefs({ enabled: true, lastCapability: { ...(result.capabilities || {}), checkedAt: new Date().toLocaleString('de-DE') } });
      if (!result?.capabilities?.canExportDurations) {
        setSuccess(t('screenTime.messages.historyCheckedNoExport'));
        return;
      }
      const days = Array.isArray(result.days) ? result.days : [];
      if (!days.length) {
        setSuccess(t('screenTime.messages.noHistory'));
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
      setSuccess(t('screenTime.messages.historySynced', { count: days.length }));
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [addLog, limit, persistPrefs, range.days, updateScreenTimeData, t]);

  const saveLimit = () => {
    const nextLimit = Math.max(30, Math.min(1440, Math.floor(Number(localLimit) || DEFAULT_LIMIT)));
    persistPrefs({ dailyLimitMinutes: nextLimit });
    updateScreenTimeData?.(undefined, { preferences: { dailyLimitMinutes: nextLimit } });
    setLocalLimit(nextLimit);
    setSuccess(t('screenTime.messages.limitSaved', { time: formatMinutes(nextLimit) }));
  };

  const uploadFallback = async () => {
    if (!fallbackFile || !fallbackAvailable || geminiAI?.isRateLimited?.()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await geminiAI.extractScreenTime(fallbackFile);
      if (!result?.valid || !Number.isFinite(Number(result.totalMinutes)) || Number(result.confidence || 0) < 60) {
        setError(result?.reason || t('screenTime.messages.screenshotUnclear'));
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
      setSuccess(t('screenTime.messages.fallbackSaved', { time: formatMinutes(result.totalMinutes), date: formatDateShort(dateKey) }));
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOcrUpload = async () => {
    if (ocrFiles.length === 0 || geminiAI?.isRateLimited?.()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setOcrResult(null);
    try {
      const result = await geminiAI.extractScreenTime(ocrFiles);
      if (!result) {
        setError(t('screenTime.messages.analysisFailed'));
        return;
      }
      setOcrResult(result);
      if (result.needsMore) {
        setError(result.hint || t('screenTime.messages.needMore'));
        return;
      }
      if (!result.valid) {
        setError(result.reason || t('screenTime.messages.screenshotUnknown'));
        return;
      }
      const dateKey = result.date || getToday();
      const totalMinutes = Math.max(0, Math.floor(Number(result.totalMinutes) || 0));

      const existingData = state?.screenTimeDailyHistory?.[dateKey];
      if (existingData && existingData.totalMinutes > 0) {
        // Show custom overwrite modal instead of saving immediately
        setOverwritePending({
          dateKey,
          totalMinutes,
          oldMinutes: existingData.totalMinutes,
          result,
        });
        setLoading(false);
        return;
      }

      // No existing data — save directly
      updateScreenTimeData?.(totalMinutes, {
        dateKey,
        limitMinutes: limit,
        source: 'screenshot-ai',
        confidence: result.confidence,
        viewMode: result.viewMode,
        apps: result.apps,
        categories: result.categories,
      });
      setSuccess(t('screenTime.messages.dayValue', { time: formatMinutes(totalMinutes), date: formatDateShort(dateKey) }));
      setOcrFiles([]);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const confirmOverwrite = () => {
    if (!overwritePending) return;
    const { dateKey, totalMinutes, result } = overwritePending;
    updateScreenTimeData?.(totalMinutes, {
      dateKey,
      limitMinutes: limit,
      source: 'screenshot-ai',
      confidence: result.confidence,
      viewMode: result.viewMode,
      apps: result.apps,
      categories: result.categories,
    });
    setSuccess(t('screenTime.messages.overwritten', { time: formatMinutes(totalMinutes), date: formatDateShort(dateKey) }));
    setOcrFiles([]);
    setOverwritePending(null);
  };

  const cancelOverwrite = () => {
    setOverwritePending(null);
    setSuccess(t('screenTime.messages.overwriteCanceled'));
  };

  return (
    <div style={{ color: '#e2e8f0', fontFamily: "'Outfit',sans-serif" }}>
      <style>{SCREEN_TIME_CSS}</style>

      {/* ── ABYSSAL SOVEREIGN OVERWRITE MODAL ── */}
      {overwritePending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #0d0d1a 0%, #060610 100%)',
            border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: 16, width: 'min(420px, 90vw)', padding: '0',
            boxShadow: '0 0 80px rgba(245,158,11,0.12), inset 0 1px 0 rgba(245,158,11,0.15)',
            fontFamily: "'JetBrains Mono','Courier New',monospace",
            overflow: 'hidden',
          }}>
            {/* Header bar */}
            <div style={{
              padding: '14px 20px 10px', borderBottom: '1px solid rgba(245,158,11,0.2)',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), transparent)',
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: '#f59e0b', fontWeight: 800 }}>⚠️ {t('screenTime.overwriteTitle')}</div>
              <div style={{ fontSize: 14, color: '#fde68a', fontWeight: 900, marginTop: 4, fontFamily: "'Cinzel',serif" }}>{t('screenTime.overwrite')}</div>
            </div>

            {/* Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
                {t('screenTime.overwriteDesc', { date: formatDateShort(overwritePending.dateKey) })}
              </div>

              {/* Old vs New comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', width: '100%', maxWidth: 320 }}>
                <div style={{
                  textAlign: 'center', padding: '12px 8px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <div style={{ fontSize: 8, color: '#ef4444', letterSpacing: 2, fontWeight: 800, marginBottom: 4 }}>{t('screenTime.oldValue')}</div>
                  <div style={{ fontSize: 20, color: '#fca5a5', fontWeight: 900 }}>{formatMinutes(overwritePending.oldMinutes)}</div>
                </div>
                <div style={{ fontSize: 20, color: '#f59e0b' }}>→</div>
                <div style={{
                  textAlign: 'center', padding: '12px 8px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  <div style={{ fontSize: 8, color: '#22c55e', letterSpacing: 2, fontWeight: 800, marginBottom: 4 }}>{t('screenTime.newValue')}</div>
                  <div style={{ fontSize: 20, color: '#86efac', fontWeight: 900 }}>{formatMinutes(overwritePending.totalMinutes)}</div>
                </div>
              </div>

              <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
                Diese Aktion kann nicht rückgängig gemacht werden.
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
                <button onClick={cancelOverwrite} style={{
                  flex: 1, padding: '12px 10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#94a3b8', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                }}>✕ {t('screenTime.cancel')}</button>
                <button onClick={confirmOverwrite} style={{
                  flex: 1, padding: '12px 10px', borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))',
                  border: '1px solid rgba(245,158,11,0.5)',
                  color: '#fde68a', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                  boxShadow: '0 0 20px rgba(245,158,11,0.1)',
                }}>⚡ {t('screenTime.overwrite')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{t('screenTime.gate')}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif" }}>{t('screenTime.title')}</div>
        </div>
        {loading && <div style={{ width: 18, height: 18, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: '50%', animation: 'screenTimeSpin 0.8s linear infinite' }} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
        {[
          { key: 'overview', label: t('screenTime.tabs.overview') },
          { key: 'history', label: t('screenTime.tabs.history') },
          { key: 'system', label: t('screenTime.tabs.system') },
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
                <div style={{ fontSize: 7, color: statusColor, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{t('screenTime.today')}</div>
              </div>
            </ProgressRing>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>{t('screenTime.dailyLimit')}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif" }}>{formatMinutes(limit)}</div>
              <div style={{ fontSize: 11, color: today.totalMinutes > limit ? '#fca5a5' : '#86efac', marginTop: 4 }}>
                {today.totalMinutes > limit ? t('screenTime.overLimit', { time: formatMinutes(today.totalMinutes - limit) }) : t('screenTime.buffer', { time: formatMinutes(limit - today.totalMinutes) })}
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 12 }}>
                <div style={{ width: `${progress}%`, maxWidth: '100%', height: '100%', background: statusColor, borderRadius: 3 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}22`, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>{t('screenTime.avg7')}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", marginTop: 4 }}>{formatMinutes(currentWeek.avg)}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${currentWeek.total <= previousWeek.total ? '#22c55e33' : '#ef444433'}`, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>{t('screenTime.trend7')}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: currentWeek.total <= previousWeek.total ? '#22c55e' : '#ef4444', fontFamily: "'Cinzel',serif", marginTop: 4 }}>{getTrendLabel(currentWeek.total, previousWeek.total, locale === 'de' ? 'NEU' : 'NEW')}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800 }}>{t('screenTime.yesterdayQuest')}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                  {yesterday ? `${formatDateShort(yesterdayKey)} - ${formatMinutes(yesterday.totalMinutes)} / ${formatMinutes(yesterday.limitMinutes || limit)}` : t('screenTime.noYesterday')}
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
            <button onClick={syncToday} disabled={loading} style={{ padding: 12, borderRadius: 12, border: `1px solid ${color}44`, background: `${color}14`, color, fontWeight: 900, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, cursor: loading ? 'default' : 'pointer' }}>{t('screenTime.syncToday')}</button>
            <button onClick={syncHistory} disabled={loading} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontWeight: 900, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, cursor: loading ? 'default' : 'pointer' }}>{t('screenTime.syncHistory')}</button>
          </div>

          {/* ── OCR SCREENSHOT UPLOAD ── */}
          <div style={{ background: 'linear-gradient(135deg, rgba(0,170,255,0.06), rgba(0,0,0,0.25))', border: '1px solid rgba(0,170,255,0.25)', borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#0af', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 4 }}>📷 {t('screenTime.screenshotVerification')}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10 }}>
              {t('screenTime.screenshotHint')}
            </div>
            {ocrFiles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {ocrFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative', width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,170,255,0.3)' }}>
                    <img src={URL.createObjectURL(f)} alt={`#${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setOcrFiles(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(200,0,0,0.8)', border: 'none', color: '#fff', fontSize: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={ocrInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const newFiles = Array.from(e.target.files || []);
              if (newFiles.length > 0) {
                setOcrFiles([newFiles[0]]);
              }
              setOcrResult(null);
              e.target.value = '';
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => ocrInputRef.current?.click()} style={{ padding: 11, borderRadius: 10, border: '1px solid rgba(0,170,255,0.35)', background: 'rgba(0,170,255,0.08)', color: '#7dd3fc', fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>{ocrFiles.length > 0 ? t('screenTime.changeImage') : t('screenTime.addImage')}</button>
              <button onClick={handleOcrUpload} disabled={ocrFiles.length === 0 || loading} style={{ padding: 11, borderRadius: 10, border: `1px solid ${ocrFiles.length > 0 ? '#0af66' : 'rgba(255,255,255,0.07)'}`, background: ocrFiles.length > 0 ? `rgba(0,170,255,0.12)` : 'rgba(255,255,255,0.03)', color: ocrFiles.length > 0 ? '#0af' : '#475569', fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: ocrFiles.length > 0 ? 'pointer' : 'default' }}>🔍 {t('screenTime.analyze')}</button>
            </div>
            {ocrResult && ocrResult.valid && (
              <div style={{ marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid rgba(0,200,100,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#86efac', marginBottom: 4 }}>
                  <span>{ocrResult.viewMode === 'woche' ? `📆 ${t('screenTime.week')}` : `📅 ${t('screenTime.day')}`}{ocrResult.date ? ` — ${formatDateShort(ocrResult.date)}` : ''}</span>
                  <span style={{ fontWeight: 900 }}>{formatMinutes(ocrResult.totalMinutes)}</span>
                </div>
                {ocrResult.topApp && <div style={{ fontSize: 9, color: '#f5a623', marginBottom: 4 }}>🏆 Top: {ocrResult.topApp}</div>}
                {ocrResult.apps?.length > 0 && (
                  <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>
                    {ocrResult.apps.slice(0, 5).map((a, i) => <div key={i}>{a.name} — {formatMinutes(a.minutes)}</div>)}
                  </div>
                )}
              </div>
            )}
            {ocrResult && ocrResult.needsMore && ocrResult.hint && (
              <div style={{ marginTop: 10, padding: 10, background: 'rgba(245,166,35,0.06)', borderRadius: 10, border: '1px solid rgba(245,166,35,0.2)', fontSize: 10, color: '#f5a623' }}>
                ⚠️ {ocrResult.hint}
              </div>
            )}
          </div>

          <BreakdownList title={t('screenTime.apps')} items={ocrResult?.apps?.length > 0 ? ocrResult.apps : today.apps} color={color} />
          <BreakdownList title={t('screenTime.categories')} items={ocrResult?.categories?.length > 0 ? ocrResult.categories : today.categories} color="#38bdf8" />
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
              <span>{t('screenTime.total', { time: formatMinutes(summarize(rows).total) })}</span>
              <span>{t('screenTime.underLimit', { under: summarize(rows).underLimitDays, total: summarize(rows).dataDays || rows.length })}</span>
            </div>
            <ScreenTimeBars rows={rows} color={color} />
          </div>
        </div>
      )}

      {tab === 'system' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 12 }}>{t('screenTime.nativeGate')}</div>
            <div style={{ display: 'grid', gap: 8, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Native</span><span style={{ color: capabilities?.nativeAvailable ? '#86efac' : '#fca5a5' }}>{String(capabilities?.nativeAvailable ?? false)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Authorization</span><span style={{ color: '#cbd5e1' }}>{capabilities?.authorizationStatus || t('screenTime.unknown')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Data Access</span><span style={{ color: capabilities?.dataAccessAvailable ? '#86efac' : '#fca5a5' }}>{String(capabilities?.dataAccessAvailable ?? false)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Minutenexport</span><span style={{ color: canExport ? '#86efac' : '#fca5a5' }}>{String(canExport)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Grund</span><span style={{ color: '#cbd5e1', textAlign: 'right' }}>{capabilities?.reason || 'noch nicht geprüft'}</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              <button onClick={handleCapabilities} disabled={loading} style={{ padding: 11, borderRadius: 10, border: `1px solid ${color}44`, background: `${color}12`, color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: loading ? 'default' : 'pointer' }}>{t('screenTime.check')}</button>
              <button onClick={handleAuthorize} disabled={authLoading} style={{ padding: 11, borderRadius: 10, border: '1px solid rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.1)', color: '#7dd3fc', fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: authLoading ? 'default' : 'pointer' }}>{t('screenTime.authorize')}</button>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 10 }}>{t('screenTime.dailyLimit')}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min="30"
                max="1440"
                value={localLimit}
                onChange={e => setLocalLimit(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}
              />
              <button onClick={saveLimit} style={{ padding: '11px 12px', borderRadius: 10, border: `1px solid ${color}44`, background: `${color}12`, color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>{t('screenTime.save')}</button>
            </div>
          </div>

          {fallbackAvailable && (
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 800, marginBottom: 6 }}>LETZTER FALLBACK</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
                {t('screenTime.fallbackDesc')}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input type="date" value={fallbackDate} onChange={e => setFallbackDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 12 }} />
                <input type="file" accept="image/*" onChange={e => setFallbackFile(e.target.files?.[0] || null)} style={{ color: '#94a3b8', fontSize: 11 }} />
                <button onClick={uploadFallback} disabled={!fallbackFile || loading || geminiAI?.isLoading || geminiAI?.isRateLimited?.()} style={{ padding: 12, borderRadius: 10, border: `1px solid ${fallbackFile ? color + '44' : 'rgba(255,255,255,0.07)'}`, background: fallbackFile ? `${color}12` : 'rgba(255,255,255,0.03)', color: fallbackFile ? color : '#475569', fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: fallbackFile ? 'pointer' : 'default' }}>{t('screenTime.checkScreenshot')}</button>
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
