import React, { useState, useEffect } from "react";
import { genId } from "../data/constants";

const AFFIRMATIONS = [
    "Ich bin der Architekt meines eigenen Schicksals.",
    "Kein Hindernis ist zu groß für meine Entschlossenheit.",
    "Jeden Tag werde ich stärker, klüger und widerstandsfähiger.",
    "Mein Fokus ist unerschütterlich wie Stahl.",
    "Durch jede Niederlage lerne ich, durch jeden Sieg wachse ich.",
    "Disziplin ist meine Klinge, Geduld mein Schild.",
    "Mein Potenzial kennt keine Limitierungen.",
    "Ich erhebe mich über Mittelmäßigkeit."
];

export default function InnerSanctum({ onClose, theme, state, persist, notify }) {
    const [phase, setPhase] = useState("declaration"); // declaration -> meditation
    const [meditationSeconds, setMeditationSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [topAffirmations, setTopAffirmations] = useState([]);

    useEffect(() => {
        // Pick 3 random affirmations for the declaration
        const shuffled = [...AFFIRMATIONS].sort(() => 0.5 - Math.random());
        setTopAffirmations(shuffled.slice(0, 3));
    }, []);

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setMeditationSeconds(s => s + 1);
            }, 1000);
        } else if (!isActive && meditationSeconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, meditationSeconds]);

    const handleStartMeditation = () => {
        setPhase("meditation");
        setIsActive(true);
    };

    const handleFinish = () => {
        setIsActive(false);

        // Calculate VIT gain (+1 per 10 mins = 600s)
        const earnedVit = Math.floor(meditationSeconds / 600);
        const meditationMinutes = Math.floor(meditationSeconds / 60);

        let nextState = { ...state };
        const today = new Date().toISOString().slice(0, 10);
        let message = `Meditation beendet: ${meditationMinutes} Minuten.`;

        if (earnedVit > 0) {
            nextState.stats = { ...nextState.stats, vit: (nextState.stats.vit || 0) + earnedVit };

            // Update Meditation Streak
            const d = new Date();
            d.setDate(d.getDate() - 1);
            const yesterday = d.toISOString().slice(0, 10);

            let streak = nextState.meditationStreak || 0;
            if (nextState.lastMeditationDate === yesterday) {
                streak += 1;
            } else if (nextState.lastMeditationDate !== today) {
                streak = 1;
            }
            nextState.meditationStreak = streak;
            nextState.lastMeditationDate = today;

            message += ` Du hast +${earnedVit} VIT durch tiefe Meditation gewonnen! (Streak: ${streak})`;

            if (streak >= 3) {
                // Unlock achievement & skill
                if (!nextState.achievements?.unlocked?.includes("inner_peace")) {
                    nextState.achievements = nextState.achievements || { unlocked: [] };
                    nextState.achievements.unlocked.push("inner_peace");
                    notify("ACHIEVEMENT: Innerer Frieden", "success");
                }
                if (!nextState.unlockedSkills?.includes("shadow_monarchs_calm")) {
                    nextState.unlockedSkills = nextState.unlockedSkills || [];
                    nextState.unlockedSkills.push("shadow_monarchs_calm");
                    notify("NEUER SKILL: Shadow Monarch's Calm", "success");
                }
            }

            persist(nextState);
            if (notify) notify(message, "success");
        } else {
            if (notify) notify(message, "info");
        }
        onClose();
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "radial-gradient(circle at 50% 50%, #150f24 0%, #06040a 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            overflow: "hidden"
        }}>
            <style>{`
        @keyframes drift {
          0% { transform: translateY(0px) opacity(0); }
          50% { opacity: 1; }
          100% { transform: translateY(-20px) opacity(0); }
        }
      `}</style>

            {phase === "declaration" ? (
                <div style={{ maxWidth: 600, padding: 24, textAlign: "center", animation: "fadeIn 1s ease" }}>
                    <div style={{ fontSize: 13, color: "#a855f7", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 4, marginBottom: 32 }}>
                        MONARCH'S DECLARATION
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 48 }}>
                        {topAffirmations.map((aff, i) => (
                            <div key={i} style={{
                                fontSize: 22, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1.4,
                                fontWeight: 600, textShadow: "0 2px 12px rgba(0,0,0,0.8), 0 0 24px rgba(168,85,247,0.4)",
                                animation: `fadeIn 1s ease ${i * 0.4}s both`
                            }}>
                                "{aff}"
                            </div>
                        ))}
                    </div>

                    <button onClick={handleStartMeditation} style={{
                        padding: "16px 32px", borderRadius: 16, fontSize: 16, fontWeight: 900,
                        background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff",
                        border: "none", cursor: "pointer", fontFamily: "'Cinzel',serif", letterSpacing: 2,
                        boxShadow: "0 0 30px rgba(168,85,247,0.4)", transition: "all 0.3s",
                        animation: "fadeIn 1s ease 1.5s both"
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                        ICH ERKLÄRE
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: "center", animation: "fadeIn 1s ease" }}>
                    <div style={{ fontSize: 11, color: "#a855f7", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 4, marginBottom: 40 }}>
                        INNER SANCTUM
                    </div>

                    <div style={{
                        width: 250, height: 250, borderRadius: "50%", margin: "0 auto",
                        background: "radial-gradient(circle at 30% 30%, #a855f722 0%, transparent 100%)",
                        border: "2px solid rgba(168,85,247,0.3)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 60px rgba(168,85,247,0.15)",
                        animation: isActive ? "pulse 4s infinite" : "none"
                    }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
                            {formatTime(meditationSeconds)}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                            {Math.floor(meditationSeconds / 600)} / {Math.floor(meditationSeconds / 600) + 1} VIT (+1 pro 10 Min)
                        </div>
                    </div>

                    <div style={{ marginTop: 48, display: "flex", gap: 16, justifyContent: "center" }}>
                        <button onClick={() => setIsActive(!isActive)} style={{
                            padding: "12px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: "rgba(168,85,247,0.1)", color: "#a855f7",
                            border: "1px solid rgba(168,85,247,0.3)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1
                        }}>
                            {isActive ? "PAUSE" : "WEITER"}
                        </button>
                        <button onClick={handleFinish} style={{
                            padding: "12px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff",
                            border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                            boxShadow: "0 0 20px rgba(168,85,247,0.3)"
                        }}>
                            BEENDEN
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
