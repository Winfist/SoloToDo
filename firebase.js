// firebase.js
import { initializeApp } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { CustomProvider, initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDR7cm2PnhKY58k6NSKMq6JjdqAMUoAUjc",
  authDomain: "solo-todo.firebaseapp.com",
  projectId: "solo-todo",
  storageBucket: "solo-todo.firebasestorage.app",
  messagingSenderId: "528898647146",
  appId: "1:528898647146:web:66f34f35cc3ef944449613",
  measurementId: "G-RCBGS0F6N4"
};

// Safari/iOS blocks cross-domain OAuth: ITP partitions storage between the app
// origin and a different auth handler origin
// (solo-todo.firebaseapp.com), which breaks both signInWithPopup (cross-origin
// iframe delay drops the user gesture → popup-blocked) and signInWithRedirect
// (pending-redirect state can't be read back → user lands on login again).
// Fix: on known Firebase Hosting origins, point authDomain at that SAME origin
// so the OAuth handler stays first-party. Dev (localhost) keeps the
// default — the Hosting __/auth handler isn't served by the vite dev server —
// and native (capacitor://localhost) doesn't use the web auth handler at all.
const FIRST_PARTY_AUTH_HOSTS = new Set([
  "solo-todo.web.app",
  "solo-todo.firebaseapp.com",
  "app.solotodo.de",
]);

if (typeof window !== "undefined" &&
    FIRST_PARTY_AUTH_HOSTS.has(window.location.hostname)) {
  firebaseConfig.authDomain = window.location.hostname;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Persistence strategy:
// - Native (iOS/Android WKWebView): use ONLY browserLocalPersistence (localStorage).
//   IndexedDB is unreliable in WKWebView and gets wiped on app restart, killing auth.
// - Web (desktop browsers): use IndexedDB first, then localStorage as fallback.
// NOTE: No popupRedirectResolver — it creates a cross-origin iframe that crashes WKWebView
function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

const isNative = isNativePlatform();
const auth = initializeAuth(app, {
  persistence: isNative
    ? [browserLocalPersistence]
    : [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: isNative ? undefined : browserPopupRedirectResolver
});
const db = getFirestore(app);
const functions = getFunctions(app, "europe-west1");

// App Check — protects Cloud Functions from abuse
// Requires VITE_RECAPTCHA_SITE_KEY in .env.local and App Check registered in Firebase Console
// Skipped in dev: localhost is not registered with reCAPTCHA, so every token
// fetch fails and floods the console with appCheck/recaptcha-error retries —
// requests went out without an App Check token either way. To test App Check
// locally instead, set self.FIREBASE_APPCHECK_DEBUG_TOKEN = true here and
// allowlist the printed token (Firebase Console → App Check → debug tokens).
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const hasConfiguredRecaptchaKey =
  recaptchaSiteKey && recaptchaSiteKey !== "YOUR_RECAPTCHA_SITE_KEY";

let appCheckReady = Promise.resolve(false);
if (!isNative && !import.meta.env.DEV && hasConfiguredRecaptchaKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckReady = Promise.resolve(true);
} else if (isNative) {
  // Native App Check uses Play Integrity on Android and App Attest/DeviceCheck
  // on iOS. Enforcement remains disabled server-side until legacy builds age out.
  appCheckReady = import("@capacitor-firebase/app-check")
    .then(async ({ FirebaseAppCheck }) => {
      await FirebaseAppCheck.initialize({ isTokenAutoRefreshEnabled: true });
      await FirebaseAppCheck.setTokenAutoRefreshEnabled({ enabled: true });
      // The app uses the Firebase JavaScript SDK inside the Capacitor WebView.
      // Bridge native Play Integrity/App Attest tokens into that SDK so callable
      // Functions actually receive X-Firebase-AppCheck.
      const provider = new CustomProvider({
        getToken: async () => {
          const result = await FirebaseAppCheck.getToken({ forceRefresh: false });
          return {
            token: result.token,
            expireTimeMillis: Number(result.expireTimeMillis) || Date.now() + 30 * 60 * 1000,
          };
        },
      });
      initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
      return true;
    })
    .catch((error) => {
      console.warn("[SoloToDo] Native App Check initialization failed.", error?.code || "unavailable");
      return false;
    });
}

// Analytics — only in browser, not in WKWebView (Capacitor native)
let analytics = null;
try {
  if (!isNative && typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
} catch (_) {
  // Analytics may fail in environments without cookie support
}

// Connect to local emulator in development
if (import.meta.env.DEV) {
  // connectFunctionsEmulator(functions, "127.0.0.1", 5001); // DISABLED: connecting to live backend to use Blaze plan
}

export { auth, db, functions, analytics, appCheckReady };
