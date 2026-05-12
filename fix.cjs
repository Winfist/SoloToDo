const fs = require('fs');
let c = fs.readFileSync('c:/Users/jwuck/OneDrive/Dokumente/SoloToDo/solo-leveling-v5.jsx', 'utf8');

const regex = /{premiumLocked \? \([\s\S]*?\{!item\.locked && item\.badge > 0 && <div/g;

const replacement = `{item.iconSrc ? (
  <img src={item.iconSrc} alt={item.label} style={{ width: 24, height: 24, objectFit: "contain", filter: \`brightness(1.1) drop-shadow(0 0 6px \${section.color}55)\`, opacity: (premiumLocked || item.locked) ? 0.35 : 1 }} />
) : (
  <span style={{ fontSize: 18, opacity: (premiumLocked || item.locked) ? 0.35 : 1 }}>{item.icon}</span>
)}
{(premiumLocked || item.locked) && (
  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
    {premiumLocked ? (
      <span style={{ fontSize: 9, color: "#fde68a", fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textShadow: "0 0 8px rgba(0,0,0,0.8)" }}>PRO</span>
    ) : (
      <span style={{ fontSize: 16, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}>🔒</span>
    )}
  </div>
)}
{!item.locked && item.badge > 0 && <div`;

c = c.replace(regex, replacement);
fs.writeFileSync('c:/Users/jwuck/OneDrive/Dokumente/SoloToDo/solo-leveling-v5.jsx', c);
console.log("Fixed!");
