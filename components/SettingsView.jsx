import React, { useState } from "react";

export default function SettingsView({ state, persist, theme }) {
    const [primaryCache, setPrimaryCache] = useState(state.customThemeData?.primary || "#3b82f6");
    const [bgCache, setBgCache] = useState(state.customThemeData?.bg || "#0a0a1a");
    const [accentCache, setAccentCache] = useState(state.customThemeData?.accent || "#60a5fa");

    const saveCustomTheme = () => {
        persist({
            ...state,
            selectedTheme: "custom",
            customThemeData: { primary: primaryCache, bg: bgCache, accent: accentCache, card: "rgba(15,15,30,0.85)", text: "#f8fafc", glow: primaryCache },
        });
        alert("Custom Theme aktiviert!");
    };

    const exportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "solo-leveling-data.json");
        dlAnchorElem.click();
    };

    return (
        <div style={{ animation: "fadeIn 0.3s ease", paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 4, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
                    SYSTEM PREFERENCES
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 15px ${theme.glow}` }}>
                    ⚙️ Settings
                </div>
            </div>

            {/* Custom Theme Creator */}
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}33`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif", marginBottom: 6 }}>Custom Themes Creator</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Passe die Systemfarben an. Wähle Farben und speichere sie, um den Custom Mode zu aktivieren.</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>HINTERGRUND KONTRAST (bg)</div>
                        <input type="color" value={bgCache} onChange={e => setBgCache(e.target.value)} style={{ width: "100%", height: 36, border: "none", borderRadius: 8, cursor: "pointer", background: "rgba(0,0,0,0.3)" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>PRIMÄRFARBE (primary)</div>
                        <input type="color" value={primaryCache} onChange={e => setPrimaryCache(e.target.value)} style={{ width: "100%", height: 36, border: "none", borderRadius: 8, cursor: "pointer", background: "rgba(0,0,0,0.3)" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>AKZENTFARBE (accent)</div>
                        <input type="color" value={accentCache} onChange={e => setAccentCache(e.target.value)} style={{ width: "100%", height: 36, border: "none", borderRadius: 8, cursor: "pointer", background: "rgba(0,0,0,0.3)" }} />
                    </div>
                </div>

                <button onClick={saveCustomTheme} style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 12, background: theme.primary, border: "none", color: "#fff", fontWeight: 800, fontFamily: "'Cinzel',serif", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                    <span>✒️</span> THEME AKTIVIEREN
                </button>
            </div>

            {/* Data Export Mock API */}
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}33`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif", marginBottom: 6 }}>API & Data Export</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>
                    Exportiere deinen gesamten System-State (XP, Level, Inventar, Quests) als Rohdaten im JSON Format (Drittanbieter / Backup Simulation).
                </div>

                <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: theme.accent, marginBottom: 16, wordBreak: "break-all" }}>
                    GET /api/v1/hunter/{state.multiplayer?.social?.friends ? "linked" : "local"}/export?token=***
                </div>

                <button onClick={exportData} style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)`, color: "#fff", fontWeight: 800, fontFamily: "'Cinzel',serif", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                    💾 JSON EXPORTIEREN
                </button>
            </div>

        </div>
    );
}
