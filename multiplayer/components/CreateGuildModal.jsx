import React, { useState } from 'react';
import { MP_THEME, GUILD_ICONS } from '../data/mpConstants';

export default function CreateGuildModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [icon, setIcon] = useState("🏰");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || name.trim().length < 2) { setError("Name muss min. 2 Zeichen haben"); return; }
    if (!tag.trim() || tag.trim().length > 4) { setError("Tag: 1–4 Zeichen"); return; }
    setCreating(true);
    setError("");
    try {
      await onCreate(name.trim(), tag.trim().toUpperCase(), icon);
      onClose();
    } catch (e) {
      setError(e.message || "Fehler beim Erstellen");
      setCreating(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(1,0,6,0.95)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "mpFadeIn 0.3s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 380,
        background: `linear-gradient(180deg, rgba(24,20,12,0.98), rgba(10,8,6,0.98))`,
        border: `1px solid ${MP_THEME.primary}33`,
        borderRadius: 20, overflow: "hidden",
        animation: "mpFadeIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${MP_THEME.primary}22`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
            GILDE GRÜNDEN
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>
            Neue Gilde erstellen
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Icon Selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>
              WAPPEN WÄHLEN
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {GUILD_ICONS.slice(0, 16).map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} style={{
                  width: 40, height: 40, fontSize: 20, borderRadius: 10,
                  background: icon === ic ? `${MP_THEME.primary}33` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${icon === ic ? MP_THEME.primary : "rgba(255,255,255,0.06)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>
              GILDENNAME
            </div>
            <input
              value={name} onChange={e => setName(e.target.value)} placeholder="Shadow Monarchs..."
              maxLength={24}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: "rgba(0,0,0,0.5)", border: `1px solid ${MP_THEME.primary}33`,
                color: "#fff", outline: "none", fontSize: 14,
                fontFamily: "'Cinzel',serif", letterSpacing: 1,
              }}
            />
          </div>

          {/* Tag */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>
              TAG (1–4 ZEICHEN)
            </div>
            <input
              value={tag} onChange={e => setTag(e.target.value.toUpperCase().slice(0, 4))} placeholder="SM"
              maxLength={4}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: "rgba(0,0,0,0.5)", border: `1px solid ${MP_THEME.primary}33`,
                color: MP_THEME.accent, outline: "none", fontSize: 14,
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 4,
              }}
            />
          </div>

          {/* Preview */}
          {name.trim() && (
            <div style={{
              background: "rgba(0,0,0,0.4)", borderRadius: 14, padding: "14px 16px",
              border: `1px solid ${MP_THEME.primary}22`, marginBottom: 20,
              display: "flex", alignItems: "center", gap: 14
            }}>
              <div style={{ fontSize: 36 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>
                  {name} <span style={{ fontSize: 12, color: MP_THEME.primary }}>[{tag || "??"}]</span>
                </div>
                <div style={{ fontSize: 10, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                  E-Tier · 1/10 Members
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 11, color: "#ef4444", textAlign: "center", marginBottom: 12, fontFamily: "'JetBrains Mono',monospace" }}>
              ⚠ {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: 14, borderRadius: 14, fontSize: 12, fontWeight: 700,
              background: "rgba(255,255,255,0.05)", color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "'Cinzel',serif", letterSpacing: 1, cursor: "pointer",
            }}>
              Abbrechen
            </button>
            <button onClick={handleCreate} disabled={creating || !name.trim() || !tag.trim()} style={{
              flex: 2, padding: 14, borderRadius: 14, fontSize: 13, fontWeight: 900,
              background: (name.trim() && tag.trim() && !creating) ? `linear-gradient(135deg, ${MP_THEME.primary}, ${MP_THEME.secondary})` : "rgba(255,255,255,0.05)",
              color: (name.trim() && tag.trim()) ? "#fff" : "#475569",
              border: "none", fontFamily: "'Cinzel',serif", letterSpacing: 2, cursor: "pointer",
              boxShadow: (name.trim() && tag.trim()) ? `0 4px 20px ${MP_THEME.glow}` : "none",
              transition: "all 0.3s",
            }}>
              {creating ? "Wird erstellt..." : "⚔️ GILDE GRÜNDEN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
