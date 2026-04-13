// QuestVerifyModal.jsx — AI-powered quest photo verification
// Shows after a hunter clicks "Complete Quest" if ai_verification is unlocked.
// Allows uploading a proof photo for a +20% XP / +10% Gold bonus.

import { useState, useRef } from "react";

const PHASE = {
  CHOICE: "choice",       // Ask: upload photo or skip?
  UPLOAD: "upload",       // Photo selection / camera
  SCANNING: "scanning",   // "SCANNING..." animation
  RESULT: "result",       // Show verified / rejected
};

export function QuestVerifyModal({ quest, onComplete, onSkip, geminiAI }) {
  const [phase, setPhase] = useState(PHASE.CHOICE);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null); // { verified, reason, confidence }
  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase(PHASE.UPLOAD);
  }

  async function handleScan() {
    if (!selectedFile) return;
    setPhase(PHASE.SCANNING);
    const res = await geminiAI.verifyQuest(selectedFile, quest.title, quest.desc || "");
    if (!res) {
      // On error (rate limit, network) — treat as skipped
      onSkip();
      return;
    }
    setResult(res);
    setPhase(PHASE.RESULT);
  }

  function handleAccept() {
    onComplete(result?.verified === true);
  }

  const scanningMessages = ["INITIALISIERE PROTOKOLL...", "BILD WIRD ANALYSIERT...", "QUEST-ABGLEICH LÄUFT..."];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerLabel}>QUEST VERIFICATION PROTOCOL</span>
          <span style={styles.questTitle}>{quest.title}</span>
        </div>

        {/* CHOICE phase */}
        {phase === PHASE.CHOICE && (
          <div style={styles.body}>
            <p style={styles.prompt}>
              Lade ein Beweisfoto hoch und erhalte einen Bonus.
            </p>
            <div style={styles.bonusBadge}>
              <span>📸 +20% XP &nbsp;|&nbsp; +10% GOLD</span>
            </div>
            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} onClick={() => { setPhase(PHASE.UPLOAD); fileInputRef.current?.click(); }}>
                FOTO HOCHLADEN
              </button>
              <button style={styles.btnSecondary} onClick={onSkip}>
                OHNE BEWEIS
              </button>
            </div>
          </div>
        )}

        {/* UPLOAD phase */}
        {phase === PHASE.UPLOAD && (
          <div style={styles.body}>
            {previewUrl && (
              <div style={styles.photoFrame}>
                <img src={previewUrl} alt="Beweis" style={styles.photo} />
                <div style={styles.scanOverlay} />
              </div>
            )}
            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} onClick={handleScan} disabled={!selectedFile}>
                SCAN STARTEN
              </button>
              <button style={styles.btnSecondary} onClick={() => fileInputRef.current?.click()}>
                ANDERES FOTO
              </button>
              <button style={styles.btnGhost} onClick={onSkip}>ABBRECHEN</button>
            </div>
          </div>
        )}

        {/* SCANNING phase */}
        {phase === PHASE.SCANNING && (
          <div style={styles.body}>
            {previewUrl && (
              <div style={styles.photoFrame}>
                <img src={previewUrl} alt="Scan" style={{ ...styles.photo, opacity: 0.7 }} />
                <div style={styles.scanLine} />
              </div>
            )}
            <div style={styles.scanMessages}>
              {scanningMessages.map((msg, i) => (
                <p key={i} style={{ ...styles.scanText, animationDelay: `${i * 0.6}s` }}>{msg}</p>
              ))}
            </div>
            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes scanMove {
                0% { top: 0; } 100% { top: 100%; }
              }
            `}</style>
          </div>
        )}

        {/* RESULT phase */}
        {phase === PHASE.RESULT && result && (
          <div style={styles.body}>
            {previewUrl && (
              <div style={{
                ...styles.photoFrame,
                boxShadow: result.verified
                  ? "0 0 24px 4px rgba(0, 255, 128, 0.5)"
                  : "0 0 24px 4px rgba(255, 60, 60, 0.5)"
              }}>
                <img src={previewUrl} alt="Ergebnis" style={styles.photo} />
              </div>
            )}
            <div style={{
              ...styles.resultBadge,
              background: result.verified ? "rgba(0,200,80,0.15)" : "rgba(200,0,0,0.15)",
              borderColor: result.verified ? "#00c850" : "#c80000",
            }}>
              <span style={{ fontSize: "1.5rem" }}>{result.verified ? "✅" : "❌"}</span>
              <span style={{ color: result.verified ? "#00ff88" : "#ff4444", fontWeight: "bold", marginLeft: 8 }}>
                {result.verified ? "VERIFIZIERT" : "ABGELEHNT"}
              </span>
            </div>
            <p style={styles.reason}>{result.reason}</p>
            {result.verified && <p style={styles.bonusText}>Beweis-Bonus: +20% XP, +10% Gold</p>}
            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} onClick={handleAccept}>
                {result.verified ? "QUEST ABSCHLIESSEN" : "TROTZDEM ABSCHLIESSEN"}
              </button>
              {!result.verified && (
                <button style={styles.btnSecondary} onClick={() => { setPhase(PHASE.UPLOAD); fileInputRef.current?.click(); }}>
                  NEUES FOTO
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.88)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "linear-gradient(180deg, #0a0a14 0%, #060610 100%)",
    border: "1px solid rgba(0,200,255,0.3)",
    borderRadius: 8,
    width: "min(480px, 92vw)",
    maxHeight: "90vh",
    overflow: "auto",
    fontFamily: "'Courier New', monospace",
    color: "#c8d8ff",
    boxShadow: "0 0 40px rgba(0,150,255,0.15)",
  },
  header: {
    padding: "14px 20px 10px",
    borderBottom: "1px solid rgba(0,200,255,0.2)",
    display: "flex", flexDirection: "column", gap: 4,
  },
  headerLabel: {
    fontSize: "0.65rem", color: "#0af", letterSpacing: "0.15em", textTransform: "uppercase",
  },
  questTitle: {
    fontSize: "0.95rem", color: "#e0eeff", fontWeight: "bold",
  },
  body: {
    padding: "20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  },
  prompt: {
    textAlign: "center", color: "#a0b8cc", fontSize: "0.85rem", margin: 0,
  },
  bonusBadge: {
    background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.3)",
    borderRadius: 4, padding: "6px 16px", fontSize: "0.8rem", color: "#0af", letterSpacing: "0.05em",
  },
  photoFrame: {
    position: "relative", width: "100%", maxWidth: 340,
    border: "1px solid rgba(0,200,255,0.4)", borderRadius: 4,
    overflow: "hidden", background: "#040408",
  },
  photo: {
    width: "100%", display: "block", maxHeight: 260, objectFit: "contain",
  },
  scanOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg, rgba(0,200,255,0.06) 0%, transparent 100%)",
    pointerEvents: "none",
  },
  scanLine: {
    position: "absolute", left: 0, right: 0, height: 2,
    background: "rgba(0,200,255,0.8)",
    animation: "scanMove 1.4s linear infinite",
    boxShadow: "0 0 10px rgba(0,200,255,0.6)",
    pointerEvents: "none",
  },
  scanMessages: {
    display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
  },
  scanText: {
    fontSize: "0.72rem", color: "#0af", letterSpacing: "0.1em",
    animation: "fadeInUp 0.4s ease forwards",
    opacity: 0, margin: 0,
  },
  resultBadge: {
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid", borderRadius: 4, padding: "10px 24px",
    fontSize: "1rem",
  },
  reason: {
    textAlign: "center", color: "#8899aa", fontSize: "0.82rem", margin: 0,
    fontStyle: "italic",
  },
  bonusText: {
    color: "#00ff88", fontSize: "0.78rem", letterSpacing: "0.05em", margin: 0,
  },
  buttonRow: {
    display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%",
  },
  btnPrimary: {
    background: "rgba(0,150,255,0.2)", border: "1px solid rgba(0,150,255,0.6)",
    color: "#0af", padding: "10px 20px", borderRadius: 4, cursor: "pointer",
    fontFamily: "inherit", fontSize: "0.78rem", letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)",
    color: "#889", padding: "10px 16px", borderRadius: 4, cursor: "pointer",
    fontFamily: "inherit", fontSize: "0.75rem", letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  btnGhost: {
    background: "transparent", border: "none",
    color: "#556", padding: "10px 12px", cursor: "pointer",
    fontFamily: "inherit", fontSize: "0.72rem",
  },
};
