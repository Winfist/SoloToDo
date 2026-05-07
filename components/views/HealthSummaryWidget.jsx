import React, { useState, useEffect, useCallback, useRef } from 'react';
import { healthService } from '../../services/healthService';
import { Capacitor } from '@capacitor/core';
import { AnimatedNumber } from '../../hooks/useAnimatedCounter.jsx';
import { getLocalDateKey, getToday } from '../../data/dateUtils.js';

const IS_NATIVE = Capacitor.isNativePlatform();

function buildWeekStats(stepHistory = [], sleepHistory = [], sleepMode = 'auto', manualSleepLog = {}, manualSleepToday = 0) {
    const stepMap = Object.fromEntries((stepHistory || []).map(item => [item.date, parseFloat(item.value) || 0]));
    const sleepMap = Object.fromEntries((sleepHistory || []).map(item => [item.date, parseFloat(item.hours ?? item.value) || 0]));
    const todayKey = getToday();
    let totalSteps = 0;
    let totalSleep = 0;
    let sleepDays = 0;

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = getLocalDateKey(d);
        totalSteps += stepMap[dateKey] || 0;

        let sleepValue = sleepMap[dateKey] || 0;
        if (sleepMode === 'manual') {
            const manualValue = manualSleepLog?.[dateKey] ?? (dateKey === todayKey ? manualSleepToday : null);
            if (manualValue !== null && manualValue !== undefined) sleepValue = parseFloat(manualValue) || 0;
        }
        if (sleepValue > 0) {
            totalSleep += sleepValue;
            sleepDays += 1;
        }
    }

    return {
        avgSteps: Math.round(totalSteps / 7),
        avgSleep: sleepDays ? (totalSleep / sleepDays).toFixed(1) : '0.0',
    };
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
    };
}

function getHistorySignature(stepsData = [], sleepData = []) {
    const stepSig = (stepsData || []).map(row => `${row.date}:${Math.max(0, Math.floor(Number(row.value) || 0))}`).join(',');
    const sleepSig = (sleepData || []).map(row => `${row.date}:${Math.max(0, Number((row.hours ?? row.value) || 0)).toFixed(1)}`).join(',');
    return `${stepSig}|${sleepSig}`;
}

export function HealthSummaryWidget({ state, theme, openDetails, updateHealthData }) {
    const cachedToday = getCachedToday(state);
    const sleepMode = state?.healthPreferences?.sleepMode || 'auto';
    const manualSleepToday = state?.healthPreferences?.manualSleepToday || 0;
    const manualSleepLog = state?.healthPreferences?.manualSleepLog;
    const cachedHistory = getCachedHealthArrays(state);
    const [steps, setSteps] = useState(cachedToday.steps);
    const [sleep, setSleep] = useState({ hours: cachedToday.sleepHours.toFixed(1) });
    const [weekStats, setWeekStats] = useState(buildWeekStats(cachedHistory.steps, cachedHistory.sleep, sleepMode, manualSleepLog, manualSleepToday));
    const [hasChecked, setHasChecked] = useState(false);
    const lastPersistKey = useRef('');

    useEffect(() => {
        const cached = getCachedToday(state);
        const history = getCachedHealthArrays(state);
        setSteps(cached.steps);
        setSleep({ hours: cached.sleepHours.toFixed(1) });
        setWeekStats(buildWeekStats(history.steps, history.sleep, sleepMode, manualSleepLog, manualSleepToday));
    }, [state?.dailySteps, state?.dailySleepHours, state?.healthDailyHistory, sleepMode, manualSleepLog, manualSleepToday]);

    const fetchHealthQuietly = useCallback(async (activeObj = { active: true }) => {
        const cached = getCachedToday(state);
        const cachedHistoryRows = getCachedHealthArrays(state);
        if (activeObj.active) {
            setSteps(cached.steps);
            setSleep({ hours: cached.sleepHours.toFixed(1) });
            setWeekStats(buildWeekStats(cachedHistoryRows.steps, cachedHistoryRows.sleep, sleepMode, manualSleepLog, manualSleepToday));
        }

        if (!IS_NATIVE) {
            if (activeObj.active) setHasChecked(true);
            return;
        }
        try {
            const isAvail = await healthService.isAvailable();
            if (!isAvail) {
                if (activeObj.active) setHasChecked(true);
                return;
            }
            const silentLog = () => { };
            let fetchedSteps = cached.steps;
            let fetchedSleepHours = cached.sleepHours;
            let stepsHistory = cachedHistoryRows.steps;
            let sleepHistory = cachedHistoryRows.sleep;

            try {
                const s = await healthService.getTodaySteps(silentLog);
                fetchedSteps = Math.max(0, Math.floor(Number(s) || 0));
                if (activeObj.active) setSteps(s);
            } catch (e) { }

            try {
                const sl = await healthService.getLastNightSleep(silentLog);
                fetchedSleepHours = Math.max(0, Number(sl?.hours) || 0);
                if (activeObj.active) setSleep(sl);
            } catch (e) { }

            try {
                stepsHistory = await healthService.getStepsHistory(7, silentLog);
                sleepHistory = await healthService.getSleepHistory(7, silentLog);
                if (activeObj.active) setWeekStats(buildWeekStats(stepsHistory, sleepHistory, sleepMode, manualSleepLog, manualSleepToday));
            } catch (e) { }

            const sleepForPersist = sleepMode === 'manual' ? manualSleepToday : fetchedSleepHours;
            const persistKey = `${fetchedSteps}:${sleepForPersist}:${getHistorySignature(stepsHistory, sleepHistory)}`;
            if (
                updateHealthData &&
                (fetchedSteps > 0 || sleepForPersist > 0 || stepsHistory?.length || sleepHistory?.length) &&
                lastPersistKey.current !== persistKey
            ) {
                lastPersistKey.current = persistKey;
                updateHealthData(fetchedSteps, sleepMode === 'off' ? 0 : sleepForPersist, {
                    stepsHistory,
                    sleepHistory: sleepMode === 'off' ? [] : sleepHistory
                });
            }
        } catch (err) {
            console.warn("[HealthSummary] Quiet fetch failed:", err);
        } finally {
            if (activeObj.active) setHasChecked(true);
        }
    }, [manualSleepLog, manualSleepToday, sleepMode, state?.dailySteps, state?.dailySleepHours, state?.healthDailyHistory, updateHealthData]);

    useEffect(() => {
        let activeObj = { active: true };

        // Initial delayed fetch to avoid blocking render
        setTimeout(() => fetchHealthQuietly(activeObj), 500);

        // Fetch every 30 seconds
        const intervalId = setInterval(() => {
            fetchHealthQuietly(activeObj);
        }, 30000);

        // Fetch on window focus/resume
        const onFocus = () => fetchHealthQuietly(activeObj);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') onFocus();
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            activeObj.active = false;
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [fetchHealthQuietly]);

    const progressSteps = Math.min((steps / 10000) * 100, 100);
    const primaryColor = theme?.primary || "#38bdf8";

    // Grab manual sleep if necessary
    const displaySleep = sleepMode === 'manual' ? manualSleepToday : sleep.hours;

    const sleepValue = parseFloat(displaySleep) || 0;
    const sleepProgress = Math.min((sleepValue / 9) * 100, 100);
    const stepGoalReached = steps >= 10000;

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
                borderTop: `1px solid ${primaryColor}38`,
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
                    <div style={{ fontSize: 10, fontWeight: 800, color: primaryColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.4 }}>BIOMETRICS</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Koerperstatus</div>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace", padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }}>
                    Details
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: sleepMode === 'off' ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 10, fontFamily: "'JetBrains Mono',monospace", marginBottom: 7 }}>
                        <span>Schritte</span>
                        <span style={{ color: stepGoalReached ? '#22c55e' : '#64748b' }}>{stepGoalReached ? 'Ziel' : '10k'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
                            <AnimatedNumber value={steps} duration={1200} format="locale" />
                        </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 9 }}>
                        <div style={{ width: `${progressSteps}%`, height: '100%', background: stepGoalReached ? '#22c55e' : primaryColor, borderRadius: 999, transition: 'width 0.7s ease' }} />
                    </div>
                </div>

                {sleepMode !== 'off' && (
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 10, fontFamily: "'JetBrains Mono',monospace", marginBottom: 7 }}>
                            <span>Schlaf</span>
                            <span style={{ color: sleepValue >= 7 ? '#a78bfa' : '#64748b' }}>{sleepMode === 'manual' ? 'Manuell' : 'Ziel 7h'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                            <div style={{ color: '#f8fafc', fontSize: 28, fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
                                {displaySleep}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>h</div>
                        </div>
                        <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 9 }}>
                            <div style={{ width: `${sleepProgress}%`, height: '100%', background: '#a78bfa', borderRadius: 999, transition: 'width 0.7s ease' }} />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: sleepMode === 'off' ? '1fr' : '1fr 1fr', gap: 8, marginTop: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
                    7T Schnitt <strong style={{ color: primaryColor, fontSize: 11 }}>{weekStats.avgSteps.toLocaleString()}</strong>
                </div>
                {sleepMode !== 'off' && (
                    <div style={{ color: '#94a3b8', fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textAlign: 'right' }}>
                        Schlaf <strong style={{ color: '#a78bfa', fontSize: 11 }}>{weekStats.avgSleep}h</strong>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div
            onClick={openDetails}
            style={{
                background: `linear-gradient(135deg, ${primaryColor}11, ${primaryColor}03)`,
                borderRadius: 18,
                padding: "16px",
                border: `1px solid ${primaryColor}33`,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px ${primaryColor}0a`
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}1a, ${primaryColor}08)`;
                e.currentTarget.style.boxShadow = `0 12px 40px ${primaryColor}22, inset 0 0 20px ${primaryColor}15`;
                e.currentTarget.style.borderColor = `${primaryColor}66`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}11, ${primaryColor}03)`;
                e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px ${primaryColor}0a`;
                e.currentTarget.style.borderColor = `${primaryColor}33`;
            }}
        >
            {/* Glow sweep layer */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "100%", background: `radial-gradient(ellipse at left, ${primaryColor}22, transparent 70%)`, pointerEvents: "none" }} />

            {/* Header / Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${primaryColor}88)` }}>
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <div style={{ fontSize: 10, fontWeight: 800, color: primaryColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>BIOMETRICS</div>
                </div>
                <div style={{ fontSize: 9, color: `${primaryColor}aa`, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>
                    DETAILS &#10095;
                </div>
            </div>

            {/* Split Grid for Steps & Sleep */}
            <div style={{ display: "grid", gridTemplateColumns: sleepMode === "off" ? "1fr" : "1fr 1fr", gap: 12, position: "relative", zIndex: 1 }}>

                {/* ── STEPS ── */}
                <div style={{
                    background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "12px",
                    border: `1px solid ${primaryColor}22`,
                    display: "flex", flexDirection: "column"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8, background: `${primaryColor}15`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `1px solid ${primaryColor}44`, position: "relative"
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 22H6c-1.1 0-2-.9-2-2V9.06c0-1.06.84-1.92 1.89-1.98L11 7l4-2 3.6 1.8c.8.4 1.4 1.1 1.4 2.2V20c0 1.1-.9 2-2 2h-5z" />
                                <path d="M10 7V3h4v4" />
                            </svg>
                            {(steps >= 10000 && !state?.healthRewardsClaimed?.steps_10000 && hasChecked) && (
                                <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "1.5px solid rgba(10,10,20,1)", animation: "pulse 1.5s infinite" }} />
                            )}
                        </div>
                        <div style={{ fontSize: 8, color: steps >= 10000 ? "#4ade80" : "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, textAlign: "right" }}>
                            {steps >= 10000 ? "ZIEL ERREICHT" : "TÄGLICHES ZIEL"}
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1 }}>
                            <AnimatedNumber value={steps} duration={1200} format="locale" />
                        </div>
                        <div style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>/ 10k</div>
                    </div>

                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: "auto", position: "relative", overflow: "hidden" }}>
                        <div style={{ width: `${progressSteps}%`, height: "100%", background: `linear-gradient(90deg, ${primaryColor}aa, ${primaryColor})`, borderRadius: 2, transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)" }} />
                        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.3)" }} />
                    </div>
                </div>

                {/* ── SLEEP ── */}
                {sleepMode !== "off" && (
                    <div style={{
                        background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "12px",
                        border: `1px solid #a78bfa22`,
                        display: "flex", flexDirection: "column"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, background: "#a78bfa15",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: "1px solid #a78bfa44"
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 0 2.93 17.07z" />
                                </svg>
                            </div>
                            <div style={{ fontSize: 8, color: parseFloat(displaySleep) >= 7 ? "#a78bfa" : "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, textAlign: "right" }}>
                                {sleepMode === "manual" ? "MANUELL" : (parseFloat(displaySleep) >= 7 ? "GUT ERHOLT" : "SCHLAFDAUER")}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1 }}>
                                {displaySleep}
                            </div>
                            <div style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>h</div>
                        </div>

                        <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: "auto", position: "relative", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min((parseFloat(displaySleep) / 9) * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg, #8b5cf6, #a78bfa)`, borderRadius: 2, transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)" }} />
                            <div style={{ position: "absolute", left: `${(7 / 9) * 100}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.3)" }} />
                        </div>
                    </div>
                )}

            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: sleepMode === "off" ? "1fr" : "1fr 1fr", gap: 8, position: "relative", zIndex: 1 }}>
                <div style={{ background: "rgba(56,189,248,0.06)", border: `1px solid ${primaryColor}22`, borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>AVG 7T</span>
                    <span style={{ fontSize: 10, color: primaryColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{weekStats.avgSteps.toLocaleString()} / Tag</span>
                </div>
                {sleepMode !== "off" && (
                    <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid #a78bfa22", borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>AVG 7T</span>
                        <span style={{ fontSize: 10, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{weekStats.avgSleep}h Schlaf</span>
                    </div>
                )}
            </div>
        </div>
    );
}
