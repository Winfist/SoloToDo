// firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Use initializeAuth with explicit persistence fallback:
// IndexedDB first (desktop), then localStorage (Capacitor WKWebView fallback)
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
const db = getFirestore(app);
const functions = getFunctions(app, "europe-west1");

// App Check — protects Cloud Functions from abuse
// Requires VITE_RECAPTCHA_SITE_KEY in .env.local and App Check registered in Firebase Console
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Connect to local emulator in development
if (import.meta.env.DEV) {
  // connectFunctionsEmulator(functions, "127.0.0.1", 5001); // DISABLED: connecting to live backend to use Blaze plan
}

export { auth, db, functions };
