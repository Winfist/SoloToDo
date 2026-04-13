import { useState, useEffect } from "react";
import { NAV_ICONS, SHOP_ICONS } from "../data/icons.js";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

export default function SettingsView({ state, persist, theme, can }) {
    const [primaryCache, setPrimaryCache] = useState(state.customThemeData?.primary || "#3b82f6");
    const [bgCache, setBgCache] = useState(state.customThemeData?.bg || "#0a0a1a");
    const [accentCache, setAccentCache] = useState(state.customThemeData?.accent || "#60a5fa");
    const [aiUsage, setAiUsage] = useState(null);

    // Load today's AI usage count from Firestore
    useEffect(() => {
        if (!can?.('ai_quest_desc')) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        getDoc(doc(db, "aiUsage", uid)).then(snap => {
            if (snap.exists()) setAiUsage(snap.data());
        }).catch(() => {});
    }, []);

    function toggleAI(field) {
        persist({ ...state, ai: { ...(state.ai || {}), [field]: !(state.ai?.[field] ?? true) } });
    }

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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><img src={NAV_ICONS.settings} alt="Settings" style={{ width: 22, height: 22, objectFit: "contain", filter: "drop-shadow(0 0 4px " + theme.glow + ")" }} /> Settings</span>
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
                    <img src={SHOP_ICONS.theme} alt="theme" style={{ width: 16, height: 16, objectFit: "contain" }} /> THEME AKTIVIEREN
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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><img src={NAV_ICONS.analytics} alt="export" style={{ width: 14, height: 14, objectFit: "contain" }} /> JSON EXPORTIEREN</span>
                </button>
            </div>

            {/* SYSTEM KI */}
            {can?.('ai_quest_desc') && (
                <div style={{ background: theme.card, border: `1px solid ${theme.primary}33`, borderRadius: 16, padding: 20, marginTop: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif" }}>SYSTEM KI</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                            <span style={{ fontSize: 10, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>ONLINE</span>
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>
                        KI-gestützte Features: Quest-Fotos, Aufgaben-Scanner, KI-Coach und dynamische Quests. Freischaltbar ab Level 5.
                    </div>

                    {/* Daily usage */}
                    <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: theme.accent, marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ color: "#94a3b8" }}>DAILY API CALLS</span>
                            <span style={{ color: "#fff", fontWeight: 700 }}>{aiUsage?.callsToday || 0} / 30</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(((aiUsage?.callsToday || 0) / 30) * 100, 100)}%`, background: (aiUsage?.callsToday || 0) >= 25 ? "#ef4444" : theme.primary, borderRadius: 2, transition: "width 0.4s" }} />
                        </div>
                        {(aiUsage?.callsToday || 0) >= 30 && (
                            <div style={{ fontSize: 9, color: "#ef4444", marginTop: 6, letterSpacing: 1 }}>TAGESLIMIT ERREICHT — RESET UM MITTERNACHT</div>
                        )}
                    </div>

                    {/* Toggle: Quest Verification */}
                    {can?.('ai_verification') ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div>
                                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Quest-Verifikation</div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>Foto-Beweis für +20% XP & Gold</div>
                            </div>
                            <button
                                onClick={() => toggleAI("verificationEnabled")}
                                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", background: (state.ai?.verificationEnabled ?? true) ? theme.primary : "rgba(255,255,255,0.1)" }}
                            >
                                <span style={{ position: "absolute", top: 3, left: (state.ai?.verificationEnabled ?? true) ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: 0.4 }}>
                            <div>
                                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Quest-Verifikation</div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>Freischaltbar ab Level 11</div>
                            </div>
                            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>🔒 L11</span>
                        </div>
                    )}

                    {/* Toggle: Dynamic Messages */}
                    {can?.('ai_coach') ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div>
                                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>KI-Systemnachrichten</div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>Dynamische Coach-Interventionen</div>
                            </div>
                            <button
                                onClick={() => toggleAI("dynamicMessagesEnabled")}
                                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", background: (state.ai?.dynamicMessagesEnabled ?? true) ? theme.primary : "rgba(255,255,255,0.1)" }}
                            >
                                <span style={{ position: "absolute", top: 3, left: (state.ai?.dynamicMessagesEnabled ?? true) ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: 0.4 }}>
                            <div>
                                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>KI-Systemnachrichten</div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>Freischaltbar ab Level 8</div>
                            </div>
                            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>🔒 L8</span>
                        </div>
                    )}

                    {/* Toggle: Dynamic Quests */}
                    {can?.('ai_dynamic_quests') ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                            <div>
                                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Dynamische Quests</div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>KI generiert tägliche System-Quests</div>
                            </div>
                            <button
                                onClick={() => toggleAI("dynamicQuestsEnabled")}
                                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", background: (state.ai?.dynamicQuestsEnabled ?? true) ? theme.primary : "rgba(255,255,255,0.1)" }}
                            >
                                <span style={{ position: "absolute", top: 3, left: (state.ai?.dynamicQuestsEnabled ?? true) ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", opacity: 0.4 }}>
                            <div>
                                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Dynamische Quests</div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>Freischaltbar ab Level 15</div>
                            </div>
                            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>🔒 L15</span>
                        </div>
                    )}

                    {/* Master Switch & AGB */}
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: (state.ai?.enabled ?? true) ? theme.accent : "#94a3b8", fontFamily: "'Cinzel',serif" }}>
                                KI-Subsystem Status
                            </div>
                            <button
                                onClick={() => toggleAI("enabled")}
                                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", background: (state.ai?.enabled ?? true) ? "#22c55e" : "rgba(255,255,255,0.1)" }}
                            >
                                <span style={{ position: "absolute", top: 3, left: (state.ai?.enabled ?? true) ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                            </button>
                        </div>
                        <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.05)" }}>
                            <strong>DATENSCHUTZ & AGB:</strong> Durch die Aktivierung der KI-Features erklärst du dich damit einverstanden, dass questbezogene Texte und verifizierte Bilder an Google's Gemini API gesendet und verarbeitet werden. Wir speichern keine Bilder dauerhaft. Opt-Out ist jederzeit über diesen Schalter möglich, wodurch das gesamte KI-System deaktiviert wird.
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
