// AuthScreen.jsx - Premium Solo Leveling Login/Register
import { useState, useEffect, useRef } from "react";

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
    const runes = ["\u16A0","\u16A2","\u16A6","\u16A8","\u16B1","\u16B2","\u16B7","\u16B9","\u16BA","\u16BE","\u16C1","\u16C3"];
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
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

// ─── ANIMATED BACKGROUND ──────────────────────────────────────
function AnimatedBackground() {
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", zIndex:0 }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0a0612 50%, #060410 100%)" }} />
      <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"50%", height:"50%", background:"radial-gradient(circle, #7c3aed15 0%, transparent 70%)", animation:"float 8s ease-in-out infinite", filter:"blur(60px)" }} />
      <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:"60%", height:"60%", background:"radial-gradient(circle, #4f46e515 0%, transparent 70%)", animation:"float 10s ease-in-out infinite reverse", filter:"blur(80px)" }} />
      <div style={{ position:"absolute", top:"30%", right:"10%", width:"30%", height:"30%", background:"radial-gradient(circle, #a78bfa10 0%, transparent 70%)", animation:"float 6s ease-in-out infinite", animationDelay:"-3s", filter:"blur(40px)" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)`, backgroundSize:"50px 50px", maskImage:"radial-gradient(ellipse at center, black 30%, transparent 80%)" }} />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
    </div>
  );
}

// ─── MAGIC CIRCLE ─────────────────────────────────────────────
function MagicCircle({ active }) {
  return (
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -50%)", width:500, height:500, pointerEvents:"none", opacity:active ? 0.6 : 0.2, transition:"opacity 0.5s ease" }}>
      <div style={{ position:"absolute", inset:0, border:"1px solid #7c3aed33", borderRadius:"50%", animation:"runeRotate 60s linear infinite" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:2, height:20, background:"linear-gradient(to bottom, #7c3aed44, transparent)", transformOrigin:"center -230px", transform:`rotate(${i * 30}deg)` }} />
        ))}
      </div>
      <div style={{ position:"absolute", inset:60, border:"1px solid #a78bfa22", borderRadius:"50%", animation:"runeRotate 40s linear infinite reverse" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ position:"absolute", top:"50%", left:"50%", fontSize:14, color:"#7c3aed44", transformOrigin:"center -160px", transform:`rotate(${i * 45}deg) translateY(-160px)` }}>\u25C6</div>
        ))}
      </div>
      <div style={{ position:"absolute", inset:120, border:"1px solid #7c3aed22", borderRadius:"50%", animation:"runeRotate 25s linear infinite", background:active ? "radial-gradient(circle, #7c3aed08 0%, transparent 70%)" : "transparent", transition:"background 0.5s ease" }} />
      {active && <div style={{ position:"absolute", inset:"35%", borderRadius:"50%", border:"2px solid #7c3aed44", animation:"energyPulse 2s ease-out infinite" }} />}
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
    <div style={{ position:"relative", marginBottom:16, animation:`slideUp 0.6s ease ${delay}s both` }}>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", left:16, fontSize:18, color:focused ? "#a78bfa" : "#64748b", transition:"color 0.3s ease", zIndex:1 }}>{icon}</div>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", padding:"16px 50px 16px 48px", borderRadius:14, fontSize:15,
            fontFamily:"'Outfit', sans-serif",
            background:focused ? "rgba(124,58,237,0.08)" : "rgba(15,15,30,0.6)",
            border:`2px solid ${error ? "#ef4444" : focused ? "#7c3aed" : "#1e1e3f"}`,
            color:"#e2e8f0", outline:"none", transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",
            animation:error ? "shakeX 0.5s ease" : "none",
            boxShadow:focused ? "0 0 30px rgba(124,58,237,0.2), inset 0 0 20px rgba(124,58,237,0.05)" : "none",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position:"absolute", right:16, background:"transparent", border:"none", color:"#64748b", cursor:"pointer", fontSize:16, padding:4, transition:"color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
          >{showPassword ? "\uD83D\uDC41\uFE0F" : "\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8\uFE0F"}</button>
        )}
      </div>
      {error && <div style={{ marginTop:6, fontSize:11, color:"#ef4444", fontFamily:"'JetBrains Mono', monospace", paddingLeft:16, animation:"slideUp 0.3s ease" }}>\u26A0 {error}</div>}
      <div style={{ position:"absolute", bottom:error ? 24 : 0, left:"50%", transform:"translateX(-50%)", width:focused ? "90%" : "0%", height:2, background:"linear-gradient(90deg, transparent, #7c3aed, transparent)", borderRadius:2, transition:"width 0.3s ease" }} />
    </div>
  );
}

// ─── BUTTON COMPONENT ─────────────────────────────────────────
function AuthButton({ children, onClick, loading, disabled, variant = "primary", delay = 0 }) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width:"100%", padding:isPrimary ? "18px 24px" : "14px 24px", borderRadius:14,
        fontSize:isPrimary ? 15 : 13, fontWeight:700,
        fontFamily:isPrimary ? "'Cinzel', serif" : "'JetBrains Mono', monospace",
        letterSpacing:isPrimary ? 3 : 1,
        background:isPrimary ? (hover ? "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 50%,#6d28d9 100%)" : "linear-gradient(135deg,#7c3aed 0%,#6d28d9 50%,#5b21b6 100%)") : (hover ? "rgba(124,58,237,0.1)" : "transparent"),
        color:isPrimary ? "#fff" : (hover ? "#a78bfa" : "#64748b"),
        border:isPrimary ? "none" : "1px solid #1e1e3f",
        cursor:disabled || loading ? "not-allowed" : "pointer",
        transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",
        position:"relative", overflow:"hidden", opacity:disabled ? 0.5 : 1,
        transform:hover && !disabled ? "translateY(-2px)" : "none",
        boxShadow:isPrimary && hover && !disabled ? "0 10px 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.2)" : isPrimary ? "0 4px 20px rgba(124,58,237,0.3)" : "none",
        animation:`slideUp 0.6s ease ${delay}s both`,
        marginBottom: 8,
      }}
    >
      {isPrimary && !loading && <div style={{ position:"absolute", top:0, left:hover ? "100%" : "-100%", width:"100%", height:"100%", background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", transition:"left 0.5s ease" }} />}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"runeRotate 0.8s linear infinite" }} />
          <span>PROCESSING...</span>
        </div>
      ) : children}
    </button>
  );
}

// ─── SOCIAL BUTTON ────────────────────────────────────────────
function SocialButton({ icon, label, onClick, delay = 0 }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex:1, padding:"14px 16px", borderRadius:12, fontSize:12,
        fontFamily:"'JetBrains Mono', monospace",
        background:hover ? "rgba(124,58,237,0.1)" : "rgba(15,15,30,0.6)",
        color:hover ? "#a78bfa" : "#94a3b8",
        border:`1px solid ${hover ? "#7c3aed44" : "#1e1e3f"}`,
        cursor:"pointer", transition:"all 0.3s ease",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        animation:`slideUp 0.6s ease ${delay}s both`,
      }}
    >
      <span style={{ fontSize:18 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────
function PasswordStrength({ password }) {
  const getStrength = () => {
    if (!password) return { level:0, label:"", color:"#1e1e3f" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 1) return { level:1, label:"SCHWACH", color:"#ef4444" };
    if (score <= 2) return { level:2, label:"MITTEL", color:"#f59e0b" };
    if (score <= 3) return { level:3, label:"GUT", color:"#22c55e" };
    return { level:4, label:"STARK", color:"#7c3aed" };
  };
  const strength = getStrength();
  if (!password) return null;
  return (
    <div style={{ marginBottom:16, animation:"fadeIn 0.3s ease" }}>
      <div style={{ display:"flex", gap:4, marginBottom:6 }}>
        {[1,2,3,4].map(level => (
          <div key={level} style={{ flex:1, height:3, borderRadius:2, background:level <= strength.level ? strength.color : "#1e1e3f", transition:"all 0.3s ease" }} />
        ))}
      </div>
      <div style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:strength.color, letterSpacing:1, textAlign:"right" }}>{strength.label}</div>
    </div>
  );
}

// ─── SUCCESS ANIMATION ────────────────────────────────────────
function SuccessAnimation({ hunterName, onComplete }) {
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
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(2,1,8,0.98)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
      {phase >= 1 && <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", border:"2px solid #7c3aed", animation:"portalOpen 1s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:"0 0 60px #7c3aed44, inset 0 0 60px #7c3aed22" }} />}
      {phase >= 2 && <div style={{ position:"absolute", width:4, background:"linear-gradient(to top, transparent, #7c3aed, #a78bfa, transparent)", animation:"lightBeam 1s ease-out forwards", filter:"blur(2px)" }} />}
      {phase >= 2 && <div style={{ fontSize:80, animation:"successPulse 0.6s cubic-bezier(0.34,1.56,0.64,1)", filter:"drop-shadow(0 0 40px #7c3aed)", marginBottom:20, zIndex:1 }}>\u2694\uFE0F</div>}
      {phase >= 3 && <div style={{ fontSize:11, letterSpacing:6, color:"#7c3aed", fontFamily:"'JetBrains Mono', monospace", marginBottom:12, animation:"fadeIn 0.6s ease" }}>SYSTEM ACTIVATED</div>}
      {phase >= 4 && <div style={{ fontSize:36, fontWeight:900, color:"#fff", fontFamily:"'Cinzel', serif", letterSpacing:4, textShadow:"0 0 40px #7c3aed", marginBottom:8, animation:"slideUp 0.6s ease" }}>{hunterName.toUpperCase()}</div>}
      {phase >= 4 && <div style={{ fontSize:14, color:"#6b7280", fontFamily:"'Cinzel', serif", letterSpacing:3, animation:"fadeIn 0.6s ease 0.2s both" }}>E-RANK HUNTER</div>}
      {phase >= 5 && (
        <div style={{ marginTop:30, display:"flex", gap:20, animation:"fadeIn 0.6s ease" }}>
          {[{stat:"STR",val:0,color:"#ef4444"},{stat:"INT",val:0,color:"#3b82f6"},{stat:"VIT",val:0,color:"#22c55e"},{stat:"AGI",val:0,color:"#f59e0b"},{stat:"CHA",val:0,color:"#a855f7"}].map((s, i) => (
            <div key={s.stat} style={{ textAlign:"center", animation:`statsReveal 0.4s ease ${i * 0.1}s both` }}>
              <div style={{ fontSize:10, color:s.color, fontFamily:"'JetBrains Mono', monospace", marginBottom:4 }}>{s.stat}</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#fff", fontFamily:"'Cinzel', serif" }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}
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
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Ung\u00FCltige E-Mail";
    if (mode !== "forgot") {
      if (!password) newErrors.password = "Passwort erforderlich";
      else if (password.length < 8) newErrors.password = "Mindestens 8 Zeichen";
    }
    if (mode === "register") {
      if (!hunterName) newErrors.hunterName = "Hunter-Name erforderlich";
      else if (hunterName.length < 3) newErrors.hunterName = "Mindestens 3 Zeichen";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passw\u00F6rter stimmen nicht \u00FCberein";
      if (!agreedToTerms) newErrors.terms = "Bitte akzeptiere die Bedingungen";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    if (mode === "forgot") {
      setErrors({ success: "Ein Link wurde an deine E-Mail gesendet" });
      setTimeout(() => switchMode("login"), 3000);
    } else {
      setShowSuccess(true);
    }
  };

  const switchMode = (newMode) => { setMode(newMode); setErrors({}); };

  if (showSuccess) {
    return <SuccessAnimation hunterName={hunterName || "Hunter"} onComplete={() => onAuthSuccess(hunterName || "Hunter")} />;
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", position:"relative" }}>
      <style>{AUTH_CSS}</style>
      <AnimatedBackground />
      <ParticleField />
      <MagicCircle active={loading} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:10 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:64, marginBottom:20, animation:"float 3s ease-in-out infinite, glow 3s ease-in-out infinite" }}>\u2694\uFE0F</div>
          <h1 style={{ fontSize:42, fontWeight:900, fontFamily:"'Cinzel', serif", color:"#fff", letterSpacing:8, marginBottom:8, animation:"textGlow 3s ease-in-out infinite, slideDown 0.8s ease" }}>ARISE</h1>
          <p style={{ fontSize:12, fontFamily:"'JetBrains Mono', monospace", color:"#7c3aed", letterSpacing:4, animation:"fadeIn 1s ease 0.3s both" }}>
            {mode === "login" && "HUNTER SYSTEM ACCESS"}
            {mode === "register" && "NEW HUNTER REGISTRATION"}
            {mode === "forgot" && "PASSWORD RECOVERY"}
          </p>
        </div>

        <div style={{ background:"rgba(10,8,20,0.8)", border:"1px solid #1e1e3f", borderRadius:24, padding:"32px 28px", backdropFilter:"blur(20px)", boxShadow:"0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(124,58,237,0.1)", animation:"scaleIn 0.6s ease, borderGlow 4s ease-in-out infinite" }}>

          {mode !== "forgot" && (
            <div style={{ display:"flex", marginBottom:28, background:"rgba(15,15,30,0.6)", borderRadius:12, padding:4 }}>
              {["login","register"].map((m) => (
                <button key={m} onClick={() => switchMode(m)}
                  style={{
                    flex:1, padding:"12px 16px", borderRadius:10, fontSize:11, fontWeight:700,
                    fontFamily:"'JetBrains Mono', monospace", letterSpacing:2,
                    background:mode === m ? "linear-gradient(135deg, #7c3aed22, #6d28d922)" : "transparent",
                    color:mode === m ? "#a78bfa" : "#475569",
                    border:mode === m ? "1px solid #7c3aed44" : "1px solid transparent",
                    cursor:"pointer", transition:"all 0.3s ease",
                  }}
                >{m === "login" ? "EINLOGGEN" : "REGISTRIEREN"}</button>
              ))}
            </div>
          )}

          {mode === "register" && <AuthInput type="text" placeholder="Hunter-Name" value={hunterName} onChange={(e) => setHunterName(e.target.value)} icon="\u2694\uFE0F" error={errors.hunterName} delay={0} />}
          <AuthInput type="email" placeholder="E-Mail Adresse" value={email} onChange={(e) => setEmail(e.target.value)} icon="\uD83D\uDCE7" error={errors.email} delay={mode === "register" ? 0.05 : 0} />

          {mode !== "forgot" && (
            <>
              <AuthInput type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} icon="\uD83D\uDD10" error={errors.password} delay={mode === "register" ? 0.1 : 0.05} />
              {mode === "register" && <PasswordStrength password={password} />}
            </>
          )}

          {mode === "register" && <AuthInput type="password" placeholder="Passwort best\u00E4tigen" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon="\uD83D\uDD12" error={errors.confirmPassword} delay={0.15} />}

          {mode === "register" && (
            <div style={{ marginBottom:20, animation:"slideUp 0.6s ease 0.2s both" }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <div
                  style={{ width:20, height:20, borderRadius:6, border:`2px solid ${errors.terms ? "#ef4444" : agreedToTerms ? "#7c3aed" : "#1e1e3f"}`, background:agreedToTerms ? "#7c3aed" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s ease", flexShrink:0, marginTop:2 }}
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                >
                  {agreedToTerms && <span style={{ color:"#fff", fontSize:12 }}>\u2713</span>}
                </div>
                <span style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>
                  Ich akzeptiere die <span style={{ color:"#a78bfa", cursor:"pointer" }}>Hunter-Vereinbarung</span> und die <span style={{ color:"#a78bfa", cursor:"pointer" }}>System-Bedingungen</span>
                </span>
              </label>
              {errors.terms && <div style={{ marginTop:6, fontSize:11, color:"#ef4444", fontFamily:"'JetBrains Mono', monospace", paddingLeft:32 }}>\u26A0 {errors.terms}</div>}
            </div>
          )}

          {mode === "login" && (
            <div style={{ textAlign:"right", marginBottom:20, animation:"fadeIn 0.6s ease 0.2s both" }}>
              <button onClick={() => switchMode("forgot")} style={{ background:"transparent", border:"none", color:"#64748b", fontSize:12, fontFamily:"'JetBrains Mono', monospace", cursor:"pointer", transition:"color 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
                onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
              >Passwort vergessen?</button>
            </div>
          )}

          {errors.success && (
            <div style={{ marginBottom:16, padding:"12px 16px", borderRadius:10, background:"rgba(34,197,94,0.1)", border:"1px solid #22c55e44", color:"#22c55e", fontSize:12, fontFamily:"'JetBrains Mono', monospace", animation:"fadeIn 0.3s ease" }}>
              \u2713 {errors.success}
            </div>
          )}

          <AuthButton onClick={handleSubmit} loading={loading} delay={mode === "register" ? 0.25 : 0.15}>
            {mode === "login" && "\u2694\uFE0F EINLOGGEN"}
            {mode === "register" && "\u2728 HUNTER WERDEN"}
            {mode === "forgot" && "\uD83D\uDCE7 LINK SENDEN"}
          </AuthButton>

          {mode === "forgot" && <AuthButton variant="secondary" onClick={() => switchMode("login")} delay={0.2}>\u2190 ZUR\u00DCCK ZUM LOGIN</AuthButton>}

          {mode !== "forgot" && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:16, margin:"24px 0", animation:"fadeIn 0.6s ease 0.3s both" }}>
                <div style={{ flex:1, height:1, background:"#1e1e3f" }} />
                <span style={{ fontSize:10, color:"#334155", fontFamily:"'JetBrains Mono', monospace", letterSpacing:2 }}>ODER</span>
                <div style={{ flex:1, height:1, background:"#1e1e3f" }} />
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <SocialButton icon="\uD83D\uDD37" label="Google" onClick={() => console.log("Google login")} delay={0.35} />
                <SocialButton icon="\uD83C\uDF4E" label="Apple" onClick={() => console.log("Apple login")} delay={0.4} />
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:24, animation:"fadeIn 1s ease 0.5s both" }}>
          <p style={{ fontSize:11, color:"#334155", fontFamily:"'JetBrains Mono', monospace" }}>
            {mode === "login" && <>Noch kein Hunter?{" "}<span onClick={() => switchMode("register")} style={{ color:"#7c3aed", cursor:"pointer" }}>Jetzt registrieren</span></>}
            {mode === "register" && <>Bereits ein Hunter?{" "}<span onClick={() => switchMode("login")} style={{ color:"#7c3aed", cursor:"pointer" }}>Einloggen</span></>}
          </p>
        </div>

        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#1e1e3f", fontFamily:"'JetBrains Mono', monospace", letterSpacing:2 }}>
          SOLO LEVELING v5.0 \u2022 ARISE
        </div>
      </div>
    </div>
  );
}
