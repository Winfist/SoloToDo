const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'SettingsView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `{/* Version */}
        <div style={{ textAlign: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>ABYSSAL SOVEREIGN v5.0</div>`;

const replacement = `{/* Version */}
        <div style={{ textAlign: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          <button onClick={async () => {
            if (window.confirm("ACCOUNT LÖSCHEN: Willst du deinen Account wirklich unwiderruflich löschen? Alle Daten gehen verloren!")) {
              try {
                if (auth.currentUser) {
                  await auth.currentUser.delete();
                  alert("Konto erfolgreich gelöscht.");
                  if (onLogout) onLogout();
                }
              } catch (err) {
                console.error(err);
                if (err.code === "auth/requires-recent-login") {
                  alert("Bitte logge dich einmal aus und wieder ein, um das Konto zu löschen.");
                } else {
                  alert("Fehler beim Löschen des Kontos.");
                }
              }
            }
          }} style={{
            background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "8px 12px",
            borderRadius: 6, fontSize: 10, cursor: "pointer", marginBottom: 16, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700
          }}>
            KONTO LÖSCHEN
          </button>
          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>ABYSSAL SOVEREIGN v5.0</div>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully patched SettingsView.jsx");
} else {
    console.log("Target string not found in SettingsView.jsx");
}
