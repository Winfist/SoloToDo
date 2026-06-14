import React from "react";
import { GATE_ICONS, QUEST_ICONS, SHADOW_ICONS, STAT_ICONS, SYSTEM_ICONS } from "../../data/icons.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function SystemLoadingScreen({
  title = "System wird geladen",
  label = "Bitte warten",
  detail = "System wird vorbereitet",
  variant = "auth",
}) {
  const { t } = useI18n();
  const isDataLoad = variant === "data";
  const iconSet = isDataLoad
    ? [QUEST_ICONS.daily, STAT_ICONS.int, SHADOW_ICONS.vaelin]
    : [SYSTEM_ICONS.logo, GATE_ICONS.normal, STAT_ICONS.agi];

  return (
    <div className="system-loader" role="status" aria-live="polite" aria-label={`${title}. ${label}. ${detail}.`}>
      <style>{styles}</style>

      <div className="system-loader__mist" aria-hidden="true" />
      <div className="system-loader__scan" aria-hidden="true" />

      <main className="system-loader__content">
        <div className="system-loader__orb" aria-hidden="true">
          <img className="system-loader__gate" src={isDataLoad ? GATE_ICONS.normal : GATE_ICONS.red} alt="" />
          <span className="system-loader__loader-ring system-loader__loader-ring--main" />
          <span className="system-loader__loader-ring system-loader__loader-ring--dash" />
          <span className="system-loader__mana-ring system-loader__mana-ring--one" />
          <span className="system-loader__mana-ring system-loader__mana-ring--two" />
          <span className="system-loader__rift" />
          <span className="system-loader__core">
            <img src={SYSTEM_ICONS.logo} alt="" />
          </span>
          {iconSet.map((src, index) => (
            <span className={`system-loader__satellite system-loader__satellite--${index + 1}`} key={`${src}-${index}`}>
              <img src={src} alt="" />
            </span>
          ))}
        </div>

        <section className="system-loader__text">
          <div className="system-loader__brand">SOLO TODO // SYSTEM</div>
          <h1>{title || t("common.loading")}</h1>
          <p>{isDataLoad ? t("loading.dataDetail") : detail}</p>
        </section>

        <div className="system-loader__bar" aria-hidden="true">
          <span />
        </div>

        <div className="system-loader__status">
          <span className="system-loader__pulse" aria-hidden="true" />
          <span>{label}</span>
          <span className="system-loader__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </main>
    </div>
  );
}

const styles = `
@keyframes slLoaderEnter {
  from { opacity: 0; transform: scale(1.015); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slLoaderSpin {
  to { transform: rotate(360deg); }
}

@keyframes slLoaderReverse {
  to { transform: rotate(-360deg); }
}

@keyframes slLoaderBreathe {
  0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 18px var(--theme-glow, rgba(34, 211, 238, 0.28))); }
  50% { transform: translateY(-3px) scale(1.025); filter: drop-shadow(0 0 32px rgba(168, 85, 247, 0.42)); }
}

@keyframes slLoaderRift {
  0%, 100% { height: 34px; opacity: 0.45; transform: scaleY(0.72); }
  45% { height: 76px; opacity: 1; transform: scaleY(1); }
}

@keyframes slLoaderBar {
  0% { transform: translateX(-108%); }
  45% { transform: translateX(-16%); }
  100% { transform: translateX(108%); }
}

@keyframes slLoaderPulse {
  0%, 100% { opacity: 0.52; transform: scale(0.74); }
  50% { opacity: 1; transform: scale(1.14); }
}

@keyframes slLoaderDots {
  0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

@keyframes slLoaderScan {
  0% { transform: translateY(-120%); opacity: 0; }
  16%, 72% { opacity: 0.46; }
  100% { transform: translateY(120%); opacity: 0; }
}

@keyframes slSatelliteOne {
  to { transform: rotate(360deg) translateX(69px) rotate(-360deg); }
}

@keyframes slSatelliteTwo {
  to { transform: rotate(-360deg) translateX(58px) rotate(360deg); }
}

@keyframes slSatelliteThree {
  to { transform: rotate(360deg) translateX(48px) rotate(-360deg); }
}

@keyframes slTitleGlow {
  0%, 100% { text-shadow: 0 0 16px var(--theme-glow, rgba(34, 211, 238, 0.38)); }
  50% { text-shadow: 0 0 24px rgba(103, 232, 249, 0.62), 0 0 42px rgba(168, 85, 247, 0.32); }
}

.system-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #eafcff;
  background:
    radial-gradient(circle at 50% 43%, var(--theme-primary-12, rgba(34, 211, 238, 0.12)), transparent 28%),
    radial-gradient(circle at 50% 58%, rgba(168, 85, 247, 0.12), transparent 34%),
    var(--theme-bg, #020208);
  animation: slLoaderEnter 220ms ease-out both;
}

.system-loader__mist {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 47%, rgba(103, 232, 249, 0.1), transparent 18%),
    linear-gradient(180deg, rgba(2, 6, 23, 0), rgba(2, 2, 8, 0.86));
  pointer-events: none;
}

.system-loader__scan {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.016) 0 1px, transparent 1px 5px),
    linear-gradient(180deg, transparent, rgba(103,232,249,0.08), transparent);
  background-size: auto, 100% 28%;
  animation: slLoaderScan 1.7s ease-in-out infinite;
  pointer-events: none;
}

.system-loader__content {
  position: relative;
  z-index: 1;
  width: min(286px, calc(100vw - 44px));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.system-loader__orb {
  position: relative;
  width: 150px;
  height: 150px;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  animation: slLoaderBreathe 1.35s ease-in-out infinite;
}

.system-loader__gate {
  position: absolute;
  width: 106px;
  height: 106px;
  object-fit: contain;
  opacity: 0.18;
  filter: grayscale(0.46) brightness(0.72) drop-shadow(0 0 18px var(--theme-glow, rgba(34, 211, 238, 0.3)));
}

.system-loader__loader-ring,
.system-loader__mana-ring {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.system-loader__loader-ring--main {
  inset: 0;
  border: 4px solid rgba(255, 255, 255, 0.055);
  border-top-color: var(--theme-accent, #67e8f9);
  border-right-color: var(--theme-secondary, #a855f7);
  box-shadow:
    0 0 22px var(--theme-glow, rgba(34, 211, 238, 0.22)),
    inset 0 0 22px rgba(34, 211, 238, 0.08);
  animation: slLoaderSpin 0.88s linear infinite;
}

.system-loader__loader-ring--dash {
  inset: 12px;
  background: repeating-conic-gradient(from 0deg, rgba(103, 232, 249, 0.72) 0 9deg, transparent 9deg 22deg);
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black 0);
  opacity: 0.72;
  animation: slLoaderReverse 2.3s linear infinite;
}

.system-loader__mana-ring--one {
  inset: 28px;
  border: 1px solid var(--theme-primary-22, rgba(34, 211, 238, 0.22));
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.1), 0 0 20px rgba(168, 85, 247, 0.18);
}

.system-loader__mana-ring--two {
  inset: 48px;
  background: radial-gradient(circle, rgba(103, 232, 249, 0.16), rgba(168, 85, 247, 0.1), transparent 68%);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.system-loader__rift {
  position: absolute;
  width: 3px;
  height: 52px;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.94), var(--theme-accent, #67e8f9), transparent);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.86), 0 0 42px rgba(168, 85, 247, 0.45);
  animation: slLoaderRift 1s ease-in-out infinite;
}

.system-loader__core {
  position: relative;
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.82);
  border: 1px solid rgba(103, 232, 249, 0.22);
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.18), inset 0 0 18px rgba(168, 85, 247, 0.16);
  overflow: hidden;
}

.system-loader__core::before {
  content: "";
  position: absolute;
  inset: -40%;
  background: linear-gradient(120deg, transparent 34%, rgba(255,255,255,0.18), transparent 66%);
  animation: slLoaderSpin 2s linear infinite;
}

.system-loader__core img {
  position: relative;
  width: 45px;
  height: 45px;
  object-fit: contain;
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 12px var(--theme-glow, rgba(34, 211, 238, 0.56)));
}

.system-loader__satellite {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.84);
  border: 1px solid rgba(103, 232, 249, 0.18);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.18);
}

.system-loader__satellite img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.45));
}

.system-loader__satellite--1 {
  animation: slSatelliteOne 2.8s linear infinite;
}

.system-loader__satellite--2 {
  animation: slSatelliteTwo 3.3s linear infinite;
}

.system-loader__satellite--3 {
  animation: slSatelliteThree 2.4s linear infinite;
}

.system-loader__text {
  width: 100%;
}

.system-loader__brand {
  margin-bottom: 6px;
  color: var(--theme-accent, #67e8f9);
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0;
  opacity: 0.76;
}

.system-loader h1 {
  margin: 0;
  color: #f8fbff;
  font-family: var(--font-display, Cinzel, serif);
  font-size: 26px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
  animation: slTitleGlow 1.35s ease-in-out infinite;
}

.system-loader__text p {
  margin: 8px auto 0;
  max-width: 260px;
  color: rgba(203, 213, 225, 0.74);
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0;
}

.system-loader__bar {
  position: relative;
  width: 206px;
  height: 6px;
  margin: 17px auto 11px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.72), 0 0 18px rgba(34, 211, 238, 0.12);
}

.system-loader__bar span {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--theme-accent, #67e8f9), var(--theme-secondary, #a855f7), transparent);
  animation: slLoaderBar 1.05s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.system-loader__status {
  min-height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: rgba(236, 254, 255, 0.88);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
}

.system-loader__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-accent, #67e8f9);
  box-shadow: 0 0 14px var(--theme-glow, rgba(34, 211, 238, 0.85));
  animation: slLoaderPulse 0.8s ease-in-out infinite;
}

.system-loader__dots {
  display: inline-flex;
  gap: 3px;
  margin-left: -3px;
}

.system-loader__dots i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  animation: slLoaderDots 0.9s ease-in-out infinite;
}

.system-loader__dots i:nth-child(2) { animation-delay: 0.14s; }
.system-loader__dots i:nth-child(3) { animation-delay: 0.28s; }

@media (max-height: 520px) {
  .system-loader__orb {
    width: 124px;
    height: 124px;
    margin-bottom: 15px;
  }

  .system-loader__gate {
    width: 88px;
    height: 88px;
  }

  .system-loader__core {
    width: 54px;
    height: 54px;
    border-radius: 15px;
  }

  .system-loader__core img {
    width: 39px;
    height: 39px;
  }

  .system-loader__satellite {
    display: none;
  }

  .system-loader h1 {
    font-size: 23px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .system-loader,
  .system-loader *,
  .system-loader *::before,
  .system-loader *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
