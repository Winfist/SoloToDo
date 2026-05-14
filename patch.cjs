const fs = require('fs');

let content = fs.readFileSync('data/constants.jsx', 'utf8');

const searchStr = `          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>EDIT</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>DEL</button>}`;

const replaceStr = `          {hasAmulet && onSetFocus && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetFocus(isDailyFocus ? null : quest.id); }}
              className="press-feedback"
              title="Tagesfokus (Amulett)"
              style={{
                width: 30, height: 24, borderRadius: 7, cursor: "pointer",
                color: isDailyFocus ? "#fbbf24" : "#64748b",
                background: isDailyFocus ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)",
                border: \`1px solid \${isDailyFocus ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"}\`,
                fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace",
                boxShadow: isDailyFocus ? "0 0 10px rgba(251,191,36,0.2)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              FOK
            </button>
          )}
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>EDIT</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>DEL</button>}`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('data/constants.jsx', content);

// Also replace the second occurrence (around line 1390)
const searchStr2 = `          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ fontSize: 14, color: "#3b82f6", background: "transparent", padding: "4px", cursor: "pointer", border: "none" }}>✏️</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ fontSize: 14, color: "#ef4444", background: "transparent", padding: "4px", cursor: "pointer", border: "none" }}>✕</button>}`;

const replaceStr2 = `          {hasAmulet && onSetFocus && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetFocus(isDailyFocus ? null : quest.id); }}
              className="press-feedback"
              title="Tagesfokus (Amulett)"
              style={{
                width: 24, height: 24, borderRadius: 7, cursor: "pointer",
                color: isDailyFocus ? "#fbbf24" : "#64748b",
                background: isDailyFocus ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.05)",
                border: \`1px solid \${isDailyFocus ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.1)"}\`,
                fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace",
                boxShadow: isDailyFocus ? "0 0 10px rgba(251,191,36,0.2)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease"
              }}
            >
              F
            </button>
          )}
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ fontSize: 14, color: "#3b82f6", background: "transparent", padding: "4px", cursor: "pointer", border: "none" }}>✏️</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ fontSize: 14, color: "#ef4444", background: "transparent", padding: "4px", cursor: "pointer", border: "none" }}>✕</button>}`;

content = content.replace(searchStr2, replaceStr2);
fs.writeFileSync('data/constants.jsx', content);
