import React, { useState } from "react";
import { calculateLevelUp } from "../data/constants";

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
            const dateStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
            setLastSync(dateStr);

            const newXp = Math.floor(data.steps * 0.05 + data.workout * 2 + (data.sleep >= 7 ? 50 : 0));

            persist(calculateLevelUp({
                ...state,
                healthSyncDate: dateStr
            }, newXp));

            notify(`Apple Health / Google Fit synchronisiert! +${newXp} Bonus XP erhalten.`, "success");
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
                    <div style={{ fontSize: 32 }}>❤️</div>
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
                        {syncing ? <span style={{ animation: "spin 1s linear infinite" }}>⏳</span> : <span>🔄</span>}
                        {syncing ? "SYNCHRONISIERUNG..." : "JETZT SYNCHRONISIEREN"}
                    </button>
                    {lastSync && <div style={{ fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>Letzter Sync: {lastSync}</div>}
                </div>

                {lastSync && (
                    <div style={{ animation: "slideUp 0.4s ease" }}>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>HEUTIGE MESSEWERTE</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            {[
                                { icon: "👟", label: "SCHRITTE", val: syncedData.steps.toLocaleString(), color: "#38bdf8" },
                                { icon: "💤", label: "SCHLAF", val: `${syncedData.sleep.toFixed(1)}h`, color: "#a78bfa" },
                                { icon: "⚡", label: "WORKOUT", val: `${syncedData.workout}m`, color: "#f59e0b" }
                            ].map(s => (
                                <div key={s.label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px", border: `1px solid ${s.color}22`, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.val}</div>
                                    <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, letterSpacing: 1 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 16, padding: "12px", borderRadius: 12, background: "rgba(251,191,36,0.05)", border: "1px dashed rgba(251,191,36,0.3)", display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontSize: 20 }}>🔥</span>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>Passive XP Gutschrift</div>
                                <div style={{ fontSize: 9, color: "#d97706", marginTop: 2 }}>Basierend auf deinem Activity-Level hast du Statuspunkte-Erfahrung gesammelt.</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
