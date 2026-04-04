import React, { useState, useEffect, useRef } from "react";
import { calculateLevelUp } from "../data/constants";

// ═══════════════════════════════════════════════════════════════
// FOCUS MODE – Fullscreen Pomodoro/Deep Work Timer
// ═══════════════════════════════════════════════════════════════

const FOCUS_MODES = {
    pomodoro: { id: "pomodoro", name: "Pomodoro", work: 25, break: 5, color: "#ef4444" },
    deepWork: { id: "deepWork", name: "Deep Work", work: 90, break: 15, color: "#a855f7" },
    sprint: { id: "sprint", name: "Sprint", work: 45, break: 10, color: "#3b82f6" }
};

export default function FocusMode({ state, persist, notify, onExit, theme }) {
    const [activeMode, setActiveMode] = useState(FOCUS_MODES.pomodoro);
    const [running, setRunning] = useState(false);
    const [phase, setPhase] = useState("work"); // "work" | "break"
    const [timeLeft, setTimeLeft] = useState(activeMode.work * 60);
    const [sessionStreak, setSessionStreak] = useState(0);
    const [totalWorkMinutes, setTotalWorkMinutes] = useState(0);

    const timerRef = useRef(null);

    // Handle mode switches when not running
    useEffect(() => {
        if (!running) {
            setTimeLeft(activeMode.work * 60);
            setPhase("work");
        }
    }, [activeMode, running]);

    // Timer logic
    useEffect(() => {
        if (running && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (running && timeLeft === 0) {
            // Transition phase
            if (phase === "work") {
                setPhase("break");
                setTimeLeft(activeMode.break * 60);

                // Reward Player
                const minutesCompleted = activeMode.work;
                setTotalWorkMinutes(prev => prev + minutesCompleted);
                const streakBonus = sessionStreak * 5;
                const xpGain = Math.floor(minutesCompleted * 2) + streakBonus; // 2 XP per minute + run bonus

                persist(calculateLevelUp(state, xpGain));

                notify(`Session komplett! +${xpGain} XP (inkl. +${streakBonus} Streak-Bonus) ⚡`, "success");
                setSessionStreak(prev => prev + 1);

                try {
                    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
                } catch (e) { }
            } else {
                setPhase("work");
                setTimeLeft(activeMode.work * 60);
                setRunning(false); // Stop Auto-start next work session? Or keep running? Stop for now so they have to commit.
                notify(`Pause beendet. Bereit für den nächsten Dungeon?`, "info");
            }
        }

        return () => clearInterval(timerRef.current);
    }, [running, timeLeft, phase, activeMode, sessionStreak, state, persist, notify]);

    const toggleTimer = () => setRunning(!running);

    const resetTimer = () => {
        setRunning(false);
        setPhase("work");
        setTimeLeft(activeMode.work * 60);
        if (sessionStreak > 0 && phase === "work" && timeLeft < activeMode.work * 60) {
            // Resetting during a work session breaks the streak
            setSessionStreak(0);
            notify("Fokus gebrochen. Session-Streak zurückgesetzt.", "warning");
        }
    };

    const getFormatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    const progress = phase === "work"
        ? 100 - (timeLeft / (activeMode.work * 60)) * 100
        : 100 - (timeLeft / (activeMode.break * 60)) * 100;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "#020205", zIndex: 900,
            display: "flex", flexDirection: "column",
            animation: "fadeIn 0.5s ease",
        }}>
            {/* Background Effect */}
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                width: "100vh", height: "100vh",
                background: `radial-gradient(circle at center, ${phase === "work" ? activeMode.color : "#22c55e"}15 0%, transparent 70%)`,
                opacity: running ? 1 : 0.4,
                transition: "all 1s ease",
            }} />

            <div style={{ position: "relative", zIndex: 1, padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Top Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={onExit} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer" }}>✕</button>
                    <div style={{ fontSize: 10, letterSpacing: 4, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>DUNGEON GATE</div>
                    <div style={{ fontSize: 14 }}>{sessionStreak > 0 ? `🔥 ${sessionStreak}` : "〰"}</div>
                </div>

                {/* Mode Selector */}
                {!running && phase === "work" && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 40 }}>
                        {Object.values(FOCUS_MODES).map(mode => (
                            <button key={mode.id} onClick={() => setActiveMode(mode)} style={{
                                padding: "8px 16px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                                background: activeMode.id === mode.id ? `${mode.color}22` : "transparent",
                                color: activeMode.id === mode.id ? mode.color : "#64748b",
                                border: `1px solid ${activeMode.id === mode.id ? mode.color + "55" : "#1e2940"}`,
                                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all 0.2s"
                            }}>
                                {mode.name.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}

                {/* Timer Fill Area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 14, color: phase === "work" ? activeMode.color : "#22c55e", letterSpacing: 6, fontFamily: "'JetBrains Mono',monospace", marginBottom: 24, animation: running ? "pulse 2s infinite" : "none" }}>
                        {phase === "work" ? "IN COMBAT" : "RECOVERY"}
                    </div>

                    <div style={{ position: "relative" }}>
                        {/* Massive Timer */}
                        <div style={{
                            fontSize: 110, fontWeight: 900, color: "#fff",
                            fontFamily: "'JetBrains Mono',monospace", lineHeight: 1,
                            textShadow: `0 0 40px ${phase === "work" ? activeMode.color : "#22c55e"}33`
                        }}>
                            {getFormatTime(timeLeft)}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "80%", maxWidth: 300, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 40, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", width: `${progress}%`,
                            background: phase === "work" ? activeMode.color : "#22c55e",
                            transition: "width 1s linear", boxShadow: `0 0 10px ${phase === "work" ? activeMode.color : "#22c55e"}`
                        }} />
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 40 }}>
                    <button onClick={toggleTimer} style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: running ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${activeMode.color}, #000)`,
                        border: `2px solid ${running ? "#334155" : activeMode.color + "88"}`,
                        color: running ? "#94a3b8" : "#fff",
                        fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s"
                    }}>
                        {running ? "⏸" : "▶"}
                    </button>

                    {(!running && timeLeft !== activeMode.work * 60) && (
                        <button onClick={resetTimer} style={{
                            width: 60, height: 60, borderRadius: "50%", marginTop: 10,
                            background: "transparent", border: "1px solid #334155", color: "#64748b",
                            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer"
                        }}>
                            ⏹
                        </button>
                    )}
                </div>

                <div style={{ textAlign: "center", fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                    HEUTE: {totalWorkMinutes} MINUTEN FOKUS
                </div>
            </div>
        </div>
    );
}
