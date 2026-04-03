// main.jsx – Auth + App Root (Firebase Integrated)
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './solo-leveling-v5.jsx'
import AuthScreen from './AuthScreen.jsx'
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

// Polyfill window.storage with localStorage
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key, val) => {
      localStorage.setItem(key, val);
      return true;
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return true;
    },
  };
}

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [hunterName, setHunterName] = useState("");

  useEffect(() => {
    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setHunterName(user.displayName || "");
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user, name) => {
    // This is called after Login/Register in AuthScreen
    setHunterName(name || user.displayName || "");
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      setHunterName("");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Loading screen
  if (isAuthenticated === null) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#060610",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
          <div style={{
            fontSize: 11,
            letterSpacing: 4,
            color: "#7c3aed",
            fontFamily: "monospace",
            animation: "pulse 1.5s ease-in-out infinite",
          }}>
            LOADING SYSTEM...
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  return isAuthenticated ? (
    <div style={{ position: 'relative' }}>
      <App initialHunterName={hunterName} />
      {/* Optional: Logout helper for testing */}
      {/* Logout helper moved to top-right below the music button to avoid covering the name */}
      <button onClick={handleLogout} style={{ 
        position: 'fixed', 
        top: 56, 
        right: 16, 
        zIndex: 9999, 
        background: 'rgba(239,68,68,0.08)', 
        border: '1px solid #ef444433', 
        color: '#ef4444', 
        fontSize: '9px', 
        padding: '5px 10px', 
        borderRadius: '5px', 
        fontFamily: 'monospace', 
        cursor: 'pointer', 
        backdropFilter: "blur(4px)",
        letterSpacing: "1px",
        transition: "all 0.3s"
      }}
      onMouseEnter={(e) => { e.target.style.background = 'rgba(239,68,68,0.2)'; e.target.style.borderColor = '#ef4444'; }}
      onMouseLeave={(e) => { e.target.style.background = 'rgba(239,68,68,0.08)'; e.target.style.borderColor = '#ef444433'; }}
      >
        EXIT SYSTEM
      </button>
    </div>
  ) : (
    <AuthScreen onAuthSuccess={handleAuthSuccess} />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
