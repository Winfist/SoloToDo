// AuthScreen.jsx - Premium Solo Leveling Login/Register (Firebase Integrated)
import { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";

// ─── AUTH CSS ─────────────────────────────────────────────────
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
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
@keyframes textGlow { 0%, 100% { text-shadow: 0 0 20px #7c3aed88; } 50% { text-shadow: 0 0 40px #7c3aed, 0 0 80px #a78bfa; } }
@keyframes borderGlow { 0%, 100% { border-color: #7c3aed33; box-shadow: 0 0 20px #7c3aed11; } 50% { border-color: #7c3aed66; box-shadow: 0 0 30px #7c3aed33; } }
@keyframes runeRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes energyPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 0; } }
@keyframes shakeX { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
`;

// ─── PARTICLE FIELD (Lightweight) ───────────────────────────────
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
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5, speedY: -Math.random() * 0.4 - 0.1,
      speedX: (Math.random() - 0.5) * 0.2, opacity: Math.random() * 0.4 + 0.1,
      hue: Math.random() * 40 + 250,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
        ctx.fill();
        p.x += p.speedX; p.y += p.speedY;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

// ─── MAGIC CIRCLE ─────────────────────────────────────────────
function MagicCircle({ active }) {
  return (
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -50%)", width:400, height:400, pointerEvents:"none", opacity:active ? 0.5 : 0.15, transition:"opacity 0.5s ease" }}>
      <div style={{ position:"absolute", inset:0, border:"1px solid #7c3aed33", borderRadius:"50%", animation:"runeRotate 60s linear infinite" }} />
      <div style={{ position:"absolute", inset:60, border:"1px solid #a78bfa22", borderRadius:"50%", animation:"runeRotate 40s linear infinite reverse" }} />
      {active && <div style={{ position:"absolute", inset:"35%", borderRadius:"50%", border:"2px solid #7c3aed44", animation:"energyPulse 2.5s ease-out infinite" }} />}
    </div>
  );
}

// ─── AUTH INPUT ───────────────────────────────────────────────
function AuthInput({ type = "text", placeholder, value, onChange, icon, error, delay = 0 }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  return (
    <div style={{ position:"relative", marginBottom:16, animation:`slideUp 0.6s ease ${delay}s both` }}>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", left:16, fontSize:18, color:focused ? "#a78bfa" : "#64748b", transition:"color 0.3s ease", zIndex:1 }}>{icon}</div>
        <input
          type={inputType} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:"100%", padding:"16px 50px 16px 48px", borderRadius:14, fontSize:15,
            fontFamily:"'Outfit', sans-serif", background:focused ? "rgba(124,58,237,0.08)" : "rgba(15,15,30,0.6)",
            border:`2px solid ${error ? "#ef4444" : focused ? "#7c3aed" : "#1e1e3f"}`,
            color:"#e2e8f0", outline:"none", transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxShadow:focused ? "0 0 30px rgba(124,58,237,0.1)" : "none",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position:"absolute", right:16, background:"transparent", border:"none", color:"#64748b", cursor:"pointer", transition:"color 0.3s" }}
          >{showPassword ? "👁️" : "👁️‍🗨️"}</button>
        )}
      </div>
      {error && <div style={{ marginTop:6, fontSize:10, color:"#ef4444", fontFamily:"'JetBrains Mono', monospace", paddingLeft:16 }}>⚠️ {error}</div>}
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────
function SuccessAnimation({ hunterName, onComplete }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(onComplete, 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"#060610", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
      <div style={{ fontSize:80, marginBottom:20, filter:"drop-shadow(0 0 30px #7c3aed)", animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>⚔️</div>
      {phase >= 1 && <div style={{ fontSize:10, letterSpacing:6, color:"#7c3aed", fontFamily:"'JetBrains Mono', monospace", animation:"fadeIn 0.6s ease" }}>SYSTEM ACTIVATED</div>}
      {phase >= 2 && <div style={{ fontSize:32, fontWeight:900, color:"#fff", fontFamily:"'Cinzel', serif", letterSpacing:4, textShadow:"0 0 40px #7c3aed", marginTop:16, animation:"slideUp 0.6s ease" }}>{hunterName.toUpperCase()}</div>}
      <style>{`@keyframes scaleIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── MAIN AUTH SCREEN ─────────────────────────────────────────
export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hunterName, setHunterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "E-Mail erforderlich";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Ungültige E-Mail";
    if (mode !== "forgot") {
      if (!password) newErrors.password = "Passwort erforderlich";
      else if (password.length < 8) newErrors.password = "Mindestens 8 Zeichen";
    }
    if (mode === "register") {
      if (!hunterName) newErrors.hunterName = "Hunter-Name erforderlich";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwörter stimmen nicht überein";
      if (!agreedToTerms) newErrors.terms = "Bitte akzeptiere die Bedingungen";
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const name = userCredential.user.displayName || "Hunter";
        setHunterName(name);
        setShowSuccess(true);
      } else if (mode === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: hunterName });
        setShowSuccess(true);
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setErrors({ success: "Link gesendet! Prüfe dein Postfach." });
        setTimeout(() => setMode("login"), 4000);
      }
    } catch (err) {
      console.error(err);
      let msg = "Fehler aufgetreten";
      if (err.code === "auth/user-not-found") msg = "Benutzer nicht gefunden";
      else if (err.code === "auth/wrong-password") msg = "Falsches Passwort";
      else if (err.code === "auth/email-already-in-use") msg = "E-Mail wird bereits verwendet";
      else if (err.code === "auth/invalid-credential") msg = "Ungültige Anmeldedaten";
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setHunterName(result.user.displayName || "Hunter");
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setErrors({ server: "Google Login fehlgeschlagen" });
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <SuccessAnimation hunterName={hunterName || "Hunter"} onComplete={() => onAuthSuccess(auth.currentUser, hunterName || "Hunter")} />;
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060612", position:"relative", overflow:"hidden" }}>
      <style>{AUTH_CSS}</style>
      <ParticleField />
      <MagicCircle active={loading} />

      <div style={{ width:"100%", maxWidth:400, position:"relative", zIndex:10, padding: 20 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:56, marginBottom:16, animation:"float 3s ease-in-out infinite" }}>⚔️</div>
          <h1 style={{ fontSize:36, fontWeight:900, fontFamily:"'Cinzel', serif", color:"#fff", letterSpacing:6, animation:"textGlow 3s ease-in-out infinite" }}>ARISE</h1>
          <p style={{ fontSize:10, color:"#7c3aed", letterSpacing:3, marginTop:8 }}>SYSTEM ACCESS</p>
        </div>

        <div style={{ background:"rgba(15,15,30,0.8)", border:"1px solid #1e1e3f", borderRadius:20, padding:32, backdropFilter:"blur(20px)", animation:"scaleIn 0.5s ease" }}>
          
          <div style={{ display:"flex", marginBottom:24, background:"rgba(0,0,0,0.3)", borderRadius:10, padding:4 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); }}
                style={{ flex:1, padding:10, borderRadius:8, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono', monospace", border:"none", cursor:"pointer", transition:"all 0.3s", background:mode === m ? "#7c3aed22" : "transparent", color:mode === m ? "#a78bfa" : "#475569" }}
              >{m.toUpperCase()}</button>
            ))}
          </div>

          {mode === "register" && <AuthInput placeholder="Hunter-Name" value={hunterName} onChange={e => setHunterName(e.target.value)} icon="⚔️" error={errors.hunterName} />}
          <AuthInput type="email" placeholder="E-Mail" value={email} onChange={e => setEmail(e.target.value)} icon="📧" error={errors.email} />
          
          {mode !== "forgot" && (
            <AuthInput type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)} icon="🔐" error={newErrors => {}} />
          )}

          {mode === "register" && <AuthInput type="password" placeholder="Bestätigen" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} icon="🛡️" error={errors.confirmPassword} />}

          {mode === "register" && (
            <label style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, cursor:"pointer", paddingLeft:4 }}>
              <input type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} style={{ display:"none" }} />
              <div style={{ width:16, height:16, borderRadius:4, border:"1px solid #1e1e3f", background:agreedToTerms ? "#7c3aed" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff" }}>{agreedToTerms && "✓"}</div>
              <span style={{ fontSize:11, color:"#475569" }}>Akzeptiere Hunter-Bedingungen</span>
            </label>
          )}

          {errors.server && <div style={{ marginBottom:16, fontSize:12, color:"#ef4444", textAlign:"center", padding:8, background:"#ef444411", borderRadius:8 }}>{errors.server}</div>}
          {errors.success && <div style={{ marginBottom:16, fontSize:12, color:"#22c55e", textAlign:"center", padding:8, background:"#22c55e11", borderRadius:8 }}>{errors.success}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width:"100%", padding:16, borderRadius:12, background:loading ? "#1e1e3f" : "linear-gradient(135deg,#7c3aed,#5b21b6)", color:"#fff", border:"none", fontWeight:900, fontFamily:"'Cinzel', serif", letterSpacing:3, cursor:"pointer", transition:"all 0.3s" }}
          >{loading ? "PROCESSING..." : mode === "login" ? "EINLOGGEN" : "SYSTEM START"}</button>

          {mode === "login" && (
            <div style={{ textAlign:"center", marginTop:16 }}>
              <button onClick={() => setMode("forgot")} style={{ background:"transparent", border:"none", color:"#475569", fontSize:11, cursor:"pointer" }}>Passwort vergessen?</button>
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0" }}>
            <div style={{ flex:1, height:1, background: "#1e1e3f" }} />
            <span style={{ fontSize:10, color:"#1e1e3f" }}>ODER</span>
            <div style={{ flex:1, height:1, background: "#1e1e3f" }} />
          </div>

          <button onClick={handleGoogleLogin} style={{ width:"100%", padding:12, borderRadius:10, background:"rgba(15,15,30,0.6)", border:"1px solid #1e1e3f", color:"#94a3b8", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", transition:"all 0.3s" }}>
            <span>🌀</span> Mit Google anmelden
          </button>
        </div>
      </div>
    </div>
  );
}
