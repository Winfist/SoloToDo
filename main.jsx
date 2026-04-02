// main.jsx – Auth + App Root
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './solo-leveling-v5.jsx'
import AuthScreen from './AuthScreen.jsx'

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
    const checkAuth = async () => {
      try {
        const authData = await window.storage.get("sl-auth");
        if (authData) {
          const parsed = JSON.parse(authData.value);
          setHunterName(parsed.hunterName || "Hunter");
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleAuthSuccess = async (name) => {
    await window.storage.set("sl-auth", JSON.stringify({
      hunterName: name,
      loggedIn: true,
      timestamp: Date.now(),
    }));
    setHunterName(name);
    setIsAuthenticated(true);
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
    <App initialHunterName={hunterName} />
  ) : (
    <AuthScreen onAuthSuccess={handleAuthSuccess} />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
