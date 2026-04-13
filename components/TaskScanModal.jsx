// TaskScanModal.jsx — AI-powered task extraction from a photo of handwritten notes

import { useState, useRef } from "react";

const CATEGORIES = [
  { key: "str", label: "STR — Kraft" },
  { key: "int", label: "INT — Wissen" },
  { key: "vit", label: "VIT — Vitalität" },
  { key: "agi", label: "AGI — Agilität" },
  { key: "cha", label: "CHA — Charisma" },
];
const DIFFICULTIES = ["easy", "normal", "hard"];

const PHASE = {
  UPLOAD: "upload",
  SCANNING: "scanning",
  RESULTS: "results",
};

export function TaskScanModal({ geminiAI, onConfirm, onClose }) {
  const [phase, setPhase] = useState(PHASE.UPLOAD);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleScan() {
    if (!selectedFile) return;
    setPhase(PHASE.SCANNING);
    const res = await geminiAI.scanTaskPhoto(selectedFile);
    if (!res || !res.tasks?.length) {
      // Nothing detected or error — go back to upload
      setPhase(PHASE.UPLOAD);
      return;
    }
    setTasks(res.tasks.map((t, i) => ({ ...t, _id: i, selected: true })));
    setPhase(PHASE.RESULTS);
  }

  function updateTask(id, field, value) {
    setTasks(prev => prev.map(t => t._id === id ? { ...t, [field]: value } : t));
  }

  function handleConfirm() {
    const selected = tasks.filter(t => t.selected);
    if (selected.length === 0) { onClose(); return; }
    onConfirm(selected.map(({ title, category, difficulty }) => ({ title, category, difficulty })));
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.headerLabel}>HUNTER NOTE SCANNER</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* UPLOAD */}
        {phase === PHASE.UPLOAD && (
          <div style={styles.body}>
            <p style={styles.hint}>Fotografiere einen Aufgabenzettel. Das System extrahiert automatisch alle Quests.</p>
            {previewUrl && (
              <div style={styles.previewWrap}>
                <img src={previewUrl} alt="Vorschau" style={styles.previewImg} />
              </div>
            )}
            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} onClick={() => fileInputRef.current?.click()}>
                {previewUrl ? "ANDERES FOTO" : "FOTO WÄHLEN"}
              </button>
              {previewUrl && (
                <button style={styles.btnPrimary} onClick={handleScan}>
                  SCAN STARTEN
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* SCANNING */}
        {phase === PHASE.SCANNING && (
          <div style={styles.body}>
            {previewUrl && (
              <div style={{ ...styles.previewWrap, position: "relative" }}>
                <img src={previewUrl} alt="Scan" style={{ ...styles.previewImg, opacity: 0.6 }} />
                <div style={styles.scanLine} />
              </div>
            )}
            <p style={styles.scanningText}>SCANNING HUNTER'S NOTES...</p>
            <p style={styles.scanningSubText}>SYSTEM ANALYSIERT AUFGABEN</p>
            <style>{`@keyframes scanMove { 0%{top:0} 100%{top:100%} }`}</style>
          </div>
        )}

        {/* RESULTS */}
        {phase === PHASE.RESULTS && (
          <div style={styles.body}>
            <p style={styles.resultsHeader}>
              {tasks.filter(t => t.selected).length} von {tasks.length} Aufgaben ausgewählt
            </p>
            <div style={styles.taskList}>
              {tasks.map(task => (
                <div key={task._id} style={{
                  ...styles.taskRow,
                  opacity: task.selected ? 1 : 0.4,
                  borderColor: task.selected ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.08)",
                }}>
                  <input
                    type="checkbox"
                    checked={task.selected}
                    onChange={e => updateTask(task._id, "selected", e.target.checked)}
                    style={styles.checkbox}
                  />
                  <input
                    type="text"
                    value={task.title}
                    onChange={e => updateTask(task._id, "title", e.target.value)}
                    style={styles.titleInput}
                  />
                  <select
                    value={task.category}
                    onChange={e => updateTask(task._id, "category", e.target.value)}
                    style={styles.select}
                  >
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key.toUpperCase()}</option>)}
                  </select>
                  <select
                    value={task.difficulty}
                    onChange={e => updateTask(task._id, "difficulty", e.target.value)}
                    style={styles.select}
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} onClick={handleConfirm}>
                QUESTS ERSTELLEN ({tasks.filter(t => t.selected).length})
              </button>
              <button style={styles.btnSecondary} onClick={onClose}>ABBRECHEN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.88)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "linear-gradient(180deg, #0a0a14 0%, #060610 100%)",
    border: "1px solid rgba(0,200,255,0.3)",
    borderRadius: 8,
    width: "min(520px, 94vw)",
    maxHeight: "90vh",
    overflow: "auto",
    fontFamily: "'Courier New', monospace",
    color: "#c8d8ff",
    boxShadow: "0 0 40px rgba(0,150,255,0.15)",
  },
  header: {
    padding: "14px 20px 10px",
    borderBottom: "1px solid rgba(0,200,255,0.2)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerLabel: {
    fontSize: "0.65rem", color: "#0af", letterSpacing: "0.15em", textTransform: "uppercase",
  },
  closeBtn: {
    background: "transparent", border: "none", color: "#556",
    cursor: "pointer", fontSize: "1rem", lineHeight: 1,
  },
  body: {
    padding: "20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
  },
  hint: {
    textAlign: "center", color: "#7a8fa0", fontSize: "0.8rem", margin: 0,
  },
  previewWrap: {
    width: "100%", maxWidth: 360,
    border: "1px solid rgba(0,200,255,0.3)", borderRadius: 4, overflow: "hidden",
  },
  previewImg: {
    width: "100%", display: "block", maxHeight: 220, objectFit: "contain", background: "#040408",
  },
  scanLine: {
    position: "absolute", left: 0, right: 0, height: 2,
    background: "rgba(0,200,255,0.8)",
    animation: "scanMove 1.2s linear infinite",
    boxShadow: "0 0 10px rgba(0,200,255,0.6)",
    top: 0,
  },
  scanningText: {
    color: "#0af", fontSize: "0.85rem", letterSpacing: "0.15em", margin: 0,
  },
  scanningSubText: {
    color: "#445566", fontSize: "0.65rem", letterSpacing: "0.1em", margin: 0,
  },
  resultsHeader: {
    color: "#7a9ab0", fontSize: "0.75rem", letterSpacing: "0.05em", margin: 0,
  },
  taskList: {
    width: "100%", display: "flex", flexDirection: "column", gap: 6,
  },
  taskRow: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(0,200,255,0.04)",
    border: "1px solid",
    borderRadius: 4, padding: "8px 10px",
    transition: "opacity 0.2s, border-color 0.2s",
  },
  checkbox: {
    width: 14, height: 14, flexShrink: 0, cursor: "pointer", accentColor: "#0af",
  },
  titleInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#c8d8ff", fontFamily: "inherit", fontSize: "0.8rem",
    minWidth: 0,
  },
  select: {
    background: "#0a0a18", border: "1px solid rgba(0,200,255,0.2)",
    color: "#7a9ab0", borderRadius: 3, padding: "3px 6px",
    fontFamily: "inherit", fontSize: "0.68rem", cursor: "pointer",
    flexShrink: 0,
  },
  buttonRow: {
    display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%",
  },
  btnPrimary: {
    background: "rgba(0,150,255,0.2)", border: "1px solid rgba(0,150,255,0.6)",
    color: "#0af", padding: "10px 20px", borderRadius: 4, cursor: "pointer",
    fontFamily: "inherit", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
    color: "#667", padding: "10px 16px", borderRadius: 4, cursor: "pointer",
    fontFamily: "inherit", fontSize: "0.72rem", textTransform: "uppercase",
  },
};
