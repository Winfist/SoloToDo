// AuthScreen.jsx - Premium Abyssal Sovereign Login/Register (Firebase Integrated)
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Capacitor } from "@capacitor/core";
import { SYSTEM_ICONS, SKILL_ICONS } from "./data/icons.js";
import ScrollApproachHint from "./components/ui/ScrollApproachHint.jsx";
import { useI18n } from "./components/i18n/I18nProvider.jsx";
import { openLegalPage } from "./services/legalLinks.js";

const AuthTunnelScene = lazy(() => import("./3d/auth/AuthTunnelScene.jsx"));

function supportsWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch { return false; }
}
const HAS_WEBGL = supportsWebGL();
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  browserPopupRedirectResolver
} from "firebase/auth";

// Detect native Capacitor environment (WKWebView on iOS)
function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

const IS_CAPACITOR = isNativePlatform();
// Mobile browsers block popups — use redirect flow instead
const IS_MOBILE_BROWSER = !IS_CAPACITOR && typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const AUTH_RETRY_DELAY_MS = 700;
const RECENT_REGISTRATION_RECOVERY_MS = 5 * 60 * 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isNetworkAuthError(err) {
  return err?.code === "auth/network-request-failed" || /network request failed/i.test(err?.message || "");
}

async function runAuthRequest(fn) {
  try {
    return await fn();
  } catch (err) {
    if (isNetworkAuthError(err) && navigator.onLine !== false) {
      await delay(AUTH_RETRY_DELAY_MS);
      return await fn();
    }
    throw err;
  }
}

// ─── AUTH HELPERS ──────────────────────────────────────────────
function readNativeDisplayName(nativeResult) {
  return (
    nativeResult?.user?.displayName
    || nativeResult?.additionalUserInfo?.profile?.name
    || nativeResult?.additionalUserInfo?.profile?.given_name
    || ""
  );
}

function getNativeCredential(nativeResult, providerName) {
  const credential = nativeResult?.credential;
  if (!credential) {
    throw new Error(`${providerName} returned no credential from the native sign-in flow.`);
  }
  return credential;
}

function createGoogleCredential(nativeResult) {
  const credential = getNativeCredential(nativeResult, "Google");
  const idToken = credential.idToken || null;
  const accessToken = credential.accessToken || null;
  if (!idToken && !accessToken) {
    throw new Error("Google returned no ID token or access token from the native sign-in flow.");
  }
  return GoogleAuthProvider.credential(idToken, accessToken);
}

function createAppleCredential(nativeResult) {
  const credential = getNativeCredential(nativeResult, "Apple");
  if (!credential.idToken) {
    throw new Error("Apple returned no ID token from the native sign-in flow.");
  }
  const provider = new OAuthProvider("apple.com");
  return provider.credential({
    idToken: credential.idToken,
    rawNonce: credential.nonce || undefined,
  });
}

function shouldRetryGoogleWithoutCredentialManager(err) {
  const message = `${err?.code || ""} ${err?.message || ""}`;
  return Capacitor.getPlatform?.() === "android"
    && /credential/i.test(message)
    && !/cancel|aborted|user/i.test(message);
}

async function signInWithNativeCredential(startNativeSignIn, createCredential) {
  const nativeResult = await startNativeSignIn();
  const credential = createCredential(nativeResult);
  const userCredential = await runAuthRequest(() => signInWithCredential(auth, credential));
  const nativeDisplayName = readNativeDisplayName(nativeResult);

  if (nativeDisplayName && !userCredential.user.displayName) {
    try {
      await updateProfile(userCredential.user, { displayName: nativeDisplayName });
    } catch (profileErr) {
      console.warn("Native social display name could not be stored.", profileErr);
    }
  }

  return {
    userCredential,
    displayName: userCredential.user.displayName || nativeDisplayName || "Hunter",
  };
}

function isRecentlyCreatedUser(user) {
  const createdAtMs = Date.parse(user?.metadata?.creationTime || "");
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs < RECENT_REGISTRATION_RECOVERY_MS;
}

async function createUserWithNetworkRecovery(emailValue, passwordValue) {
  try {
    return await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
  } catch (err) {
    if (!isNetworkAuthError(err) || navigator.onLine === false) throw err;

    await delay(AUTH_RETRY_DELAY_MS);
    if (auth.currentUser?.email && auth.currentUser.email.toLowerCase() === emailValue.toLowerCase()) {
      return { user: auth.currentUser };
    }

    try {
      return await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
    } catch (retryErr) {
      if (retryErr?.code === "auth/email-already-in-use") {
        try {
          const recovered = await signInWithEmailAndPassword(auth, emailValue, passwordValue);
          if (isRecentlyCreatedUser(recovered.user)) return recovered;
          await signOut(auth);
        } catch {
          // Keep the original email-already-in-use result for normal existing accounts.
        }
      }
      throw retryErr;
    }
  }
}

// Fonts are loaded globally in index.html. Keyframes here supplement styles/base.css during migration.
const AUTH_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: #7c3aed44; border-radius: 4px; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slideDown { from { transform: translateY(-40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
@keyframes glow { 0%, 100% { filter: drop-shadow(0 0 20px #7c3aed66); } 50% { filter: drop-shadow(0 0 40px #7c3aed) drop-shadow(0 0 80px #a78bfa66); } }
@keyframes textGlow { 0%, 100% { text-shadow: 0 0 20px #7c3aed88; } 50% { text-shadow: 0 0 40px #7c3aed, 0 0 80px #a78bfa, 0 0 120px #7c3aed44; } }
@keyframes borderGlow { 0%, 100% { border-color: #7c3aed33; box-shadow: 0 0 20px #7c3aed11; } 50% { border-color: #7c3aed66; box-shadow: 0 0 30px #7c3aed33, inset 0 0 20px #7c3aed11; } }
@keyframes runeRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes energyPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 0; } }
@keyframes shakeX { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes successPulse { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes portalOpen { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes lightBeam { 0% { height: 0; opacity: 0; } 50% { height: 200%; opacity: 1; } 100% { height: 200%; opacity: 0; } }
@keyframes statsReveal { 0% { transform: translateX(-20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
`;

// ─── PARTICLE SYSTEM ──────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5, speedY: -Math.random() * 0.5 - 0.2,
      speedX: (Math.random() - 0.5) * 0.3, opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() * 60 + 250,
    }));
    const runes = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"];
    const floatingRunes = Array.from({ length: 8 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      rune: runes[Math.floor(Math.random() * runes.length)],
      size: Math.random() * 16 + 12, speedY: -Math.random() * 0.3 - 0.1,
      speedX: (Math.random() - 0.5) * 0.2, opacity: Math.random() * 0.3 + 0.1,
      rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 0.5,
    }));
    let time = 0;
    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + p.x * 0.01);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.8 + 0.4 * pulse), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity * pulse})`;
        ctx.shadowColor = `hsla(${p.hue}, 70%, 60%, 0.5)`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        p.x += p.speedX; p.y += p.speedY;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10 || p.x > canvas.width + 10) p.x = Math.random() * canvas.width;
      });
      floatingRunes.forEach(r => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate((r.rotation * Math.PI) / 180);
        ctx.font = `${r.size}px serif`;
        ctx.fillStyle = `rgba(167, 139, 250, ${r.opacity * (0.5 + 0.5 * Math.sin(time + r.x))})`;
        ctx.shadowColor = "#7c3aed"; ctx.shadowBlur = 15; ctx.textAlign = "center";
        ctx.fillText(r.rune, 0, 0);
        ctx.restore();
        r.x += r.speedX; r.y += r.speedY; r.rotation += r.rotationSpeed;
        if (r.y < -50) { r.y = canvas.height + 50; r.x = Math.random() * canvas.width; r.rune = runes[Math.floor(Math.random() * runes.length)]; }
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
}

// ─── ANIMATED BACKGROUND ──────────────────────────────────────
function AnimatedBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0a0612 50%, #060410 100%)" }} />
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, #7c3aed15 0%, transparent 70%)", animation: "float 8s ease-in-out infinite", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, #4f46e515 0%, transparent 70%)", animation: "float 10s ease-in-out infinite reverse", filter: "blur(80px)" }} />
      <div style={{ position: "absolute", top: "30%", right: "10%", width: "30%", height: "30%", background: "radial-gradient(circle, #a78bfa10 0%, transparent 70%)", animation: "float 6s ease-in-out infinite", animationDelay: "-3s", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)`, backgroundSize: "50px 50px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
    </div>
  );
}

// ─── MAGIC CIRCLE ─────────────────────────────────────────────
function MagicCircle({ active }) {
  const isMob = typeof window !== "undefined" && window.innerWidth < 768;
  const size = isMob ? 280 : 500;
  const innerOff = isMob ? 35 : 60;
  const coreOff = isMob ? 70 : 120;
  const spoke = isMob ? -130 : -230;
  const diamond = isMob ? -90 : -160;
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: size, height: size, pointerEvents: "none", opacity: active ? 0.6 : 0.2, transition: "opacity 0.5s ease" }}>
      <div style={{ position: "absolute", inset: 0, border: "1px solid #7c3aed33", borderRadius: "50%", animation: "runeRotate 60s linear infinite" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 2, height: isMob ? 12 : 20, background: "linear-gradient(to bottom, #7c3aed44, transparent)", transformOrigin: `center ${spoke}px`, transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>
      <div style={{ position: "absolute", inset: innerOff, border: "1px solid #a78bfa22", borderRadius: "50%", animation: "runeRotate 40s linear infinite reverse" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", fontSize: isMob ? 10 : 14, color: "#7c3aed44", transformOrigin: `center ${diamond}px`, transform: `rotate(${i * 45}deg) translateY(${diamond}px)` }}>◆</div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: coreOff, border: "1px solid #7c3aed22", borderRadius: "50%", animation: "runeRotate 25s linear infinite", background: active ? "radial-gradient(circle, #7c3aed08 0%, transparent 70%)" : "transparent", transition: "background 0.5s ease" }} />
      {active && <div style={{ position: "absolute", inset: "35%", borderRadius: "50%", border: "2px solid #7c3aed44", animation: "energyPulse 2s ease-out infinite" }} />}
    </div>
  );
}

// ─── INPUT COMPONENT ──────────────────────────────────────────
function AuthInput({ type = "text", placeholder, value, onChange, icon, error, delay = 0 }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  return (
    <div style={{ position: "relative", marginBottom: 16, animation: `slideUp 0.6s ease ${delay}s both` }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 16, fontSize: 18, color: focused ? "#a78bfa" : "#64748b", transition: "color 0.3s ease", zIndex: 1 }}>{icon}</div>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "16px 50px 16px 48px", borderRadius: 14, fontSize: 15,
            fontFamily: "'Outfit', sans-serif",
            background: focused ? "rgba(124,58,237,0.08)" : "rgba(15,15,30,0.6)",
            border: `2px solid ${error ? "#ef4444" : focused ? "#7c3aed" : "#1e1e3f"}`,
            color: "#e2e8f0", outline: "none", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            animation: error ? "shakeX 0.5s ease" : "none",
            boxShadow: focused ? "0 0 30px rgba(124,58,237,0.2), inset 0 0 20px rgba(124,58,237,0.05)" : "none",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 16, background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 4, transition: "color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
          >{showPassword ? "👁️" : "👁️‍🗨️"}</button>
        )}
      </div>
      {error && <div style={{ marginTop: 6, fontSize: 11, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", paddingLeft: 16, animation: "slideUp 0.3s ease" }}>⚠ {error}</div>}
      <div style={{ position: "absolute", bottom: error ? 24 : 0, left: "50%", transform: "translateX(-50%)", width: focused ? "90%" : "0%", height: 2, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)", borderRadius: 2, transition: "width 0.3s ease" }} />
    </div>
  );
}

// ─── BUTTON COMPONENT ─────────────────────────────────────────
function AuthButton({ children, onClick, loading, disabled, variant = "primary", delay = 0 }) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: isPrimary ? "18px 24px" : "14px 24px", borderRadius: 14,
        fontSize: isPrimary ? 15 : 13, fontWeight: 700,
        fontFamily: isPrimary ? "'Cinzel', serif" : "'JetBrains Mono', monospace",
        letterSpacing: isPrimary ? 3 : 1,
        background: isPrimary ? (hover ? "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 50%,#6d28d9 100%)" : "linear-gradient(135deg,#7c3aed 0%,#6d28d9 50%,#5b21b6 100%)") : (hover ? "rgba(124,58,237,0.1)" : "transparent"),
        color: isPrimary ? "#fff" : (hover ? "#a78bfa" : "#64748b"),
        border: isPrimary ? "none" : "1px solid #1e1e3f",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", overflow: "hidden", opacity: disabled ? 0.5 : 1,
        transform: hover && !disabled ? "translateY(-2px)" : "none",
        boxShadow: isPrimary && hover && !disabled ? "0 10px 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.2)" : isPrimary ? "0 4px 20px rgba(124,58,237,0.3)" : "none",
        animation: `slideUp 0.6s ease ${delay}s both`,
        marginBottom: 8,
      }}
    >
      {isPrimary && !loading && <div style={{ position: "absolute", top: 0, left: hover ? "100%" : "-100%", width: "100%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", transition: "left 0.5s ease" }} />}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "runeRotate 0.8s linear infinite" }} />
          <span>PROCESSING...</span>
        </div>
      ) : children}
    </button>
  );
}

// ─── SOCIAL BUTTON ────────────────────────────────────────────
function SocialButton({ icon, label, onClick, disabled = false, delay = 0 }) {
  const [hover, setHover] = useState(false);
  return (
    <button type="button" onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: "14px 16px", borderRadius: 12, fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        background: hover ? "rgba(124,58,237,0.1)" : "rgba(15,15,30,0.6)",
        color: hover ? "#a78bfa" : "#94a3b8",
        border: `1px solid ${hover ? "#7c3aed44" : "#1e1e3f"}`,
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.3s ease",
        opacity: disabled ? 0.55 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        animation: `slideUp 0.6s ease ${delay}s both`,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────
function PasswordStrength({ password }) {
  const getStrength = () => {
    if (!password) return { level: 0, label: "", color: "#1e1e3f" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: "SCHWACH", color: "#ef4444" };
    if (score <= 2) return { level: 2, label: "MITTEL", color: "#f59e0b" };
    if (score <= 3) return { level: 3, label: "GUT", color: "#22c55e" };
    return { level: 4, label: "STARK", color: "#7c3aed" };
  };
  const strength = getStrength();
  if (!password) return null;
  return (
    <div style={{ marginBottom: 16, animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map(level => (
          <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: level <= strength.level ? strength.color : "#1e1e3f", transition: "all 0.3s ease" }} />
        ))}
      </div>
      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: strength.color, letterSpacing: 1, textAlign: "right" }}>{strength.label}</div>
    </div>
  );
}

// ─── SUCCESS ANIMATION ────────────────────────────────────────
function SuccessAnimation({ hunterName, onComplete }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2600),
      setTimeout(() => setPhase(5), 3400),
      setTimeout(onComplete, 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,1,8,0.98)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {phase >= 1 && <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "2px solid #7c3aed", animation: "portalOpen 1s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 0 60px #7c3aed44, inset 0 0 60px #7c3aed22" }} />}
      {phase >= 2 && <div style={{ position: "absolute", width: 4, background: "linear-gradient(to top, transparent, #7c3aed, #a78bfa, transparent)", animation: "lightBeam 1s ease-out forwards", filter: "blur(2px)" }} />}
      {phase >= 2 && <div style={{ animation: "successPulse 0.6s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 20, zIndex: 1 }}><img src={SYSTEM_ICONS.logo} alt="System" style={{ width: 96, height: 96, objectFit: "contain", filter: "drop-shadow(0 0 40px #7c3aed)" }} /></div>}
      {phase >= 3 && <div style={{ fontSize: 11, letterSpacing: 6, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, animation: "fadeIn 0.6s ease" }}>{t("auth.successActivated")}</div>}
      {phase >= 4 && <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", letterSpacing: 4, textShadow: "0 0 40px #7c3aed", marginBottom: 8, animation: "slideUp 0.6s ease" }}>{hunterName.toUpperCase()}</div>}
      {phase >= 4 && <div style={{ fontSize: 14, color: "#6b7280", fontFamily: "'Cinzel', serif", letterSpacing: 3, animation: "fadeIn 0.6s ease 0.2s both" }}>E-RANK HUNTER</div>}
      {phase >= 5 && (
        <div style={{ marginTop: 30, display: "flex", gap: 20, animation: "fadeIn 0.6s ease" }}>
          {[{ stat: "STR", val: 0, color: "#ef4444" }, { stat: "INT", val: 0, color: "#3b82f6" }, { stat: "VIT", val: 0, color: "#22c55e" }, { stat: "AGI", val: 0, color: "#f59e0b" }, { stat: "CHA", val: 0, color: "#a855f7" }].map((s, i) => (
            <div key={s.stat} style={{ textAlign: "center", animation: `statsReveal 0.4s ease ${i * 0.1}s both` }}>
              <div style={{ fontSize: 10, color: s.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{s.stat}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif" }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN AUTH SCREEN ─────────────────────────────────────────
function LegalInlineLink({ kind, children }) {
  const handleOpen = (event) => {
    event.stopPropagation();
    openLegalPage(kind);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLegalPage(kind);
    }
  };

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
    >
      {children}
    </span>
  );
}

export default function AuthScreen({ onAuthSuccess }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hunterName, setHunterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const authScrollRef = useRef(null);
  const autoApproachRef = useRef(null);
  // Imperative refs for progress-driven UI (no re-renders)
  const formContainerRef = useRef(null);
  const headerRef = useRef(null);
  const scrollHintRef = useRef(null);
  const msg1Ref = useRef(null);
  const msg2Ref = useRef(null);
  const msg3Ref = useRef(null);
  const vignetteRef = useRef(null);

  // Handle redirect result after mobile OAuth (Google/Apple redirect flow)
  useEffect(() => {
    if (!IS_MOBILE_BROWSER) return;
    getRedirectResult(auth).then((result) => {
      if (!result) return;
      setHunterName(result.user.displayName || "Hunter");
      setShowSuccess(true);
    }).catch((err) => {
      if (err.code && err.code !== "auth/no-auth-event") {
        setErrors({ server: err.message });
      }
    });
  }, []);

  // Called every frame by AuthTunnelScene — only DOM manipulation, no setState
  const handleProgress = useCallback((p) => {
    // Vignette deepens with approach
    if (vignetteRef.current) {
      const v = 0.7 + p * 0.3;
      vignetteRef.current.style.opacity = v.toString();
    }
    // Scroll hint fades immediately
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = Math.max(0, 1 - p * 6).toString();
    }
    // Header fades out between 65% and 85%
    if (headerRef.current) {
      const hOp = Math.max(0, 1 - Math.max(0, (p - 0.62) / 0.22));
      headerRef.current.style.opacity = hOp.toString();
    }
    // SL narrative overlays — CSS transition handles smoothing
    const setOp = (ref, val) => { if (ref.current) ref.current.style.opacity = val > 0 ? "1" : "0"; };
    setOp(msg1Ref, p >= 0.12 && p < 0.40 ? 1 : 0);
    setOp(msg2Ref, p >= 0.44 && p < 0.70 ? 1 : 0);
    setOp(msg3Ref, p >= 0.76 && p < 0.87 ? 1 : 0);
    // Form fades in at 85%, slides up slightly
    if (formContainerRef.current) {
      const fOp = Math.max(0, Math.min(1, (p - 0.84) / 0.14));
      formContainerRef.current.style.opacity = fOp.toString();
      formContainerRef.current.style.pointerEvents = fOp > 0.05 ? "auto" : "none";
      formContainerRef.current.style.transform = `translateY(${(1 - fOp) * 22}px)`;
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = t("auth.validation.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email.trim())) newErrors.email = t("auth.validation.emailInvalid");
    if (mode !== "forgot") {
      if (!password) newErrors.password = t("auth.validation.passwordRequired");
      else if (password.length < 8) newErrors.password = t("auth.validation.passwordMin");
    }
    if (mode === "register") {
      const selectedName = hunterName.trim();
      if (!selectedName) newErrors.hunterName = t("auth.validation.hunterRequired");
      else if (selectedName.length < 3) newErrors.hunterName = t("auth.validation.hunterMin");
      if (password !== confirmPassword) newErrors.confirmPassword = t("auth.validation.passwordsMismatch");
      if (!agreedToTerms) newErrors.terms = t("auth.validation.termsRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      if (mode === "login") {
        const userCredential = await runAuthRequest(() => signInWithEmailAndPassword(auth, email.trim(), password));
        const name = userCredential.user.displayName || "Hunter";
        setHunterName(name);
        setShowSuccess(true);
      } else if (mode === "register") {
        const selectedName = hunterName.trim();
        try { sessionStorage.setItem("sl-pending-hunter-name", selectedName); } catch { }
        const userCredential = await createUserWithNetworkRecovery(email.trim(), password);
        try {
          await runAuthRequest(() => updateProfile(userCredential.user, { displayName: selectedName }));
        } catch (profileErr) {
          console.warn(t("auth.messages.profileNameWarn"), profileErr);
        }
        setHunterName(selectedName);
        setShowSuccess(true);
      } else if (mode === "forgot") {
        await runAuthRequest(() => sendPasswordResetEmail(auth, email.trim()));
        setErrors({ success: t("auth.messages.resetSent") });
        setTimeout(() => switchMode("login"), 4000);
      }
    } catch (err) {
      console.error(err);
      if (mode === "register") {
        try { sessionStorage.removeItem("sl-pending-hunter-name"); } catch { }
      }
      let msg = t("auth.messages.genericError", { message: err.message || "" });
      if (err.code === "auth/wrong-password") msg = t("auth.messages.wrongPassword");
      else if (err.code === "auth/email-already-in-use") msg = t("auth.messages.emailInUse");
      else if (err.code === "auth/weak-password") msg = t("auth.messages.weakPassword");
      if (isNetworkAuthError(err)) msg = navigator.onLine === false
        ? t("auth.messages.offline")
        : t("auth.messages.firebaseUnavailable");
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrors({});
    try {
      if (IS_CAPACITOR) {
        // Native Google Sign-In via Capacitor plugin
        // With skipNativeAuth:true, the plugin returns credentials without signing in.
        // We sign in via the JS SDK so it can persist the session in localStorage.
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const { displayName } = await signInWithNativeCredential(
          async () => {
            try {
              return await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true, useCredentialManager: true });
            } catch (nativeErr) {
              if (shouldRetryGoogleWithoutCredentialManager(nativeErr)) {
                return await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true, useCredentialManager: false });
              }
              throw nativeErr;
            }
          },
          createGoogleCredential
        );
        setHunterName(displayName);
        setShowSuccess(true);
      } else {
        // Web: popup on desktop, redirect on mobile (Safari blocks popups)
        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        if (IS_MOBILE_BROWSER) {
          await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
          return; // result handled by getRedirectResult on next load
        }
        const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        setHunterName(result.user.displayName || "Hunter");
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      let msg = t("auth.messages.googleFailed", { message: err.message || "" });
      if (err.code === "auth/operation-not-allowed") msg = t("auth.messages.googleNotEnabled");
      else if (err.code === "auth/popup-closed-by-user" || err.message?.includes("canceled")) msg = t("auth.messages.loginCanceled");
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setErrors({});
    try {
      if (IS_CAPACITOR) {
        // Native Apple Sign-In via Capacitor plugin
        // With skipNativeAuth:true, the plugin returns credentials without signing in.
        // We sign in via the JS SDK so it can persist the session in localStorage.
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const { displayName } = await signInWithNativeCredential(
          () => FirebaseAuthentication.signInWithApple({ skipNativeAuth: true }),
          createAppleCredential
        );
        setHunterName(displayName);
        setShowSuccess(true);
      } else {
        // Web: popup on desktop, redirect on mobile (Safari blocks popups)
        const provider = new OAuthProvider('apple.com');
        provider.addScope("email");
        provider.addScope("name");
        if (IS_MOBILE_BROWSER) {
          await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
          return; // result handled by getRedirectResult on next load
        }
        const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        setHunterName(result.user.displayName || "Hunter");
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      let msg = t("auth.messages.appleFailed", { message: err.message || "" });
      if (err.code === "auth/operation-not-allowed") msg = t("auth.messages.appleNotEnabled");
      else if (err.code === "auth/popup-closed-by-user" || err.message?.includes("canceled")) msg = t("auth.messages.loginCanceled");
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => { setMode(newMode); setErrors({}); };

  if (showSuccess) {
    return <SuccessAnimation hunterName={hunterName || "Hunter"} onComplete={() => onAuthSuccess(auth.currentUser, hunterName || "Hunter")} />;
  }

  // ── Form card (pure HTML — rendered as fixed overlay, NOT in 3D) ─────────────
  const formCard = (
    <div style={{ background: "rgba(8,5,20,0.88)", border: "1px solid #2d1b69", borderRadius: isMobile ? 16 : 20, padding: isMobile ? "24px 18px" : "32px 28px", backdropFilter: "blur(24px) saturate(1.4)", boxShadow: "0 0 0 1px #7c3aed22, 0 20px 60px rgba(0,0,0,0.7), 0 0 80px rgba(124,58,237,0.12), inset 0 1px 0 rgba(167,139,250,0.08)", position: "relative", overflow: "hidden" }}>
      {/* Inner glow accent line at top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed88, transparent)", zIndex: 1 }} />

      {/* Mode tabs */}
      {mode !== "forgot" && (
        <div style={{ display: "flex", marginBottom: 28, background: "rgba(10,8,25,0.7)", borderRadius: 12, padding: 4, border: "1px solid #1e1040" }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2,
                background: mode === m ? "linear-gradient(135deg, #7c3aed28, #4c1d9522)" : "transparent",
                color: mode === m ? "#a78bfa" : "#3d3560",
                border: mode === m ? "1px solid #7c3aed55" : "1px solid transparent",
                cursor: "pointer", transition: "all 0.3s ease",
              }}
            >{m === "login" ? t("auth.tabs.login") : t("auth.tabs.register")}</button>
          ))}
        </div>
      )}

      {mode === "register" && <AuthInput type="text" placeholder={t("auth.placeholders.hunterName")} value={hunterName} onChange={(e) => setHunterName(e.target.value)} icon="⚔️" error={errors.hunterName} delay={0} />}
      <AuthInput type="email" placeholder={t("auth.placeholders.email")} value={email} onChange={(e) => setEmail(e.target.value)} icon="📧" error={errors.email} delay={mode === "register" ? 0.05 : 0} />

      {mode !== "forgot" && (
        <>
          <AuthInput type="password" placeholder={t("auth.placeholders.password")} value={password} onChange={(e) => setPassword(e.target.value)} icon="🔐" error={errors.password} delay={mode === "register" ? 0.1 : 0.05} />
          {mode === "register" && <PasswordStrength password={password} />}
        </>
      )}
      {mode === "register" && <AuthInput type="password" placeholder={t("auth.placeholders.confirmPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon="🔒" error={errors.confirmPassword} delay={0.15} />}

      {mode === "register" && (
        <div style={{ marginBottom: 20, animation: "slideUp 0.6s ease 0.2s both" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
            <div
              style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${errors.terms ? "#ef4444" : agreedToTerms ? "#7c3aed" : "#1e1e3f"}`, background: agreedToTerms ? "#7c3aed" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", flexShrink: 0, marginTop: 2 }}
              onClick={() => setAgreedToTerms(!agreedToTerms)}
            >
              {agreedToTerms && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
              {t("auth.termsPrefix")} <LegalInlineLink kind="terms">{t("auth.hunterAgreement")}</LegalInlineLink> {t("auth.termsConnector")} <LegalInlineLink kind="privacy">{t("auth.systemTerms")}</LegalInlineLink>
            </span>
          </label>
          {errors.terms && <div style={{ marginTop: 6, fontSize: 11, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", paddingLeft: 32 }}>⚠ {errors.terms}</div>}
        </div>
      )}

      {mode === "login" && (
        <div style={{ textAlign: "right", marginBottom: 20, animation: "fadeIn 0.6s ease 0.2s both" }}>
          <button onClick={() => switchMode("forgot")} style={{ background: "transparent", border: "none", color: "#4a4070", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", transition: "color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
            onMouseLeave={e => e.currentTarget.style.color = "#4a4070"}
          >{t("auth.forgotPassword")}</button>
        </div>
      )}

      {errors.server && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid #ef444433", color: "#ef4444", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", animation: "fadeIn 0.3s ease" }}>
          ⚠ {errors.server}
        </div>
      )}
      {errors.success && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e33", color: "#22c55e", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", animation: "fadeIn 0.3s ease" }}>
          ✓ {errors.success}
        </div>
      )}

      <AuthButton onClick={handleSubmit} loading={loading} delay={mode === "register" ? 0.25 : 0.15}>
        {mode === "login" && `⚔️ ${t("auth.submit.login").toUpperCase()}`}
        {mode === "register" && `✨ ${t("auth.submit.register").toUpperCase()}`}
        {mode === "forgot" && `📧 ${t("auth.submit.forgot").toUpperCase()}`}
      </AuthButton>

      {mode === "forgot" && <AuthButton variant="secondary" onClick={() => switchMode("login")} delay={0.2}>← {t("auth.backToLogin").toUpperCase()}</AuthButton>}

      {mode !== "forgot" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1a1035" }} />
            <span style={{ fontSize: 10, color: "#2d2050", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>{t("auth.divider")}</span>
            <div style={{ flex: 1, height: 1, background: "#1a1035" }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <SocialButton icon="🔷" label="Google" onClick={handleGoogleLogin} disabled={loading} delay={0.35} />
            <SocialButton icon="🍎" label="Apple" onClick={handleAppleLogin} disabled={loading} delay={0.4} />
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <p style={{ fontSize: 11, color: "#2d2a4a", fontFamily: "'JetBrains Mono', monospace" }}>
          {mode === "login" && <>{t("auth.switchToRegister")}{" "}<span onClick={() => switchMode("register")} style={{ color: "#7c3aed", cursor: "pointer" }}>{t("auth.registerNow")}</span></>}
          {mode === "register" && <>{t("auth.switchToLogin")}{" "}<span onClick={() => switchMode("login")} style={{ color: "#7c3aed", cursor: "pointer" }}>{t("auth.loginNow")}</span></>}
        </p>
      </div>
    </div>
  );

  const SL_MSG = {
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: isMobile ? 2 : 5,
    fontSize: isMobile ? 9 : 11,
    pointerEvents: "none",
    transition: "opacity 0.9s ease",
    padding: isMobile ? "0 16px" : 0,
  };

  return (
    <div ref={authScrollRef} style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#030009" }}>
      <style>{AUTH_CSS}</style>

      {/* ── 3D Tunnel scene ──────────────────────────────────────── */}
      {HAS_WEBGL ? (
        <Suspense fallback={<><AnimatedBackground /><ParticleField /></>}>
          <AuthTunnelScene
            scrollContainerRef={authScrollRef}
            onProgress={handleProgress}
            autoApproachRef={autoApproachRef}
          />
        </Suspense>
      ) : (
        <>
          <AnimatedBackground />
          <ParticleField />
        </>
      )}

      {/* ── Scanlines — SL terminal aesthetic ────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)"
      }} />

      {/* ── Vignette ──────────────────────────────────────────────── */}
      <div ref={vignetteRef} style={{
        position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none", opacity: 0.7,
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, rgba(2,0,12,0.85) 100%)"
      }} />

      {/* ── Corner brackets (SL UI accent) ───────────────────────── */}
      {["top:12px;left:12px", "top:12px;right:12px", "bottom:12px;left:12px", "bottom:12px;right:12px"].map((pos, i) => {
        const style = Object.fromEntries(pos.split(";").map(s => s.split(":")));
        const isRight = pos.includes("right");
        const isBottom = pos.includes("bottom");
        return (
          <div key={i} style={{
            position: "fixed", ...style, zIndex: 6, pointerEvents: "none", width: 20, height: 20,
            borderTop: isBottom ? "none" : "1px solid #7c3aed44",
            borderBottom: isBottom ? "1px solid #7c3aed44" : "none",
            borderLeft: isRight ? "none" : "1px solid #7c3aed44",
            borderRight: isRight ? "1px solid #7c3aed44" : "none"
          }} />
        );
      })}

      {/* ── Abyssal Sovereign narrative overlays ──────────────────────── */}
      <div style={{ position: "fixed", bottom: isMobile ? 80 : 120, left: 0, right: 0, zIndex: 8, textAlign: "center", pointerEvents: "none" }}>
        {/* msg1: 12%–40% — gate detected */}
        <div ref={msg1Ref} style={{ ...SL_MSG, opacity: 0, color: "#a78bfa", textShadow: "0 0 18px #7c3aed" }}>
          ⚠ {t("auth.overlay.gateDetected")}
        </div>
        {/* msg2: 44%–70% — portal sequence */}
        <div ref={msg2Ref} style={{ ...SL_MSG, opacity: 0, color: "#7c3aed", letterSpacing: 4, textShadow: "0 0 12px #7c3aed66" }}>
          {t("auth.overlay.portalSequence")}
        </div>
        {/* msg3: 76%–87% — auth required (pulses) */}
        <div ref={msg3Ref} style={{ ...SL_MSG, opacity: 0, color: "#e2d9ff", letterSpacing: 6, animation: "pulse 1.2s ease-in-out infinite", textShadow: "0 0 28px #a78bfa" }}>
          ⚔ {t("auth.overlay.authRequired")}
        </div>
      </div>

      {/* ── Header — fades out as user approaches portal ──────────── */}
      <div ref={headerRef} style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: isMobile ? 24 : 38, zIndex: 12, pointerEvents: "none", transition: "opacity 0.5s ease" }}>
        <div style={{ marginBottom: isMobile ? 6 : 10, animation: "float 3s ease-in-out infinite, glow 3s ease-in-out infinite" }}><img src={SYSTEM_ICONS.logo} alt="MANIFEST" style={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, objectFit: "contain", filter: "drop-shadow(0 0 16px #7c3aed88)" }} /></div>
        <h1 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#fff", letterSpacing: isMobile ? 5 : 8, marginBottom: 6, animation: "textGlow 3s ease-in-out infinite, slideDown 0.8s ease" }}>MANIFEST</h1>
        <p style={{ fontSize: isMobile ? 9 : 11, fontFamily: "'JetBrains Mono', monospace", color: "#7c3aed", letterSpacing: isMobile ? 3 : 5, animation: "fadeIn 1s ease 0.3s both" }}>
          {mode === "login" && t("auth.overlay.login")}
          {mode === "register" && t("auth.overlay.register")}
          {mode === "forgot" && t("auth.overlay.forgot")}
        </p>
      </div>

      {/* ── Scroll hint ───────────────────────────────────────────── */}
      {HAS_WEBGL && (
        <div ref={scrollHintRef} style={{ position: "fixed", bottom: isMobile ? 38 : 46, left: "50%", transform: "translateX(-50%)", zIndex: 18, textAlign: "center", transition: "opacity 0.6s ease" }}>
          <ScrollApproachHint
            color="#a78bfa"
            isMobile={isMobile}
            label={isMobile ? t("auth.overlay.scrollMobile") : t("auth.overlay.scrollDesktop")}
            subLabel={t("auth.overlay.scrollSub")}
            onActivate={() => autoApproachRef.current?.()}
          />
        </div>
      )}

      {/* ── FORM — fixed overlay, fully stable, never in 3D space ─── */}
      <div
        ref={formContainerRef}
        style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "12px" : "20px",
          zIndex: 25,
          opacity: 0, pointerEvents: "none",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ width: "100%", maxWidth: isMobile ? 380 : 440 }}>
          {formCard}
        </div>
      </div>

      {/* No-WebGL fallback: form shown immediately */}
      {!HAS_WEBGL && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 25 }}>
          <div style={{ width: "100%", maxWidth: 440 }}>{formCard}</div>
        </div>
      )}

      {/* MagicCircle overlay */}
      <MagicCircle active={loading} />

      {/* Version watermark */}
      <div style={{ position: "fixed", bottom: isMobile ? 10 : 20, left: "50%", transform: "translateX(-50%)", fontSize: isMobile ? 7 : 9, color: "#1e2a3a", fontFamily: "'JetBrains Mono', monospace", letterSpacing: isMobile ? 1 : 2, zIndex: 5 }}>
        SOLOTODO SYSTEM v5.0
      </div>
    </div>
  );
}
