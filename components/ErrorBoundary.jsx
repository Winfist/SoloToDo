import React from "react";
import { logError } from "../services/errorReporting.js";

// Catches render-time errors anywhere below it and shows a graceful recovery
// screen instead of a blank white page. Self-contained inline styles so the
// fallback renders even if a stylesheet or asset failed to load.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError(error, "react");
    if (info?.componentStack) {
      console.error("[SoloToDo:react] component stack:", info.componentStack);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16, padding: 24,
        background: "#06060e", color: "#e2e8f0", textAlign: "center",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
          SYSTEM ERROR
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
          Etwas ist schiefgelaufen
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", maxWidth: 320, lineHeight: 1.6 }}>
          Die App hat einen unerwarteten Fehler festgestellt. Deine Daten sind sicher gespeichert.
        </div>
        <button onClick={this.handleReload} style={{
          marginTop: 8, padding: "12px 28px", borderRadius: 12,
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)", color: "#fff",
          border: "none", fontWeight: 800, fontSize: 13, fontFamily: "'Cinzel', serif",
          letterSpacing: 1, cursor: "pointer",
        }}>
          Neu laden
        </button>
      </div>
    );
  }
}
