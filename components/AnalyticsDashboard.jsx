import React, { useMemo, useState } from "react";
import { STAT_ICONS, MILESTONE_ICONS, JOB_ICONS } from "../data/icons.js";
import { JOBS } from "../data/jobs.js";
import { CATEGORIES, DIFFICULTIES } from "../data/gameData.js";
import { getToday, getLocalDateKey } from "../data/dateUtils.js";

/**
 * AnalyticsDashboard – Progress Analytics showing XP history,
 * completion rates, stat trends, and best-time detection.
 */

export default function AnalyticsDashboard({ state, theme }) {
    const completedQuests = state?.completedQuests || [];
    const habits = state?.habits || [];
    const dungeonHistory = state?.dungeonHistory || [];
    const userJob = state?.job ? JOBS[state.job] : null;

    // ── Feedback Insights ────────────────────────────────────────
    const feedbackStats = useMemo(() => {
        const rated = completedQuests.filter(q => q.rating != null);
        if (rated.length === 0) return null;
        const avgRating = (rated.reduce((s, q) => s + q.rating, 0) / rated.length).toFixed(1);
        const ratingDist = [1, 2, 3, 4, 5].map(r => ({
            stars: r,
            count: rated.filter(q => q.rating === r).length,
            pct: Math.round((rated.filter(q => q.rating === r).length / rated.length) * 100),
        }));
        const diffFeedback = {
            zu_leicht: rated.filter(q => q.feltDifficulty === "zu_leicht").length,
            passend: rated.filter(q => q.feltDifficulty === "passend").length,
            zu_schwer: rated.filter(q => q.feltDifficulty === "zu_schwer").length,
        };
        const durFeedback = {
            zu_kurz: rated.filter(q => q.durationFeedback === "zu_kurz").length,
            passend: rated.filter(q => q.durationFeedback === "passend").length,
            zu_lang: rated.filter(q => q.durationFeedback === "zu_lang").length,
        };
        const wrongCategory = rated.filter(q => q.categoryFeedback === "falsch").length;
        const favorites = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 3);
        return { avgRating, ratingDist, diffFeedback, durFeedback, wrongCategory, favorites, totalRated: rated.length };
    }, [completedQuests]);

    // ── Completion History ────────────────────────────────────────
    const [historyFilter, setHistoryFilter] = useState("all");
    const [historySort, setHistorySort] = useState("newest");

    const filteredHistory = useMemo(() => {
        let list = [...completedQuests];
        const today = getToday();
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
        if (historyFilter === "today") list = list.filter(q => q.completedAt === today);
        if (historyFilter === "week") list = list.filter(q => q.completedAt >= getLocalDateKey(weekAgo));
        if (historyFilter === "month") list = list.filter(q => q.completedAt >= getLocalDateKey(monthAgo));
        if (historySort === "newest") list.sort((a, b) => (b.completedAtMs || 0) - (a.completedAtMs || 0));
        if (historySort === "highest_rated") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        return list.slice(0, 50);
    }, [completedQuests, historyFilter, historySort]);

    // ── 30-day data ────────────────────────────────────────────
    const last30 = useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = getLocalDateKey(d);
            const questsDone = completedQuests.filter(q => q.completedAt === key).length;
            const habitsDone = habits.filter(h => h.history?.[key]?.completed).length;
            const habitsScheduled = habits.filter(h => h.active).length;
            days.push({ date: key, day: d.getDate(), weekday: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()], questsDone, habitsDone, habitsScheduled });
        }
        return days;
    }, [completedQuests, habits]);

    // ── 90-day heatmap data (GitHub-style) ──────────────────────
    const last90 = useMemo(() => {
        const days = [];
        for (let i = 89; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = getLocalDateKey(d);
            const questsDone = completedQuests.filter(q => q.completedAt === key).length;
            const habitsDone = habits.filter(h => h.history?.[key]?.completed).length;
            days.push({ date: key, questsDone, habitsDone, dayOfWeek: d.getDay() });
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
            str: { iconSrc: STAT_ICONS.str, label: "STR", color: "#ef4444" },
            int: { iconSrc: STAT_ICONS.int, label: "INT", color: "#3b82f6" },
            vit: { iconSrc: STAT_ICONS.vit, label: "VIT", color: "#22c55e" },
            agi: { iconSrc: STAT_ICONS.agi, label: "AGI", color: "#f59e0b" },
            cha: { iconSrc: STAT_ICONS.cha, label: "CHA", color: "#a855f7" },
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

    // ── Hunter's Path Report ───────────────────────────────────
    const last7DaysStr = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i); return getLocalDateKey(d);
    });
    const recentQuests = completedQuests.filter(q => last7DaysStr.includes(q.completedAt));
    const recentCatStats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
    recentQuests.forEach(q => { if (recentCatStats[q.category] !== undefined) recentCatStats[q.category]++; });

    // ── Streak info ────────────────────────────────────────────
    const currentStreak = state?.streak || 0;
    const shadowCount = state?.shadowArmy?.shadows?.length || 0;

    // ── Activity heatmap data ──────────────────────────────────
    const maxActivity = Math.max(...last90.map(d => d.questsDone + d.habitsDone), 1);

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {/* ── OVERVIEW CARD ── */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 18, padding: "18px 20px", marginBottom: 14,
                position: "relative", overflow: "hidden"
            }}>
                {/* Epic Class Portrait Background */}
                <div style={{
                    position: "absolute", top: -20, right: -20, width: 200, height: 200,
                    opacity: 0.2, pointerEvents: "none", zIndex: 0, mixBlendMode: "screen",
                    filter: "grayscale(0.5)"
                }}>
                    <img src={userJob?.illustrationSrc || JOB_ICONS.necromancerBig} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", filter: userJob ? `drop-shadow(0 0 10px ${userJob.color})` : "none" }} />
                </div>
                
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 14 }}>
                    <img src={STAT_ICONS.str} alt="" style={{ width: 14, height: 14, objectFit: "contain", filter: "brightness(1.1)", verticalAlign: "middle", marginRight: 4 }} /> DEINE ENTWICKLUNG (30 TAGE)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                        { label: "Quests", value: totalQuests30, color: "#22d3ee", sub: `Ø${avgQuestsPerDay}/d` },
                        { label: "Habits", value: totalHabits30, color: "#22c55e", sub: `${habitCompletionRate}% Rate` },
                        { label: "Dungeons", value: dungeonsWon, color: "#a855f7", sub: `${dungeonWinRate}% Win` },
                        { label: "Streak", value: `${currentStreak}d`, color: "#f59e0b", sub: `${shadowCount} Shadows` },
                    ].map(s => (
                        <div key={s.label} style={{
                            textAlign: "center", padding: "12px 4px",
                            background: `linear-gradient(135deg, rgba(255,255,255,0.02), ${s.color}06)`, borderRadius: 14,
                            border: `1px solid ${s.color}15`,
                            boxShadow: `0 0 12px ${s.color}08`, position: "relative"
                        }}>
                            {s.label === "Streak" && currentStreak >= 100 && (
                                <img src={MILESTONE_ICONS.streak100} alt="100 Days" style={{ position: "absolute", top: -14, right: -14, width: 36, height: 36, filter: "drop-shadow(0 0 8px rgba(168,85,247,0.8))" }} />
                            )}
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
            </div>

            {/* ── HUNTER'S PATH REPORT ── */}
            {state?.lifeDomains && state.lifeDomains.length > 0 && (
                <div style={{
                    background: theme?.card || "rgba(10,10,22,0.88)",
                    border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                    borderLeft: `3px solid ${theme?.primary || "#22d3ee"}`,
                    borderRadius: 16, padding: "16px", marginBottom: 14,
                    boxShadow: `0 4px 20px ${theme?.primary || "#22d3ee"}15`
                }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <img src={STAT_ICONS.int} alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 8px #22d3ee44) brightness(1.1)", animation: "float 3s ease-in-out infinite" }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>Weekly Path Report</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                                {(() => {
                                    const DOMAIN_TO_STATS_MAP = {
                                        "fitness": ["str", "vit", "agi"], "knowledge": ["int"],
                                        "health": ["vit"], "career": ["int", "cha"], "social": ["cha"],
                                        "dating": ["cha", "int"], "finance": ["int"], "mindset": ["vit", "int"]
                                    };
                                    let focusStats = [];
                                    state.lifeDomains.forEach(d => { if (DOMAIN_TO_STATS_MAP[d]) focusStats.push(...DOMAIN_TO_STATS_MAP[d]); });

                                    let bestFocus = { stat: "str", count: -1 };
                                    let worstFocus = { stat: "str", count: 999 };

                                    focusStats.forEach(stat => {
                                        if (recentCatStats[stat] > bestFocus.count) bestFocus = { stat, count: recentCatStats[stat] };
                                        if (recentCatStats[stat] < worstFocus.count) worstFocus = { stat, count: recentCatStats[stat] };
                                    });

                                    if (bestFocus.count === 0 && worstFocus.count === 0) {
                                        return "Du hast diese Woche noch keine Fokus-Quests abgeschlossen. Es ist Zeit, deinen Pfad zu betreten.";
                                    }
                                    const statNames = { str: "Stärke", int: "Intelligenz", vit: "Vitalität", agi: "Agilität", cha: "Charisma" };
                                    return `Du hast ${bestFocus.count} Fokus-Quests im Bereich ${statNames[bestFocus.stat] || bestFocus.stat.toUpperCase()} beendet. Aber Bereiche bezüglich ${statNames[worstFocus.stat] || worstFocus.stat.toUpperCase()} brauchen deutlich mehr Aufmerksamkeit, Hunter.`;
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 90-DAY ACTIVITY HEATMAP (GitHub-style) ── */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 14,
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>
                        ACTIVITY GRID (90 TAGE)
                    </div>
                    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                        <span style={{ fontSize: 7, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>wenig</span>
                        {["0f0f1e", "22", "55", "99", ""].map((op, i) => (
                            <div key={i} style={{
                                width: 8, height: 8, borderRadius: 2,
                                background: op === "0f0f1e" ? "#0f0f1e" : (theme?.primary || "#22d3ee") + op,
                            }} />
                        ))}
                        <span style={{ fontSize: 7, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>viel</span>
                    </div>
                </div>
                {/* Day labels */}
                <div style={{ display: "flex", gap: 0, marginBottom: 2, paddingLeft: 16 }}>
                    {["Mo", "", "Mi", "", "Fr", "", "So"].map((label, i) => (
                        <div key={i} style={{
                            width: "calc((100% - 16px) / 13)", fontSize: 6,
                            color: label ? "#334155" : "transparent",
                            fontFamily: "'JetBrains Mono',monospace",
                            textAlign: "center",
                        }}>{label || "·"}</div>
                    ))}
                </div>
                {/* Grid: build 7 rows × cols (weeks) */}
                {(() => {
                    // Pad start so grid begins on Monday
                    const firstDay = last90[0]?.dayOfWeek ?? 1;
                    const padStart = (firstDay === 0 ? 6 : firstDay - 1); // Mon=0
                    const cells = [
                        ...Array(padStart).fill(null),
                        ...last90,
                    ];
                    const numCols = Math.ceil(cells.length / 7);
                    // Transpose: render column by column (weeks)
                    const columns = Array.from({ length: numCols }, (_, col) =>
                        cells.slice(col * 7, col * 7 + 7)
                    );
                    return (
                        <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
                            {columns.map((col, ci) => (
                                <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
                                    {Array.from({ length: 7 }, (_, ri) => {
                                        const d = col[ri];
                                        if (!d) return <div key={ri} style={{ width: 10, height: 10 }} />;
                                        const activity = d.questsDone + d.habitsDone;
                                        const intensity = activity / maxActivity;
                                        const isToday = d.date === getToday();
                                        const color = intensity === 0 ? "#0f0f1e" :
                                            intensity < 0.25 ? (theme?.primary || "#22d3ee") + "22" :
                                                intensity < 0.50 ? (theme?.primary || "#22d3ee") + "55" :
                                                    intensity < 0.75 ? (theme?.primary || "#22d3ee") + "99" :
                                                        (theme?.primary || "#22d3ee");
                                        return (
                                            <div
                                                key={ri}
                                                title={`${d.date}\n${d.questsDone} Quests · ${d.habitsDone} Habits`}
                                                style={{
                                                    width: 10, height: 10, borderRadius: 2,
                                                    background: color,
                                                    border: isToday ? `1px solid ${theme?.primary || "#22d3ee"}` : "1px solid rgba(255,255,255,0.03)",
                                                    boxShadow: isToday ? `0 0 6px ${theme?.primary || "#22d3ee"}66` : "none",
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    );
                })()}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 7, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>vor 90 Tagen</span>
                    <span style={{ fontSize: 7, color: theme?.accent || "#67e8f9", fontFamily: "'JetBrains Mono',monospace" }}>heute</span>
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
                            <span style={{ fontSize: 10, color: c.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><img src={c.iconSrc} alt={c.label} style={{ width: 20, height: 20, objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15) drop-shadow(0 0 4px ${c.color}55)` }} /> {c.label}</span>
                            <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{c.count} ({c.pct}%)</span>
                        </div>
                        <div style={{ height: 7, background: "#0f0f1e", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${c.pct}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${c.color}88, ${c.color})`, transition: "width 0.6s ease", boxShadow: `0 0 6px ${c.color}33` }} />
                        </div>
                    </div>
                ))}

                {/* Insight */}
                {strongest && weakest && strongest.key !== weakest.key && (
                    <div style={{
                        marginTop: 12, padding: "10px 12px", borderRadius: 10,
                        background: "rgba(34,211,238,0.05)", border: "1px solid #22d3ee15",
                    }}>
                        <div style={{ fontSize: 8, color: "#06b6d4", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>SYSTEM INSIGHT</div>
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

            {/* ── SEKTION 6: INTEL REPORT (Feedback Insights) ── */}
            {feedbackStats && (
                <div style={{
                    background: theme.card, border: `1px solid ${theme.primary}15`,
                    borderRadius: 16, padding: "18px 18px 14px", marginBottom: 12,
                    backdropFilter: "blur(8px)",
                }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: theme.primary, fontFamily: "'JetBrains Mono',monospace" }}>
                            ★ INTEL REPORT
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18, color: "#fbbf24", fontFamily: "'Cinzel',serif", fontWeight: 900, textShadow: "0 0 12px #fbbf2466" }}>{feedbackStats.avgRating}</span>
                            <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>/ 5 · {feedbackStats.totalRated} bewertet</span>
                        </div>
                    </div>

                    {/* Rating distribution */}
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>BEWERTUNGSVERTEILUNG</div>
                    {feedbackStats.ratingDist.slice().reverse().map(r => (
                        <div key={r.stars} style={{ marginBottom: 5 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                <span style={{ fontSize: 10, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace" }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                                <span style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{r.count} ({r.pct}%)</span>
                            </div>
                            <div style={{ height: 5, background: "#0f0f1e", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${r.pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#fbbf2466,#fbbf24)", transition: "width 0.6s ease" }} />
                            </div>
                        </div>
                    ))}

                    {/* Difficulty feedback */}
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", margin: "12px 0 6px" }}>SCHWIERIGKEITS-FEEDBACK</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                            { key: "zu_leicht", label: "▽ Zu leicht", color: "#22c55e", val: feedbackStats.diffFeedback.zu_leicht },
                            { key: "passend",   label: "◆ Passend",   color: "#22d3ee", val: feedbackStats.diffFeedback.passend },
                            { key: "zu_schwer", label: "△ Zu schwer", color: "#ef4444", val: feedbackStats.diffFeedback.zu_schwer },
                        ].map(b => (
                            <span key={b.key} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: b.color + "15", color: b.color, fontFamily: "'JetBrains Mono',monospace", border: `1px solid ${b.color}22` }}>
                                {b.label}: {b.val}
                            </span>
                        ))}
                    </div>

                    {/* Duration feedback */}
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", margin: "10px 0 6px" }}>DAUER-FEEDBACK</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                            { key: "zu_kurz", label: "◁ Zu kurz", color: "#f59e0b", val: feedbackStats.durFeedback.zu_kurz },
                            { key: "passend", label: "◆ Passend", color: "#22d3ee", val: feedbackStats.durFeedback.passend },
                            { key: "zu_lang", label: "▷ Zu lang", color: "#a855f7", val: feedbackStats.durFeedback.zu_lang },
                        ].map(b => (
                            <span key={b.key} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: b.color + "15", color: b.color, fontFamily: "'JetBrains Mono',monospace", border: `1px solid ${b.color}22` }}>
                                {b.label}: {b.val}
                            </span>
                        ))}
                    </div>

                    {/* Wrong category warning */}
                    {feedbackStats.wrongCategory > 0 && (
                        <div style={{ marginTop: 10, fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", background: "#f59e0b0f", padding: "6px 10px", borderRadius: 6, border: "1px solid #f59e0b22" }}>
                            ⚠ {feedbackStats.wrongCategory} Quest{feedbackStats.wrongCategory > 1 ? "s" : ""} als „Falsche Kategorie" markiert
                        </div>
                    )}

                    {/* Top 3 favorites */}
                    {feedbackStats.favorites.length > 0 && (
                        <>
                            <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", margin: "12px 0 6px" }}>LIEBLINGS-QUESTS</div>
                            {feedbackStats.favorites.map((q, i) => {
                                const cat = CATEGORIES.find(c => c.key === q.category) || CATEGORIES[0];
                                return (
                                    <div key={q.id + i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace", width: 14 }}>{i + 1}.</span>
                                        <span style={{ fontSize: 9, color: cat.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, width: 28 }}>{cat.stat}</span>
                                        <span style={{ fontSize: 11, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</span>
                                        <span style={{ fontSize: 10, color: "#fbbf24", flexShrink: 0 }}>{"★".repeat(q.rating || 0)}</span>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}

            {/* ── SEKTION 7: HUNTER'S CHRONICLE (Completion History) ── */}
            {completedQuests.length > 0 && (
                <div style={{
                    background: theme.card, border: `1px solid ${theme.primary}15`,
                    borderRadius: 16, padding: "18px 18px 14px", marginBottom: 12,
                    backdropFilter: "blur(8px)",
                }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: theme.primary, fontFamily: "'JetBrains Mono',monospace" }}>
                            📜 HUNTER'S CHRONICLE
                        </div>
                        <span style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{completedQuests.length} gesamt</span>
                    </div>

                    {/* Filter + Sort */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                        {[
                            { key: "all", label: "ALLE" },
                            { key: "today", label: "HEUTE" },
                            { key: "week", label: "WOCHE" },
                            { key: "month", label: "MONAT" },
                        ].map(f => (
                            <button key={f.key} onClick={() => setHistoryFilter(f.key)} style={{
                                padding: "3px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700,
                                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                                background: historyFilter === f.key ? theme.primary + "22" : "transparent",
                                color: historyFilter === f.key ? theme.primary : "#475569",
                                border: `1px solid ${historyFilter === f.key ? theme.primary + "44" : "rgba(255,255,255,0.06)"}`,
                            }}>{f.label}</button>
                        ))}
                        <div style={{ flex: 1 }} />
                        {[
                            { key: "newest", label: "NEUESTE ▼" },
                            { key: "highest_rated", label: "BESTE ▼" },
                        ].map(s => (
                            <button key={s.key} onClick={() => setHistorySort(s.key)} style={{
                                padding: "3px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700,
                                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                                background: historySort === s.key ? theme.primary + "15" : "transparent",
                                color: historySort === s.key ? theme.primary : "#475569",
                                border: `1px solid ${historySort === s.key ? theme.primary + "33" : "rgba(255,255,255,0.06)"}`,
                            }}>{s.label}</button>
                        ))}
                    </div>

                    {/* Quest list */}
                    <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 2 }}>
                        {filteredHistory.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px", fontSize: 11, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>
                                Keine Einträge für diesen Zeitraum
                            </div>
                        ) : filteredHistory.map((q, i) => {
                            const cat = CATEGORIES.find(c => c.key === q.category) || CATEGORIES[0];
                            const diff = DIFFICULTIES.find(d => d.key === q.difficulty) || DIFFICULTIES[1];
                            return (
                                <div key={q.id + "-" + i} style={{
                                    padding: "10px 12px", marginBottom: 5, borderRadius: 10,
                                    background: "linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))",
                                    border: "1px solid rgba(255,255,255,0.04)",
                                    borderLeft: `3px solid ${cat.color}44`,
                                }}>
                                    {/* Row 1: cat + diff + stars */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                            {cat.iconSrc
                                                ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 12, height: 12, objectFit: "contain" }} />
                                                : <span style={{ fontSize: 10 }}>{cat.icon}</span>}
                                            <span style={{ fontSize: 9, color: cat.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{cat.stat}</span>
                                            <span style={{ fontSize: 9, color: diff.color, fontFamily: "'JetBrains Mono',monospace" }}>{diff.icon} {diff.label}</span>
                                            {q.isSystem && <span style={{ fontSize: 7, color: "#06b6d4", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>⚙ SYS</span>}
                                        </div>
                                        {q.rating != null && (
                                            <span style={{ fontSize: 10, color: "#fbbf24", flexShrink: 0 }}>
                                                {"★".repeat(q.rating)}{"☆".repeat(5 - q.rating)}
                                            </span>
                                        )}
                                    </div>
                                    {/* Row 2: title */}
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</div>
                                    {/* Row 3: date + rewards */}
                                    <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", display: "flex", gap: 8 }}>
                                        <span>{q.completedAt}</span>
                                        {q.xpEarned != null && <span style={{ color: "#a78bfa" }}>+{q.xpEarned} XP</span>}
                                        {q.goldEarned != null && <span style={{ color: "#fbbf24" }}>+{q.goldEarned} Gold</span>}
                                    </div>
                                    {/* Row 4: feedback badges */}
                                    {(q.feltDifficulty || q.durationFeedback) && (
                                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                            {q.feltDifficulty && (
                                                <span style={{
                                                    fontSize: 8, padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace",
                                                    background: q.feltDifficulty === "passend" ? "#22d3ee15" : q.feltDifficulty === "zu_leicht" ? "#22c55e15" : "#ef444415",
                                                    color: q.feltDifficulty === "passend" ? "#22d3ee" : q.feltDifficulty === "zu_leicht" ? "#22c55e" : "#ef4444",
                                                }}>
                                                    {q.feltDifficulty === "zu_leicht" ? "Zu leicht" : q.feltDifficulty === "passend" ? "Passend" : "Zu schwer"}
                                                </span>
                                            )}
                                            {q.durationFeedback && (
                                                <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 4, background: "#64748b15", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>
                                                    {q.durationFeedback === "zu_kurz" ? "Zu kurz" : q.durationFeedback === "passend" ? "Passend" : "Zu lang"}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {/* Row 5: notes */}
                                    {q.notes && <div style={{ fontSize: 9, color: "#64748b", fontStyle: "italic", marginTop: 3 }}>„{q.notes}"</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}
