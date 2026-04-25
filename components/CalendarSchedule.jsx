import React, { useState } from "react";
import { HABIT_ICONS, QUEST_ICONS } from "../data/icons.js";
import { getToday, getLocalDateKey } from "../data/dateUtils.js";

// ═══════════════════════════════════════════════════════════════
// CALENDAR & SCHEDULING – Native Calendar View for Quests
// ═══════════════════════════════════════════════════════════════

export default function CalendarSchedule({ state, persist, notify, theme }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calView, setCalView] = useState("month"); // "month" | "week"

    const selectedDateStr = getLocalDateKey(currentDate);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startingDay = startOfMonth.getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const quests = state?.quests || [];
    const habits = state?.habits || [];

    // Get items for the selected day
    const itemsForDay = [
        ...quests.filter(q => q.dueDate === selectedDateStr || (!q.completed && q.type === "daily" && selectedDateStr === getToday())),
        ...habits.filter(h => h.active && (!h.frequency || h.frequency === "daily" ||
            (h.frequency === "weekday" && currentDate.getDay() !== 0 && currentDate.getDay() !== 6) ||
            (h.frequency === "weekend" && (currentDate.getDay() === 0 || currentDate.getDay() === 6))
        )).map(h => ({
            id: "habit_" + h.id,
            title: h.title,
            category: h.category,
            type: "habit",
            completed: h.history?.[selectedDateStr]?.completed
        }))
    ];

    const catColors = { str: "#ef4444", int: "#3b82f6", vit: "#22c55e", agi: "#f59e0b", cha: "#a855f7" };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Week view helpers
    const getWeekDays = () => {
        const day = currentDate.getDay(); // 0=Sun
        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() - ((day + 6) % 7)); // shift to Monday
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    };
    const weekDayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

    const renderWeekView = () => {
        const days = getWeekDays();
        const todayStr = getToday();
        const completedQuests = state?.completedQuests || [];
        return (
            <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
                {days.map((d, i) => {
                    const ds = getLocalDateKey(d);
                    const isToday = ds === todayStr;
                    const dayQuests = quests.filter(q => q.dueDate === ds || (q.type === "daily" && ds === todayStr));
                    const dayHabits = habits.filter(h => h.active);
                    const doneQuests = completedQuests.filter(q => q.completedAt === ds);
                    return (
                        <div key={ds} onClick={() => setCurrentDate(new Date(d))} style={{
                            flex: "1 1 0", minWidth: 44, borderRadius: 10, cursor: "pointer",
                            background: isToday
                                ? `linear-gradient(180deg,${theme?.primary || "#22d3ee"}18,transparent)`
                                : "rgba(255,255,255,0.02)",
                            border: `1px solid ${isToday ? (theme?.primary || "#22d3ee") + "55" : "rgba(255,255,255,0.06)"}`,
                            padding: "8px 4px 10px",
                        }}>
                            {/* Day header */}
                            <div style={{ textAlign: "center", marginBottom: 6 }}>
                                <div style={{ fontSize: 8, color: isToday ? theme?.primary || "#22d3ee" : "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 2 }}>{weekDayLabels[i]}</div>
                                <div style={{
                                    fontSize: 14, fontWeight: isToday ? 900 : 600,
                                    color: isToday ? theme?.primary || "#22d3ee" : "#94a3b8",
                                    fontFamily: "'JetBrains Mono',monospace",
                                }}>{d.getDate()}</div>
                            </div>
                            {/* Quest dots */}
                            {dayQuests.map((q, qi) => (
                                <div key={q.id + qi} style={{
                                    margin: "2px 2px", padding: "3px 5px", borderRadius: 5,
                                    background: (catColors[q.category] || "#64748b") + "22",
                                    borderLeft: `2px solid ${catColors[q.category] || "#64748b"}`,
                                    fontSize: 8, color: catColors[q.category] || "#94a3b8",
                                    fontFamily: "'JetBrains Mono',monospace",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{q.title}</div>
                            ))}
                            {/* Habit dots (just count) */}
                            {dayHabits.length > 0 && (
                                <div style={{ margin: "2px 2px", padding: "3px 5px", borderRadius: 5, background: "#06b6d415", borderLeft: "2px solid #06b6d4", fontSize: 8, color: "#06b6d4", fontFamily: "'JetBrains Mono',monospace" }}>
                                    {dayHabits.length} Habits
                                </div>
                            )}
                            {/* Done quests */}
                            {doneQuests.slice(0, 2).map((q, qi) => (
                                <div key={q.id + "done" + qi} style={{
                                    margin: "2px 2px", padding: "3px 5px", borderRadius: 5,
                                    background: "rgba(34,197,94,0.06)", borderLeft: "2px solid #22c55e44",
                                    fontSize: 8, color: "#22c55e66",
                                    fontFamily: "'JetBrains Mono',monospace",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    textDecoration: "line-through",
                                }}>{q.title}</div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    const selectDay = (day) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const renderCalendarDays = () => {
        const blanks = [];
        for (let i = 0; i < startingDay; i++) {
            blanks.push(<div key={`blank-${i}`} style={{ width: "14.28%", height: 40 }} />);
        }

        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = getLocalDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
            const isToday = dateStr === getToday();
            const isSelected = d === currentDate.getDate();

            const dayQuests = quests.filter(q => q.dueDate === dateStr).length;

            days.push(
                <div key={d} onClick={() => selectDay(d)} style={{
                    width: "14.28%", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    background: isSelected ? `linear-gradient(135deg,${theme?.primary || "#22d3ee"}33,transparent)` : (isToday ? "rgba(255,255,255,0.05)" : "transparent"),
                    border: isSelected ? `1px solid ${theme?.primary || "#22d3ee"}88` : "1px solid transparent",
                    borderRadius: 12, cursor: "pointer", position: "relative",
                }}>
                    <span style={{ fontSize: 13, fontWeight: isToday ? 900 : 500, color: isToday ? (theme?.accent || "#67e8f9") : "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>{d}</span>
                    {dayQuests > 0 && <div style={{ position: "absolute", bottom: 6, display: "flex", gap: 2 }}>
                        {Array.from({ length: Math.min(dayQuests, 3) }).map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: theme?.primary || "#22d3ee" }} />)}
                        {dayQuests > 3 && <span style={{ fontSize: 8, color: theme?.primary || "#22d3ee" }}>+</span>}
                    </div>}
                </div>
            );
        }
        return [...blanks, ...days];
    };

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>Schedule</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Kalender & Zeitplanung</div>
                </div>
            </div>

            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 20, padding: 16, marginBottom: 20, backdropFilter: "blur(12px)",
            }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {[["month", "MONAT"], ["week", "WOCHE"]].map(([v, label]) => (
                        <button key={v} onClick={() => setCalView(v)} style={{
                            padding: "4px 12px", borderRadius: 6, fontSize: 9, fontWeight: 700,
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                            background: calView === v ? (theme?.primary || "#22d3ee") + "22" : "transparent",
                            color: calView === v ? (theme?.primary || "#22d3ee") : "#475569",
                            border: `1px solid ${calView === v ? (theme?.primary || "#22d3ee") + "44" : "rgba(255,255,255,0.06)"}`,
                            transition: "all 0.2s",
                        }}>{label}</button>
                    ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <button onClick={prevMonth} style={{ padding: "8px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>◀</button>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </div>
                    <button onClick={nextMonth} style={{ padding: "8px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>▶</button>
                </div>

                {calView === "week" ? renderWeekView() : (
                    <>
                        <div style={{ display: "flex", marginBottom: 8 }}>
                            {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map(day => (
                                <div key={day} style={{ width: "14.28%", textAlign: "center", fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{day}</div>
                            ))}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", rowGap: 8 }}>
                            {renderCalendarDays()}
                        </div>
                    </>
                )}
            </div>

            {/* AGENDA SECTION */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 20, padding: 16, minHeight: 200,
            }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, borderBottom: "1px solid #1e2940", paddingBottom: 8 }}>
                    AGENDA FÜR {selectedDateStr}
                </div>

                {itemsForDay.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>Keine Quests oder Habits geplant.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {itemsForDay.map((item, i) => {
                            const col = item.type === "habit" ? "#06b6d4" : (catColors[item.category] || "#94a3b8");
                            return (
                                <div key={item.id || i} style={{
                                    display: "flex", alignItems: "center", gap: 12, padding: "10px",
                                    background: item.completed ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                                    borderRadius: 12, border: `1px solid ${item.completed ? "#22c55e22" : "transparent"}`,
                                    borderLeft: `3px solid ${item.completed ? "#22c55e" : col}`
                                }}>
                                    <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {item.completed
                                            ? <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>
                                            : item.type === "habit"
                                                ? <img src={HABIT_ICONS.manual} alt="Habit" style={{ width: 16, height: 16, objectFit: "contain", opacity: 0.8 }} />
                                                : <img src={QUEST_ICONS.daily} alt="Quest" style={{ width: 16, height: 16, objectFit: "contain", opacity: 0.8 }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: item.completed ? "#64748b" : "#e2e8f0", textDecoration: item.completed ? "line-through" : "none" }}>{item.title}</div>
                                        {item.type === "habit" && <div style={{ fontSize: 9, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace" }}>HABIT</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
