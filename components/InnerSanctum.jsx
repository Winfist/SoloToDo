import React from "react";
import { genId } from "../data/constants";

export default function InnerSanctum({ state, persist, notify, theme }) {
    // Initialization check
    const sanctum = state.sanctum || { level: 1, willpower: 0, totalMeditationMinutes: 0 };
    const manifestations = state.manifestations || [];

    const handleAddVision = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const text = fd.get("text");
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
        e.target.reset();
        if (notify) notify("Vision ins Sanctum aufgenommen", "success");
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
                    <input name="text" placeholder="Neue Manifestation oder Ziel..." style={{ flex: 1, background: "rgba(10,10,22,0.8)", border: `1px solid ${theme.primary}33`, color: "#fff", padding: "14px 16px", borderRadius: 12, fontSize: 14, outline: "none" }} />
                    <button type="submit" style={{ padding: "0 20px", background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`, border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 20 }}>+</button>
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
