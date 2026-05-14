with open('data/constants.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Replace the first occurrences
search_str = '''          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>EDIT</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>DEL</button>}'''

replace_str = '''          {hasAmulet && onSetFocus && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetFocus(isDailyFocus ? null : quest.id); }}
              className="press-feedback"
              title="Tagesfokus (Amulett)"
              style={{
                width: 30, height: 24, borderRadius: 7, cursor: "pointer",
                color: isDailyFocus ? "#fbbf24" : "#64748b",
                background: isDailyFocus ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isDailyFocus ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"}`,
                fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace",
                boxShadow: isDailyFocus ? "0 0 10px rgba(251,191,36,0.2)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              FOK
            </button>
          )}
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>EDIT</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>DEL</button>}'''

new_content = content.replace(search_str, replace_str, 1)
with open('data/constants.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
