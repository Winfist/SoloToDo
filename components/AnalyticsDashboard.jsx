import React, { useMemo } from "react";

/**
 * AnalyticsDashboard – Progress Analytics showing XP history,
 * completion rates, stat trends, and best-time detection.
 */

function getToday() { return new Date().toISOString().slice(0, 10); }

export default function AnalyticsDashboard({ state, theme }) {
    const completedQuests = state?.completedQuests || [];
    const habits = state?.habits || [];
    const dungeonHistory = state?.dungeonHistory || [];

    // ── 30-day data ────────────────────────────────────────────
    const last30 = useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const questsDone = completedQuests.filter(q => q.completedAt === key).length;
            const habitsDone = habits.filter(h => h.history?.[key]?.completed).length;
            const habitsScheduled = habits.filter(h => h.active).length;
            days.push({ date: key, day: d.getDate(), weekday: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()], questsDone, habitsDone, habitsScheduled });
        }
        return days;
    }, [completedQuests, habits]);

    const totalQuests30 = last30.reduce((s, d) => s + d.questsDone, 0);
    const totalHabits30 = last30.reduce((s, d) => s + d.habitsDone, 0);
    const avgQuestsPerDay = (totalQuests30 / 30).toFixed(1);

    // ── Weekly completion rate ─────────────────────────────────
    const last7 = last30.slice(-7);
    const questsThisWeek = last7.reduce((s, d) => s + d.questsDone, 0);
    const habitsThisWeek = last7.reduce((s, d) => s + d.habitsDone, 0);
    const habitsTargetWeek = last7.reduce((s, d) => s + d.habitsScheduled, 0);
    const habitCompletionRate = habitsTargetWeek > 0 ? Math.round((habitsThisWeek / habitsTargetWeek) * 100) : 0;

    // ── Category breakdown ─────────────────────────────────────
    const catStats = useMemo(() => {
        const cats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
        completedQuests.forEach(q => { if (cats[q.category] !== undefined) cats[q.category]++; });
        const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
        const catInfo = {
            str: { icon: "⚔️", label: "STR", color: "#ef4444" },
            int: { icon: "📖", label: "INT", color: "#3b82f6" },
            vit: { icon: "🛡️", label: "VIT", color: "#22c55e" },
            agi: { icon: "⚡", label: "AGI", color: "#f59e0b" },
            cha: { icon: "👥", label: "CHA", color: "#a855f7" },
        };
        return Object.entries(cats).map(([key, count]) => ({
            ...catInfo[key], key, count, pct: Math.round((count / total) * 100),
        })).sort((a, b) => b.count - a.count);
    }, [completedQuests]);

    const strongest = catStats[0];
    const weakest = catStats[catStats.length - 1];

    // ── Dungeon stats ──────────────────────────────────────────
    const dungeonsWon = dungeonHistory.filter(d => d.won).length;
    const dungeonsTotal = dungeonHistory.length;
    const dungeonWinRate = dungeonsTotal > 0 ? Math.round((dungeonsWon / dungeonsTotal) * 100) : 0;

    // ── Streak info ────────────────────────────────────────────
    const currentStreak = state?.streak || 0;
    const shadowCount = state?.shadowArmy?.shadows?.length || 0;

    // ── Activity heatmap (30 days) ─────────────────────────────
    const maxActivity = Math.max(...last30.map(d => d.questsDone + d.habitsDone), 1);

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {/* ── OVERVIEW CARD ── */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 18, padding: "18px 20px", marginBottom: 14,
            }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 14 }}>
                    📊 DEINE ENTWICKLUNG (30 TAGE)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                        { label: "Quests", value: totalQuests30, color: "#22d3ee", sub: `Ø${avgQuestsPerDay}/d` },
                        { label: "Habits", value: totalHabits30, color: "#22c55e", sub: `${habitCompletionRate}% Rate` },
                        { label: "Dungeons", value: dungeonsWon, color: "#a855f7", sub: `${dungeonWinRate}% Win` },
                        { label: "Streak", value: `${currentStreak}d`, color: "#f59e0b", sub: `${shadowCount} Shadows` },
                    ].map(s => (
                        <div key={s.label} style={{
                            textAlign: "center", padding: "10px 4px",
                            background: "rgba(255,255,255,0.02)", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.04)",
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.value}</div>
                            <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                            <div style={{ fontSize: 7, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{s.sub}</div>
                        </div>
                    ))}
                </div>

                {/* XP Info */}
                <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                    <div style={{ flex: 1, padding: "8px 12px", background: "rgba(34,211,238,0.05)", borderRadius: 8, border: "1px solid #22d3ee15" }}>
                        <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>TOTAL XP</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#67e8f9", fontFamily: "'Cinzel',serif" }}>{(state?.totalXpEarned || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, padding: "8px 12px", background: "rgba(251,191,36,0.05)", borderRadius: 8, border: "1px solid #fbbf2415" }}>
                        <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>TOTAL GOLD</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>{(state?.totalGoldEarned || 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* ── 30-DAY ACTIVITY HEATMAP ── */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 14,
            }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
                    AKTIVITÄT (30 TAGE)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: 3 }}>
                    {last30.map((d, i) => {
                        const activity = d.questsDone + d.habitsDone;
                        const intensity = activity / maxActivity;
                        const color = intensity === 0 ? "#0f0f1e" :
                            intensity < 0.33 ? (theme?.primary || "#22d3ee") + "33" :
                                intensity < 0.66 ? (theme?.primary || "#22d3ee") + "66" :
                                    (theme?.primary || "#22d3ee");
                        return (
                            <div key={i} title={`${d.date}: ${activity} Aktivitäten`} style={{
                                aspectRatio: "1", borderRadius: 3,
                                background: color, border: "1px solid rgba(255,255,255,0.03)",
                            }} />
                        );
                    })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 7, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>vor 30 Tagen</span>
                    <span style={{ fontSize: 7, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>heute</span>
                </div>
            </div>

            {/* ── CATEGORY BREAKDOWN ── */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 14,
            }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>
                    KATEGORIE-VERTEILUNG
                </div>
                {catStats.map(c => (
                    <div key={c.key} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: c.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{c.icon} {c.label}</span>
                            <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{c.count} ({c.pct}%)</span>
                        </div>
                        <div style={{ height: 5, background: "#0f0f1e", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${c.pct}%`, height: "100%", borderRadius: 3, background: c.color, transition: "width 0.6s ease" }} />
                        </div>
                    </div>
                ))}

                {/* Insight */}
                {strongest && weakest && strongest.key !== weakest.key && (
                    <div style={{
                        marginTop: 12, padding: "10px 12px", borderRadius: 10,
                        background: "rgba(34,211,238,0.05)", border: "1px solid #22d3ee15",
                    }}>
                        <div style={{ fontSize: 8, color: "#06b6d4", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>💡 SYSTEM INSIGHT</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
                            Stärkste Kategorie: <span style={{ color: strongest.color, fontWeight: 700 }}>{strongest.label} ({strongest.pct}%)</span>
                            <br />
                            Schwächste: <span style={{ color: weakest.color, fontWeight: 700 }}>{weakest.label} ({weakest.pct}%)</span>
                            {weakest.pct < 10 && <span style={{ color: "#f59e0b" }}> — Empfehlung: Mehr {weakest.label}-Quests!</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ── WEEKLY CHART ── */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 14,
            }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>
                    DIESE WOCHE
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, marginBottom: 6 }}>
                    {last7.map((d, i) => {
                        const total = d.questsDone + d.habitsDone;
                        const maxWeek = Math.max(...last7.map(x => x.questsDone + x.habitsDone), 1);
                        const h = Math.max((total / maxWeek) * 60, 4);
                        const isToday = d.date === getToday();
                        return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>{total}</div>
                                <div style={{
                                    width: "100%", height: h, borderRadius: 4,
                                    background: isToday
                                        ? `linear-gradient(0deg,${theme?.primary || "#22d3ee"},${theme?.secondary || "#a855f7"})`
                                        : total > 0 ? (theme?.primary || "#22d3ee") + "44" : "#0f0f1e",
                                    border: isToday ? "none" : "1px solid rgba(255,255,255,0.03)",
                                    transition: "height 0.4s ease",
                                }} />
                                <div style={{
                                    fontSize: 8, fontWeight: isToday ? 700 : 400,
                                    color: isToday ? (theme?.accent || "#67e8f9") : "#334155",
                                    fontFamily: "'JetBrains Mono',monospace",
                                }}>{d.weekday}</div>
                            </div>
                        );
                    })}
                </div>
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace",
                    marginTop: 4, padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.04)",
                }}>
                    <span>Quests: {questsThisWeek}</span>
                    <span>Habits: {habitsThisWeek}</span>
                    <span>Gesamt: {questsThisWeek + habitsThisWeek}</span>
                </div>
            </div>
        </div>
    );
}
