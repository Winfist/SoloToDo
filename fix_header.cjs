const fs = require('fs');
const path = 'solo-leveling-v5.jsx';
let content = fs.readFileSync(path, 'utf8');

// The broken section: hidden quest modal reward merged with header top row
const broken = `              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid #6366f133", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>BELOHNUNG</div>
            {/* TOP ROW: Rank + Name + Exit */}`;

const fixed = `              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid #6366f133", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>BELOHNUNG</div>
                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>XP MULT</div><div style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa", fontFamily: "'Cinzel',serif" }}>x{showHiddenQuestModal.reward?.xpMult || 3}</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>GOLD MULT</div><div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>x{showHiddenQuestModal.reward?.goldMult || 2}</div></div>
                </div>
              </div>
              <button onClick={() => setShowHiddenQuestModal(null)} className="press-feedback" style={{ width: "100%", padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#6366f122,#6366f110)", color: "#a5b4fc", border: "1px solid #6366f144", fontFamily: "'Cinzel',serif", letterSpacing: 2, transition: "all 0.3s" }}>QUEST ANNEHMEN</button>
            </div>
          </div>
        )}

        {/* ── SCREEN VIGNETTE (Design 2.0) ── */}
        <div className="vignette" aria-hidden="true" />

        {/* HEADER 3.0 — Futuristic HUD with Compact Scroll */}
        <header data-tutorial="header-stats" ref={headerRef} className={\`header-v3 \${headerState.isCompact ? 'header-v3-compact' : ''}\`} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, paddingTop: headerState.isCompact ? "max(env(safe-area-inset-top, 0px), 8px)" : "calc(max(env(safe-area-inset-top, 0px), 8px) + 6px)", paddingLeft: 16, paddingRight: 16, paddingBottom: headerState.isCompact ? 4 : 10, background: \`\${theme.card}, \${theme.bg}\`, backdropFilter: "blur(28px) saturate(1.5)", WebkitBackdropFilter: "blur(28px) saturate(1.5)", opacity: isCreatingEntry ? 0 : 1, pointerEvents: isCreatingEntry ? "none" : "auto", transition: "padding 0.35s cubic-bezier(0.22,1,0.36,1), background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, opacity 0.35s ease", borderBottom: headerState.isCompact ? \`1px solid \${theme.primary}22\` : '1px solid transparent', boxShadow: headerState.isCompact ? \`0 4px 24px rgba(0,0,0,0.3), 0 1px 0 \${theme.primary}15\` : 'none' }}>
          {/* HUD corner brackets */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 18, height: 18, borderTop: \`2px solid \${theme.primary}44\`, borderLeft: \`2px solid \${theme.primary}44\`, pointerEvents: "none", zIndex: 2, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, borderTop: \`2px solid \${theme.primary}44\`, borderRight: \`2px solid \${theme.primary}44\`, pointerEvents: "none", zIndex: 2, opacity: 0.6 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480, margin: "0 auto", width: "100%" }}>
            {/* TOP ROW: Rank + Name + Exit */}`;

// Normalize line endings for matching
const brokenNorm = broken.replace(/\r\n/g, '\n');
const contentNorm = content.replace(/\r\n/g, '\n');

if (contentNorm.includes(brokenNorm)) {
  const result = contentNorm.replace(brokenNorm, fixed);
  // Write back with original CRLF
  fs.writeFileSync(path, result.replace(/\n/g, '\r\n'), 'utf8');
  console.log('SUCCESS: Header and hidden quest modal fixed!');
} else {
  console.log('ERROR: Could not find broken section');
  // Try to find the nearby text
  const idx = contentNorm.indexOf('BELOHNUNG');
  if (idx >= 0) {
    console.log('Found BELOHNUNG at index', idx);
    console.log('Context:', contentNorm.substring(idx - 100, idx + 200));
  }
}
