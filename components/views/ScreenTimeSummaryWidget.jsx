import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatedNumber } from '../../hooks/useAnimatedCounter.jsx';
import { screenTimeService } from '../../services/screenTimeService.js';
import { addLocalDays, getLocalDateKey, getToday } from '../../data/dateUtils.js';

const DEFAULT_LIMIT = 180;

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

function getTodayRow(state) {
  const date = getToday();
  const limit = getLimit(state);
  const saved = state?.screenTimeDailyHistory?.[date] || {};
  const totalMinutes = Math.max(0, Math.floor(Number(saved.totalMinutes ?? state?.dailyScreenTimeMinutes) || 0));
  return {
    date,
    totalMinutes,
    limitMinutes: Math.max(1, Math.floor(Number(saved.limitMinutes) || limit)),
    underLimit: saved.underLimit ?? totalMinutes <= limit,
    source: saved.source || null,
  };
}

function buildWeekRows(state, offsetDays = 0) {
  const history = state?.screenTimeDailyHistory || {};
  const limit = getLimit(state);
  const rows = [];
  for (let i = 6 + offsetDays; i >= offsetDays; i--) {
    const d = addLocalDays(new Date(), -i);
    const date = getLocalDateKey(d);
    const saved = history[date] || {};
    const totalMinutes = Math.max(0, Math.floor(Number(saved.totalMinutes) || 0));
    rows.push({
      date,
      totalMinutes,
      limitMinutes: Math.max(1, Math.floor(Number(saved.limitMinutes) || limit)),
      underLimit: saved.underLimit ?? totalMinutes <= limit,
    });
  }
  return rows;
}

function sumRows(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.totalMinutes) || 0), 0);
}

function getTrend(currentTotal, previousTotal) {
  if (!previousTotal) return currentTotal > 0 ? 'NEU' : '0%';
  const pct = ((currentTotal - previousTotal) / previousTotal) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

export function ScreenTimeSummaryWidget({ state, theme, openDetails, updateScreenTimeData }) {
  const primaryColor = '#f59e0b';
  const today = getTodayRow(state);
  const limit = getLimit(state);
  const [currentToday, setCurrentToday] = useState(today);
  const lastPersistKey = useRef('');
  const capabilities = state?.screenTimePreferences?.lastCapability;

  const currentWeek = useMemo(() => buildWeekRows(state, 0), [state?.screenTimeDailyHistory, state?.screenTimePreferences]);
  const previousWeek = useMemo(() => buildWeekRows(state, 7), [state?.screenTimeDailyHistory, state?.screenTimePreferences]);
  const currentTotal = sumRows(currentWeek);
  const previousTotal = sumRows(previousWeek);
  const avg = Math.round(currentTotal / 7);
  const progress = Math.min(100, (currentToday.totalMinutes / limit) * 100);
  const statusColor = currentToday.totalMinutes > limit ? '#ef4444' : primaryColor;

  useEffect(() => {
    setCurrentToday(getTodayRow(state));
  }, [state?.dailyScreenTimeMinutes, state?.screenTimeDailyHistory, state?.screenTimePreferences]);

  useEffect(() => {
    let active = true;
    const quietSync = async () => {
      if (capabilities?.canExportDurations !== true) return;
      try {
        const result = await screenTimeService.syncToday();
        if (!result?.capabilities?.canExportDurations || !result?.day) return;
        const totalMinutes = Math.max(0, Math.floor(Number(result.day.totalMinutes) || 0));
        if (!active) return;
        setCurrentToday({ ...result.day, totalMinutes, limitMinutes: limit, underLimit: totalMinutes <= limit });
        const persistKey = `${result.day.date || getToday()}:${totalMinutes}`;
        if (updateScreenTimeData && lastPersistKey.current !== persistKey) {
          lastPersistKey.current = persistKey;
          updateScreenTimeData(totalMinutes, {
            dateKey: result.day.date || getToday(),
            limitMinutes: limit,
            source: result.day.source || 'native-screen-time',
            apps: result.day.apps,
            categories: result.day.categories,
            capabilities: result.capabilities,
          });
        }
      } catch (err) {
        console.warn('[ScreenTimeSummary] Quiet sync failed:', err);
      }
    };

    const timer = setTimeout(quietSync, 900);
    const intervalId = setInterval(quietSync, 45000);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [capabilities?.canExportDurations, limit, updateScreenTimeData]);

  const trend = getTrend(currentTotal, previousTotal);
  const underLimit = currentToday.totalMinutes <= limit;

  return (
    <div
      onClick={openDetails}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') openDetails?.();
      }}
      style={{
        background: 'linear-gradient(180deg, rgba(8,12,24,0.94), rgba(5,7,15,0.98))',
        border: '1px solid rgba(148,163,184,0.14)',
        borderTop: `1px solid ${statusColor}38`,
        borderRadius: 14,
        padding: 14,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 138,
        boxShadow: '0 10px 28px rgba(0,0,0,0.24)',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: statusColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.4 }}>FOKUS</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Bildschirmzeit</div>
        </div>
        <div style={{ fontSize: 10, color: underLimit ? '#22c55e' : '#ef4444', fontFamily: "'JetBrains Mono',monospace", padding: '4px 8px', borderRadius: 8, border: `1px solid ${underLimit ? '#22c55e35' : '#ef444435'}`, background: underLimit ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
          {underLimit ? 'Unter Limit' : 'Limit'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{ color: '#f8fafc', fontSize: 34, fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
            <AnimatedNumber value={currentToday.totalMinutes} duration={900} format="number" />
          </div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>min</div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, textAlign: 'right', lineHeight: 1.45 }}>
          Limit {formatMinutes(limit)}<br />
          Avg {formatMinutes(avg)}
        </div>
      </div>

      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 12 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: statusColor, borderRadius: 999, transition: 'width 0.7s ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, color: '#64748b', fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
        <span>Trend</span>
        <strong style={{ color: currentTotal <= previousTotal ? '#22c55e' : '#ef4444', fontSize: 12 }}>{trend}</strong>
      </div>
    </div>
  );

  return (
    <div
      onClick={openDetails}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}04)`,
        borderRadius: 18,
        padding: 16,
        border: `1px solid ${statusColor}33`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px ${primaryColor}0a`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = `${statusColor}66`;
        e.currentTarget.style.boxShadow = `0 12px 40px ${statusColor}22, inset 0 0 20px ${primaryColor}16`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = `${statusColor}33`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px ${primaryColor}0a`;
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `radial-gradient(ellipse at top right, ${primaryColor}22, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          <div style={{ fontSize: 10, fontWeight: 800, color: primaryColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>FOKUS</div>
        </div>
        <div style={{ fontSize: 9, color: `${primaryColor}aa`, fontFamily: "'JetBrains Mono',monospace" }}>DETAILS &#10095;</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 12, border: `1px solid ${statusColor}22`, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${statusColor}15`, border: `1px solid ${statusColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2h8" />
                <rect x="6" y="4" width="12" height="18" rx="2" />
              </svg>
            </div>
            <div style={{ fontSize: 8, color: currentToday.totalMinutes > limit ? '#fca5a5' : '#86efac', fontFamily: "'JetBrains Mono',monospace", textAlign: 'right' }}>
              {currentToday.totalMinutes > limit ? '\u00dcBER LIMIT' : 'UNTER LIMIT'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", lineHeight: 1 }}>
              <AnimatedNumber value={currentToday.totalMinutes} duration={900} format="number" />
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>min</div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: statusColor, borderRadius: 2, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
          </div>
          <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>Limit {formatMinutes(limit)}</div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '10px 11px', border: `1px solid ${primaryColor}22` }}>
            <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>AVG 7T</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel',serif", marginTop: 3 }}>{formatMinutes(avg)}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '10px 11px', border: `1px solid ${currentTotal <= previousTotal ? '#22c55e22' : '#ef444422'}` }}>
            <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>TREND</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: currentTotal <= previousTotal ? '#22c55e' : '#ef4444', fontFamily: "'Cinzel',serif", marginTop: 3 }}>{getTrend(currentTotal, previousTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
