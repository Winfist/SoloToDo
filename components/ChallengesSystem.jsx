import React, { useState, useEffect } from "react";
import { calculateLevelUp } from "../data/constants";

const WEEKLY_CHALLENGES = [
    { id: "iron_week", title: "Iron Week", req: "7 STR-Quests in einer Woche", reward: { xp: 500, gold: 200, badge: "iron_will" }, icon: "💪" },
    { id: "streak_master", title: "Streak Master", req: "7-Tage Streak halten", reward: { xp: 300, gold: 150 }, icon: "🔥" },
    { id: "scholar", title: "Scholar", req: "5 INT-Quests in einer Woche", reward: { xp: 400, gold: 100 }, icon: "📚" }
];

const MONTHLY_CHALLENGES = [
    { id: "hunter_games", title: "Hunter Games", desc: "Alle Hunter gemeinsam: 1 Million Quests", progressStr: "348.192 / 1.000.000", pct: 34, reward: { xp: 2000, title: "Global Contributor" }, icon: "🌍" }
];

const SEASONAL_EVENTS = [
    { id: "winter_dungeon", title: "Der gefrorene Turm", duration: "21.12 - 06.01", desc: "Spezielle Eis-Dungeons mit 2x Item Drop Rate.", active: false, icon: "❄️" },
    { id: "red_gate", title: "Red Gate Anomaly", duration: "Heute", desc: "Ein Red Gate wurde gesichtet. Extreme Gefahr. Extreme Belohnung.", active: true, icon: "🩸" }
];

export default function ChallengesSystem({ state, persist, notify, theme }) {
    const [tab, setTab] = useState("weekly");

    const completeChallenge = (c) => {
        // Only visual mock of completion for now
        if (state.completedChallenges?.includes(c.id)) {
            notify("Challenge wurde bereits abgeschlossen!", "warning");
            return;
        }
        persist(calculateLevelUp({
            ...state,
            gold: state.gold + (c.reward.gold || 0),
            completedChallenges: [...(state.completedChallenges || []), c.id]
        }, (c.reward.xp || 0)));
        notify(`Challenge bestanden: ${c.title}! +${c.reward.xp} XP`, "success");
    };

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "20px", marginBottom: 16, backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 14 }}>RETENTION SYSTEM</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    {[{ id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }, { id: "seasonal", label: "Events" }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: tab === t.id ? theme.primary + "22" : "transparent", color: tab === t.id ? theme.accent : "#475569", border: `1px solid ${tab === t.id ? theme.primary + "55" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === "weekly" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {WEEKLY_CHALLENGES.map((c, i) => {
                            const completed = state.completedChallenges?.includes(c.id);
                            return (
                                <div key={c.id} style={{ padding: "14px", borderRadius: 14, background: completed ? "rgba(34,197,94,0.05)" : theme.surface, border: `1px solid ${completed ? "#22c55e44" : theme.primary + "1a"}`, display: "flex", alignItems: "center", gap: 12, opacity: completed ? 0.6 : 1, animation: `slideUp 0.3s ease ${i * 0.1}s both` }}>
                                    <span style={{ fontSize: 24, filter: completed ? "grayscale(1)" : "none" }}>{c.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: completed ? "#22c55e" : "#e2e8f0" }}>{c.title}</div>
                                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{c.req}</div>
                                    </div>
                                    {completed ? (
                                        <div style={{ fontSize: 10, fontWeight: 900, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" }}>✓ DONE</div>
                                    ) : (
                                        <div style={{ textAlign: "right", fontSize: 9, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace" }}>
                                            <div>+{c.reward.xp} XP</div>
                                            <div>+{c.reward.gold} G</div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {tab === "monthly" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ padding: "14px", borderRadius: 14, background: `linear-gradient(135deg, ${theme.primary}11, ${theme.secondary}11)`, border: `1px solid ${theme.primary}33` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <span style={{ fontSize: 32 }}>🌍</span>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: theme.accent, fontFamily: "'Cinzel',serif" }}>Global Hunter Games</div>
                                    <div style={{ fontSize: 10, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>Community Event</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 11, color: "#cbd5e1", marginBottom: 10, lineHeight: 1.5 }}>
                                Alle Hunter arbeiten zusammen um 1.000.000 Quests abzuschließen.
                            </div>
                            <div style={{ height: 6, background: "#0f0f1e", borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
                                <div style={{ width: "34%", height: "100%", background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, boxShadow: `0 0 10px ${theme.glow}` }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "#64748b" }}>
                                <span>348.192</span>
                                <span>1.000.000</span>
                            </div>
                            <button style={{ width: "100%", marginTop: 14, padding: "8px", borderRadius: 8, fontSize: 10, background: theme.primary + "22", color: theme.accent, border: "none", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>TEILNEHMEN</button>
                        </div>
                    </div>
                )}

                {tab === "seasonal" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {SEASONAL_EVENTS.map(ev => (
                            <div key={ev.id} style={{ padding: "14px", borderRadius: 14, background: ev.active ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${ev.active ? "#ef444433" : "#1e2940"}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <span style={{ fontSize: 24 }}>{ev.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: ev.active ? "#ef4444" : "#e2e8f0" }}>{ev.title}</div>
                                        <div style={{ fontSize: 9, color: ev.active ? "#ef4444" : "#64748b", fontFamily: "'JetBrains Mono',monospace", padding: "2px 6px", borderRadius: 4, background: ev.active ? "#ef444422" : "transparent" }}>
                                            {ev.duration}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, lineHeight: 1.4 }}>{ev.desc}</div>
                                    {ev.active && (
                                        <button style={{ marginTop: 10, padding: "5px 12px", fontSize: 10, borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>EVENT BETRETEN</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
