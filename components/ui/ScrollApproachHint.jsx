const SPARKS = [
  { left: "32%", delay: "0.1s", size: 3 },
  { left: "68%", delay: "0.32s", size: 2 },
  { left: "44%", delay: "0.55s", size: 2 },
  { left: "58%", delay: "0.78s", size: 3 },
  { left: "24%", delay: "1.02s", size: 2 },
  { left: "76%", delay: "1.24s", size: 2 },
];

const CSS = `
@keyframes sahBreathe {
  0%, 100% { transform: translateY(0); filter: brightness(1); }
  50% { transform: translateY(5px); filter: brightness(1.32); }
}
@keyframes sahDrop {
  0% { opacity: 0; transform: translateY(-13px) rotate(45deg) scale(0.82); }
  28% { opacity: 1; }
  100% { opacity: 0; transform: translateY(18px) rotate(45deg) scale(1.08); }
}
@keyframes sahBeam {
  0%, 100% { opacity: 0.18; transform: scaleY(0.76); }
  45% { opacity: 0.76; transform: scaleY(1.12); }
}
@keyframes sahHalo {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.64); }
  35% { opacity: 0.58; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.45); }
}
@keyframes sahSpark {
  0% { opacity: 0; transform: translateY(-16px) scale(0.8); }
  24% { opacity: 0.95; }
  100% { opacity: 0; transform: translateY(42px) scale(0.24); }
}
@keyframes sahTextWake {
  0%, 100% { opacity: 0.62; }
  45% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .sah-root, .sah-chevron, .sah-beam, .sah-halo, .sah-spark, .sah-label {
    animation: none !important;
  }
}
`;

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export default function ScrollApproachHint({
  color = "#a78bfa",
  label = "SCROLL TO APPROACH",
  subLabel = "MOVE TOWARD THE PORTAL",
  isMobile = false,
  onActivate,
  progress = 0,
  hidden = false,
  disabled = false,
  style,
}) {
  const p = clamp01(progress);
  const fade = hidden ? 0 : clamp01(1 - p * 4.5);
  const canActivate = typeof onActivate === "function" && !disabled && fade > 0.05;

  return (
    <button
      type="button"
      className="sah-root"
      onClick={canActivate ? onActivate : undefined}
      disabled={!canActivate}
      aria-label={label}
      style={{
        "--sah-color": color,
        "--sah-soft": `${color}33`,
        "--sah-mid": `${color}77`,
        "--sah-strong": `${color}cc`,
        position: "relative",
        appearance: "none",
        border: 0,
        background: "transparent",
        padding: isMobile ? "4px 18px 8px" : "6px 20px 10px",
        minWidth: isMobile ? 168 : 206,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 6 : 8,
        color: "var(--sah-color)",
        cursor: canActivate ? "pointer" : "default",
        pointerEvents: canActivate ? "all" : "none",
        opacity: fade,
        transform: `translateY(${p * 12}px)`,
        transition: "opacity 0.55s ease, transform 0.55s ease, filter 0.35s ease",
        animation: "sahBreathe 2.4s ease-in-out infinite",
        filter: "drop-shadow(0 0 18px var(--sah-mid))",
        ...style,
      }}
    >
      <style>{CSS}</style>

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: isMobile ? 24 : 28,
          width: isMobile ? 58 : 70,
          height: isMobile ? 58 : 70,
          borderRadius: "50%",
          border: "1px solid var(--sah-soft)",
          boxShadow: "0 0 34px var(--sah-soft), inset 0 0 24px var(--sah-soft)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
      <span
        className="sah-halo"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: isMobile ? 24 : 28,
          width: isMobile ? 68 : 82,
          height: isMobile ? 68 : 82,
          borderRadius: "50%",
          border: "1px solid var(--sah-mid)",
          boxShadow: "0 0 40px var(--sah-soft)",
          animation: "sahHalo 2.15s ease-out infinite",
          pointerEvents: "none",
        }}
      />

      <span
        aria-hidden="true"
        style={{
          position: "relative",
          width: isMobile ? 56 : 68,
          height: isMobile ? 76 : 88,
          display: "block",
        }}
      >
        <span
          className="sah-beam"
          style={{
            position: "absolute",
            left: "50%",
            top: 5,
            width: 2,
            height: isMobile ? 64 : 74,
            transform: "translateX(-50%)",
            transformOrigin: "50% 10%",
            background: "linear-gradient(180deg, transparent, var(--sah-strong), transparent)",
            boxShadow: "0 0 16px var(--sah-color), 0 0 36px var(--sah-soft)",
            animation: "sahBeam 1.7s ease-in-out infinite",
          }}
        />

        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="sah-chevron"
            style={{
              position: "absolute",
              left: "50%",
              top: 10 + i * (isMobile ? 16 : 18),
              width: isMobile ? 18 : 22,
              height: isMobile ? 18 : 22,
              marginLeft: isMobile ? -9 : -11,
              borderRight: "2px solid var(--sah-color)",
              borderBottom: "2px solid var(--sah-color)",
              boxShadow: "4px 4px 14px var(--sah-mid)",
              animation: `sahDrop 1.35s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.18}s infinite`,
            }}
          />
        ))}

        {SPARKS.map((spark, i) => (
          <span
            key={i}
            className="sah-spark"
            style={{
              position: "absolute",
              left: spark.left,
              top: 12,
              width: spark.size,
              height: spark.size,
              borderRadius: "50%",
              background: "var(--sah-color)",
              boxShadow: "0 0 12px var(--sah-color)",
              animation: `sahSpark 1.55s ease-in ${spark.delay} infinite`,
            }}
          />
        ))}
      </span>

      <span
        className="sah-label"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 0,
          textAlign: "center",
          textTransform: "uppercase",
          textShadow: "0 0 15px var(--sah-mid), 0 2px 12px rgba(0,0,0,0.92)",
          animation: "sahTextWake 2.1s ease-in-out infinite",
        }}
      >
        <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 900, color: "#f8fafc" }}>
          {label}
        </span>
        {subLabel && (
          <span style={{ fontSize: isMobile ? 8 : 9, fontWeight: 700, color: "var(--sah-color)", opacity: 0.78 }}>
            {subLabel}
          </span>
        )}
      </span>
    </button>
  );
}
