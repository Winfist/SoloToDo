const fs = require('fs');

const file = 'c:\\Users\\jwuck\\OneDrive\\Dokumente\\SoloToDo\\AuthScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '// AuthScreen.jsx - Premium Solo Leveling Login/Register (Firebase Integrated)',
  '// AuthScreen.jsx - Premium Abyssal Sovereign Login/Register (Firebase Integrated)'
);

content = content.replace(
  '{/* ── Solo Leveling narrative overlays ──────────────────────── */}',
  '{/* ── Abyssal Sovereign narrative overlays ──────────────────────── */}'
);

content = content.replace(
  '<img src={SYSTEM_ICONS.logo} alt="ARISE"',
  '<img src={SYSTEM_ICONS.logo} alt="MANIFEST"'
);

content = content.replace(
  '>ARISE</h1>',
  '>MANIFEST</h1>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing in AuthScreen.jsx');
