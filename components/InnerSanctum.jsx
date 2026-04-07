import React, { useState } from "react";
import { genId } from "../data/constants";

const PREMIUM_MANIFESTATIONS = [
    "Ich bin der Architekt meines eigenen Schicksals. Niemand wird die Arbeit für mich erledigen.",
    "Jeder Widerstand formt meinen Charakter. Ich begrüße den Schmerz des Wachstums.",
    "Meine Zeit ist mein wertvollstes Asset. Ich investiere sie in meine ultimative Vision.",
    "Disziplin wiegt Unzen, Bedauern wiegt Tonnen. Ich wähle die Disziplin.",
    "Ich fokussiere mich nur auf das, was ich kontrollieren kann. Der Rest ist Illusion.",
    "Ich vergleiche mich nicht mit anderen, sondern nur damit, wer ich gestern war.",
    "Motivation ist flüchtig. Wahre Macht liegt in der unerschütterlichen Konsistenz.",
    "Es gibt kein Limit. Mein Potenzial wächst mit jeder Herausforderung, die ich meistere.",
    "Erfolg mietet man, und die Miete ist jeden Tag fällig. Ich gebe heute 100%.",
    "Jede Ablenkung ist ein Feind meiner Zukunft. Mein Fokus ist absolute Priorität."
];

export default function InnerSanctum({ state, persist, notify, theme }) {
    const sanctum = state.sanctum || { level: 1, willpower: 0, totalMeditationMinutes: 0 };
    const manifestations = state.manifestations || [];
    const [inputText, setInputText] = useState("");

    const remainingManifestations = PREMIUM_MANIFESTATIONS.filter(pm =>
        !manifestations.some(m => m.text === pm)
    );

    const handleAddVision = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        const newVision = {
            id: genId(),
            text,
            createdAt: new Date().toISOString()
        };

        persist({
            ...state,
            manifestations: [newVision, ...manifestations]
        });
        setInputText("");
        if (notify) notify("Vision ins Sanctum aufgenommen", "success");
    };

    const rollPremiumManifestation = () => {
        if ((state.gold || 0) < 20) {
            if (notify) notify("Nicht genug Gold! (20G benötigt)", "error");
            return;
        }

        if (remainingManifestations.length === 0) return;

        const randomItem = remainingManifestations[Math.floor(Math.random() * remainingManifestations.length)];
        setInputText(randomItem);

        persist({
            ...state,
            gold: state.gold - 20
        });

        if (notify) notify("Einsicht des Monarchen erlangt! (-20G)", "success");
    };

    const handleDeleteVision = (id) => {
        persist({
            ...state,
            manifestations: manifestations.filter(m => m.id !== id)
        });
    };

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {/* Header Banner */}
            <div style={{ position: "relative", background: "linear-gradient(160deg, rgba(88,28,135,0.95), rgba(15,23,42,0.98))", border: `1px solid ${theme.secondary}44`, borderRadius: 20, padding: "24px", marginBottom: 20, overflow: "hidden", boxShadow: `0 8px 40px ${theme.secondary}22` }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, background: `conic-gradient(from 0deg, transparent 0%, ${theme.secondary}15 8%, transparent 16%)`, animation: "monarchRays 30s linear infinite", pointerEvents: "none" }} />

                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontSize: 10, letterSpacing: 4, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>INNER SANCTUM</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 20px ${theme.secondary}88` }}>Lv. {sanctum.level}</div>
                        <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Basis des Monarchen</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: theme.secondary, fontFamily: "'JetBrains Mono',monospace" }}>{sanctum.willpower} / {sanctum.level * 10}</div>
                        <div style={{ fontSize: 8, color: "#94a3b8", letterSpacing: 1, marginTop: 2 }}>WILLPOWER</div>
                    </div>
                </div>

                {/* Passive Buffs Display */}
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: 10, color: "#64748b" }}>XP Buff global</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>+{sanctum.level}%</div>
                    </div>
                    <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: 10, color: "#64748b" }}>Meditation Total</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#34d399" }}>{sanctum.totalMeditationMinutes}m</div>
                    </div>
                </div>
            </div>

            {/* VISION BOARD VIEW */}
            <div style={{ animation: "slideUp 0.3s ease" }}>
                <form onSubmit={handleAddVision} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <input
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Neue Manifestation oder Ziel..."
                        style={{ flex: 1, background: "rgba(10,10,22,0.8)", border: `1px solid ${theme.primary}33`, color: "#fff", padding: "14px 16px", borderRadius: 12, fontSize: 14, outline: "none", transition: "all 0.2s" }}
                    />
                    {remainingManifestations.length > 0 && (
                        <button
                            type="button"
                            onClick={rollPremiumManifestation}
                            title="Premium Manifestation (20G)"
                            disabled={(state.gold || 0) < 20}
                            style={{
                                padding: "6px 14px",
                                background: (state.gold || 0) >= 20 ? "rgba(245,158,11,0.15)" : "rgba(15,15,30,0.5)",
                                border: `1px solid ${(state.gold || 0) >= 20 ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.05)"}`,
                                borderRadius: 12,
                                color: (state.gold || 0) >= 20 ? "#f59e0b" : "#475569",
                                cursor: (state.gold || 0) >= 20 ? "pointer" : "not-allowed",
                                transition: "all 0.2s",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2
                            }}
                            onMouseEnter={e => { if ((state.gold || 0) >= 20) { e.currentTarget.style.background = "rgba(245,158,11,0.25)"; e.currentTarget.style.transform = "scale(1.05)"; } }}
                            onMouseLeave={e => { if ((state.gold || 0) >= 20) { e.currentTarget.style.background = "rgba(245,158,11,0.15)"; e.currentTarget.style.transform = "none"; } }}
                        >
                            <span style={{ fontSize: 20 }}>🎲</span>
                            <span style={{ fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>20G</span>
                        </button>
                    )}
                    <button type="submit" disabled={!inputText.trim()} style={{ padding: "0 22px", background: inputText.trim() ? `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})` : "rgba(255,255,255,0.05)", border: "none", borderRadius: 12, color: inputText.trim() ? "#fff" : "#475569", fontWeight: 800, cursor: inputText.trim() ? "pointer" : "not-allowed", fontSize: 20, transition: "all 0.3s" }}>+</button>
                </form>

                <div style={{ display: "grid", gap: 10 }}>
                    {manifestations.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", background: theme.card, borderRadius: 16 }}>
                            Die Zukunft ist ungeschrieben. Trage deine Manifestationen ein.
                        </div>
                    ) : manifestations.map(m => (
                        <div key={m.id} style={{ padding: "16px", background: "rgba(10,10,24,0.6)", border: `1px solid ${theme.secondary}22`, borderRadius: 12, borderLeft: `3px solid ${theme.secondary}`, position: "relative" }}>
                            <div style={{ fontSize: 16, color: "#e2e8f0", fontFamily: "'Cinzel',serif", lineHeight: 1.4 }}>"{m.text}"</div>
                            <button onClick={() => handleDeleteVision(m.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>✕</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
