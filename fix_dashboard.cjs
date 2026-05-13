const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'components', 'views', 'DashboardView.jsx');
let content = fs.readFileSync(file, 'utf8');

// Normalize to LF for easier matching
content = content.replace(/\r\n/g, '\n');

// The broken section: duplicate gem_booster + hunter_status cases with missing button tag
const broken = `      case "hunter_status":
        if (isCollapsed) return { content: null, isEmpty: false };
          ),
          isEmpty: false
        };

      case "gem_booster": {
        if (!can('gem_shop')) return { content: null, isEmpty: true };
        const boosters = getActiveGemBoosters ? getActiveGemBoosters() : [];
        if (boosters.length === 0) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return { content: <GemBoosterBanner activeBoosters={boosters} theme={theme} />, isEmpty: false };
      }

      case "hunter_status":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <>
                  marginBottom: showDashboardStats ? 12 : 0,`;

const fixed = `      case "hunter_status":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <>
              {/* ── COMPACT HUNTER STATUS ── */}
              <button
                data-tutorial="hunter-status"
                onClick={() => setShowDashboardStats(!showDashboardStats)}
                style={{
                  width: "100%", background: "rgba(8,12,24,0.82)", border: "1px solid rgba(148,163,184,0.12)",
                  borderRadius: 12, padding: "12px 13px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                  marginBottom: showDashboardStats ? 12 : 0,`;

if (content.includes(broken)) {
  content = content.replace(broken, fixed);
  fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
  console.log('SUCCESS: DashboardView fixed!');
} else {
  console.log('ERROR: Could not find broken section');
  // Debug: find parts
  const parts = broken.split('\n');
  parts.forEach((p, i) => {
    if (p.trim() && !content.includes(p)) {
      console.log(`Line ${i} NOT found: "${p.substring(0, 80)}"`);
    }
  });
}
