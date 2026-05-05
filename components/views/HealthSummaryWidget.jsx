import React, { useState, useEffect, useCallback } from 'react';
import { healthService } from '../../services/healthService';
import { Capacitor } from '@capacitor/core';
import { AnimatedNumber } from '../../hooks/useAnimatedCounter.jsx';

const IS_NATIVE = Capacitor.isNativePlatform();

export function HealthSummaryWidget({ state, theme, openDetails }) {
    const [steps, setSteps] = useState(0);
    const [sleep, setSleep] = useState({ hours: '0.0' });
    const [hasChecked, setHasChecked] = useState(false);

    const fetchHealthQuietly = useCallback(async (activeObj = { active: true }) => {
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
            try {
                const s = await healthService.getTodaySteps(silentLog);
                if (activeObj.active) setSteps(s);
            } catch (e) { }

            try {
                const sl = await healthService.getLastNightSleep(silentLog);
                if (activeObj.active) setSleep(sl);
            } catch (e) { }
        } catch (err) {
            console.warn("[HealthSummary] Quiet fetch failed:", err);
        } finally {
            if (activeObj.active) setHasChecked(true);
        }
    }, []);

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
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') onFocus();
        });

        return () => {
            activeObj.active = false;
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, [fetchHealthQuietly]);

    const sleepMode = state?.healthPreferences?.sleepMode || 'auto';
    const progressSteps = Math.min((steps / 10000) * 100, 100);
    const primaryColor = theme?.primary || "#38bdf8";

    // Grab manual sleep if necessary
    const displaySleep = sleepMode === 'manual' ? (state?.healthPreferences?.manualSleepToday || 0) : sleep.hours;

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
        </div>
    );
}
