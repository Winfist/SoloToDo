import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './solo-leveling-v5.jsx'
import AuthScreen from './AuthScreen.jsx'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Polyfill window.storage if it's missing (using localStorage)
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key, val) => {
      localStorage.setItem(key, val);
      return true;
    }
  };
}

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hunterName, setHunterName] = useState("");
  
  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setHunterName(user.displayName || "Hunter");
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleAuthSuccess = (name) => {
    // This is now purely for visual transition until Firebase listener catches up
    setHunterName(name);
    setIsAuthenticated(true);
  };
  
  // Loading state
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
          }}>
            LOADING SYSTEM...
          </div>
        </div>
      </div>
    );
  }
  
  // Show auth screen or main app
  return isAuthenticated ? (
    <App initialHunterName={hunterName} />
  ) : (
    <AuthScreen onAuthSuccess={handleAuthSuccess} />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
