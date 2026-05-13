// main.jsx – Auth + App Root (Firebase Integrated)
import React, { useState, useEffect } from 'react'
import { SYSTEM_ICONS } from "./data/icons.js";
import ReactDOM from 'react-dom/client'
import App from './solo-leveling-v5.jsx'
import AuthScreen from './AuthScreen.jsx'
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

function isTextEntryTarget(target) {
  return !!target?.closest?.('input, textarea, select, [contenteditable="true"]');
}

// Apply saved theme to root element before first render (avoids flash)
try {
  const _raw = localStorage.getItem("sl-todo-v5");
  const _savedTheme = _raw ? (JSON.parse(_raw).selectedTheme || "default") : "default";
  document.documentElement.dataset.theme = _savedTheme;
} catch {
  document.documentElement.dataset.theme = "default";
}

// ── NATIVE APP: Block ALL zoom gestures (pinch, double-tap, Ctrl+scroll) ──
// Prevents the WebView from ever revealing it's a browser
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) { e.preventDefault(); }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
  if (e.touches.length > 1) { e.preventDefault(); }
}, { passive: false });

// Block double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  if (isTextEntryTarget(e.target)) return;
  const now = Date.now();
  if (now - lastTouchEnd <= 300) { e.preventDefault(); }
  lastTouchEnd = now;
}, { passive: false });

// Block Ctrl+scroll (desktop browser zoom) and Ctrl+Plus/Minus
document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) { e.preventDefault(); }
}, { passive: false });

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
    e.preventDefault();
  }
});

// Block context menu (long-press on mobile shows browser context menu)
document.addEventListener('contextmenu', function(e) {
  if (isTextEntryTarget(e.target)) return;
  e.preventDefault();
});

// Block Safari-specific gesture zoom events (proprietary Safari API)
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', function(e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', function(e) {
  e.preventDefault();
}, { passive: false });

// ── GLOBAL ERROR CATCHER FOR NATIVE WEBVIEWS ──
// Enhanced: captures error.stack when available to bypass cross-origin masking
window.mobileErrors = [];
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const stack = (error && error.stack) ? error.stack : '(no stack)';
  const detail = `${msg}\nLine: ${lineNo}\nURL: ${url}\nStack: ${stack}`;
  window.mobileErrors.push(detail);
  try { alert('CRITICAL ERROR:\n' + detail); } catch (_) { /* alert might fail */ }
  return false;
};
window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason;
  const msg = String(reason?.message || reason || '');
  const stack = (reason && reason.stack) ? reason.stack : msg;

  // Suppress known Capacitor plugin errors — these are NOT bugs, just
  // native plugins that aren't available in every environment.
  const isCapacitorPlugin = msg.includes('not implemented') ||
    msg.includes('unimplemented') ||
    msg.includes('plugin') ||
    msg.includes('Capacitor') ||
    msg.includes('capacitor') ||
    msg.includes('Health') ||
    msg.includes('Geolocation');

  if (isCapacitorPlugin) {
    console.warn('[SoloToDo] Suppressed Capacitor plugin rejection:', msg);
    event.preventDefault(); // Prevents the browser from logging it as an error
    return;
  }

  const detail = `Unhandled Promise Rejection:\n${stack}`;
  window.mobileErrors.push(detail);
  try { alert('PROMISE REJECTION:\n' + detail); } catch (_) { /* alert might fail */ }
});

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

// ── AUTH TIMEOUT: if Firebase auth never fires, fallback to login after 8s ──
const AUTH_TIMEOUT_MS = 8000;

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [hunterName, setHunterName] = useState("");

  useEffect(() => {
    let settled = false;

    // With skipNativeAuth:true, the JS SDK manages all auth state.
    // On sign-in, signInWithCredential stores the session in localStorage (browserLocalPersistence).
    // On app restart, onAuthStateChanged restores from localStorage automatically.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      if (user) {
        console.log('[SoloToDo] Auth restored:', user.email);
        setHunterName(user.displayName || '');
        setIsAuthenticated(true);
      } else {
        console.log('[SoloToDo] No authenticated user');
        setIsAuthenticated(false);
      }
    });

    // Safety timeout: if onAuthStateChanged never fires, show login screen
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('[SoloToDo] Auth timeout – forcing login screen');
        settled = true;
        setIsAuthenticated(false);
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
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

  // Loading screen — BUG FIX #2: Ensure content is vertically centered
  // with flexDirection column. Image uses display:block + margin:auto
  // for reliable centering on all devices.
  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--theme-bg, #06060e)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes slPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.96); } }`}</style>
        <img
          src={SYSTEM_ICONS.logo}
          alt="System lädt"
          style={{ display: "block", width: 56, height: 56, objectFit: "contain", margin: "0 auto 16px", animation: "slPulse 1.5s ease-in-out infinite", filter: "drop-shadow(0 0 20px var(--theme-glow, #7c3aed88))" }}
        />
        <div style={{ fontSize: "var(--text-xs, 11px)", letterSpacing: 4, color: "var(--theme-primary, #7c3aed)", fontFamily: "var(--font-mono, monospace)", animation: "slPulse 1.5s ease-in-out infinite", textAlign: "center" }}>
          LOADING SYSTEM...
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <App initialHunterName={hunterName} onLogout={handleLogout} />
  ) : (
    <AuthScreen onAuthSuccess={handleAuthSuccess} />
  );
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
} catch (e) {
  const msg = e && e.stack ? e.stack : String(e);
  alert('FATAL RENDER ERROR:\n' + msg);
}
