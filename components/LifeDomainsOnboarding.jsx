import React, { useState } from "react";
import { DOMAIN_ICONS, STAT_ICONS, SEASON_ICONS, NAV_ICONS } from "../data/icons.js";

const DOMAINS = [
    { id: "fitness", label: "Fitness", icon: "💪", iconSrc: STAT_ICONS.str, color: "#ef4444" },
    { id: "knowledge", label: "Wissen", icon: "🧠", iconSrc: STAT_ICONS.int, color: "#3b82f6" },
    { id: "health", label: "Gesundheit", icon: "🛡️", iconSrc: STAT_ICONS.vit, color: "#22c55e" },
    { id: "career", label: "Karriere", icon: "💼", iconSrc: DOMAIN_ICONS.career, color: "#f59e0b" },
    { id: "social", label: "Soziales", icon: "👥", iconSrc: STAT_ICONS.cha, color: "#a855f7" },
    { id: "dating", label: "Dating", icon: "❤️", iconSrc: DOMAIN_ICONS.dating, color: "#ec4899" },
    { id: "finance", label: "Finanzen", icon: "💰", iconSrc: SEASON_ICONS.merchant, color: "#fbbf24" },
    { id: "mindset", label: "Mindset", icon: "🧘", iconSrc: STAT_ICONS.agi, color: "#06b6d4" },
];

export default function LifeDomainsOnboarding({ onComplete, theme }) {
    const [selected, setSelected] = useState([]);

    const toggleDomain = (id) => {
        if (selected.includes(id)) {
            setSelected(selected.filter((d) => d !== id));
        } else if (selected.length < 3) {
            setSelected([...selected, id]);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(6, 6, 16, 0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: theme.card || "rgba(15,15,30,0.9)", border: `1px solid ${theme.primary || "#7c3aed"}44`, borderRadius: 24, padding: "32px 24px", maxWidth: 420, width: "100%", textAlign: "center", animation: "slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><img src={NAV_ICONS.events} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", marginBottom: 8 }}>Dein Hunter Path</h2>
                <p style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'Outfit', sans-serif", marginBottom: 24, lineHeight: 1.5 }}>
                    Wähle die 3 Lebensbereiche, auf die du dich als erstes konzentrieren möchtest. Das System wird deine Quests entsprechend anpassen.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    {DOMAINS.map((domain) => {
                        const isSelected = selected.includes(domain.id);
                        return (
                            <button
                                key={domain.id}
                                onClick={() => toggleDomain(domain.id)}
                                style={{
                                    background: isSelected ? `${domain.color}22` : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${isSelected ? domain.color : "rgba(255,255,255,0.1)"}`,
                                    borderRadius: 14,
                                    padding: "16px 10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                                    boxShadow: isSelected ? `0 0 16px ${domain.color}33` : "none"
                                }}
                            >
                                {domain.iconSrc ? (
                                    <img src={domain.iconSrc} alt={domain.label} style={{ width: 32, height: 32, objectFit: "contain", filter: isSelected ? `drop-shadow(0 0 8px ${domain.color}99) brightness(1.1)` : "brightness(0.7) saturate(0.8)" }} />
                                ) : (
                                    <span style={{ fontSize: 24 }}>{domain.icon}</span>
                                )}
                                <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#fff" : "#cbd5e1", fontFamily: "'Outfit', sans-serif" }}>{domain.label}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onComplete(selected)}
                    disabled={selected.length !== 3}
                    style={{
                        width: "100%",
                        padding: "16px",
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 800,
                        background: selected.length === 3 ? `linear-gradient(135deg, ${theme.primary || "#4f6ef7"}, ${theme.secondary || "#7c3aed"})` : "rgba(255,255,255,0.05)",
                        color: selected.length === 3 ? "#fff" : "#475569",
                        border: "none",
                        cursor: selected.length === 3 ? "pointer" : "not-allowed",
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: 2,
                        transition: "all 0.3s"
                    }}
                >
                    {selected.length === 3 ? "PATH BESTÄTIGEN" : `NOCH ${3 - selected.length} WÄHLEN`}
                </button>
            </div>
        </div>
    );
}
