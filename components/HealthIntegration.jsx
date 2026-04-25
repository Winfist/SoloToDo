import React, { useState } from "react";
import { HEALTH_ICONS, STAT_ICONS, NAV_ICONS } from "../data/icons.js";
import { getDateTimeLocalValue } from "../data/dateUtils.js";

export default function HealthIntegration({ state, persist, notify, theme }) {
    const [syncing, setSyncing] = useState(false);

    // Fake properties to simulate actual sync since web browsers lack HealthKit
    const [lastSync, setLastSync] = useState(state.healthSyncDate || null);
    const [syncedData, setSyncedData] = useState({
        steps: 0,
        sleep: 0,
        workout: 0
    });

    const handleSync = () => {
        setSyncing(true);
        setTimeout(() => {
            setSyncing(false);
            const data = {
                steps: Math.floor(Math.random() * 5000) + 5000, // 5k-10k
                sleep: (Math.floor(Math.random() * 30) + 60) / 10, // 6.0 - 9.0
                workout: Math.floor(Math.random() * 45) + 15 // 15 - 60
            };
            setSyncedData(data);
            const dateStr = getDateTimeLocalValue().replace('T', ' ');
            setLastSync(dateStr);

            // Only save the sync date — no XP reward per sync.
            // The one-time "health_link" achievement (300 XP) fires automatically
            // via checkAchievements when healthSyncDate is first set.
            persist({ ...state, healthSyncDate: dateStr });

            notify("Apple Health / Google Fit synchronisiert!", "success");
        }, 1500);
    };

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "20px", marginBottom: 16, backdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>LIFE SYNC</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>Health Data Tracker</div>
                    </div>
                    <div><img src={STAT_ICONS.vit} alt="Health" style={{ width: 36, height: 36, objectFit: "contain", filter: "drop-shadow(0 0 10px #22c55e88)" }} /></div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
                        Solo ToDo kann sicher mit <b>Apple Health</b> oder <b>Google Fit</b> verbunden werden, um deine körperlichen Aktivitäten passiv in Hunter XP umzuwandeln.
                    </p>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: syncing ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s", cursor: syncing ? "not-allowed" : "pointer" }}
                    >
                        {syncing ? <span style={{ animation: "spin 1s linear infinite" }}><img src={NAV_ICONS.settings} alt="sync" style={{ width: 14, height: 14, objectFit: "contain" }} /></span> : <img src={STAT_ICONS.vit} alt="sync" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                        {syncing ? "SYNCHRONISIERUNG..." : "JETZT SYNCHRONISIEREN"}
                    </button>
                    {lastSync && <div style={{ fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>Letzter Sync: {lastSync}</div>}
                </div>

                {lastSync && (
                    <div style={{ animation: "slideUp 0.4s ease" }}>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>HEUTIGE MESSEWERTE</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            {[
                                { icon: "👟", iconSrc: HEALTH_ICONS.steps, label: "SCHRITTE", val: syncedData.steps.toLocaleString(), color: "#38bdf8" },
                                { icon: "💤", iconSrc: HEALTH_ICONS.sleep, label: "SCHLAF", val: `${syncedData.sleep.toFixed(1)}h`, color: "#a78bfa" },
                                { icon: "⚡", iconSrc: STAT_ICONS.agi, label: "WORKOUT", val: `${syncedData.workout}m`, color: "#f59e0b" }
                            ].map(s => (
                                <div key={s.label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px", border: `1px solid ${s.color}22`, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, marginBottom: 4 }}>
                                    {s.iconSrc ? (
                                        <img src={s.iconSrc} alt={s.label} style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 6px ${s.color}88) brightness(1.1)` }} />
                                    ) : s.icon}
                                </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.val}</div>
                                    <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, letterSpacing: 1 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {!state.healthSyncDate && (
                            <div style={{ marginTop: 16, padding: "12px", borderRadius: 12, background: "rgba(139,92,246,0.05)", border: "1px dashed rgba(139,92,246,0.3)", display: "flex", gap: 10, alignItems: "center" }}>
                                <img src={NAV_ICONS.achievements} alt="Achievement" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px #a78bfa88)", flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>Einmaliges Achievement</div>
                                    <div style={{ fontSize: 9, color: "#7c3aed", marginTop: 2 }}>Erster Sync schaltet "Vitalität Gekoppelt" frei (+300 XP).</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
