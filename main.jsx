// main.jsx – Auth + App Root (Firebase Integrated)
import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import App from './solo-leveling-v5.jsx'
import AuthScreen from './AuthScreen.jsx'
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"
import SystemLoadingScreen from "./components/ui/SystemLoadingScreen.jsx"

const PENDING_HUNTER_NAME_KEY = "sl-pending-hunter-name";

function isTextEntryTarget(target) {
  return !!target?.closest?.('input, textarea, select, [contenteditable="true"]');
}

function consumePendingHunterName() {
  try {
    const value = sessionStorage.getItem(PENDING_HUNTER_NAME_KEY);
    if (value) sessionStorage.removeItem(PENDING_HUNTER_NAME_KEY);
    return value || "";
  } catch {
    return "";
  }
}

function getLocalStateTimestamp(state) {
  return Math.max(
    Number(state?.lastModifiedAtMs || 0),
    Number(state?.lastInteractionTimeMs || 0),
    Number(state?.updatedAtMs || 0),
    Number(state?.savedAtMs || 0)
  );
}

function getLocalProfileIdentity(key, state) {
  const scopedMatch = key.match(/^(sl-todo-v5|sl-todo-v4):(.+)$/);
  return state?.ownerUid || state?.email || scopedMatch?.[2] || "";
}

function getLocalGameStateCandidates() {
  try {
    const keys = Object.keys(localStorage)
      .filter(key => /^(sl-todo-v5|sl-todo-v4)(:|$)/.test(key))
      .filter(key => !key.includes("pending-cloud-sync"));
    return keys
      .map(key => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? { key, state: JSON.parse(raw) } : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => getLocalStateTimestamp(b.state) - getLocalStateTimestamp(a.state));
  } catch {
    return [];
  }
}

function readLocalGameProfile() {
  try {
    const candidates = getLocalGameStateCandidates();
    const identities = new Set(
      candidates
        .map(({ key, state }) => getLocalProfileIdentity(key, state))
        .filter(Boolean)
    );
    if (identities.size > 1) {
      console.warn('[SoloToDo] Offline profile fallback skipped: multiple local profiles found.');
      return { hasState: false, hunterName: "" };
    }

    for (const { state } of candidates) {
      if (!state) continue;
      if (!state.ownerUid && !state.email && candidates.length > 1) continue;

      const completed = Math.max(Number(state.totalQuestsCompleted || 0), state.completedQuests?.length || 0);
      const statsTotal = Object.values(state.stats || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
      const hasState = Boolean(
        state.hunterName
        || (state.level || 1) > 1
        || completed > 0
        || statsTotal > 0
        || state.shadowArmy?.shadows?.length
      );
      if (hasState) return { hasState, hunterName: state.hunterName || "" };
    }
    return { hasState: false, hunterName: "" };
  } catch {
    return { hasState: false, hunterName: "" };
  }
}

// Apply saved theme to root element before first render (avoids flash)
try {
  const _raw = getLocalGameStateCandidates()[0]?.state;
  const _savedTheme = _raw ? (_raw.selectedTheme || "default") : "default";
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
  const explicitLogoutRef = useRef(false);

  useEffect(() => {
    let authEventReceived = false;

    // With skipNativeAuth:true, the JS SDK manages all auth state.
    // On sign-in, signInWithCredential stores the session in localStorage (browserLocalPersistence).
    // On app restart, onAuthStateChanged restores from localStorage automatically.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authEventReceived = true;
      if (user) {
        console.log('[SoloToDo] Auth restored:', user.email);
        explicitLogoutRef.current = false;
        setHunterName(consumePendingHunterName() || user.displayName || '');
        setIsAuthenticated(true);
      } else {
        const localProfile = readLocalGameProfile();
        if (!explicitLogoutRef.current && navigator.onLine === false && localProfile.hasState) {
          console.warn('[SoloToDo] Auth unavailable offline - opening local profile');
          setHunterName(localProfile.hunterName);
          setIsAuthenticated(true);
          return;
        }
        console.log('[SoloToDo] No authenticated user');
        setIsAuthenticated(false);
      }
    });

    // Safety timeout: if onAuthStateChanged never fires, show login screen
    const timeout = setTimeout(() => {
      if (!authEventReceived) {
        const localProfile = readLocalGameProfile();
        if (!explicitLogoutRef.current && navigator.onLine === false && localProfile.hasState) {
          console.warn('[SoloToDo] Auth timeout - opening local profile');
          setHunterName(localProfile.hunterName);
          setIsAuthenticated(true);
          return;
        }
        console.warn('[SoloToDo] Auth timeout – forcing login screen');
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
    explicitLogoutRef.current = false;
    setHunterName(name || user.displayName || "");
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      explicitLogoutRef.current = true;
      await auth.signOut();
      setIsAuthenticated(false);
      setHunterName("");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Keep this screen lightweight: no artificial delay, just fills the auth wait.
  if (isAuthenticated === null) {
    return (
      <SystemLoadingScreen
        title="SYSTEM WIRD GELADEN"
        label="Login wird geprueft"
        detail="Session und Hunter-Zugriff werden vorbereitet"
      />
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
