import React, { useState, useEffect, useRef } from 'react';
import { GEM_ICONS } from '../data/icons.js';
import { AdService } from '../services/adService.js';
import { Capacitor } from '@capacitor/core';

export default function RewardedAdModal({ onComplete, onClose, theme }) {
  const [phase, setPhase] = useState("loading"); // loading | watching | reward | done
  const [countdown, setCountdown] = useState(15);
  const [gemReward, setGemReward] = useState(0);
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    async function loadAndShowAd() {
      if (Capacitor.getPlatform() === 'web') {
        // Loading phase (1.5s) for Web simulation
        const loadTimer = setTimeout(() => {
          setPhase("watching");
          // Start countdown
          intervalRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(intervalRef.current);
                const reward = 3 + Math.floor(Math.random() * 3); // 3-5
                setGemReward(reward);
                setPhase("reward");
                generateParticles();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }, 1500);
        return () => { clearTimeout(loadTimer); if (intervalRef.current) clearInterval(intervalRef.current); };
      } else {
        // Native AdMob Ad
        try {
          await AdService.showRewardedAd();
          // Ad finished watching
          const reward = 3 + Math.floor(Math.random() * 3); // 3-5
          setGemReward(reward);
          setPhase("reward");
          generateParticles();
        } catch (error) {
          console.error("Failed to show AdMob video", error);
          alert("Fehler beim Laden der Werbung.");
          onClose();
        }
      }
    }
    
    const cleanup = loadAndShowAd();
    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, []);

  const generateParticles = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 60,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 1.5,
    }));
    setParticles(newParticles);
  };

  const handleCollect = () => {
    onComplete();
    setPhase("done");
    setTimeout(() => onClose(), 600);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(2,2,10,0.95)",
      backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.3s ease",
      padding: 16
    }}>
      <style>{`
        @keyframes gemPulse {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 15px #a855f799); }
          25% { transform: scale(1.08) rotate(3deg); filter: drop-shadow(0 0 25px #a855f7cc); }
          50% { transform: scale(1.15) rotate(0deg); filter: drop-shadow(0 0 35px #c084fcff); }
          75% { transform: scale(1.08) rotate(-3deg); filter: drop-shadow(0 0 25px #a855f7cc); }
        }
        @keyframes gemRain {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
        }
        @keyframes countdownPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shineRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rewardScale {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 380,
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(14,10,28,0.98), rgba(6,4,16,0.99))",
        border: "1px solid #a855f744",
        boxShadow: "0 24px 80px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
        animation: phase === "done" ? "fadeIn 0.3s ease reverse forwards" : "slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
      }}>
        {/* Top gradient bar */}
        <div style={{
          height: 3, width: "100%",
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc, #a855f7, #7c3aed)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite"
        }} />

        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          {/* Loading Phase */}
          {phase === "loading" && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 20px",
                borderRadius: "50%",
                border: "3px solid #a855f733",
                borderTopColor: "#a855f7",
                animation: "shineRotate 1s linear infinite"
              }} />
              <div style={{
                fontSize: 12, color: "#a855f7",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: 2
              }}>WERBUNG WIRD GELADEN...</div>
            </div>
          )}

          {/* Watching Phase */}
          {phase === "watching" && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              {/* Big gem icon */}
              <div style={{ marginBottom: 24 }}>
                <img src={GEM_ICONS.gem} alt="Gem" style={{
                  width: 80, height: 80, objectFit: "contain",
                  animation: "gemPulse 3s ease-in-out infinite"
                }} />
              </div>

              {/* Ad placeholder content */}
              <div style={{
                background: "rgba(124,58,237,0.06)",
                border: "1px solid #a855f722",
                borderRadius: 16,
                padding: "20px",
                marginBottom: 24
              }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "#c084fc",
                  fontFamily: "'Cinzel',serif", marginBottom: 8
                }}>Gem Crystal Surge</div>
                <div style={{
                  fontSize: 11, color: "#94a3b8", lineHeight: 1.5
                }}>
                  Die Kristalle des Monarchen laden sich auf...<br />
                  Warte, bis die Energie vollständig absorbiert wurde.
                </div>
              </div>

              {/* Countdown */}
              <div style={{
                fontSize: 48, fontWeight: 900, color: "#a855f7",
                fontFamily: "'Cinzel',serif",
                animation: "countdownPulse 1s ease infinite",
                textShadow: "0 0 30px rgba(124,58,237,0.5)"
              }}>{countdown}</div>
              <div style={{
                fontSize: 10, color: "#64748b",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: 2, marginTop: 8
              }}>SEKUNDEN VERBLEIBEND</div>

              {/* Progress bar */}
              <div style={{
                width: "100%", height: 4, borderRadius: 2,
                background: "rgba(124,58,237,0.15)",
                marginTop: 16, overflow: "hidden"
              }}>
                <div style={{
                  width: `${((15 - countdown) / 15) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                  borderRadius: 2,
                  transition: "width 1s linear",
                  boxShadow: "0 0 8px #a855f7"
                }} />
              </div>
            </div>
          )}

          {/* Reward Phase */}
          {phase === "reward" && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              {/* Celebration particles */}
              {particles.map(p => (
                <div key={p.id} style={{
                  position: "absolute",
                  left: `${p.x}%`, top: `${p.y}%`,
                  width: p.size, height: p.size,
                  borderRadius: "50%",
                  background: `hsl(${270 + Math.random() * 40}, 80%, ${60 + Math.random() * 20}%)`,
                  animation: `gemRain ${p.duration}s ease-out ${p.delay}s both`,
                  pointerEvents: "none"
                }} />
              ))}

              {/* Big reward display */}
              <div style={{
                animation: "rewardScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                marginBottom: 24
              }}>
                <img src={GEM_ICONS.gem} alt="Gem" style={{
                  width: 100, height: 100, objectFit: "contain",
                  filter: "drop-shadow(0 0 30px #a855f7cc)",
                  animation: "float 2s ease-in-out infinite"
                }} />
              </div>

              <div style={{
                fontSize: 10, letterSpacing: 4, color: "#22c55e",
                fontFamily: "'JetBrains Mono',monospace",
                marginBottom: 12
              }}>KRISTALL ABSORBIERT!</div>

              <div style={{
                fontSize: 42, fontWeight: 900, color: "#c084fc",
                fontFamily: "'Cinzel',serif",
                textShadow: "0 0 40px rgba(168,85,247,0.5), 0 4px 20px rgba(124,58,237,0.3)",
                marginBottom: 8,
                animation: "rewardScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}>+{gemReward || "3-5"}</div>
              <div style={{
                fontSize: 14, color: "#a855f7",
                fontFamily: "'Cinzel',serif", fontWeight: 700,
                marginBottom: 32
              }}>💎 Gems</div>

              <button onClick={handleCollect} style={{
                width: "100%", padding: "16px",
                borderRadius: 16, fontSize: 14, fontWeight: 900,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                letterSpacing: 3,
                fontFamily: "'Cinzel',serif",
                boxShadow: "0 8px 32px rgba(124,58,237,0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
                cursor: "pointer",
                border: "none",
                transition: "all 0.3s"
              }}>✦ EINSAMMELN ✦</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
