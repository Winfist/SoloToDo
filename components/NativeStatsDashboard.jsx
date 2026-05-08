import React, { useState, useEffect, useCallback, useRef } from 'react';
import { healthService } from '../services/healthService';
import { Capacitor } from '@capacitor/core';
import { getLocalDateKey, getToday } from '../data/dateUtils.js';

const IS_NATIVE = Capacitor.isNativePlatform();
const STEP_GOAL = 10000;
const SLEEP_GOAL = 7;
const HISTORY_RANGES = [
  { key: '7d', label: '7T', days: 7 },
  { key: '14d', label: '14T', days: 14 },
  { key: '30d', label: '30T', days: 30 },
  { key: '90d', label: '90T', days: 90 },
];
const DAY_LABELS = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];

function getHistoryRangeConfig(key) {
  return HISTORY_RANGES.find(r => r.key === key) || HISTORY_RANGES[0];
}

function formatHistoryLabel(date, daysBack, rangeDays) {
  if (daysBack === 0) return 'HEUTE';
  if (rangeDays <= 14) return DAY_LABELS[date.getDay()];
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDateShort(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '--';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

function getCachedHealthArrays(state) {
  const history = { ...(state?.healthDailyHistory || {}) };
  const todayKey = getToday();
  const today = { ...(history[todayKey] || {}) };
  if (today.steps === undefined && Number(state?.dailySteps) > 0) today.steps = state.dailySteps;
  if (today.sleepHours === undefined && Number(state?.dailySleepHours) > 0) today.sleepHours = state.dailySleepHours;
  if (today.steps !== undefined || today.sleepHours !== undefined) history[todayKey] = today;
  const steps = [];
  const sleep = [];
  Object.keys(history).sort().forEach(date => {
    const day = history[date] || {};
    steps.push({ date, value: Math.max(0, Math.floor(Number(day.steps) || 0)) });
    sleep.push({ date, hours: Math.max(0, Number(day.sleepHours) || 0) });
  });
  return { steps, sleep };
}

function getCachedToday(state) {
  const todayKey = getToday();
  const today = state?.healthDailyHistory?.[todayKey] || {};
  return {
    steps: Math.max(0, Math.floor(Number(today.steps ?? state?.dailySteps) || 0)),
    sleepHours: Math.max(0, Number(today.sleepHours ?? state?.dailySleepHours) || 0),
    lastSync: today.syncedAt || state?.lastNativeSync || null
  };
}

function getHistorySignature(stepsData = [], sleepData = []) {
  const stepSig = (stepsData || []).map(row => `${row.date}:${Math.max(0, Math.floor(Number(row.value) || 0))}`).join(',');
  const sleepSig = (sleepData || []).map(row => `${row.date}:${Math.max(0, Number((row.hours ?? row.value) || 0)).toFixed(1)}`).join(',');
  return `${stepSig}|${sleepSig}`;
}

function buildHistoryRows(rangeDays, stepsData = [], sleepData = [], manualSleepLog = {}, sleepMode = 'auto', manualSleepToday = 0, offsetDays = 0) {
  const stepMap = Object.fromEntries((stepsData || []).map(item => [item.date, parseFloat(item.value) || 0]));
  const sleepMap = Object.fromEntries((sleepData || []).map(item => [item.date, parseFloat(item.hours ?? item.value) || 0]));
  const steps = [];
  const sleep = [];
  const labelEvery = rangeDays <= 14 ? 1 : rangeDays <= 30 ? 5 : 15;
  const todayKey = getToday();

  for (let i = rangeDays - 1 + offsetDays; i >= offsetDays; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateKey(d);
    const relativeIndex = i - offsetDays;
    const showLabel = i === 0 || relativeIndex === 0 || relativeIndex % labelEvery === 0;
    const showValue = i === 0;
    const label = formatHistoryLabel(d, i, rangeDays);
    let sleepValue = sleepMap[dateKey] || 0;

    if (sleepMode === 'manual') {
      const manualValue = manualSleepLog?.[dateKey] ?? (dateKey === todayKey ? manualSleepToday : null);
      if (manualValue !== null && manualValue !== undefined) sleepValue = parseFloat(manualValue) || 0;
    }

    steps.push({ date: dateKey, label, value: stepMap[dateKey] || 0, showLabel, showValue });
    sleep.push({ date: dateKey, label, value: sleepValue, showLabel, showValue });
  }

  return { steps, sleep };
}

function summarizeHistory(stepsRows = [], sleepRows = []) {
  const totalSteps = stepsRows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);
  const avgSteps = stepsRows.length ? Math.round(totalSteps / stepsRows.length) : 0;
  const stepGoalDays = stepsRows.filter(row => (parseFloat(row.value) || 0) >= STEP_GOAL).length;
  const bestStepDay = stepsRows.reduce((best, row) => ((parseFloat(row.value) || 0) > (parseFloat(best?.value) || 0) ? row : best), null);

  const sleepWithData = sleepRows.filter(row => (parseFloat(row.value) || 0) > 0);
  const totalSleep = sleepWithData.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);
  const avgSleep = sleepWithData.length ? totalSleep / sleepWithData.length : 0;
  const sleepGoalNights = sleepRows.filter(row => (parseFloat(row.value) || 0) >= SLEEP_GOAL).length;
  const bestSleepNight = sleepRows.reduce((best, row) => ((parseFloat(row.value) || 0) > (parseFloat(best?.value) || 0) ? row : best), null);

  return { totalSteps, avgSteps, stepGoalDays, bestStepDay, avgSleep, sleepGoalNights, bestSleepNight };
}

function patchHistoryValue(rows, dateKey, value) {
  return rows.map(row => row.date === dateKey ? { ...row, value } : row);
}

function formatStepsTrend(currentTotal, previousTotal) {
  if (!previousTotal) return currentTotal > 0 ? 'NEU' : '0%';
  const pct = ((currentTotal - previousTotal) / previousTotal) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

function formatSleepTrend(currentAvg, previousAvg) {
  if (!previousAvg) return currentAvg > 0 ? 'NEU' : '0.0h';
  const diff = currentAvg - previousAvg;
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h`;
}

// ─── KEYFRAMES ────────────────────────────────────────────────
const HEALTH_CSS = `
@keyframes healthPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes healthSpin { to{transform:rotate(360deg)} }
@keyframes healthSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes healthGlow { 0%,100%{box-shadow:0 0 8px rgba(56,189,248,0.15)} 50%{box-shadow:0 0 20px rgba(56,189,248,0.3)} }
`;

// ─── CIRCULAR PROGRESS RING ───────────────────────────────────
function ProgressRing({ radius = 38, stroke = 4, progress = 0, color = '#38bdf8', children }) {
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// ─── SVG CHART COMPONENT ──────────────────────────────────────
function BarChart({ data, primaryColor, labelFormatter }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>Keine Daten verfügbar</div>;
  }

  const allZero = data.every(d => parseFloat(d.value) === 0);
  const maxValue = allZero ? 1 : Math.max(...data.map(d => parseFloat(d.value) || 0), 1);
  const needsScroll = data.length > 21;
  const innerWidth = needsScroll ? Math.max(data.length * 18, 560) : '100%';

  return (
    <div style={{ overflowX: needsScroll ? 'auto' : 'visible', overflowY: 'hidden', paddingBottom: needsScroll ? 4 : 0 }}>
      <div style={{ position: 'relative', height: 140, padding: '10px 0 0', minWidth: innerWidth }}>
        {/* Grid lines */}
        {[0.5, 1].map(r => (
          <div key={r} style={{ position: 'absolute', bottom: `calc(${r * 80}% + 24px)`, left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.04)', zIndex: 0 }} />
        ))}

        {/* Empty state overlay */}
        {allZero && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              Synchronisiere um Daten zu laden
            </div>
          </div>
        )}

        {/* Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: needsScroll ? 'flex-start' : 'space-around', gap: needsScroll ? 4 : 0, height: '100%', paddingBottom: 24 }}>
          {data.map((item, i) => {
            const val = parseFloat(item.value) || 0;
            const heightPct = allZero ? 3 : Math.max((val / maxValue) * 100, 3);
            const isToday = i === data.length - 1;
            const showLabel = !needsScroll || item.showLabel || isToday;
            const showValue = !needsScroll || item.showValue || isToday;
            return (
              <div key={item.date || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: needsScroll ? 14 : `${85 / data.length}%`, flex: needsScroll ? '0 0 14px' : '0 1 auto', position: 'relative', zIndex: 1, animation: `healthSlideUp 0.5s ease ${Math.min(i, 12) * 0.04}s both` }}>
                {/* Value label */}
                <div style={{ height: 10, fontSize: 7, color: isToday ? primaryColor : 'rgba(255,255,255,0.35)', marginBottom: 3, fontFamily: "'JetBrains Mono',monospace", fontWeight: isToday ? 800 : 400 }}>
                  {!allZero && val > 0 && showValue ? labelFormatter(val) : ''}
                </div>
                {/* Bar */}
                <div style={{
                  width: '100%', maxWidth: 28, height: `${heightPct}%`, minHeight: 4,
                  background: allZero ? `${primaryColor}15`
                    : isToday ? `linear-gradient(180deg, ${primaryColor}, ${primaryColor}88)`
                      : `linear-gradient(180deg, ${primaryColor}66, ${primaryColor}18)`,
                  borderRadius: '5px 5px 2px 2px',
                  boxShadow: isToday && !allZero ? `0 0 12px ${primaryColor}44, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
                  opacity: allZero ? 0.25 : 1,
                  transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
                {/* Day label */}
                <div style={{ height: 10, fontSize: 8, color: isToday ? '#fff' : '#4a5568', marginTop: 6, fontFamily: "'JetBrains Mono',monospace", fontWeight: isToday ? 700 : 400, letterSpacing: 0.5 }}>
                  {showLabel ? item.label : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── STAT MINI CARD ───────────────────────────────────────────
function StatMini({ icon, label, value, color, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: `1px solid ${color}15` }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}33`, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Cinzel',serif" }}>{value}</div>
        <div style={{ fontSize: 7, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, marginTop: 1 }}>{label}</div>
        {detail && <div style={{ fontSize: 7, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginTop: 3 }}>{detail}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function NativeStatsDashboard({ state, persist, updateHealthData, claimHealthReward }) {
  const [tab, setTab] = useState('overview');
  const cachedToday = getCachedToday(state);

  const [steps, setSteps] = useState(cachedToday.steps);
  const [sleep, setSleep] = useState({ hours: cachedToday.sleepHours.toFixed(1), minutes: Math.round(cachedToday.sleepHours * 60) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(cachedToday.lastSync);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [diagLog, setDiagLog] = useState([]);

  const [historySteps, setHistorySteps] = useState([]);
  const [historySleep, setHistorySleep] = useState([]);
  const [previousSteps, setPreviousSteps] = useState([]);
  const [previousSleep, setPreviousSleep] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const sleepMode = state?.healthPreferences?.sleepMode || 'auto';
  const [historyRange, setHistoryRange] = useState(state?.healthPreferences?.healthHistoryRange || '7d');
  const [manualSleepHours, setManualSleepHours] = useState(state?.healthPreferences?.manualSleepToday || 0);
  const [savedManual, setSavedManual] = useState(false);
  const lastHistoryPersistKey = useRef('');

  useEffect(() => {
    const cached = getCachedToday(state);
    setSteps(cached.steps);
    setSleep({ hours: cached.sleepHours.toFixed(1), minutes: Math.round(cached.sleepHours * 60) });
    setLastSyncTime(cached.lastSync);
  }, [state?.dailySteps, state?.dailySleepHours, state?.lastNativeSync, state?.healthDailyHistory]);

  const addLog = useCallback((msg) => {
    setDiagLog(prev => [...prev, `[${new Date().toLocaleTimeString('de-DE')}] ${msg}`]);
  }, []);

  // ── History ──
  const loadHistory = useCallback(async () => {
    const range = getHistoryRangeConfig(historyRange);
    const totalDays = range.days * 2;
    const manualLog = state?.healthPreferences?.manualSleepLog || {};
    const cached = getCachedHealthArrays(state);
    const cachedCurrent = buildHistoryRows(range.days, cached.steps, cached.sleep, manualLog, sleepMode, manualSleepHours, 0);
    const cachedPrevious = buildHistoryRows(range.days, cached.steps, cached.sleep, manualLog, sleepMode, manualSleepHours, range.days);
    const hasCachedData = cachedCurrent.steps.some(row => (parseFloat(row.value) || 0) > 0)
      || cachedCurrent.sleep.some(row => (parseFloat(row.value) || 0) > 0);
    setHistorySteps(cachedCurrent.steps); setHistorySleep(cachedCurrent.sleep);
    setPreviousSteps(cachedPrevious.steps); setPreviousSleep(cachedPrevious.sleep);
    setHistoryLoading(!hasCachedData);

    if (!IS_NATIVE) {
      setHistoryLoading(false);
      return;
    }
    try {
      if (!hasCachedData) setHistoryLoading(true);
      const sData = await healthService.getStepsHistory(totalDays);
      const slData = await healthService.getSleepHistory(totalDays);
      const current = buildHistoryRows(range.days, sData, slData, manualLog, sleepMode, manualSleepHours, 0);
      const previous = buildHistoryRows(range.days, sData, slData, manualLog, sleepMode, manualSleepHours, range.days);
      setHistorySteps(current.steps); setHistorySleep(current.sleep);
      setPreviousSteps(previous.steps); setPreviousSleep(previous.sleep);
      const todaySteps = current.steps[current.steps.length - 1]?.value || 0;
      const todaySleep = current.sleep[current.sleep.length - 1]?.value || 0;
      if (todaySteps > 0) setSteps(todaySteps);
      if (todaySleep > 0 && sleepMode !== 'manual') setSleep({ hours: todaySleep.toFixed(1), minutes: Math.round(todaySleep * 60) });
      const persistKey = `${range.days}:${todaySteps}:${todaySleep}:${getHistorySignature(sData, slData)}`;
      if (updateHealthData && (sData?.length || slData?.length) && lastHistoryPersistKey.current !== persistKey) {
        lastHistoryPersistKey.current = persistKey;
        updateHealthData(todaySteps, sleepMode === 'manual' ? manualSleepHours : todaySleep, {
          stepsHistory: sData,
          sleepHistory: slData
        });
      }
    } catch (err) { console.warn("History:", err); } finally { setHistoryLoading(false); }
  }, [historyRange, manualSleepHours, sleepMode, state?.healthPreferences?.manualSleepLog, state?.healthDailyHistory, updateHealthData]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Sync ──
  const loadNativeData = async () => {
    setLoading(true); setError(''); setSyncSuccess(false); setDiagLog([]);
    addLog('Sync gestartet...');
    let fetchedSteps = 0, fetchedSleep = { hours: '0.0', minutes: 0 };
    try {
      if (IS_NATIVE) {
        try { await healthService.requestPermissions(addLog); } catch (e) { }
        try { fetchedSteps = await healthService.getTodaySteps(addLog); } catch (e) { }
        try { fetchedSleep = await healthService.getLastNightSleep(addLog); } catch (e) { }
        setSteps(fetchedSteps); setSleep(fetchedSleep);
        // Patch today's history buckets
        const todayKey = getToday();
        setHistorySteps(prev => patchHistoryValue(prev, todayKey, fetchedSteps));
        setHistorySleep(prev => patchHistoryValue(prev, todayKey, sleepMode === 'manual' ? manualSleepHours : parseFloat(fetchedSleep.hours)));
      } else { addLog('Web: Keine Sensoren.'); }
      setLastSyncTime(new Date().toLocaleString('de-DE'));
      setSyncSuccess(true);
      return { steps: fetchedSteps, sleep: fetchedSleep };
    } catch (err) {
      setError(err.message || String(err)); return null;
    } finally { setLoading(false); }
  };

  const syncAndReward = async () => {
    const data = await loadNativeData();
    if (!data) return;
    const s = data.steps;
    let sl = parseFloat(data.sleep.hours);
    if (sleepMode === 'manual') sl = manualSleepHours;
    if (sleepMode === 'off') sl = 0;
    if (s > 0 || sl > 0) {
      if (updateHealthData) updateHealthData(s, sl);
      else if (persist) persist({ ...state, lastNativeSync: new Date().toLocaleString('de-DE') });
    }
    if (claimHealthReward) {
      if (s >= 5000 && !state?.healthRewardsClaimed?.steps_5000) claimHealthReward("steps_5000", 15, 50, "5.000 Schritte", "Schritt-Meilenstein");
      if (s >= 10000 && !state?.healthRewardsClaimed?.steps_10000) claimHealthReward("steps_10000", 30, 100, "10.000 Schritte", "Schritt-Meilenstein");
      if (sleepMode !== 'off' && sl >= 7 && !state?.healthRewardsClaimed?.sleep_7h) claimHealthReward("sleep_7h", 20, 60, "7+ Stunden Schlaf", "Erholungs-Bonus");
    }
  };

  const updatePreferences = (updates) => {
    persist({ ...state, healthPreferences: { ...(state?.healthPreferences || {}), ...updates } });
  };

  const handleAuthorizeHealth = async () => {
    setIsAuthorizing(true);
    try { await healthService.authorize(addLog); await syncAndReward(); } catch (e) { }
    finally { setIsAuthorizing(false); }
  };

  // ── Computed ──
  const stepsPct = Math.min((steps / 10000) * 100, 100);
  const displaySleep = sleepMode === 'manual' ? manualSleepHours : parseFloat(sleep.hours);
  const sleepPct = Math.min((displaySleep / 8) * 100, 100);
  const rangeConfig = getHistoryRangeConfig(historyRange);
  const currentStats = summarizeHistory(historySteps, historySleep);
  const previousStats = summarizeHistory(previousSteps, previousSleep);
  const stepsTrend = formatStepsTrend(currentStats.totalSteps, previousStats.totalSteps);
  const sleepTrend = formatSleepTrend(currentStats.avgSleep, previousStats.avgSleep);

  // ─── TABS ───────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'HEUTE', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
    { id: 'history', label: 'VERLAUF', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg> },
    { id: 'settings', label: 'SYSTEM', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.09 15H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.05 1.39 1.18H21a2 2 0 1 1 0 4h-.09c-.62.13-1.13.58-1.39 1.18z" /></svg> }
  ];

  return (
    <div style={{ animation: 'healthSlideUp 0.3s ease', minHeight: 380 }}>
      <style>{HEALTH_CSS}</style>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
            background: tab === t.id ? 'rgba(56,189,248,0.12)' : 'transparent',
            color: tab === t.id ? '#38bdf8' : '#4a5568',
            fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 1.2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.25s', cursor: 'pointer',
            boxShadow: tab === t.id ? '0 0 16px rgba(56,189,248,0.08)' : 'none',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: OVERVIEW ═══════ */}
      {tab === 'overview' && (
        <div style={{ animation: 'healthSlideUp 0.35s ease' }}>

          {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', color: '#f87171', borderRadius: 12, marginBottom: 14, fontSize: 10, border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}

          {/* Hero Rings */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
            {/* Steps Ring */}
            <div style={{ textAlign: 'center' }}>
              <ProgressRing radius={44} stroke={5} progress={stepsPct} color="#38bdf8">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M13 22H6c-1.1 0-2-.9-2-2V9.06c0-1.06.84-1.92 1.89-1.98L11 7l4-2 3.6 1.8c.8.4 1.4 1.1 1.4 2.2V20c0 1.1-.9 2-2 2h-5z" /><path d="M10 7V3h4v4" /></svg>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", marginTop: 2 }}>{steps.toLocaleString()}</div>
              </ProgressRing>
              <div style={{ fontSize: 7, color: '#38bdf8', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginTop: 6 }}>SCHRITTE</div>
              <div style={{ fontSize: 8, color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>/ 10.000</div>
            </div>

            {/* Sleep Ring (if not off) */}
            {sleepMode !== 'off' && (
              <div style={{ textAlign: 'center' }}>
                <ProgressRing radius={44} stroke={5} progress={sleepPct} color="#a78bfa">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 0 2.93 17.07z" /></svg>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", marginTop: 2 }}>{displaySleep}</div>
                </ProgressRing>
                <div style={{ fontSize: 7, color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginTop: 6 }}>SCHLAF</div>
                <div style={{ fontSize: 8, color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>{sleepMode === 'manual' ? 'manuell' : '/ 8h'}</div>
              </div>
            )}
          </div>

          {/* Reward Milestones */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[
              { key: 'steps_5000', label: '5K', claimed: state?.healthRewardsClaimed?.steps_5000, reached: steps >= 5000, color: '#38bdf8' },
              { key: 'steps_10000', label: '10K', claimed: state?.healthRewardsClaimed?.steps_10000, reached: steps >= 10000, color: '#38bdf8' },
              ...(sleepMode !== 'off' ? [{ key: 'sleep_7h', label: '7h+', claimed: state?.healthRewardsClaimed?.sleep_7h, reached: displaySleep >= 7, color: '#a78bfa' }] : [])
            ].map(m => (
              <div key={m.key} style={{
                flex: 1, padding: '8px', borderRadius: 10, textAlign: 'center',
                background: m.claimed ? `${m.color}12` : 'rgba(0,0,0,0.25)',
                border: `1px solid ${m.claimed ? m.color + '44' : m.reached ? m.color + '33' : 'rgba(255,255,255,0.04)'}`,
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: m.claimed ? m.color : m.reached ? '#fff' : '#4a5568', fontFamily: "'JetBrains Mono',monospace" }}>{m.label}</div>
                <div style={{ fontSize: 7, color: m.claimed ? m.color : '#4a5568', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                  {m.claimed ? '✓ CLAIMED' : m.reached ? 'BEREIT' : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Sync Button */}
          <button onClick={syncAndReward} disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: loading ? 'rgba(56,189,248,0.06)' : syncSuccess ? 'rgba(34,197,94,0.08)' : 'rgba(56,189,248,0.08)',
            border: `1px solid ${syncSuccess ? 'rgba(34,197,94,0.25)' : 'rgba(56,189,248,0.2)'}`,
            color: syncSuccess ? '#22c55e' : '#38bdf8',
            fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
          }}>
            {loading ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'healthSpin 1.2s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> SYNCHRONISIERE...</>
            ) : syncSuccess ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg> SYNC ERFOLGREICH</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> DATEN ABRUFEN</>
            )}
          </button>

          {/* Last sync */}
          {lastSyncTime && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 8, color: '#374151', fontFamily: "'JetBrains Mono',monospace" }}>Letzter Sync: {lastSyncTime}</div>}

          {/* Connect hint */}
          {IS_NATIVE && steps === 0 && parseFloat(sleep.hours) === 0 && syncSuccess && (
            <div style={{ marginTop: 14, padding: '14px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#fca5a5', marginBottom: 10, lineHeight: 1.5 }}>Keine Daten erkannt. Prüfe ob Apple Health Rechte erteilt wurden.</div>
              <button onClick={handleAuthorizeHealth} disabled={isAuthorizing} style={{
                padding: '10px 20px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, fontWeight: 700, fontSize: 9, letterSpacing: 1, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace"
              }}>{isAuthorizing ? 'VERBINDE...' : 'HEALTH VERBINDEN'}</button>
            </div>
          )}

          {/* Diag Log (collapsible) */}
          {diagLog.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 8, color: '#4a5568', fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', letterSpacing: 1 }}>DIAGNOSE LOG ({diagLog.length})</summary>
              <div style={{ marginTop: 6, padding: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: 10, maxHeight: 150, overflowY: 'auto', border: '1px solid rgba(99,102,241,0.15)' }}>
                {diagLog.map((l, i) => (
                  <div key={i} style={{ fontSize: 8, color: l.includes('FEHLER') || l.includes('ERROR') ? '#f87171' : l.includes('✓') ? '#22c55e' : '#6b7280', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7, borderBottom: '1px solid rgba(255,255,255,0.02)', padding: '1px 0' }}>{l}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ═══════ TAB: HISTORY ═══════ */}
      {tab === 'history' && (
        <div style={{ animation: 'healthSlideUp 0.35s ease' }}>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: 'rgba(0,0,0,0.28)', borderRadius: 12, padding: 4 }}>
            {HISTORY_RANGES.map(r => (
              <button key={r.key} onClick={() => { setHistoryRange(r.key); updatePreferences({ healthHistoryRange: r.key }); }} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
                background: historyRange === r.key ? 'rgba(56,189,248,0.14)' : 'transparent',
                color: historyRange === r.key ? '#38bdf8' : '#475569',
                fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                cursor: 'pointer', transition: 'all 0.2s'
              }}>{r.label}</button>
            ))}
          </div>

          <div style={{ fontSize: 8, color: '#475569', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2, marginBottom: 12, textAlign: 'center' }}>
            AKTUELLER ZEITRAUM: {rangeConfig.days} TAGE / VERGLEICH MIT VORPERIODE
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <StatMini
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"><path d="M13 22H6c-1.1 0-2-.9-2-2V9.06c0-1.06.84-1.92 1.89-1.98L11 7l4-2 3.6 1.8c.8.4 1.4 1.1 1.4 2.2V20c0 1.1-.9 2-2 2h-5z" /></svg>}
              label="GESAMT" value={currentStats.totalSteps.toLocaleString()} color="#38bdf8" detail={`TREND ${stepsTrend}`}
            />
            <StatMini
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"><path d="M8 17l4-4 4 4" /><path d="M12 13V3" /><path d="M20 21H4" /></svg>}
              label="AVG / TAG" value={currentStats.avgSteps.toLocaleString()} color="#38bdf8" detail={`${currentStats.stepGoalDays}/${rangeConfig.days} ZIELTAGE`}
            />
            {sleepMode !== 'off' && (
              <StatMini
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 0 2.93 17.07z" /></svg>}
                label="AVG SCHLAF" value={`${currentStats.avgSleep.toFixed(1)}h`} color="#a78bfa" detail={`TREND ${sleepTrend}`}
              />
            )}
            {sleepMode !== 'off' && (
              <StatMini
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"><path d="M12 3v18" /><path d="M7 8h10" /><path d="M7 16h10" /></svg>}
                label="7H+ N\u00c4CHTE" value={`${currentStats.sleepGoalNights}/${rangeConfig.days}`} color="#a78bfa" detail={`BESTE ${(parseFloat(currentStats.bestSleepNight?.value) || 0).toFixed(1)}h`}
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: sleepMode === 'off' ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatMini
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>}
              label="BESTER SCHRITT-TAG" value={(parseFloat(currentStats.bestStepDay?.value) || 0).toLocaleString()} color="#22c55e" detail={currentStats.bestStepDay?.date ? formatDateShort(currentStats.bestStepDay.date) : '--'}
            />
            {sleepMode !== 'off' && (
              <StatMini
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M4 14h16" /><path d="M7 14V8a3 3 0 0 1 6 0v6" /></svg>}
                label="BESTE NACHT" value={`${(parseFloat(currentStats.bestSleepNight?.value) || 0).toFixed(1)}h`} color="#22c55e" detail={currentStats.bestSleepNight?.date ? formatDateShort(currentStats.bestSleepNight.date) : '--'}
              />
            )}
          </div>

          {/* Steps Chart */}
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #38bdf818', borderRadius: 16, padding: '16px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#38bdf8', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
              SCHRITTE
            </div>
            {historyLoading
              ? <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>LADEN...</div>
              : <BarChart data={historySteps} primaryColor="#38bdf8" labelFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
            }
          </div>

          {/* Sleep Chart */}
          {sleepMode !== 'off' && (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #a78bfa18', borderRadius: 16, padding: '16px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 0 2.93 17.07z" /></svg>
                SCHLAF
              </div>
              {historyLoading
                ? <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>LADEN...</div>
                : <BarChart data={historySleep} primaryColor="#a78bfa" labelFormatter={v => `${v}h`} />
              }
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB: SETTINGS ═══════ */}
      {tab === 'settings' && (
        <div style={{ animation: 'healthSlideUp 0.35s ease' }}>

          {/* Platform Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: IS_NATIVE ? '#22c55e' : '#f59e0b', boxShadow: `0 0 8px ${IS_NATIVE ? '#22c55e' : '#f59e0b'}66` }} />
            <div style={{ fontSize: 9, color: IS_NATIVE ? '#22c55e' : '#f59e0b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, fontWeight: 600 }}>
              {IS_NATIVE ? 'NATIVE · HEALTHKIT VERBUNDEN' : 'WEB · EINGESCHRÄNKTER MODUS'}
            </div>
          </div>

          {/* Sleep Mode Selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>SCHLAFTRACKING MODUS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'auto', title: 'Automatisch', desc: 'Via Apple HealthKit Sensor', color: '#38bdf8', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
                { value: 'manual', title: 'Manuell', desc: 'Tägliche Direkteingabe', color: '#a78bfa', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
                { value: 'off', title: 'Deaktiviert', desc: 'Kein Schlaftracking', color: '#6b7280', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg> }
              ].map(opt => (
                <div key={opt.value} onClick={() => updatePreferences({ sleepMode: opt.value })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 14,
                    border: `1px solid ${sleepMode === opt.value ? opt.color + '55' : 'rgba(255,255,255,0.04)'}`,
                    background: sleepMode === opt.value ? `${opt.color}10` : 'rgba(0,0,0,0.2)',
                    cursor: 'pointer', transition: 'all 0.25s',
                  }}>
                  {/* Radio dot */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sleepMode === opt.value ? opt.color : '#374151'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {sleepMode === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />}
                  </div>
                  <div style={{ color: sleepMode === opt.value ? opt.color : '#6b7280', flexShrink: 0 }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: sleepMode === opt.value ? '#fff' : '#94a3b8', letterSpacing: 0.5 }}>{opt.title}</div>
                    <div style={{ fontSize: 8, color: '#4a5568', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Sleep Input */}
          {sleepMode === 'manual' && (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #a78bfa33', borderRadius: 14, padding: '16px', animation: 'healthSlideUp 0.3s ease' }}>
              <div style={{ fontSize: 8, color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 12 }}>HEUTIGER SCHLAF</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number" min="0" max="24" step="0.5"
                  value={manualSleepHours}
                  onChange={e => { setManualSleepHours(parseFloat(e.target.value) || 0); setSavedManual(false); }}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #a78bfa33', padding: '10px 12px', borderRadius: 10, color: '#fff', fontSize: 18, width: 70, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textAlign: 'center' }}
                />
                <div style={{ fontSize: 12, color: '#64748b' }}>h</div>
                <button
                  onClick={() => {
                    const todayKey = getToday();
                    updatePreferences({
                      manualSleepToday: manualSleepHours,
                      manualSleepLog: { ...(state?.healthPreferences?.manualSleepLog || {}), [todayKey]: manualSleepHours }
                    });
                    setHistorySleep(prev => patchHistoryValue(prev, todayKey, manualSleepHours));
                    setSavedManual(true);
                    setTimeout(() => setSavedManual(false), 2000);
                  }}
                  style={{
                    marginLeft: 'auto', padding: '10px 18px', borderRadius: 10, border: 'none',
                    background: savedManual ? 'rgba(34,197,94,0.15)' : '#a78bfa',
                    color: savedManual ? '#22c55e' : '#000',
                    fontWeight: 800, fontSize: 9, letterSpacing: 1, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.3s'
                  }}>
                  {savedManual ? '✓ GESPEICHERT' : 'SPEICHERN'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
