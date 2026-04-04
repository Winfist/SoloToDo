import React, { useState, useCallback } from "react";

/**
 * DoubleDungeonTutorial – Thematisches Onboarding nach Solo Leveling.
 *
 * Ablauf:
 *  1. Der Nutzer "erwacht" im Double Dungeon.
 *  2. Step-by-step lernt er: Quests, Stat-Kategorien, Shadow Army, Dungeons, Shop.
 *  3. Am Ende: "ARISE" → Tutorial wird als abgeschlossen markiert.
 *
 * Props:
 *  - hunterName: String  (wird vorher abgefragt)
 *  - onComplete: () => void  (markiert Tutorial als abgeschlossen)
 */

const STEPS = [
    {
        id: "awakening",
        icon: "💀",
        title: "DER DOUBLE DUNGEON",
        lines: [
            "Du öffnest die Augen.",
            "Das Letzte, woran du dich erinnerst, ist blendendes Licht.",
            "Du bist in einem Dungeon – allein.",
            "Doch eine Stimme hallt durch die Kammer…",
        ],
        systemLine: "SYSTEM: Neuer Spieler erkannt. Initialisierung beginnt.",
        bg: "radial-gradient(ellipse at 50% 80%, #1a0a2e 0%, #06060e 70%)",
    },
    {
        id: "system_intro",
        icon: "⚙️",
        title: "DAS SYSTEM",
        lines: [
            "Diese App ist dein persönliches System.",
            "Es verfolgt deine Fortschritte, gibt dir Aufgaben und belohnt Disziplin.",
            "Jede erledigte Quest bringt XP, Gold und steigert deine Stats.",
        ],
        systemLine: "SYSTEM: Interface kalibriert. Bereit zur Einweisung.",
        bg: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #06060e 70%)",
    },
    {
        id: "quests",
        icon: "📝",
        title: "QUESTS – DEINE AUFGABEN",
        lines: [
            "Quests sind echte Aufgaben aus deinem Alltag.",
            "Erstelle eigene oder wähle aus der Ideen-Bibliothek.",
            "Es gibt 4 Schwierigkeitsstufen: Easy ◇, Normal ◆, Hard ★, Boss ♛.",
            "Boss-Quests beschwören Schatten für deine Armee!",
        ],
        highlight: [
            { icon: "◇", label: "Easy", desc: "+5 XP", color: "#6b7280" },
            { icon: "◆", label: "Normal", desc: "+15 XP", color: "#22d3ee" },
            { icon: "★", label: "Hard", desc: "+40 XP", color: "#a78bfa" },
            { icon: "♛", label: "Boss", desc: "+100 XP + Shadow", color: "#ef4444" },
        ],
        systemLine: "SYSTEM: Täglich werden 3 System-Quests generiert. Eigene Quests jederzeit erstellbar.",
        bg: "radial-gradient(ellipse at 30% 50%, #0e1a0e 0%, #06060e 70%)",
    },
    {
        id: "stats",
        icon: "📊",
        title: "DEINE STATS",
        lines: [
            "Jede Quest gehört zu einer Kategorie und stärkt den passenden Stat.",
            "Durch Level-Ups bekommst du Stat-Punkte, die du frei verteilen kannst.",
        ],
        highlight: [
            { icon: "⚔️", label: "STR", desc: "Sport & Fitness", color: "#ef4444" },
            { icon: "📖", label: "INT", desc: "Lernen & Lesen", color: "#3b82f6" },
            { icon: "🛡️", label: "VIT", desc: "Erholung", color: "#22c55e" },
            { icon: "⚡", label: "AGI", desc: "Produktivität", color: "#f59e0b" },
            { icon: "👥", label: "CHA", desc: "Soziales", color: "#a855f7" },
        ],
        systemLine: "SYSTEM: Hohe Stats schalten Skills und Named Shadows frei.",
        bg: "radial-gradient(ellipse at 70% 40%, #1a0e0e 0%, #06060e 70%)",
    },
    {
        id: "shadows",
        icon: "🌑",
        title: "DIE SHADOW ARMY",
        lines: [
            "Boss-Quests beschwören Schatten-Soldaten.",
            "Stelle sie in Formationen auf, um Dungeon-Boni zu erhalten.",
            "Legendäre Named Shadows haben einzigartige Fähigkeiten!",
        ],
        systemLine: "SYSTEM: Shadow Army Modul aktiviert. Kapazität: 20 Einheiten.",
        bg: "radial-gradient(ellipse at 50% 60%, #0e0e1a 0%, #06060e 70%)",
    },
    {
        id: "dungeons",
        icon: "🌀",
        title: "DUNGEON GATES",
        lines: [
            "Täglich öffnen sich 3 Gates mit verschiedenen Rängen.",
            "Wähle eine Strategie und kämpfe dich durch die Böden.",
            "Siege bringen XP, Gold und seltenes Equipment!",
        ],
        systemLine: "SYSTEM: Gates werden täglich regeneriert. Stärkere Gates bei höherem Rang.",
        bg: "radial-gradient(ellipse at 50% 20%, #1a1a0e 0%, #06060e 70%)",
    },
    {
        id: "arise",
        icon: "👑",
        title: "A R I S E",
        lines: [
            "Du hast das Tutorial des Double Dungeon überlebt.",
            "Von nun an bist du ein Hunter.",
            "Dein System ist aktiv. Deine Reise beginnt jetzt.",
        ],
        systemLine: "SYSTEM: Tutorial abgeschlossen. Hunter-Status: AKTIV.",
        isFinale: true,
        bg: "radial-gradient(ellipse at 50% 50%, #1a0a2e 0%, #0a0a1a 40%, #06060e 80%)",
    },
];

export default function DoubleDungeonTutorial({ hunterName, onComplete }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [lineIndex, setLineIndex] = useState(0);
    const [showSystem, setShowSystem] = useState(false);
    const [showHighlight, setShowHighlight] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    const step = STEPS[stepIndex];
    const isLastLine = lineIndex >= step.lines.length - 1;
    const hasHighlight = step.highlight && step.highlight.length > 0;

    const advance = useCallback(() => {
        if (!isLastLine) {
            setLineIndex(prev => prev + 1);
            return;
        }

        if (hasHighlight && !showHighlight) {
            setShowHighlight(true);
            return;
        }

        if (!showSystem) {
            setShowSystem(true);
            return;
        }

        // Move to next step
        if (stepIndex < STEPS.length - 1) {
            setFadeOut(true);
            setTimeout(() => {
                setStepIndex(prev => prev + 1);
                setLineIndex(0);
                setShowSystem(false);
                setShowHighlight(false);
                setFadeOut(false);
            }, 400);
        } else {
            // Tutorial complete
            setFadeOut(true);
            setTimeout(() => onComplete(), 800);
        }
    }, [isLastLine, showSystem, showHighlight, hasHighlight, stepIndex, onComplete]);

    return (
        <div
            onClick={advance}
            style={{
                position: "fixed", inset: 0, zIndex: 10000,
                background: step.bg || "#06060e",
                color: "#e2e8f0",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                fontFamily: "'Outfit',sans-serif",
                cursor: "pointer",
                padding: "24px",
                transition: "background 0.8s ease",
                opacity: fadeOut ? 0 : 1,
            }}
        >
            <style>{`
        @keyframes tutorialPulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes tutorialFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes tutorialFadeIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes tutorialGlow { 0%,100% { text-shadow: 0 0 20px #a855f744 } 50% { text-shadow: 0 0 40px #a855f788 } }
        @keyframes tutorialTypewriter { from { width: 0 } to { width: 100% } }
        @keyframes ariseGlow { 0% { text-shadow: 0 0 10px transparent; letter-spacing: 8px } 50% { text-shadow: 0 0 60px #a855f7, 0 0 120px #7c3aed; letter-spacing: 24px } 100% { text-shadow: 0 0 40px #a855f788; letter-spacing: 16px } }
      `}</style>

            {/* Ambient particles */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.04), transparent 60%)",
            }} />

            {/* Step counter */}
            <div style={{
                position: "absolute", top: 20, right: 24,
                fontSize: 10, color: "#334155",
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2,
            }}>
                {stepIndex + 1}/{STEPS.length}
            </div>

            {/* Main content */}
            <div style={{
                maxWidth: 420, width: "100%",
                animation: "tutorialFadeIn 0.5s ease",
            }}>
                {/* Icon */}
                <div style={{
                    fontSize: step.isFinale ? 72 : 56,
                    textAlign: "center", marginBottom: 16,
                    animation: "tutorialFloat 3s ease-in-out infinite",
                    filter: step.isFinale
                        ? "drop-shadow(0 0 40px rgba(168,85,247,0.6))"
                        : "drop-shadow(0 0 20px rgba(168,85,247,0.3))",
                }}>
                    {step.icon}
                </div>

                {/* Title */}
                <div style={{
                    fontSize: step.isFinale ? 28 : 16,
                    fontWeight: 900,
                    fontFamily: "'Cinzel',serif",
                    textAlign: "center",
                    letterSpacing: step.isFinale ? 16 : 6,
                    color: step.isFinale ? "#a855f7" : "#fff",
                    marginBottom: 24,
                    animation: step.isFinale ? "ariseGlow 2s ease-in-out infinite" : "none",
                    textShadow: step.isFinale ? "0 0 40px #a855f788" : "none",
                }}>
                    {step.title}
                </div>

                {/* Lines */}
                <div style={{ marginBottom: 24, minHeight: 120 }}>
                    {step.lines.slice(0, lineIndex + 1).map((line, i) => (
                        <div key={i} style={{
                            fontSize: 14,
                            color: i === lineIndex ? "#e2e8f0" : "#64748b",
                            lineHeight: 1.8,
                            textAlign: "center",
                            animation: i === lineIndex ? "tutorialFadeIn 0.4s ease" : "none",
                            transition: "color 0.4s ease",
                        }}>
                            {line}
                        </div>
                    ))}
                </div>

                {/* Highlight cards */}
                {showHighlight && step.highlight && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: step.highlight.length <= 4 ? `repeat(${step.highlight.length}, 1fr)` : "repeat(3, 1fr)",
                        gap: 8, marginBottom: 20,
                        animation: "tutorialFadeIn 0.4s ease",
                    }}>
                        {step.highlight.map((h, i) => (
                            <div key={i} style={{
                                background: `${h.color}10`,
                                border: `1px solid ${h.color}33`,
                                borderRadius: 12, padding: "10px 8px",
                                textAlign: "center",
                                animation: `tutorialFadeIn 0.4s ease ${i * 0.1}s both`,
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{h.icon}</div>
                                <div style={{
                                    fontSize: 10, fontWeight: 700, color: h.color,
                                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                                }}>{h.label}</div>
                                <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{h.desc}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* System message */}
                {showSystem && (
                    <div style={{
                        background: "rgba(10,10,22,0.9)",
                        border: "1px solid #22d3ee22",
                        borderLeft: "3px solid #22d3ee",
                        borderRadius: 12, padding: "12px 16px",
                        marginBottom: 16,
                        animation: "tutorialFadeIn 0.4s ease",
                    }}>
                        <div style={{
                            fontSize: 10, color: "#22d3ee",
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2,
                            lineHeight: 1.6,
                        }}>
                            {step.systemLine}
                        </div>
                    </div>
                )}

                {/* Continue hint */}
                <div style={{
                    textAlign: "center", marginTop: 24,
                    fontSize: 10, color: "#334155",
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3,
                    animation: "tutorialPulse 2s ease-in-out infinite",
                }}>
                    {step.isFinale && showSystem
                        ? "▶ TIPPE UM ZU BEGINNEN"
                        : "▶ TIPPE UM FORTZUFAHREN"}
                </div>
            </div>

            {/* Hunter name display */}
            <div style={{
                position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
                fontSize: 9, color: "#1e293b",
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 4,
            }}>
                HUNTER: {(hunterName || "UNBEKANNT").toUpperCase()}
            </div>
        </div>
    );
}
