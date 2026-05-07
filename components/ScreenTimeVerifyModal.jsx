import { useState, useRef } from "react";

const PHASE = {
    UPLOAD: "upload",
    SCANNING: "scanning",
    RESULT: "result",
};

export function ScreenTimeVerifyModal({ quest, onComplete, onSkip, geminiAI, dailyLimitMinutes, theme }) {
    const [phase, setPhase] = useState(PHASE.UPLOAD);
    const [selectedFiles, setSelectedFiles] = useState([]); // File[]
    const [previewUrls, setPreviewUrls] = useState([]);     // string[]
    const [result, setResult] = useState(null);
    const [scanStep, setScanStep] = useState(0);
    const fileInputRef = useRef(null);

    function handleFileSelect(e) {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length === 0) return;
        const merged = [newFiles[0]];
        setSelectedFiles(merged);
        setPreviewUrls(merged.map(f => URL.createObjectURL(f)));
        setPhase(PHASE.UPLOAD);
    }

    function removeFile(index) {
        const next = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(next);
        setPreviewUrls(next.map(f => URL.createObjectURL(f)));
    }

    async function handleScan() {
        if (selectedFiles.length === 0) return;
        setPhase(PHASE.SCANNING);
        setScanStep(0);

        const stepTimer = setInterval(() => setScanStep(s => Math.min(s + 1, 3)), 800);

        // Send all files to the Gemini Cloud Function
        const res = await geminiAI.extractScreenTime(selectedFiles);
        clearInterval(stepTimer);

        if (!res) {
            setResult({ verified: false, reason: "Fehler bei der Analyse. Versuche es erneut." });
            setPhase(PHASE.RESULT);
            return;
        }

        // If the AI needs more screenshots
        if (res.needsMore && res.hint) {
            setResult({
                verified: false,
                needsMore: true,
                hint: res.hint,
                reason: res.reason || "Mehr Informationen benötigt.",
                data: res,
            });
            setPhase(PHASE.RESULT);
            return;
        }

        // Validate against daily limit
        let isVerified = false;
        let reason = res.reason || "Analyse abgeschlossen.";

        if (res.valid && res.totalMinutes !== undefined) {
            if (res.totalMinutes <= dailyLimitMinutes) {
                isVerified = true;
                reason = `Ziel erreicht: ${formatMinutes(res.totalMinutes)} (Limit: ${formatMinutes(dailyLimitMinutes)})`;
            } else {
                reason = `Tageslimit überschritten: ${formatMinutes(res.totalMinutes)} (Limit: ${formatMinutes(dailyLimitMinutes)})`;
            }
        }

        setResult({ verified: isVerified, reason, data: res });
        setPhase(PHASE.RESULT);
    }

    function handleAccept() {
        onComplete(result?.verified === true);
    }

    function handleAddMore() {
        // Go back to upload to add more screenshots
        setPhase(PHASE.UPLOAD);
    }

    function formatMinutes(m) {
        if (m == null) return "–";
        const h = Math.floor(m / 60);
        const min = m % 60;
        return h > 0 ? (min > 0 ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
    }

    const scanMessages = [
        "Screenshot wird lokal komprimiert...",
        "KI analysiert das Bild...",
        "Tag & Zeit wird extrahiert...",
        "App-Daten werden verarbeitet..."
    ];

    return (
        <div style={S.overlay}>
            <div style={S.modal}>
                {/* Header */}
                <div style={S.header}>
                    <span style={S.headerLabel}>📱 SCREEN TIME OCR</span>
                    <span style={S.questTitle}>{quest.title}</span>
                </div>

                {/* ── UPLOAD PHASE ── */}
                {phase === PHASE.UPLOAD && (
                    <div style={S.body}>
                        <p style={S.prompt}>
                            Lade <strong>einen Screenshot</strong> deiner heutigen Bildschirmzeit hoch.
                            <br />
                            <span style={{ fontSize: "0.72rem", color: "#667" }}>
                                (Ansicht: "Heute", um den korrekten Tageswert zu erfassen)
                            </span>
                        </p>

                        {/* Preview grid */}
                        {previewUrls.length > 0 ? (
                            <div style={S.grid}>
                                {previewUrls.map((url, i) => (
                                    <div key={i} style={S.thumbWrap}>
                                        <img src={url} alt={`Screenshot ${i + 1}`} style={S.thumb} />
                                        <button onClick={() => removeFile(i)} style={S.removeBtn}>✕</button>
                                        <div style={S.thumbLabel}>HEUTE</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ ...S.dropZone }} onClick={() => fileInputRef.current?.click()}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                                <div style={{ color: "#8899aa", fontSize: "0.82rem" }}>Klicke hier um ein Bild auszuwählen</div>
                                <div style={{ color: "#556", fontSize: "0.7rem", marginTop: 4 }}>Max. 1 Bild</div>
                            </div>
                        )}

                        <div style={S.buttonRow}>
                            {selectedFiles.length > 0 && (
                                <button style={S.btnPrimary} onClick={handleScan}>
                                    🔍 BILD ANALYSIEREN
                                </button>
                            )}
                            <button style={S.btnGhost} onClick={onSkip}>ABBRECHEN</button>
                        </div>
                    </div>
                )}

                {/* ── SCANNING PHASE ── */}
                {phase === PHASE.SCANNING && (
                    <div style={S.body}>
                        <div style={S.grid}>
                            {previewUrls.slice(0, 2).map((url, i) => (
                                <div key={i} style={S.thumbWrap}>
                                    <img src={url} alt="scan" style={{ ...S.thumb, opacity: 0.6 }} />
                                    <div style={S.scanLine} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", marginTop: 12 }}>
                            {scanMessages.slice(0, scanStep + 1).map((msg, i) => (
                                <p key={i} style={{ ...S.scanText, animation: "stFadeIn 0.4s ease forwards", animationDelay: `${i * 0.2}s`, opacity: 0 }}>{msg}</p>
                            ))}
                        </div>
                        <style>{`
              @keyframes stFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
              @keyframes stScanMove { 0% { top:0; } 100% { top:100%; } }
            `}</style>
                    </div>
                )}

                {/* ── RESULT PHASE ── */}
                {phase === PHASE.RESULT && result && (
                    <div style={S.body}>
                        {/* needsMore case — AI wants more screenshots */}
                        {result.needsMore ? (
                            <>
                                <div style={{ ...S.badge, background: "rgba(255,180,0,0.12)", borderColor: "#f5a623" }}>
                                    <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                                    <span style={{ color: "#f5a623", fontWeight: "bold", marginLeft: 8 }}>MEHR DATEN BENÖTIGT</span>
                                </div>
                                <p style={S.reason}>{result.hint}</p>
                                <div style={S.buttonRow}>
                                    <button style={S.btnPrimary} onClick={handleAddMore}>📷 WEITERE SCREENSHOTS</button>
                                    <button style={S.btnGhost} onClick={onSkip}>ABBRECHEN</button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Success / Fail badge */}
                                <div style={{
                                    ...S.badge,
                                    background: result.verified ? "rgba(0,200,80,0.12)" : "rgba(200,0,0,0.12)",
                                    borderColor: result.verified ? "#00c850" : "#c80000",
                                }}>
                                    <span style={{ fontSize: "1.3rem" }}>{result.verified ? "✅" : "❌"}</span>
                                    <span style={{ color: result.verified ? "#00ff88" : "#ff4444", fontWeight: "bold", marginLeft: 8 }}>
                                        {result.verified ? "VERIFIZIERT" : "LIMIT ÜBERSCHRITTEN"}
                                    </span>
                                </div>

                                <p style={S.reason}>{result.reason}</p>

                                {/* View mode info */}
                                {result.data?.viewMode && (
                                    <div style={S.infoRow}>
                                        <span style={S.infoLabel}>Modus:</span>
                                        <span style={S.infoVal}>{result.data.viewMode === "tag" ? "📅 Tagesansicht" : "📆 Wochenansicht"}</span>
                                    </div>
                                )}
                                {result.data?.date && (
                                    <div style={S.infoRow}>
                                        <span style={S.infoLabel}>Datum:</span>
                                        <span style={S.infoVal}>{result.data.date}</span>
                                    </div>
                                )}
                                {result.data?.totalMinutes > 0 && (
                                    <div style={S.infoRow}>
                                        <span style={S.infoLabel}>{result.data?.viewMode === "woche" ? "Ø pro Tag:" : "Gesamtzeit:"}</span>
                                        <span style={{ ...S.infoVal, color: result.verified ? "#00ff88" : "#ff4444", fontWeight: "bold" }}>
                                            {formatMinutes(result.data.totalMinutes)}
                                        </span>
                                    </div>
                                )}
                                {result.data?.weekTotalMinutes > 0 && (
                                    <div style={S.infoRow}>
                                        <span style={S.infoLabel}>Woche gesamt:</span>
                                        <span style={S.infoVal}>{formatMinutes(result.data.weekTotalMinutes)}</span>
                                    </div>
                                )}

                                {/* Top App highlight */}
                                {result.data?.topApp && (
                                    <div style={S.topApp}>
                                        🏆 Meistgenutzte App: <strong>{result.data.topApp}</strong>
                                    </div>
                                )}

                                {/* App breakdown */}
                                {result.data?.apps?.length > 0 && (
                                    <div style={S.appList}>
                                        <div style={S.appListTitle}>APP-NUTZUNG</div>
                                        {result.data.apps.map((app, i) => (
                                            <div key={i} style={S.appRow}>
                                                <span style={S.appName}>{app.name}</span>
                                                <span style={S.appTime}>{formatMinutes(app.minutes)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Category breakdown */}
                                {result.data?.categories?.length > 0 && (
                                    <div style={S.appList}>
                                        <div style={S.appListTitle}>KATEGORIEN</div>
                                        {result.data.categories.map((cat, i) => (
                                            <div key={i} style={S.appRow}>
                                                <span style={S.appName}>{cat.name}</span>
                                                <span style={S.appTime}>{formatMinutes(cat.minutes)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={S.buttonRow}>
                                    {result.verified ? (
                                        <button style={S.btnPrimary} onClick={handleAccept}>🎉 BELOHNUNG EINSAMMELN</button>
                                    ) : (
                                        <button style={S.btnSecondary} onClick={onSkip}>SCHLIESSEN</button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
}

// ── Styles ──
const S = {
    overlay: {
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
    },
    modal: {
        background: "linear-gradient(180deg, #0a0a14 0%, #060610 100%)",
        border: "1px solid rgba(0,200,255,0.25)",
        borderRadius: 12,
        width: "min(500px, 94vw)",
        maxHeight: "90vh",
        overflow: "auto",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        color: "#c8d8ff",
        boxShadow: "0 0 60px rgba(0,150,255,0.1)",
    },
    header: {
        padding: "14px 20px 10px",
        borderBottom: "1px solid rgba(0,200,255,0.15)",
        display: "flex", flexDirection: "column", gap: 4,
    },
    headerLabel: { fontSize: "0.68rem", color: "#0af", letterSpacing: "0.15em" },
    questTitle: { fontSize: "0.9rem", color: "#e0eeff", fontWeight: "bold" },
    body: {
        padding: "18px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    },
    prompt: { textAlign: "center", color: "#8899aa", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 },

    // Upload grid
    grid: {
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
        width: "100%", maxWidth: 360,
    },
    thumbWrap: {
        position: "relative", borderRadius: 6, overflow: "hidden",
        border: "1px solid rgba(0,200,255,0.25)", background: "#040408",
    },
    thumb: { width: "100%", height: 130, objectFit: "cover", display: "block" },
    removeBtn: {
        position: "absolute", top: 4, right: 4,
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(200,0,0,0.7)", border: "none", color: "#fff",
        fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    },
    thumbLabel: {
        position: "absolute", bottom: 4, left: 4,
        background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "2px 6px",
        fontSize: "0.6rem", color: "#0af",
    },
    addThumb: {
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        border: "1px dashed rgba(0,200,255,0.3)", borderRadius: 6,
        height: 130, cursor: "pointer", gap: 4, background: "rgba(0,200,255,0.03)",
    },
    dropZone: {
        width: "100%", maxWidth: 360, padding: "36px 20px",
        border: "1px dashed rgba(0,200,255,0.3)", borderRadius: 8, cursor: "pointer",
        textAlign: "center", background: "rgba(0,200,255,0.02)",
    },

    // Scan
    scanLine: {
        position: "absolute", left: 0, right: 0, height: 2, top: 0,
        background: "rgba(0,200,255,0.8)", boxShadow: "0 0 10px rgba(0,200,255,0.6)",
        animation: "stScanMove 1.4s linear infinite", pointerEvents: "none",
    },
    scanText: { fontSize: "0.72rem", color: "#0af", letterSpacing: "0.08em", margin: 0, fontFamily: "inherit" },

    // Result
    badge: {
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid", borderRadius: 6, padding: "10px 20px",
    },
    reason: { textAlign: "center", color: "#8899aa", fontSize: "0.78rem", margin: 0, fontStyle: "italic", lineHeight: 1.4 },
    infoRow: {
        display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 320,
        padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    },
    infoLabel: { fontSize: "0.72rem", color: "#667" },
    infoVal: { fontSize: "0.72rem", color: "#cde" },
    topApp: {
        fontSize: "0.78rem", color: "#f5a623", textAlign: "center",
        padding: "8px 16px", borderRadius: 6, background: "rgba(245,166,35,0.08)",
        border: "1px solid rgba(245,166,35,0.2)", width: "100%", maxWidth: 320,
    },
    appList: {
        width: "100%", maxWidth: 320,
        background: "rgba(255,255,255,0.02)", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px",
    },
    appListTitle: { fontSize: "0.6rem", color: "#0af", letterSpacing: "0.12em", marginBottom: 6 },
    appRow: { display: "flex", justifyContent: "space-between", padding: "3px 0" },
    appName: { fontSize: "0.72rem", color: "#aabbcc" },
    appTime: { fontSize: "0.72rem", color: "#e0eeff", fontWeight: "bold" },

    // Buttons
    buttonRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%", marginTop: 4 },
    btnPrimary: {
        background: "rgba(0,150,255,0.15)", border: "1px solid rgba(0,150,255,0.5)",
        color: "#0af", padding: "10px 20px", borderRadius: 6, cursor: "pointer",
        fontFamily: "inherit", fontSize: "0.76rem", letterSpacing: "0.08em",
    },
    btnSecondary: {
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)",
        color: "#889", padding: "10px 16px", borderRadius: 6, cursor: "pointer",
        fontFamily: "inherit", fontSize: "0.72rem",
    },
    btnGhost: {
        background: "transparent", border: "none",
        color: "#556", padding: "10px 12px", cursor: "pointer",
        fontFamily: "inherit", fontSize: "0.7rem",
    },
};
