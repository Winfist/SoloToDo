// ──────────────────────────────────────────────────────────────────────────
// data/constants.jsx – Re-export barrel
// All imports of './data/constants' continue to work unchanged.
// The actual code has been split into focused modules:
//   gameData.js       → RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, SHADOW_CLASSES, etc.
//   defaultState.js   → DEFAULT_STATE
//   helpers.js        → getRank, genId, getToday, calculateLevelUp, shadow helpers, dungeon helpers, etc.
//   protocolHelpers.js → generateRedemptionQuests, isDawnWindow/isDuskWindow, calculateProtocolXp, generateSeasonalQuests
//   storage.js        → loadState, saveState, migrateState
//   css.js            → CSS template literal
// The React UI components remain in this file to avoid splitting JSX dependencies.

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getToday as getLocalToday, formatLocalDateTime } from "./dateUtils.js";

// â”€â”€â”€ RE-EXPORTS FROM SPLIT MODULES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES,
  SHOP_ITEMS, GEM_SHOP_ITEMS, THEMES, QUEST_TYPES_CONFIG,
} from "./gameData.js";

export { DEFAULT_STATE } from "./defaultState.js";

export {
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  getRank, getXpForLevel, getRankIndex, genId, getToday,
  getDailyModifier, calcPowerLevel, getEquipBonuses,
  checkSkillUnlocks, getSkillBonuses, checkAchievements,
  generateDungeons, generateDailySystemQuests, generateStarterQuests, getJobBonuses,
  calculateLevelUp, recalculateLevelFromTotalXp, awardJobXp,
  checkJobUnlocked, checkAllJobsLevel5, formatCooldown,
  calculateJobQuestProgress, calcSuccessChance, getEquipDropForDungeon,
  hoursUntilMidnight,
  assignShadowClass, assignShadowTier, calcShadowXpToNext,
  createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks,
  generateFloorPlan, getFloorLogs,
  checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getDungeonGateImage,
} from "./helpers.js";

export {
  generateRedemptionQuests, isDawnWindow, isDuskWindow,
  calculateProtocolXp, generateSeasonalQuests,
} from "./protocolHelpers.js";

export {
  loadState,
  saveState,
  migrateState,
  cacheStateLocally,
  resolveStateConflict,
  getStateProgressScore,
  getStateTimestamp,
} from "./storage.js";

export { CSS } from "./css.js";

// â”€â”€â”€ REACT UI COMPONENTS (remain here, referenced by JSX consumers) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { STAT_ICONS, SHADOW_ICONS, GATE_ICONS, ITEM_ICONS, QUEST_ICONS, DIFF_ICONS, ROLE_ICONS, STYLE_ICONS, DUNGEON_ICONS, BACKGROUNDS, STORY_ICONS, HABIT_ICONS, NAV_ICONS, MICRO_ICONS, SHOP_ICONS, SKILL_ICONS, SYSTEM_ICONS, BOSS_ICONS, ABILITY_ICONS, JOB_ICONS } from "./icons.js";
import { JOBS } from "./jobs.js";
import { getRank as _getRank, getXpForLevel as _getXpForLevel, getRankIndex as _getRankIndex, genId as _genId, getToday as _getToday } from "./helpers.js";
import { RANKS as _RANKS, DIFFICULTIES as _DIFFICULTIES, CATEGORIES as _CATEGORIES, STRATEGIES as _STRATEGIES, SHADOW_CLASSES as _SHADOW_CLASSES, SHADOW_TIERS as _SHADOW_TIERS, NAMED_SHADOWS as _NAMED_SHADOWS, FORMATION_SLOTS as _FORMATION_SLOTS, ACHIEVEMENTS as _ACHIEVEMENTS, SKILLS as _SKILLS, DUNGEON_MODIFIERS as _DUNGEON_MODIFIERS, FLOOR_TYPES as _FLOOR_TYPES, BOSS_PHASES as _BOSS_PHASES, EQUIPMENT_POOL as _EQUIPMENT_POOL, RARITY_COLORS as _RARITY_COLORS, RARITY_LABELS as _RARITY_LABELS, DUNGEON_TEMPLATES as _DUNGEON_TEMPLATES, SHOP_ITEMS as _SHOP_ITEMS, GEM_SHOP_ITEMS as _GEM_SHOP_ITEMS, THEMES as _THEMES, QUEST_TYPES_CONFIG as _QUEST_TYPES_CONFIG } from "./gameData.js";
import { getJobBonuses as _getJobBonuses, calcShadowXpToNext as _calcShadowXpToNext, calcFormationBonus as _calcFormationBonus, assignShadowClass as _assignShadowClass, assignShadowTier as _assignShadowTier, createShadowFromQuest as _createShadowFromQuest, checkNamedShadowUnlocks as _checkNamedShadowUnlocks, generateFloorPlan as _generateFloorPlan, getFloorLogs as _getFloorLogs, getDungeonGateImage as _getDungeonGateImage, calcSuccessChance as _calcSuccessChance, getEquipBonuses as _getEquipBonuses, checkSkillUnlocks as _checkSkillUnlocks, getSkillBonuses as _getSkillBonuses, checkAchievements as _checkAchievements, generateDungeons as _generateDungeons, getEquipDropForDungeon as _getEquipDropForDungeon } from "./helpers.js";

// Use short aliases for readability inside this file
const getRank = _getRank, getXpForLevel = _getXpForLevel, getRankIndex = _getRankIndex, genId = _genId, getToday = _getToday;
const RANKS = _RANKS, DIFFICULTIES = _DIFFICULTIES, CATEGORIES = _CATEGORIES, STRATEGIES = _STRATEGIES;
const SHADOW_CLASSES = _SHADOW_CLASSES, SHADOW_TIERS = _SHADOW_TIERS, NAMED_SHADOWS = _NAMED_SHADOWS, FORMATION_SLOTS = _FORMATION_SLOTS;
const ACHIEVEMENTS = _ACHIEVEMENTS, SKILLS = _SKILLS, DUNGEON_MODIFIERS = _DUNGEON_MODIFIERS, FLOOR_TYPES = _FLOOR_TYPES, BOSS_PHASES = _BOSS_PHASES;
const EQUIPMENT_POOL = _EQUIPMENT_POOL, RARITY_COLORS = _RARITY_COLORS, RARITY_LABELS = _RARITY_LABELS, DUNGEON_TEMPLATES = _DUNGEON_TEMPLATES;
const THEMES = _THEMES, QUEST_TYPES_CONFIG = _QUEST_TYPES_CONFIG;
const calcShadowXpToNext = _calcShadowXpToNext, calcFormationBonus = _calcFormationBonus;
const assignShadowClass = _assignShadowClass, assignShadowTier = _assignShadowTier, createShadowFromQuest = _createShadowFromQuest;
const checkNamedShadowUnlocks = _checkNamedShadowUnlocks, generateFloorPlan = _generateFloorPlan, getFloorLogs = _getFloorLogs;
const getDungeonGateImage = _getDungeonGateImage, calcSuccessChance = _calcSuccessChance;
const getEquipBonuses = _getEquipBonuses, checkSkillUnlocks = _checkSkillUnlocks, getSkillBonuses = _getSkillBonuses, getJobBonuses = _getJobBonuses;
const checkAchievements = _checkAchievements, generateDungeons = _generateDungeons, getEquipDropForDungeon = _getEquipDropForDungeon;


function ParticleField({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let anim;
    const resize = () => { c.width = c.offsetWidth * 1.5; c.height = c.offsetHeight * 1.5; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 40 }, () => ({ x: Math.random() * 1000, y: Math.random() * 1000, r: Math.random() * 1.5 + 0.3, dx: (Math.random() - 0.5) * 0.2, dy: -Math.random() * 0.4 - 0.05, a: Math.random() * 0.6 + 0.15, phase: Math.random() * Math.PI * 2 }));
    let t = 0;
    function draw() {
      t += 0.01; ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        const f = 0.5 + 0.5 * Math.sin(t * 2 + p.phase);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.8 + 0.4 * f), 0, Math.PI * 2);
        ctx.fillStyle = theme.accent + Math.round(p.a * f * 255).toString(16).padStart(2, "0");
        ctx.shadowColor = theme.primary; ctx.shadowBlur = 6 * f; ctx.fill(); ctx.shadowBlur = 0;
        p.x += p.dx + Math.sin(t + p.phase) * 0.15; p.y += p.dy;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        if (p.x < -10 || p.x > c.width + 10) p.x = Math.random() * c.width;
      }
      anim = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(anim); window.removeEventListener("resize", resize); };
  }, [theme]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.7 }} />;
}


// ═══ MUSIC PLAYER ═════════════════════════════════════════════
function MusicPlayer({ play, volume = 0.3 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (play) {
        audioRef.current.play().catch(err => {
          console.warn("Autoplay blocked or audio error:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [play, volume]);

  return (
    <audio
      ref={audioRef}
      src="/Solo Grind.mp3"
      loop
      style={{ display: "none" }}
    />
  );
}

// ═══ SYSTEM NOTIFICATION ══════════════════════════════════════

function getSystemNotificationMeta(message, type) {
  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const text = String(message || "");
  const normalized = normalize(text);
  const stat = CATEGORIES.find(cat => {
    const label = normalize(cat.label);
    const key = normalize(cat.key);
    const statCode = normalize(cat.stat);
    return normalized.includes(label) || normalized.includes(key) || normalized.includes(statCode);
  });
  const typeMeta = {
    info: { color: "#38bdf8", label: "SYSTEM NOTICE", code: "SYS" },
    success: { color: "#22f5c7", label: "OPERATION COMPLETE", code: "OK" },
    warning: { color: "#f59e0b", label: "SYSTEM WARNING", code: "WARN" },
    error: { color: "#fb7185", label: "ERROR", code: "ERR" },
    gold: { color: "#fbbf24", label: "REWARD ACQUIRED", code: "GOLD" },
    xp: { color: "#a78bfa", label: "XP TRANSFER", code: "XP" },
    levelup: { color: "#f0abfc", label: "LEVEL UP", code: "LV" },
    dungeon: { color: "#22d3ee", label: "GATE UPDATE", code: "GATE" },
    defeat: { color: "#ef4444", label: "DEFEAT RECORDED", code: "FAIL" },
    achievement: { color: "#f59e0b", label: "ACHIEVEMENT", code: "ACH" },
    skill: { color: "#22d3ee", label: "SKILL READY", code: "SKILL" },
    penalty: { color: "#ef4444", label: "PENALTY ZONE", code: "PEN" },
    shadow: { color: "#a78bfa", label: "SHADOW ARMY", code: "SHA" },
    named: { color: "#fbbf24", label: "MONARCH NOTICE", code: "MN" },
  };
  const meta = { ...(typeMeta[type] || typeMeta.info) };
  if (stat && normalized.includes("erhoht")) {
    meta.color = stat.color;
    meta.label = "STAT ALLOCATION";
    meta.code = stat.stat;
    meta.iconSrc = stat.iconSrc;
  }
  return meta;
}

function SystemNotification({ message, type = "info", onDone, slot = 0 }) {
  const [exiting, setExiting] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => { const t1 = setTimeout(() => setExiting(true), 3200); const t2 = setTimeout(() => onDoneRef.current?.(), 3620); return () => { clearTimeout(t1); clearTimeout(t2); }; }, []);
  const meta = useMemo(() => getSystemNotificationMeta(message, type), [message, type]);
  const c = meta.color;
  const dim = slot > 0 ? Math.max(0.72, 1 - slot * 0.09) : 1;
  return (
    <div style={{
      position: "fixed",
      top: `calc(max(14px, env(safe-area-inset-top)) + ${slot * 74}px)`,
      left: "50%",
      transform: "translate3d(-50%,0,0)",
      zIndex: 240 - slot,
      animation: exiting ? "sysNotifOut 360ms cubic-bezier(0.4,0,0.2,1) forwards" : "sysNotifIn 420ms cubic-bezier(0.16,1,0.3,1) both",
      transition: "top 180ms cubic-bezier(0.4,0,0.2,1)",
      pointerEvents: "none",
      width: "min(466px, calc(100vw - 28px))",
      opacity: dim,
      willChange: "transform, opacity",
      contain: "layout paint",
    }}>
      <div style={{
        position: "relative",
        overflow: "hidden",
        minHeight: 58,
        background: `linear-gradient(135deg, rgba(3,7,18,0.96), rgba(9,12,29,0.94) 52%, ${c}12)`,
        border: `1px solid ${c}66`,
        borderRadius: 8,
        clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        boxShadow: `0 18px 48px rgba(0,0,0,0.56), 0 0 28px ${c}26, inset 0 1px 0 rgba(255,255,255,0.10)`,
        backdropFilter: "blur(10px) saturate(1.15)",
        WebkitBackdropFilter: "blur(10px) saturate(1.15)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 38%)", opacity: 0.55, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(180deg, transparent 0 7px, ${c}10 8px, transparent 9px)`, opacity: 0.45, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: `linear-gradient(180deg, transparent, ${c}, transparent)`, boxShadow: `0 0 18px ${c}`, animation: "sysNotifRail 1.8s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: `linear-gradient(90deg, ${c}, ${c}66, transparent)`, transformOrigin: "left", animation: "sysNotifTimer 3.2s linear forwards", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: "-45%", width: "42%", height: "100%", background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.13), transparent)", animation: "sysNotifSweep 2.6s ease-out 0.12s 1", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "42px 1fr", gap: 12, alignItems: "center", padding: "11px 15px 12px 13px" }}>
          <div style={{
            width: 38,
            height: 38,
            display: "grid",
            placeItems: "center",
            clipPath: "polygon(18% 0, 100% 0, 100% 82%, 82% 100%, 0 100%, 0 18%)",
            background: `radial-gradient(circle at 50% 40%, ${c}40, ${c}12 48%, rgba(2,6,23,0.78))`,
            border: `1px solid ${c}70`,
            boxShadow: `inset 0 0 18px ${c}18, 0 0 18px ${c}28`,
            position: "relative",
          }}>
            {meta.iconSrc ? (
              <img src={meta.iconSrc} alt="" style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 8px ${c}) brightness(1.15)` }} />
            ) : (
              <span style={{ color: c, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>{meta.code}</span>
            )}
            <span style={{ position: "absolute", inset: -5, border: `1px solid ${c}22`, clipPath: "inherit", animation: "sysNotifPing 1.8s ease-out infinite", pointerEvents: "none" }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ color: c, fontSize: 9, fontWeight: 900, letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", textShadow: `0 0 12px ${c}66`, whiteSpace: "nowrap" }}>SYSTEM</span>
              <span style={{ height: 1, flex: 1, minWidth: 24, background: `linear-gradient(90deg, ${c}66, transparent)` }} />
              <span style={{ color: "#64748b", fontSize: 8, fontWeight: 800, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{meta.label}</span>
            </div>
            <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 700, lineHeight: 1.35, textShadow: "0 1px 10px rgba(0,0,0,0.65)", overflowWrap: "anywhere" }}>{message}</div>
          </div>
        </div>

        <div style={{ position: "absolute", top: 7, left: 7, width: 12, height: 12, borderTop: `1px solid ${c}88`, borderLeft: `1px solid ${c}88`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 7, bottom: 7, width: 12, height: 12, borderRight: `1px solid ${c}88`, borderBottom: `1px solid ${c}88`, pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ═══ ACHIEVEMENT TOAST ════════════════════════════════════════
function AchievementToast({ achievement, onDone }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t1 = setTimeout(() => setExiting(true), 3500); const t2 = setTimeout(onDone, 4000); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 110, right: 16, zIndex: 210, maxWidth: 280, animation: exiting ? "achIn 4s ease forwards reverse" : "achIn 4s ease forwards" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(12,10,22,0.97),rgba(24,20,10,0.97))", border: "1px solid #f59e0b44", borderLeft: "3px solid #f59e0b", borderRadius: 12, padding: "12px 14px", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.6),0 0 20px rgba(245,158,11,0.15)" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>ACHIEVEMENT UNLOCKED</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 26 }}>{achievement.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fde68a", fontFamily: "'Cinzel',serif" }}>{achievement.name}</div>
            <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>{achievement.desc}</div>
            {achievement.reward.xp > 0 && <div style={{ fontSize: 10, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>+{achievement.reward.xp} XP · +{achievement.reward.gold} G</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ XP FLOAT ═════════════════════════════════════════════════
function XpFloat({ x, y, xp, gold }) {
  return (
    <div style={{ position: "fixed", left: x, top: y, zIndex: 300, pointerEvents: "none", animation: "floatUp 1.2s ease-out forwards" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa", fontFamily: "'Cinzel',serif", textShadow: "0 0 12px rgba(167,139,250,0.6)", whiteSpace: "nowrap" }}>+{xp} XP</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace" }}>+{gold} G</div>
    </div>
  );
}

// ═══ LEVEL UP ═════════════════════════════════════════════════
function LevelUpCinematic({ levelData, rank, oldRank, onClose }) {
  const level = levelData?.level || levelData;
  const earnedPoints = levelData?.earnedPoints || 0;
  const isRankUp = oldRank && oldRank.name !== rank.name;
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: "levelUpBg 4s ease forwards", background: "rgba(0,0,0,0.93)" }}>
      <div style={{ position: "absolute", width: 500, height: 500, background: `conic-gradient(from 0deg,transparent,${rank.color}08,transparent,${rank.color}05,transparent)`, animation: "levelUpRays 8s linear infinite", borderRadius: "50%" }} />
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: `2px solid ${rank.color}44`, animation: "ringExpand 1.5s ease-out forwards" }} />
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: rank.color, fontFamily: "'JetBrains Mono',monospace", animation: "levelUpText 1.2s ease-out forwards", marginBottom: 12, opacity: 0 }}>{isRankUp ? "RANK UP" : "LEVEL UP"}</div>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 60px ${rank.color},0 0 120px ${rank.color}66`, animation: "levelUpText 1s ease-out 0.15s forwards", opacity: 0, lineHeight: 1 }}>{level}</div>
        <div style={{ fontSize: 18, color: rank.color, fontFamily: "'Cinzel',serif", letterSpacing: 4, animation: "levelUpRank 1.8s ease-out forwards", opacity: 0, marginTop: 12, textShadow: `0 0 20px ${rank.glow}` }}>{rank.label}</div>
        {earnedPoints > 0 && <div style={{ fontSize: 15, color: "#fff", fontFamily: "'JetBrains Mono',monospace", marginTop: 18, animation: "levelUpRank 2s ease-out forwards", opacity: 0 }}>+ {earnedPoints} Stat-Punkte</div>}
        {isRankUp && <div style={{ marginTop: 20, padding: "8px 24px", borderRadius: 20, background: `linear-gradient(135deg,${rank.color}22,${rank.color}11)`, border: `1px solid ${rank.color}44`, fontSize: 12, color: rank.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, animation: "levelUpRank 2s ease-out forwards", opacity: 0 }}>✨ NEW RANK ACHIEVED ✨</div>}
      </div>
    </div>
  );
}

// ═══ ARISE CINEMATIC (ENHANCED) ═══════════════════════════════
function AriseCinematic({ shadow, onClose }) {
  const [phase, setPhase] = useState(0);
  const isNamed = shadow?.isNamed;
  const cls = shadow ? SHADOW_CLASSES[shadow.class] : SHADOW_CLASSES.soldier;
  const tierData = shadow ? SHADOW_TIERS[shadow.tier] : SHADOW_TIERS[1];
  const glowColor = isNamed ? shadow.glowColor : cls.color;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2400),
      setTimeout(() => setPhase(5), 3200),
      setTimeout(onClose, isNamed ? 6000 : 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onClose, isNamed]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 998, background: isNamed ? "rgba(1,0,4,0.98)" : "rgba(2,0,8,0.97)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: "fadeIn 0.4s" }}>
      {/* Named shadow: rotating monarch rays */}
      {isNamed && phase >= 1 && (
        <div style={{ position: "absolute", width: 600, height: 600, background: `conic-gradient(from 0deg,transparent,${glowColor}06,transparent,${glowColor}04,transparent)`, animation: "monarchRays 12s linear infinite", borderRadius: "50%" }} />
      )}
      {/* Ground crack */}
      {phase >= 1 && <div style={{ position: "absolute", bottom: "28%", left: "15%", right: "15%", height: isNamed ? 3 : 2, background: `linear-gradient(90deg,transparent,${glowColor},transparent)`, animation: "ariseGround 1s ease-out forwards", transformOrigin: "center" }} />}
      {/* Secondary cracks for named */}
      {isNamed && phase >= 1 && <div style={{ position: "absolute", bottom: "27%", left: "30%", right: "30%", height: 1, background: `linear-gradient(90deg,transparent,${glowColor}88,transparent)`, animation: "ariseGround 1.2s ease-out 0.1s forwards", transformOrigin: "center" }} />}
      {/* Energy pillar */}
      {phase >= 2 && (
        <div style={{ position: "absolute", bottom: "28%", left: "50%", transform: "translateX(-50%)", width: isNamed ? 120 : 80, display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
          <div style={{ width: isNamed ? 4 : 3, background: `linear-gradient(0deg,transparent,${glowColor},${glowColor}aa)`, animation: "ariseEnergy 1.2s ease-out forwards", height: 0, transformOrigin: "bottom" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center bottom,${glowColor}${isNamed ? "55" : "33"},transparent)`, animation: "ariseEnergy 1.2s ease-out forwards" }} />
        </div>
      )}
      {/* ARISE text */}
      {phase >= 2 && (
        <div style={{ position: "absolute", top: "18%", textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: isNamed ? 60 : 52, fontWeight: 900, color: glowColor, fontFamily: "'Cinzel',serif", animation: `ariseText 1s ease-out forwards,ariseGlow 2s ease-in-out 1s infinite`, opacity: 0, letterSpacing: 2, ["--glow-color"]: glowColor }}>ARISE</div>
          {isNamed && phase >= 3 && <div style={{ fontSize: 11, letterSpacing: 6, color: glowColor + "aa", fontFamily: "'JetBrains Mono',monospace", marginTop: 8, animation: "fadeIn 0.6s both" }}>NAMED SHADOW AWAKENED</div>}
        </div>
      )}
      {/* Shadow figure */}
      {phase >= 3 && (
        <div style={{ textAlign: "center", animation: "ariseShadow 1s cubic-bezier(0.34,1.56,0.64,1) forwards", opacity: 0 }}>
          {isNamed ? (
            <div style={{ fontSize: 100, animation: "namedGlow 2s ease-in-out infinite", ["--named-color"]: glowColor }}>
              {shadow.iconSrc ? (
                <img src={shadow.iconSrc} alt={shadow.name} style={{ width: 140, height: 140, objectFit: "contain", filter: `drop-shadow(0 0 40px ${glowColor}99) drop-shadow(0 0 20px ${glowColor}66) brightness(1.15)` }} />
              ) : shadow.icon}
            </div>
          ) : (
            <div style={{ filter: `brightness(0.15) saturate(200%) sepia(100%) hue-rotate(${shadow?.class === "knight" ? 200 : shadow?.class === "mage" ? 280 : shadow?.class === "assassin" ? 120 : shadow?.class === "healer" ? 160 : 220}deg) brightness(0.8)` }}>
              {cls.iconSrc
                ? <img src={cls.iconSrc} alt={cls.name} style={{ width: 120, height: 120, objectFit: "contain", filter: `drop-shadow(0 0 40px ${glowColor})` }} />
                : <span style={{ fontSize: 100 }}>{cls.icon}</span>}
            </div>
          )}
          {phase >= 4 && (
            <div style={{ animation: "fadeIn 0.6s both" }}>
              <div style={{ fontSize: isNamed ? 18 : 16, fontWeight: 700, color: glowColor, fontFamily: "'Cinzel',serif", letterSpacing: 3, marginTop: 12, textShadow: `0 0 20px ${glowColor}` }}>{shadow?.name || "Shadow Soldier"}</div>
              {isNamed && shadow.title && <div style={{ fontSize: 11, color: glowColor + "aa", fontFamily: "'Cinzel',serif", letterSpacing: 2, marginTop: 4 }}>{shadow.title}</div>}
              <div style={{ fontSize: 10, color: cls.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {cls.iconSrc ? <img src={cls.iconSrc} alt={cls.name} style={{ width: 16, height: 16, objectFit: "contain", filter: `drop-shadow(0 0 5px ${cls.color}88)` }} /> : <span>{cls.icon}</span>}
                <span>{cls.name.toUpperCase()}</span>
                <span style={{ color: tierData.color }}>· {tierData.name.toUpperCase()}</span>
              </div>
              {isNamed && phase >= 5 && shadow.uniqueAbility && (
                <div style={{ marginTop: 16, padding: "8px 20px", borderRadius: 12, background: `${glowColor}15`, border: `1px solid ${glowColor}44`, display: "inline-block", animation: "scaleIn 0.4s ease" }}>
                  <div style={{ fontSize: 9, color: glowColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>UNIQUE ABILITY</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "'Cinzel',serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {shadow.uniqueAbility.iconSrc
                      ? <img src={shadow.uniqueAbility.iconSrc} alt={shadow.uniqueAbility.name} style={{ width: 18, height: 18, objectFit: "contain" }} />
                      : <span>{shadow.uniqueAbility.icon}</span>}
                    {shadow.uniqueAbility.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{shadow.uniqueAbility.effect}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 40, fontSize: 10, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>TAP TO SKIP</div>
      {/* Version Marker */}
      <div style={{
        marginTop: "auto", padding: "10px 0", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.03)",
        fontSize: "10px", color: "rgba(255,255,255,0.15)",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3
      }}>
        ARISE SYSTEM v1.3.6 (FORCED UPDATE)
      </div>
    </div>
  );
}

// ═══ SHADOW CARD ══════════════════════════════════════════════
function ShadowCard({ shadow, theme, onClick, showSlot, index }) {
  const cls = SHADOW_CLASSES[shadow.class] || SHADOW_CLASSES.soldier;
  const tierData = SHADOW_TIERS[shadow.tier] || SHADOW_TIERS[1];
  const xpPct = Math.min((shadow.xp / shadow.xpToNext) * 100, 100);
  const slotData = shadow.deploymentSlot ? FORMATION_SLOTS[shadow.deploymentSlot] : null;
  const glowColor = shadow.isNamed ? shadow.glowColor : cls.color;
  const isDeployed = shadow.isDeployed;

  return (
    <div onClick={onClick} style={{
      background: `linear-gradient(170deg,rgba(4,3,12,0.98) 0%,${glowColor}07 100%)`,
      border: `1px solid ${glowColor}${isDeployed ? "55" : "28"}`,
      borderRadius: 16, cursor: "pointer",
      boxShadow: isDeployed
        ? `0 0 22px ${glowColor}22, inset 0 0 28px ${glowColor}04`
        : shadow.isNamed ? `0 0 14px ${glowColor}18` : "none",
      position: "relative", overflow: "visible",
      animation: `shadowRise 0.4s ease ${index * 0.06}s both`,
      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      ["--shadow-glow"]: glowColor,
      ["--named-color"]: shadow.glowColor || glowColor,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px) scale(1.01)";
        e.currentTarget.style.borderColor = glowColor + "77";
        e.currentTarget.style.boxShadow = `0 8px 28px ${glowColor}33, inset 0 0 20px ${glowColor}07`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = glowColor + (isDeployed ? "55" : "28");
        e.currentTarget.style.boxShadow = isDeployed ? `0 0 22px ${glowColor}22` : shadow.isNamed ? `0 0 14px ${glowColor}18` : "none";
      }}>

      {/* Tier sweep shine */}
      {shadow.tier >= 3 && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: "45%", height: "100%", background: `linear-gradient(90deg,transparent,${tierData.color}0d,transparent)`, animation: "tierShine 4s ease-in-out infinite" }} />
        </div>
      )}

      {/* Portrait area */}
      <div style={{ position: "relative", padding: "14px 8px 6px", textAlign: "center" }}>
        {/* Ambient glow pool beneath the character */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 40,
          background: `radial-gradient(ellipse at center, ${glowColor}28 0%, transparent 70%)`,
          pointerEvents: "none", borderRadius: "50%",
        }} />
        {/* Deployed aura ring */}
        {isDeployed && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 90, height: 90, borderRadius: "50%", border: `1px solid ${glowColor}44`, animation: "ringExpand 2.2s ease-out infinite", pointerEvents: "none" }} />
        )}

        {/* Character portrait — free-floating transparent PNG */}
        {(() => {
          const namedDef = shadow.isNamed ? NAMED_SHADOWS[shadow.id] || NAMED_SHADOWS[shadow.namedId] : null;
          const src = shadow.isNamed && namedDef?.iconSrc ? namedDef.iconSrc : cls.iconSrc;
          const imgSize = shadow.isNamed ? 100 : 88;
          return src ? (
            <div style={{ position: "relative", display: "inline-block", zIndex: 1 }}>
              <img src={src} alt={shadow.name} style={{
                width: imgSize, height: imgSize,
                objectFit: "contain",
                filter: [
                  `drop-shadow(0 6px 18px ${glowColor}70)`,
                  "brightness(1.08)",
                  shadow.isNamed ? `drop-shadow(0 0 12px ${glowColor}66)` : "",
                ].filter(Boolean).join(" "),
                animation: shadow.isNamed ? "namedGlow 3s ease-in-out infinite" : "none",
                display: "block",
              }} />
              {/* Named glow ring around image */}
              {shadow.isNamed && (
                <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `radial-gradient(circle,${glowColor}18,transparent 65%)`, pointerEvents: "none" }} />
              )}
            </div>
          ) : (
            <div style={{
              width: 72, height: 72, margin: "0 auto",
              borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
              background: `radial-gradient(circle at 38% 28%,${glowColor}22,${glowColor}06)`,
              border: `1.5px solid ${glowColor}33`,
              fontSize: shadow.isNamed ? 30 : 26,
              position: "relative", zIndex: 1,
            }}>{shadow.isNamed ? shadow.icon : cls.icon}</div>
          );
        })()}

        {/* Tier badge top-left */}
        <div style={{ position: "absolute", top: 10, left: 10, padding: "2px 5px", borderRadius: 5, background: tierData.color + "20", border: `1px solid ${tierData.color}44`, fontSize: 7, color: tierData.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>T{shadow.tier}</div>
        {/* Named star top-right */}
        {shadow.isNamed && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: shadow.glowColor, animation: "namedGlow 2.5s ease-in-out infinite", filter: `drop-shadow(0 0 5px ${shadow.glowColor})` }}>✨</div>}
        {/* Deployed indicator dot top-right */}
        {isDeployed && !shadow.isNamed && <div style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55eaa", animation: "pulse 1.8s infinite" }} />}
      </div>

      {/* Info area */}
      <div style={{ padding: "0 11px 12px", textAlign: "center" }}>
        {/* Name */}
        <div style={{ fontSize: 11, fontWeight: 800, color: shadow.isNamed ? shadow.glowColor : "#dde4f0", fontFamily: "'Cinzel',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2, lineHeight: 1.2, textShadow: shadow.isNamed ? `0 0 12px ${shadow.glowColor}55` : "none" }}>{shadow.name}</div>
        {shadow.isNamed && shadow.title && <div style={{ fontSize: 8, color: shadow.glowColor + "88", fontFamily: "'Outfit',sans-serif", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shadow.title}</div>}
        {/* Class pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 9 }}>
          <span style={{ fontSize: 8, color: cls.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 6px", borderRadius: 4, background: cls.color + "14", border: `1px solid ${cls.color}28`, letterSpacing: 0.5, display: "inline-flex", alignItems: "center", gap: 3 }}>
            {cls.iconSrc ? <img src={cls.iconSrc} alt={cls.name} style={{ width: 10, height: 10, objectFit: "contain" }} /> : cls.icon} {shadow.class.toUpperCase()}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3, marginBottom: 9 }}>
          {[{ k: "power", icon: "⚡", iconSrc: SKILL_ICONS.attack, c: "#ef4444" }, { k: "speed", icon: "⬡", iconSrc: SKILL_ICONS.speed, c: "#f59e0b" }, { k: "loyalty", icon: "🛡️", iconSrc: SKILL_ICONS.defense, c: "#3b82f6" }, { k: "presence", icon: "✓ª", iconSrc: SKILL_ICONS.magic, c: "#a855f7" }].map(({ k, icon, iconSrc, c }) => (
            <div key={k} style={{ textAlign: "center", background: c + "09", borderRadius: 5, padding: "4px 2px", border: `1px solid ${c}18` }}>
              <div style={{ fontSize: 8, color: c, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={iconSrc} alt={k} style={{ width: 10, height: 10, objectFit: "contain", filter: `drop-shadow(0 0 3px ${c}99)` }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#b8c5d6", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.4 }}>{shadow.stats[k]}</div>
            </div>
          ))}
        </div>

        {/* Level + XP bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ fontSize: 8, color: "#2d3a4a", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>EXP</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: glowColor, fontFamily: "'Cinzel',serif", lineHeight: 1, textShadow: `0 0 10px ${glowColor}55` }}>Lv.{shadow.level}</div>
        </div>
        <div style={{ height: 2, background: "rgba(6,4,16,0.9)", borderRadius: 1, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ width: `${xpPct}%`, height: "100%", borderRadius: 1, background: `linear-gradient(90deg,${glowColor}66,${glowColor})`, transition: "width 0.6s ease", boxShadow: `0 0 4px ${glowColor}88` }} />
        </div>

        {/* Deployment status */}
        {isDeployed && slotData ? (
          <div style={{ fontSize: 8, color: slotData.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "3px 8px", borderRadius: 5, background: slotData.color + "12", border: `1px solid ${slotData.color}28` }}>
            {slotData.iconSrc ? <img src={slotData.iconSrc} alt={slotData.name} style={{ width: 10, height: 10, objectFit: "contain" }} /> : <span>{slotData.icon}</span>}<span>{slotData.name.toUpperCase()}</span>
          </div>
        ) : (
          <div style={{ fontSize: 8, color: "#1e2840", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>📦 IN RESERVE</div>
        )}
      </div>
    </div>
  );
}

// ═══ SHADOW DETAIL MODAL ══════════════════════════════════════
function ShadowDetailModal({ shadow, theme, onClose, onDeploy, onUndeploy, onEvolve, gold }) {
  const cls = SHADOW_CLASSES[shadow.class] || SHADOW_CLASSES.soldier;
  const tierData = SHADOW_TIERS[shadow.tier] || SHADOW_TIERS[1];
  const nextTierData = SHADOW_TIERS[shadow.tier + 1];
  const xpPct = Math.min((shadow.xp / shadow.xpToNext) * 100, 100);
  const canEvolve = nextTierData && gold >= nextTierData.evolutionCost && shadow.level >= tierData.maxLevel;
  const slotData = shadow.deploymentSlot ? FORMATION_SLOTS[shadow.deploymentSlot] : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(2,2,8,0.95)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "linear-gradient(180deg,rgba(10,10,22,0.99),rgba(6,6,16,0.99))", border: `1px solid ${shadow.isNamed ? shadow.glowColor + "44" : cls.color + "33"}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", animation: "slideUp 0.3s ease", maxHeight: "85vh", overflowY: "auto" }}>
        {/* Close handle */}
        <div style={{ width: 36, height: 3, background: "#1e2940", borderRadius: 2, margin: "0 auto 20px" }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: `${cls.color}15`, border: `2px solid ${shadow.isNamed ? shadow.glowColor + "66" : cls.color + "44"}`, fontSize: shadow.isNamed ? 36 : 28, boxShadow: shadow.isNamed ? `0 0 20px ${shadow.glowColor}44` : "none" }}>
            {(() => {
              const namedDef = shadow.isNamed ? NAMED_SHADOWS[shadow.id] || NAMED_SHADOWS[shadow.namedId] : null;
              const src = shadow.isNamed && namedDef ? namedDef.iconSrc : cls.iconSrc;
              return src ? <img src={src} alt={shadow.name} style={{ width: 56, height: 56, objectFit: "contain", mixBlendMode: "screen", filter: `drop-shadow(0 0 12px ${shadow.isNamed ? shadow.glowColor + '55' : cls.color + '55'})` }} /> : (shadow.isNamed ? shadow.icon : cls.icon);
            })()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: shadow.isNamed ? shadow.glowColor : "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{shadow.name}</div>
            {shadow.isNamed && shadow.title && <div style={{ fontSize: 11, color: shadow.glowColor + "88", fontFamily: "'Cinzel',serif", letterSpacing: 1, marginTop: 2 }}>{shadow.title}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: cls.color, fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 5, background: cls.color + "18", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {cls.iconSrc ? <img src={cls.iconSrc} alt={cls.name} style={{ width: 12, height: 12, objectFit: "contain" }} /> : cls.icon} {cls.name}
              </span>
              <span style={{ fontSize: 10, color: tierData.color, fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 5, background: tierData.color + "18", border: `1px solid ${tierData.color}33` }}>Tier {shadow.tier} · {tierData.name}</span>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>LEVEL</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{shadow.level}</div>
          </div>
        </div>
        {/* XP */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>
            <span>EXP</span><span>{shadow.xp} / {shadow.xpToNext}</span>
          </div>
          <div style={{ height: 6, background: "#0a0a14", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${xpPct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${cls.color}88,${cls.color})`, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>Max Level f├╝r diesen Tier: {tierData.maxLevel}</div>
        </div>
        {/* Stats */}
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>KAMPFSTATS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {[{ k: "power", name: "Power", iconSrc: SKILL_ICONS.attack, color: "#ef4444", desc: "Dungeon-Erfolg" }, { k: "speed", name: "Speed", iconSrc: SKILL_ICONS.speed, color: "#f59e0b", desc: "Clear-Zeit Reduktion" }, { k: "loyalty", name: "Loyalty", iconSrc: SKILL_ICONS.defense, color: "#3b82f6", desc: "Bonus-Aktivierungschance" }, { k: "presence", name: "Presence", iconSrc: SKILL_ICONS.magic, color: "#a855f7", desc: "Passive Effekt-St├ñrke" }].map(({ k, name, iconSrc, color, desc }) => (
            <div key={k} style={{ background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <img src={iconSrc} alt={name} style={{ width: 13, height: 13, objectFit: "contain", filter: `drop-shadow(0 0 4px ${color}99)` }} /> {name}
                </span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{shadow.stats[k]}</span>
              </div>
              <div style={{ height: 3, background: "#0a0a14", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.min((shadow.stats[k] / 100) * 100, 100)}%`, height: "100%", borderRadius: 2, background: color + "66" }} />
              </div>
              <div style={{ fontSize: 8, color: "#334155", marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>{desc}</div>
            </div>
          ))}
        </div>
        {/* Passive Effect */}
        <div style={{ background: `${cls.color}0a`, border: `1px solid ${cls.color}22`, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>PASSIVE EFFEKT</div>
          <div style={{ fontSize: 12, color: cls.color, fontWeight: 600 }}>{cls.passiveEffect}</div>
        </div>
        {/* Named: unique ability & lore */}
        {shadow.isNamed && (
          <>
            <div style={{ background: `${shadow.glowColor}0a`, border: `1px solid ${shadow.glowColor}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>UNIQUE ABILITY</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{shadow.uniqueAbility?.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: shadow.glowColor, fontFamily: "'Cinzel',serif" }}>{shadow.uniqueAbility?.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{shadow.uniqueAbility?.effect}</div>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "12px 14px", marginBottom: 18, fontStyle: "italic", fontSize: 12, color: "#64748b", lineHeight: 1.6, borderLeft: `2px solid ${shadow.glowColor}44` }}>"{shadow.lore}"</div>
          </>
        )}
        {/* Deployment */}
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>FORMATION</div>
        {shadow.isDeployed ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: `${slotData?.color}15`, border: `1px solid ${slotData?.color}44`, display: "flex", alignItems: "center", gap: 8 }}>
              {slotData?.iconSrc ? <img src={slotData.iconSrc} alt={slotData.name} style={{ width: 22, height: 22, objectFit: "contain", filter: `drop-shadow(0 0 4px ${slotData.color}88)` }} /> : <span style={{ fontSize: 18 }}>{slotData?.icon}</span>}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: slotData?.color, fontFamily: "'JetBrains Mono',monospace" }}>{slotData?.name.toUpperCase()}</div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{slotData?.bonus}</div>
              </div>
            </div>
            <button onClick={() => onUndeploy(shadow.id)} style={{ padding: "10px 16px", borderRadius: 10, background: "transparent", color: "#475569", border: "1px solid #1e2940", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 1 }}>RECALL</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 18 }}>
            {Object.entries(FORMATION_SLOTS).map(([slotKey, slot]) => (
              <button key={slotKey} onClick={() => onDeploy(shadow.id, slotKey)} style={{ padding: "10px 6px", borderRadius: 10, background: `${slot.color}10`, border: `1px solid ${slot.color}33`, color: slot.color, textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = slot.color + "20"; }} onMouseLeave={e => { e.currentTarget.style.background = slot.color + "10"; }}>
                <div style={{ fontSize: 18, display: "flex", justifyContent: "center" }}>
                  {slot.iconSrc ? (
                    <img src={slot.iconSrc} alt={slot.name} style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 6px ${slot.color}88) brightness(1.1)` }} />
                  ) : slot.icon}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{slot.name.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{slot.bonus}</div>
              </button>
            ))}
          </div>
        )}
        {/* Evolution */}
        {nextTierData && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${nextTierData.color}22`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 2 }}>EVOLUTION</div>
                <div style={{ fontSize: 12, color: nextTierData.color, fontWeight: 700 }}>Tier {shadow.tier} → Tier {shadow.tier + 1} ({nextTierData.name})</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>KOSTEN</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>{nextTierData.evolutionCost}G</div>
              </div>
            </div>
            {!canEvolve && shadow.level < tierData.maxLevel && <div style={{ fontSize: 9, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>⚠ Erfordert Level {tierData.maxLevel} (aktuell {shadow.level})</div>}
            {!canEvolve && gold < nextTierData.evolutionCost && <div style={{ fontSize: 9, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>⚠ Zu wenig Gold ({gold}G / {nextTierData.evolutionCost}G)</div>}
            <button onClick={() => canEvolve && onEvolve(shadow.id)} disabled={!canEvolve} style={{ width: "100%", padding: 12, borderRadius: 10, fontSize: 12, fontWeight: 700, background: canEvolve ? `linear-gradient(135deg,${nextTierData.color}25,${nextTierData.color}10)` : "rgba(255,255,255,0.03)", color: canEvolve ? nextTierData.color : "#334155", border: `1px solid ${canEvolve ? nextTierData.color + "44" : "#1e2940"}`, fontFamily: "'Cinzel',serif", letterSpacing: 2, cursor: canEvolve ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              {canEvolve ? "✧ EVOLUTION ✧" : "EVOLUTION GESPERRT"}
            </button>
          </div>
        )}
        <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, background: "transparent", color: "#334155", border: "1px solid #1e293b", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 2 }}>SCHLIESSEN</button>
      </div>
    </div>
  );
}

// ═══ FORMATION EDITOR ═════════════════════════════════════════
function FormationEditor({ shadowArmy, theme, onDeploy, onUndeploy, formationBonus }) {
  const shadows = shadowArmy?.shadows || [];
  const deployed = shadows.filter(s => s.isDeployed);
  const reserve = shadows.filter(s => !s.isDeployed);

  return (
    <div>
      {/* Tactical bonus bar */}
      <div style={{ background: "linear-gradient(135deg,rgba(4,3,12,0.98),rgba(14,6,28,0.95))", border: "1px solid #7c3aed28", borderRadius: 16, padding: "14px 16px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 80, background: "radial-gradient(ellipse,#7c3aed08,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 8, letterSpacing: 4, color: "#7c3aed", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 1, background: "#7c3aed55" }} />
          FORMATIONS-BONI
          <div style={{ width: 16, height: 1, background: "#7c3aed55" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Dungeon", val: `+${formationBonus.dungeonBonus}%`, color: "#ef4444", iconSrc: SKILL_ICONS.attack },
            { label: "XP", val: `+${Math.round(formationBonus.xpBonus * 100)}%`, color: "#a78bfa", iconSrc: SKILL_ICONS.magic },
            { label: "Gold", val: `+${Math.round(formationBonus.goldBonus * 100)}%`, color: "#fbbf24", iconSrc: ITEM_ICONS.ring }
          ].map(({ label, val, color, iconSrc }) => (
            <div key={label} style={{ textAlign: "center", padding: "10px 6px", background: `radial-gradient(circle at 50% 0%,${color}12,${color}04)`, borderRadius: 12, border: `1px solid ${color}22` }}>
              <div style={{ fontSize: 14, marginBottom: 3, display: "flex", justifyContent: "center" }}>
                <img src={iconSrc} alt={label} style={{ width: 18, height: 18, objectFit: "contain", filter: `drop-shadow(0 0 4px ${color}99)` }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color, fontFamily: "'Cinzel',serif" }}>{val}</div>
              <div style={{ fontSize: 7, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Battlefield slots */}
      {Object.entries(FORMATION_SLOTS).map(([slotKey, slot], si) => {
        const inSlot = deployed.filter(s => s.deploymentSlot === slotKey);
        const emptySlots = slot.maxSlots - inSlot.length;
        return (
          <div key={slotKey} style={{ marginBottom: 12, background: "linear-gradient(135deg,rgba(4,3,12,0.96),rgba(10,5,20,0.92))", border: `1px solid ${slot.color}22`, borderRadius: 16, padding: "14px 14px", overflow: "hidden", position: "relative" }}>
            {/* slot glow */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${slot.color}44,transparent)` }} />
            {/* Slot header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: slot.color + "14", border: `1px solid ${slot.color}33`, fontSize: 15, flexShrink: 0 }}>
                {slot.iconSrc ? (
                  <img src={slot.iconSrc} alt={slot.name} style={{ width: 20, height: 20, objectFit: "contain", filter: `drop-shadow(0 0 4px ${slot.color}88)` }} />
                ) : slot.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: slot.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{slot.name.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: "#334155", marginTop: 1 }}>{slot.bonus}</div>
              </div>
              <div style={{ fontSize: 9, color: inSlot.length > 0 ? slot.color : "#1e2840", fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 6, background: inSlot.length > 0 ? slot.color + "14" : "transparent", border: `1px solid ${inSlot.length > 0 ? slot.color + "33" : "#1a1e30"}` }}>{inSlot.length}/{slot.maxSlots}</div>
            </div>
            {/* Shadow slots grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${slot.maxSlots},1fr)`, gap: 7 }}>
              {inSlot.map(s => {
                const cls = SHADOW_CLASSES[s.class] || SHADOW_CLASSES.soldier;
                const glow = s.isNamed ? s.glowColor : cls.color;
                return (
                  <div key={s.id} onClick={() => onUndeploy(s.id)}
                    style={{ background: `linear-gradient(160deg,${glow}14,${glow}06)`, border: `1px solid ${glow}44`, borderRadius: 12, padding: "10px 6px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", boxShadow: `0 0 10px ${glow}18`, position: "relative" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ef444418"; e.currentTarget.style.borderColor = "#ef444466"; e.currentTarget.style.boxShadow = "0 0 14px #ef444428"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(160deg,${glow}14,${glow}06)`; e.currentTarget.style.borderColor = glow + "44"; e.currentTarget.style.boxShadow = `0 0 10px ${glow}18`; }}>
                    <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
                    <div style={{ fontSize: 18, marginBottom: 3, display: "flex", justifyContent: "center" }}>
                      {(() => { const src = s.isNamed && (NAMED_SHADOWS[s.id] || NAMED_SHADOWS[s.namedId])?.iconSrc || cls.iconSrc; return src ? <img src={src} alt={s.name} style={{ width: 26, height: 26, objectFit: "contain", filter: `drop-shadow(0 0 5px ${glow}88)` }} /> : (s.isNamed ? s.icon : cls.icon); })()}
                    </div>
                    <div style={{ fontSize: 8, color: s.isNamed ? s.glowColor : "#c8d4e0", fontFamily: "'JetBrains Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.length > 7 ? s.name.slice(0, 7) + "…" : s.name}</div>
                    <div style={{ fontSize: 7, color: "#334155", marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>Lv.{s.level}</div>
                  </div>
                );
              })}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} style={{ border: `1px dashed ${slot.color}18`, borderRadius: 12, padding: "10px 6px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 68 }}>
                  <div style={{ fontSize: 16, opacity: 0.15, animation: "formationPulse 2.5s ease-in-out infinite" }}>
                    {slot.iconSrc ? <img src={slot.iconSrc} alt={slot.name} style={{ width: 20, height: 20, objectFit: "contain" }} /> : slot.icon}
                  </div>
                  <div style={{ fontSize: 7, color: "#1a2030", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>LEER</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Reserve pool */}
      {reserve.length > 0 && (
        <div style={{ marginTop: 4, background: "rgba(4,3,12,0.9)", border: "1px solid #1a1e30", borderRadius: 16, padding: "14px" }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>RESERVE — TIPPE UM ZUZUWEISEN</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {reserve.map(s => {
              const cls = SHADOW_CLASSES[s.class] || SHADOW_CLASSES.soldier;
              const glow = s.isNamed ? s.glowColor : cls.color;
              return (
                <div key={s.id} style={{ background: glow + "09", border: `1px solid ${glow}22`, borderRadius: 10, padding: "8px 4px", textAlign: "center", opacity: 0.65 }}>
                  <div style={{ fontSize: 16, display: "flex", justifyContent: "center" }}>
                    {(() => { const src = s.isNamed && (NAMED_SHADOWS[s.id] || NAMED_SHADOWS[s.namedId])?.iconSrc || cls.iconSrc; return src ? <img src={src} alt={s.name} style={{ width: 22, height: 22, objectFit: "contain", filter: `drop-shadow(0 0 4px ${glow}77)` }} /> : (s.isNamed ? s.icon : cls.icon); })()}
                  </div>
                  <div style={{ fontSize: 7, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.length > 6 ? s.name.slice(0, 6) + "…" : s.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ STAT RADAR ═══════════════════════════════════════════════
function StatRadar({ stats, theme, size = 160 }) {
  const keys = ["str", "int", "vit", "agi", "cha"];
  const maxStat = Math.max(...keys.map(k => stats[k] || 0), 20);
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const angle = i => (Math.PI * 2 * i) / 5 - Math.PI / 2;
  const pt = (i, f) => [cx + r * f * Math.cos(angle(i)), cy + r * f * Math.sin(angle(i))];
  const grid = [0.25, 0.5, 0.75, 1].map(f => keys.map((_, i) => pt(i, f).join(",")).join(" "));
  const data = keys.map((k, i) => { const v = Math.min((stats[k] || 0) / maxStat, 1); return pt(i, Math.max(v, 0.05)).join(","); }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke={theme.primary + "15"} strokeWidth={0.5} />)}
      {keys.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke={theme.primary + "15"} strokeWidth={0.5} />)}
      <polygon points={data} fill={theme.primary + "22"} stroke={theme.accent} strokeWidth={1.5} strokeLinejoin="round" />
      {keys.map((k, i) => {
        const [px, py] = pt(i, 1.3);
        const cat = CATEGORIES.find(c => c.key === k);
        return cat.iconSrc ? (
          <g key={k}>
            <defs>
              <clipPath id={`clip-${k}`}>
                <circle cx={px} cy={py} r="14" />
              </clipPath>
            </defs>
            <circle cx={px} cy={py} r="16" fill={`${cat.color}15`} stroke={`${cat.color}44`} strokeWidth="1.5" />
            <image href={cat.iconSrc} x={px - 14} y={py - 14} width="28" height="28" clipPath={`url(#clip-${k})`} style={{ mixBlendMode: "screen", filter: `brightness(1.2)` }} />
          </g>
        ) : (
          <text key={k} x={px} y={py} textAnchor="middle" dominantBaseline="central" fill={cat.color} fontSize={9} fontFamily="'JetBrains Mono',monospace" fontWeight="600">{cat.stat}</text>
        );
      })}
    </svg>
  );
}

// ═══ QUEST TIMER ══════════════════════════════════════════════
function QuestTimer({ expiresAt, color = "#ef4444" }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setTimeLeft(calc());
    const iv = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const urgent = timeLeft < 3600;
  const pad = n => String(n).padStart(2, "0");
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
      color: urgent ? "#ef4444" : color,
      background: urgent ? "#ef444415" : "transparent",
      padding: urgent ? "1px 5px" : "0", borderRadius: 4,
      animation: urgent && timeLeft < 600 ? "breathe 0.8s infinite" : "none",
      letterSpacing: 1,
    }}>
      T-{h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}
    </span>
  );
}

// ═══ QUEST TYPE BADGE ═════════════════════════════════════════
function QuestTypeBadge({ type }) {
  const cfg = QUEST_TYPES_CONFIG[type] || QUEST_TYPES_CONFIG.side;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
      color: cfg.color, background: cfg.color + "18",
      border: `1px solid ${cfg.color}44`,
      padding: "1px 6px", borderRadius: 4, letterSpacing: 0.5,
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {cfg.iconSrc ? (
        <img src={cfg.iconSrc} alt={cfg.label} style={{ width: 10, height: 10, objectFit: "contain", filter: `drop-shadow(0 0 3px ${cfg.color}88)` }} />
      ) : cfg.icon}
      {cfg.label.toUpperCase()}
    </span>
  );
}

// ═══ EMERGENCY QUEST CARD ═════════════════════════════════════
function EmergencyQuestCard({ quest, done, failed, onComplete, theme }) {
  const [hover, setHover] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (!quest) return null;
  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty) || DIFFICULTIES[1];
  const cat = CATEGORIES.find(c => c.key === quest.category) || CATEGORIES[0];
  const expired = quest.timeLimit && new Date(quest.timeLimit) < new Date();
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: done ? "rgba(34,197,94,0.06)" : failed || expired ? "rgba(239,68,68,0.06)" : `linear-gradient(135deg,rgba(239,68,68,0.7),rgba(20,0,0,0.8)), url(${BACKGROUNDS.emergency})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
        border: `1px solid ${done ? "#22c55e44" : failed || expired ? "#ef444444" : "#ef4444"}`,
        borderLeft: `3px solid ${done ? "#22c55e" : failed || expired ? "#ef444466" : "#ef4444"}`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 16,
        animation: !done && !failed && !expired ? "glow 2s infinite" : "none",
        transition: "all 0.25s",
        opacity: done || failed ? 0.7 : 1,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16, animation: !done && !failed && !expired ? "pulse 1s infinite" : "none" }}>⚡</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <QuestTypeBadge type="emergency" />
            {!done && !failed && !expired && quest.timeLimit && <QuestTimer expiresAt={quest.timeLimit} color="#ef4444" />}
            {(expired || failed) && !done && <span style={{ fontSize: 9, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace" }}>ABGELAUFEN</span>}
            {done && <span style={{ fontSize: 9, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" }}>ERFÜLLT ✓</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: done ? "#64748b" : "#fff", fontFamily: "'Outfit',sans-serif", textDecoration: done ? "line-through" : "none" }}>{quest.title}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10, lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>{quest.desc}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ color: cat.color }}>{cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 12, height: 12, objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15)`, verticalAlign: "middle", marginTop: -2 }} /> : cat.icon} {cat.stat}</span>
          <span style={{ color: "#334155", margin: "0 6px" }}>·</span>
          <span style={{ color: "#a78bfa" }}>+{diff.xp * 2.5 | 0} XP</span>
          <span style={{ color: "#334155", margin: "0 6px" }}>·</span>
          <span style={{ color: "#fbbf24" }}>+{diff.gold * 2.5 | 0} G</span>
        </div>
        {!done && !failed && !expired && (
          <button onClick={() => {
            if (!confirming) {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            } else {
              onComplete(quest);
            }
          }} style={{ padding: "7px 16px", borderRadius: 10, fontSize: 11, fontWeight: 800, background: confirming ? "rgba(245,158,11,0.2)" : "linear-gradient(135deg,#ef444425,#ef444410)", color: confirming ? "#f59e0b" : "#ef4444", border: `1px solid ${confirming ? "#f59e0b" : "#ef444455"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, transition: "all 0.3s" }}>
            {confirming ? "JA?" : "ERFÜLLEN"}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══ CHAINED QUEST PROGRESS ═══════════════════════════════════
function ChainedQuestProgress({ quest }) {
  const steps = quest.chainTotal || 3;
  const current = quest.chainStep || 1;
  const mult = quest.chainMultiplier || 1;
  return (
    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < current ? "#f59e0b" : "#1e2940", transition: "background 0.3s" }} />
      ))}
      <span style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>x{mult.toFixed(2)}</span>
    </div>
  );
}

// ═══ QUEST CARD 2.0 ═══════════════════════════════════════════
function QuestCard({ quest, index, theme, onComplete, onEdit, onDelete, onCompleteSubQuest, onOpenDetail }) {
  const [completing, setCompleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hover, setHover] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);
  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty) || DIFFICULTIES[0];
  const cat = CATEGORIES.find(c => c.key === quest.category) || CATEGORIES[0];
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
  const xpGain = Math.round((diff?.xp || 50) * (quest.chainMultiplier || 1) * (typeCfg.xpMult || 1));
  const goldGain = Math.round((diff?.gold || 25) * (quest.chainMultiplier || 1) * (typeCfg.goldMult || 1));
  const isHidden = quest.type === "hidden";
  const isSystemQuest = quest.isSystem === true;
  const isBoss = quest.difficulty === 'boss';
  const isHard = quest.difficulty === 'hard';
  const isEasy = quest.difficulty === 'easy';
  const originBadge = isSystemQuest
    ? { label: "SYSTEM", color: "#06b6d4", icon: "⚙" }
    : { label: "EIGENE", color: "#f59e0b", icon: "✦" };
  const subQuests = quest.subQuests || [];
  const completedSubs = subQuests.filter(sq => sq.completed).length;
  const allSubsDone = subQuests.length > 0 && completedSubs === subQuests.length;
  const hasDetails = (quest.description && quest.description.trim()) || subQuests.length > 0;
  const todayKey = getLocalToday();
  const isOverdue = quest.dueDate && quest.dueDate < todayKey && !quest.completed;
  const isDueToday = quest.dueDate === todayKey;
  const priorityMeta = {
    high: { label: "HOCH", color: "#f59e0b" },
    medium: { label: "MITTEL", color: "#38bdf8" },
    low: { label: "NIEDRIG", color: "#64748b" },
  }[quest.priority || "medium"];
  const energyMeta = {
    quick: "5 MIN",
    medium: "30 MIN",
    deep: "DEEP",
  }[quest.energy || "medium"];
  const reminderLabel = quest.reminderAt ? formatLocalDateTime(quest.reminderAt) : null;
  const handleComplete = () => {
    if (completing) return;
    if (subQuests.length > 0 && !allSubsDone) { setExpanded(true); return; }
    if (!quest.isSystem && quest.createdAtMs) {
      const waitHours = diff?.waitHours || 1;
      const elapsedMs = Date.now() - quest.createdAtMs;
      const requiredMs = waitHours * 3600 * 1000;
      if (elapsedMs < requiredMs) { onComplete(quest.id, null); return; }
    }
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return; }
    setCompleting(true); const rect = cardRef.current?.getBoundingClientRect();
    // Trigger CompletionFX confetti via CustomEvent
    if (rect) {
      try { window.dispatchEvent(new CustomEvent('questComplete', { detail: { x: rect.left + rect.width / 2, y: rect.top, color: diff.color } })); } catch (e) { }
      // v3.0: Trigger XP Particle Trail
      try { window.dispatchEvent(new CustomEvent('xpTrail', { detail: { fromX: rect.left + rect.width / 2, fromY: rect.top + rect.height / 2, xp: xpGain, gold: goldGain, color: diff.color } })); } catch (e) { }
      // v3.0 Phase 3: Screen Shake for Boss/Hard quests
      if (isBoss) {
        try { window.dispatchEvent(new CustomEvent('screenShake', { detail: { intensity: 6, duration: 500 } })); } catch (e) { }
        setTimeout(() => { try { window.dispatchEvent(new CustomEvent('letterbox', { detail: { text: 'BOSS ELIMINATED', duration: 2000, color: '#ef4444' } })); } catch (e) { } }, 600);
      } else if (isHard) {
        try { window.dispatchEvent(new CustomEvent('screenShake', { detail: { intensity: 3, duration: 300 } })); } catch (e) { }
      }
    }
    setTimeout(() => onComplete(quest.id, rect ? { x: rect.left + rect.width / 2, y: rect.top } : null), 500);
  };

  const questAccent = isOverdue ? "#ef4444" : isDueToday ? "#f59e0b" : isSystemQuest ? "#38bdf8" : isHidden ? typeCfg.color : diff.color;
  const completionBlocked = subQuests.length > 0 && !allSubsDone;
  const subQuestProgress = subQuests.length > 0 ? (completedSubs / subQuests.length) * 100 : 0;
  const dueLabel = isOverdue ? "ÜBERFÄLLIG" : isDueToday ? "HEUTE" : quest.dueDate;
  const typeLabel = (typeCfg.label || quest.type || "Quest").toUpperCase();
  const categoryLabel = cat.stat || quest.category || "STAT";

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => { if (onOpenDetail) onOpenDetail(quest); }}
        style={{
          background: completing ? `${questAccent}0f` : "rgba(8,12,24,0.92)",
          border: `1px solid ${hover ? questAccent + "4d" : "rgba(148,163,184,0.12)"}`,
          borderLeft: `3px solid ${questAccent}${hover ? "aa" : "66"}`,
          borderRadius: 12,
          padding: "12px",
          display: "grid",
          gridTemplateColumns: "36px minmax(0,1fr) auto",
          gap: 11,
          alignItems: "flex-start",
          boxShadow: hover ? "0 12px 28px rgba(0,0,0,0.28)" : "0 6px 18px rgba(0,0,0,0.18)",
          transform: hover && !completing ? "translateY(-1px)" : "none",
          transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
          opacity: completing ? 0.5 : isEasy ? 0.93 : 1,
          cursor: onOpenDetail ? "pointer" : "default",
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleComplete(); }}
          className="press-feedback"
          title={completionBlocked ? "Erst Etappen abschliessen" : "Quest abschliessen"}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: confirming ? "rgba(245,158,11,0.12)" : completionBlocked ? "rgba(255,255,255,0.025)" : `${questAccent}10`,
            border: `1px solid ${confirming ? "#f59e0b88" : completionBlocked ? "rgba(148,163,184,0.16)" : questAccent + "55"}`,
            color: confirming ? "#f59e0b" : completionBlocked ? "#64748b" : questAccent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 900,
            fontFamily: "'JetBrains Mono',monospace",
            cursor: completionBlocked ? "default" : "pointer",
            transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
          }}
        >
          {completing ? "OK" : confirming ? "JA?" : completionBlocked ? `${completedSubs}/${subQuests.length}` : (
            <span style={{ width: 9, height: 9, borderRadius: 999, background: "currentColor", opacity: 0.45 }} />
          )}
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ padding: "2px 7px", borderRadius: 7, color: questAccent, background: `${questAccent}12`, border: `1px solid ${questAccent}26`, fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.4 }}>
              {typeLabel}
            </span>
            <span style={{ padding: "2px 7px", borderRadius: 7, color: "#94a3b8", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
              {isSystemQuest ? "System" : "Eigen"}
            </span>
            <span style={{ padding: "2px 7px", borderRadius: 7, color: "#94a3b8", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
              {categoryLabel}
            </span>
            {quest.dueDate && (
              <span style={{ padding: "2px 7px", borderRadius: 7, color: isOverdue ? "#ef4444" : isDueToday ? "#f59e0b" : "#94a3b8", background: isOverdue ? "rgba(239,68,68,0.1)" : isDueToday ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.035)", border: `1px solid ${isOverdue ? "#ef444433" : isDueToday ? "#f59e0b33" : "rgba(255,255,255,0.07)"}`, fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                {dueLabel}
              </span>
            )}
            {reminderLabel && (
              <span style={{ padding: "2px 7px", borderRadius: 7, color: theme.primary, background: `${theme.primary}10`, border: `1px solid ${theme.primary}24`, fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                REM
              </span>
            )}
            {quest.type === "weekly" && quest.timeLimit && <QuestTimer expiresAt={quest.timeLimit} color="#8b5cf6" />}
          </div>

          {quest.systemMessage && (
            <div style={{ fontSize: 10, color: "#f87171", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, background: "rgba(248,113,113,0.08)", padding: "5px 7px", borderRadius: 7, border: "1px solid rgba(248,113,113,0.18)" }}>
              {quest.systemMessage}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              onClick={(e) => {
                if (onOpenDetail) { e.stopPropagation(); onOpenDetail(quest); }
                else if (hasDetails) { e.stopPropagation(); setExpanded(!expanded); }
              }}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 750,
                color: completing ? "#64748b" : "#e5e7eb",
                textDecoration: completing ? "line-through" : "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: expanded ? "normal" : "nowrap",
                fontFamily: "'Outfit',sans-serif",
                lineHeight: 1.35,
                cursor: (onOpenDetail || hasDetails) ? "pointer" : "inherit",
              }}
            >
              {quest.title}
            </div>
            <span style={{ flexShrink: 0, color: "#a78bfa", fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
              +{xpGain} XP
            </span>
          </div>

          {quest.description && quest.description.trim() && !expanded && (
            <div style={{ marginTop: 4, color: "#64748b", fontSize: 11, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Outfit',sans-serif" }}>
              {quest.description}
            </div>
          )}

          {(quest.priority || quest.energy || quest.context || quest.tags?.length > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ color: priorityMeta?.color || "#94a3b8", background: `${priorityMeta?.color || "#94a3b8"}12`, border: `1px solid ${priorityMeta?.color || "#94a3b8"}24`, borderRadius: 7, padding: "2px 7px", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                {priorityMeta?.label || "MITTEL"}
              </span>
              {energyMeta && <span style={{ color: "#94a3b8", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "2px 7px", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{energyMeta}</span>}
              {quest.context && <span style={{ color: "#94a3b8", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "2px 7px", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{quest.context}</span>}
              {quest.tags?.slice(0, 2).map((t, i) => (
                <span key={i} style={{ color: "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>#{t}</span>
              ))}
            </div>
          )}

          {quest.type === "chained" && <ChainedQuestProgress quest={quest} />}

          {subQuests.length > 0 && !expanded && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${subQuestProgress}%`, borderRadius: 999, background: allSubsDone ? "#22c55e" : questAccent, transition: "width 0.3s ease" }} />
              </div>
              <span style={{ color: allSubsDone ? "#22c55e" : "#64748b", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{completedSubs}/{subQuests.length}</span>
            </div>
          )}

          {expanded && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {quest.description && quest.description.trim() && (
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5, marginBottom: subQuests.length ? 10 : 0 }}>
                  {quest.description}
                </div>
              )}
              {subQuests.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 1.4, color: questAccent, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, marginBottom: 7 }}>ETAPPEN</div>
                  {subQuests.map((sq, si) => (
                    <div key={sq.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: si === 0 ? "none" : "1px solid rgba(255,255,255,0.055)" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!sq.completed && onCompleteSubQuest) onCompleteSubQuest(quest.id, sq.id); }}
                        disabled={sq.completed}
                        className="press-feedback"
                        style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: sq.completed ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.025)", border: `1px solid ${sq.completed ? "#22c55e55" : questAccent + "3a"}`, color: sq.completed ? "#22c55e" : questAccent, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: sq.completed ? "default" : "pointer", fontFamily: "'JetBrains Mono',monospace", fontWeight: 900 }}
                      >
                        {sq.completed ? "OK" : ""}
                      </button>
                      <span style={{ flex: 1, minWidth: 0, color: sq.completed ? "#64748b" : "#dbe4ef", textDecoration: sq.completed ? "line-through" : "none", fontSize: 12, lineHeight: 1.35 }}>{sq.title}</span>
                      <span style={{ color: "#475569", fontSize: 8, fontFamily: "'JetBrains Mono',monospace" }}>{si + 1}/{subQuests.length}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, color: "#475569", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
            <span>{goldGain > 0 ? `+${goldGain} G` : "Belohnung offen"}</span>
            {hasDetails && (
              <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ color: "#64748b", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", borderRadius: 7, padding: "3px 7px", fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                {expanded ? "WENIGER" : "MEHR"}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>EDIT</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ width: 30, height: 24, borderRadius: 7, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>DEL</button>}
        </div>
      </div>
    </div>
  );

  // Difficulty-based styling
  const cardBg = completing
    ? `linear-gradient(135deg,${diff.color}15,transparent)`
    : `linear-gradient(135deg,rgba(12,12,20,0.95),${isSystemQuest ? "rgba(6,26,36,0.92)" : "rgba(22,18,10,0.92)"}), url(${isBoss ? BACKGROUNDS.boss : BACKGROUNDS.standard})`;

  const cardBorder = isBoss
    ? `1px solid ${hover ? "#ef444466" : "#ef444433"}`
    : isHard
      ? `1px solid ${hover ? diff.color + "55" : theme.primary + "22"}`
      : isHidden
        ? `1px solid ${hover ? typeCfg.color + "55" : typeCfg.color + "33"}`
        : `1px solid ${hover ? diff.color + "44" : theme.primary + "18"}`;

  const cardLeftBorder = isBoss
    ? `3px solid ${hover ? "#ef4444" : "#ef444488"}`
    : isHard
      ? `3px solid ${hover ? "#f97316cc" : "#f9731666"}`
      : `3px solid ${isHidden ? typeCfg.color : isSystemQuest ? "#06b6d4" : diff.color}${hover ? "cc" : "66"}`;

  const cardShadow = isBoss
    ? `0 4px 24px rgba(0,0,0,0.5), 0 0 ${hover ? "24px" : "12px"} rgba(239,68,68,${hover ? "0.15" : "0.08"}), inset 0 1px 0 rgba(255,255,255,0.04)`
    : isHard
      ? `0 4px 24px rgba(0,0,0,0.45), -4px 0 16px rgba(249,115,22,0.06), inset 0 1px 0 rgba(255,255,255,0.04)`
      : isHidden
        ? `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${typeCfg.color}18, inset 0 1px 0 rgba(255,255,255,0.03)`
        : `0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)`;

  // Determine rarity border class
  const rarityClass = isBoss ? 'rarity-border rarity-border-boss'
    : isHard ? 'rarity-border rarity-border-hard'
      : isHidden ? 'rarity-border rarity-border-hidden'
        : '';

  return (
    <div className={rarityClass} style={{ marginBottom: 8 }}>
      <div ref={cardRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => { if (onOpenDetail) onOpenDetail(quest); }} style={{
        background: cardBg,
        backgroundSize: "cover", backgroundPosition: "center", backgroundBlendMode: "overlay",
        border: cardBorder, borderRadius: 14, padding: "14px 16px",
        borderLeft: cardLeftBorder,
        animation: completing ? "fadeOut 0.5s ease forwards" : `cardEnter 0.4s ease ${index * 0.06}s both`,
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hover && !completing ? "translateY(-2px) translateX(2px)" : "none",
        backdropFilter: "blur(12px) saturate(1.4)",
        WebkitBackdropFilter: "blur(12px) saturate(1.4)",
        boxShadow: cardShadow,
        opacity: isEasy ? (hover ? 1 : 0.88) : 1,
        position: "relative",
        overflow: "hidden",
        cursor: onOpenDetail ? "pointer" : "default",
      }}>
        {/* Scan line overlay for Boss quests */}
        {isBoss && !completing && <div style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(239,68,68,0.03),transparent)", animation: "scanLine 6s linear infinite", pointerEvents: "none", zIndex: 1 }} />}
        {/* Ambient glow for Boss quests */}
        {isBoss && !completing && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(239,68,68,0.06), transparent 55%)", pointerEvents: "none", zIndex: 0 }} />}

        <button onClick={(e) => { e.stopPropagation(); handleComplete(); }} className="press-feedback" style={{
          width: confirming ? 46 : 38, height: 38, borderRadius: 10, flexShrink: 0, marginTop: 2,
          background: completing ? diff.color + "22" : confirming ? "#f59e0b22" : "transparent",
          border: `2px solid ${completing ? diff.color : confirming ? "#f59e0b" : subQuests.length > 0 && !allSubsDone ? "#334155" : diff.color + "44"}`,
          color: confirming ? "#f59e0b" : subQuests.length > 0 && !allSubsDone ? "#334155" : diff.color, fontSize: confirming ? 11 : 15, display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", transform: completing ? "scale(1.15)" : confirming ? "scale(1.05)" : hover ? "scale(1.05)" : "scale(1)",
          cursor: subQuests.length > 0 && !allSubsDone ? "default" : "pointer",
          boxShadow: completing ? `0 0 16px ${diff.color}44` : confirming ? "0 0 12px #f59e0b33" : "none",
          position: "relative", zIndex: 2,
        }}>
          {completing ? <span style={{ animation: "checkPop 0.4s ease forwards", display: "inline-block" }}>✓</span> : confirming ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>JA?</span> : subQuests.length > 0 && !allSubsDone ? <span style={{ opacity: 0.4, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{completedSubs}/{subQuests.length}</span> : <span style={{ opacity: 0.5 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, flexWrap: "wrap" }}>
            <QuestTypeBadge type={quest.type} />
            <span style={{
              color: originBadge.color,
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              background: originBadge.color + "15",
              fontSize: 9,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              border: `1px solid ${originBadge.color}44`,
              animation: isSystemQuest ? "systemBadgePulse 2s ease-in-out infinite" : "none",
              letterSpacing: 1,
            }}>
              {originBadge.icon} {originBadge.label}
            </span>
            <span style={{ color: diff.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: diff.color + "15", fontSize: 9, display: "inline-flex", alignItems: "center", gap: 3, boxShadow: isBoss ? `0 0 6px ${diff.color}22` : "none" }}>{diff.iconSrc ? <img src={diff.iconSrc} alt={diff.label} style={{ width: 10, height: 10, objectFit: "contain" }} /> : diff.icon} {diff.label}</span>
            <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 9, background: cat.color + "15", color: cat.color, fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 4, boxShadow: `0 0 4px ${cat.color}11` }}>{cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 10, height: 10, objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15)` }} /> : cat.icon} <span>{cat.stat}</span></span>
            {quest.tags?.map((t, i) => (
              <span key={i} style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 8, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", transition: "all 0.2s" }}>#{t}</span>
            ))}
            {quest.type === "weekly" && quest.timeLimit && <QuestTimer expiresAt={quest.timeLimit} color="#8b5cf6" />}
            {quest.dueDate && <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 9, background: isOverdue ? "rgba(239,68,68,0.15)" : isDueToday ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)", color: isOverdue ? "#ef4444" : isDueToday ? "#f59e0b" : "#94a3b8", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${isOverdue ? "#ef444455" : isDueToday ? "#f59e0b55" : "rgba(255,255,255,0.08)"}` }}>{isOverdue ? "ÜBERFÄLLIG" : isDueToday ? "HEUTE" : quest.dueDate}</span>}
            {reminderLabel && <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 9, background: `${theme.primary}14`, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${theme.primary}33` }}>REM {reminderLabel}</span>}
          </div>
          {quest.systemMessage && (
            <div style={{ fontSize: 9, letterSpacing: 1, color: "#f87171", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4, background: "rgba(248,113,113,0.1)", padding: "4px 6px", borderRadius: 6, borderLeft: "2px solid #f87171" }}>
              ⚠ {quest.systemMessage}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div onClick={(e) => {
              if (onOpenDetail) { e.stopPropagation(); onOpenDetail(quest); }
              else if (hasDetails) { e.stopPropagation(); setExpanded(!expanded); }
            }} style={{ fontSize: 14, fontWeight: 600, color: completing ? "#64748b" : "#e2e8f0", textDecoration: completing ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: expanded ? "normal" : "nowrap", fontFamily: "'Outfit',sans-serif", cursor: (onOpenDetail || hasDetails) ? "pointer" : "inherit", flex: 1 }}>{quest.title}</div>
            {hasDetails && <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ background: "transparent", border: "none", color: "#475569", fontSize: 10, cursor: "pointer", padding: "2px 4px", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none", flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>▼</button>}
          </div>
          {quest.description && quest.description.trim() && !expanded && (
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Outfit',sans-serif", fontStyle: "italic" }}>{quest.description}</div>
          )}
          {(quest.priority || quest.energy || quest.context) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 9 }}>
              <span style={{ color: priorityMeta.color, background: `${priorityMeta.color}14`, border: `1px solid ${priorityMeta.color}33`, borderRadius: 6, padding: "2px 7px" }}>PRIO {priorityMeta.label}</span>
              {energyMeta && <span style={{ color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 7px" }}>{energyMeta}</span>}
              {quest.context && <span style={{ color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 7px" }}>{quest.context}</span>}
            </div>
          )}
          {quest.type === "chained" && <ChainedQuestProgress quest={quest} />}
          {subQuests.length > 0 && !expanded && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: allSubsDone ? "#22c55e" : `linear-gradient(90deg,${theme.primary},${theme.accent})`, width: `${subQuests.length > 0 ? (completedSubs / subQuests.length) * 100 : 0}%`, transition: "width 0.4s ease", boxShadow: `0 0 6px ${allSubsDone ? "#22c55e44" : theme.glow}` }} />
              </div>
              <span style={{ fontSize: 9, color: allSubsDone ? "#22c55e" : "#64748b", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{completedSubs}/{subQuests.length}</span>
            </div>
          )}
          {expanded && (
            <div style={{ marginTop: 8, animation: "slideDown 0.25s ease", overflow: "hidden" }}>
              {quest.description && quest.description.trim() && (
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10, fontFamily: "'Outfit',sans-serif", fontStyle: "italic", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 10, borderLeft: `2px solid ${diff.color}44` }}>{quest.description}</div>
              )}
              {subQuests.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>ETAPPEN</div>
                  {subQuests.map((sq, si) => (
                    <div key={sq.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 3, borderRadius: 8, background: sq.completed ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${sq.completed ? "#22c55e22" : "rgba(255,255,255,0.04)"}`, transition: "all 0.2s" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!sq.completed && onCompleteSubQuest) onCompleteSubQuest(quest.id, sq.id); }}
                        disabled={sq.completed}
                        className="press-feedback"
                        style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: sq.completed ? "#22c55e22" : "transparent", border: `1.5px solid ${sq.completed ? "#22c55e" : diff.color + "44"}`, color: sq.completed ? "#22c55e" : diff.color + "66", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: sq.completed ? "default" : "pointer", transition: "all 0.2s" }}
                      >
                        {sq.completed ? "✓" : ""}
                      </button>
                      <span style={{ fontSize: 12, color: sq.completed ? "#64748b" : "#e2e8f0", textDecoration: sq.completed ? "line-through" : "none", fontFamily: "'Outfit',sans-serif", flex: 1 }}>{sq.title}</span>
                      <span style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>{si + 1}/{subQuests.length}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: allSubsDone ? "#22c55e" : `linear-gradient(90deg,${theme.primary},${theme.accent})`, width: `${(completedSubs / subQuests.length) * 100}%`, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: 9, color: allSubsDone ? "#22c55e" : "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{allSubsDone ? "ALLE ETAPPEN ERLEDIGT ✓" : `${completedSubs}/${subQuests.length} Etappen`}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: "#a78bfa", textShadow: hover ? "0 0 6px #a78bfa44" : "none", transition: "text-shadow 0.3s" }}>+{xpGain} XP</span>
            <span style={{ margin: "0 5px", color: "#1e293b" }}>·</span>
            <span style={{ color: "#fbbf24", textShadow: hover ? "0 0 6px #fbbf2444" : "none", transition: "text-shadow 0.3s" }}>+{goldGain} G</span>
            {subQuests.length > 0 && <span style={{ margin: "0 5px", color: "#334155" }}>·</span>}
            {subQuests.length > 0 && <span style={{ color: theme.primary, fontSize: 9 }}>{subQuests.length} Etappen</span>}
            {isHidden && <span style={{ margin: "0 5px", color: typeCfg.color }}>· ✨ Verborgene Belohnung</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, opacity: 1, transition: "opacity 0.2s", position: "relative", zIndex: 2 }}>
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(quest); }} className="press-feedback" style={{ fontSize: 14, color: "#3b82f6", background: "transparent", padding: "4px", cursor: "pointer", border: "none" }}>✏️</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }} className="press-feedback" style={{ fontSize: 14, color: "#ef4444", background: "transparent", padding: "4px", cursor: "pointer", border: "none" }}>✕</button>}
        </div>
      </div>
    </div>
  );
}
// ═══ GATE IMAGE HELPER ════════════════════════════════════════
function getGateImage(dungeon) {
  const d = (dungeon.name + " " + (dungeon.desc || "")).toLowerCase();
  if (d.includes("frost") || d.includes("ice") || d.includes("winter") || d.includes("thunder")) return "/Gates/frost_gate.png";
  if (d.includes("red") || d.includes("blood") || d.includes("crimson")) return "/Gates/red_gate.png";
  if (d.includes("inferno") || d.includes("fire") || d.includes("dragon") || d.includes("demon") || d.includes("altar") || d.includes("monarch")) return "/Gates/inferno_gate.png";
  if (d.includes("spring") || d.includes("forest") || d.includes("goblin") || d.includes("rat") || d.includes("cave") || d.includes("ruin") || d.includes("fortress")) return "/Gates/spring_gate.png";

  if (dungeon.rank === "S" || dungeon.rank === "A") return "/Gates/red_gate.png";
  if (dungeon.rank === "B") return "/Gates/inferno_gate.png";
  if (dungeon.rank === "C") return "/Gates/frost_gate.png";
  return "/Gates/spring_gate.png";
}

// ═══ DUNGEON GATE ═════════════════════════════════════════════
function DungeonGate({ dungeon, playerStats, theme, onEnter, modifier, onPreview }) {
  const [hover, setHover] = useState(false);
  const rankData = RANKS.find(r => r.name === dungeon.rank) || RANKS[0];
  const reqs = Object.entries(dungeon.requirements);
  const timeLeft = Math.max(0, new Date(dungeon.expiresAt) - new Date());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
  const rc = rankData.color;
  const isHighRank = dungeon.rank === "S" || dungeon.rank === "SSS";
  const isMidRank = dungeon.rank === "A" || dungeon.rank === "B";
  const threatLabel = isHighRank ? "⚠ EXTREME THREAT" : isMidRank ? "⬡ HIGH THREAT" : "⬡ STANDARD";
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      position: "relative", overflow: "hidden",
      background: dungeon.cleared
        ? "rgba(6,6,14,0.4)"
        : `linear-gradient(155deg,#0c0c1e 0%,#07071a 55%,#0a0814 100%)`,
      border: `1px solid ${dungeon.cleared ? "#1e293b" : hover ? rc + "55" : rc + "22"}`,
      borderRadius: 18,
      opacity: dungeon.cleared ? 0.45 : 1,
      backdropFilter: "blur(12px)",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      transform: hover && !dungeon.cleared ? "translateY(-3px)" : "none",
      boxShadow: hover && !dungeon.cleared
        ? `0 16px 48px rgba(0,0,0,0.6), 0 0 40px ${rc}18, inset 0 1px 0 ${rc}15`
        : `0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 ${rc}08`,
    }}>
      {/* Top rank-color energy bar */}
      <div style={{ height: 2, borderRadius: "18px 18px 0 0", background: `linear-gradient(90deg, transparent, ${rc}66, ${rc}cc, ${rc}66, transparent)`, opacity: hover ? 1 : 0.55, transition: "opacity 0.3s" }} />

      {/* Hover scan beam */}
      {hover && !dungeon.cleared && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", pointerEvents: "none", zIndex: 0, background: `linear-gradient(180deg, transparent 0%, ${rc}06 50%, transparent 100%)`, animation: "rankShine 1.8s ease-in-out infinite" }} />
      )}

      {/* Corner accent glow */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 40, height: 40, pointerEvents: "none", zIndex: 3,
        background: `radial-gradient(circle at 100% 0%, ${rc}22 0%, transparent 70%)`,
        borderRadius: "0 18px 0 0"
      }} />

      {/* Body */}
      <div style={{ padding: "15px 18px 0", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

          {/* Gate icon — free-floating transparent PNG with glow ring */}
          <div style={{ width: 96, height: 96, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Glow ring */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${rc}55`, boxShadow: `0 0 20px ${rc}44, inset 0 0 16px ${rc}22`, pointerEvents: "none" }} />
            {/* Ambient glow pool */}
            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 70, height: 20, background: `radial-gradient(ellipse at center, ${rc}33, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
            {dungeon.cleared ? (
              <span style={{ fontSize: 36, color: "#fff", fontWeight: "bold", textShadow: `0 0 20px ${rc}` }}>✓</span>
            ) : (
              <img src={getDungeonGateImage(dungeon)} style={{ width: 120, height: 120, objectFit: "contain", filter: `drop-shadow(0 4px 16px ${rc}77) brightness(1.15)`, animation: "gateFloat 4s ease-in-out infinite", position: "relative", zIndex: 1 }} alt="Gate" />
            )}
          </div>

          {/* Gate info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8, color: rc, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, fontWeight: 700, opacity: 0.85, marginBottom: 4, textShadow: `0 0 8px ${rc}` }}>⚠ GATE ANOMALY DETECTED</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: dungeon.cleared ? "#475569" : "#f1f5f9", fontFamily: "'Cinzel',serif", letterSpacing: 1.5, lineHeight: 1.2, marginBottom: 5, textShadow: dungeon.cleared ? "none" : "0 0 24px rgba(255,255,255,0.12)" }}>{dungeon.name}</div>
            <div style={{ fontSize: 10, color: "#4a5568", lineHeight: 1.45 }}>{dungeon.desc}</div>
          </div>

          {/* Rank badge — angular clip-path */}
          <div style={{
            flexShrink: 0, textAlign: "center", padding: "8px 14px 10px",
            background: `linear-gradient(145deg,${rc}22,${rc}0a)`,
            border: `1px solid ${rc}44`,
            borderRadius: 12,
            fontSize: 15, fontWeight: 900, color: rc, fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 0.5, lineHeight: 1,
            textShadow: `0 0 14px ${rc}`,
            boxShadow: hover ? `0 0 20px ${rc}33` : "none",
            transition: "box-shadow 0.3s"
          }}>
            {dungeon.rank}
            <div style={{ fontSize: 7, opacity: 0.65, letterSpacing: 1.5, marginTop: 3 }}>RANK</div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", padding: "3px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", letterSpacing: 0.8, borderRadius: 6 }}>🏛️ {dungeon.floors} FLOORS</span>
          {!dungeon.cleared && timeLeft > 0 && (
            <span style={{ fontSize: 9, color: hoursLeft < 2 ? "#ef4444" : "#475569", fontFamily: "'JetBrains Mono',monospace", padding: "3px 8px", background: hoursLeft < 2 ? "#ef444412" : "rgba(255,255,255,0.03)", border: `1px solid ${hoursLeft < 2 ? "#ef444430" : "rgba(255,255,255,0.07)"}`, letterSpacing: 0.8, borderRadius: 6 }}>⏱ {hoursLeft}h {minsLeft}m</span>
          )}
          <span style={{ fontSize: 9, color: rc, fontFamily: "'JetBrains Mono',monospace", padding: "3px 8px", background: rc + "10", border: `1px solid ${rc}25`, letterSpacing: 0.8, fontWeight: 700, borderRadius: 6 }}>{threatLabel}</span>
        </div>

        {/* Requirements */}
        {reqs.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
            {reqs.map(([stat, val]) => {
              const cat = CATEGORIES.find(c => c.key === stat);
              const met = (playerStats[stat] || 0) >= val;
              return (
                <div key={stat} style={{ padding: "3px 9px", fontSize: 9, background: met ? cat.color + "12" : "#ef444408", color: met ? cat.color : "#ef4444", border: `1px solid ${met ? cat.color + "30" : "#ef444422"}`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, borderRadius: 6 }}>
                  <span style={{ display: "flex", alignItems: "center" }}>{cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 12, height: 12, objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15)` }} /> : cat.icon}</span> {cat.stat} {val} {met ? "✓" : `(${playerStats[stat] || 0})`}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rank-color gradient divider */}
      <div style={{ margin: "13px 0 0", height: 1, background: `linear-gradient(90deg, transparent, ${rc}22, ${rc}55, ${rc}22, transparent)` }} />

      {/* Footer */}
      <div style={{ padding: "11px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(180deg, transparent, ${rc}07)`, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "linear-gradient(135deg,rgba(192,132,252,0.1),rgba(192,132,252,0.02))", border: "1px solid #c084fc33", borderRadius: 12, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            <span style={{ color: "#c084fc", fontSize: 13, textShadow: "0 0 8px #c084fc" }}>✧</span> <span style={{ color: "#e2e8f0", fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>+{modifier?.xpMult ? Math.round(dungeon.xp * modifier.xpMult) : dungeon.xp} XP</span>
          </div>
          {(modifier?.goldMult ? Math.round(dungeon.gold * modifier.goldMult) : dungeon.gold) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "linear-gradient(135deg,rgba(251,191,36,0.1),rgba(251,191,36,0.02))", border: "1px solid #fcd34d33", borderRadius: 12, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <img src="/icon/coin.png" alt="G" style={{ width: 14, height: 14, opacity: 0.9, filter: "drop-shadow(0 0 4px #fbbf2455)" }} /> <span style={{ color: "#e2e8f0", fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>+{modifier?.goldMult ? Math.round(dungeon.gold * modifier.goldMult) : dungeon.gold}</span>
            </div>
          )}
        </div>
        {dungeon.cleared
          ? <div style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 700 }}>CLEARED ✓</div>
          : <button
            onClick={() => onPreview ? onPreview(dungeon) : onEnter(dungeon)}
            style={{
              padding: "10px 26px",
              fontSize: 12, fontWeight: 900,
              background: hover ? `linear-gradient(135deg,${rc}45,${rc}22)` : `linear-gradient(135deg,${rc}28,${rc}12)`,
              color: rc,
              border: `1px solid ${rc}${hover ? "88" : "44"}`,
              borderRadius: 12,
              fontFamily: "'Cinzel',serif", letterSpacing: 3,
              transition: "all 0.22s ease",
              boxShadow: hover ? `0 0 22px ${rc}44, 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 ${rc}25` : `inset 0 1px 0 ${rc}12`,
              cursor: "pointer",
              textShadow: hover ? `0 0 12px ${rc}` : "none",
            }}
          >ENTER ▶</button>
        }
      </div>
    </div>
  );
}

// ═══ SPRINT 3: FLOOR PROGRESS BAR ═════════════════════════════
function FloorProgressBar({ floors, currentFloor, totalFloors }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 16 }}>
      {floors.map((f, i) => {
        const ft = FLOOR_TYPES[f.type];
        const isCurrent = f.floor === currentFloor && !f.completed;
        const isPast = f.completed;
        const isFuture = !f.completed && f.floor !== currentFloor;
        return (
          <div key={i} style={{
            flex: f.type === "boss_arena" ? 2 : 1, display: "flex", alignItems: "center",
            flexDirection: "column", gap: 3, position: "relative",
          }}>
            <div style={{
              height: f.type === "boss_arena" ? 36 : 28,
              width: "100%",
              borderRadius: 6,
              background: isPast ? "#22c55e22" : isCurrent ? ft.color + "28" : "rgba(10,10,20,0.6)",
              border: `1px solid ${isPast ? "#22c55e55" : isCurrent ? ft.color : "#1e2940"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isPast ? 10 : f.type === "boss_arena" ? 16 : 12,
              transition: "all 0.4s",
              animation: isCurrent ? `floorActiveGlow 1.5s infinite` : "none",
              "--floor-color": ft.color,
              boxShadow: isCurrent ? `0 0 10px ${ft.color}44` : "none",
              opacity: isFuture ? 0.4 : 1,
              position: "relative", overflow: "hidden",
            }}>
              {isPast ? "✓" : (ft.iconSrc
                ? <img src={ft.iconSrc} alt={ft.name} style={{ width: 14, height: 14, objectFit: "contain", opacity: 0.9 }} />
                : ft.icon)}
              {isCurrent && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,transparent,${ft.color}22,transparent)`, animation: "rankShine 1.5s ease-in-out infinite" }} />}
            </div>
            <div style={{ fontSize: 7, color: isPast ? "#22c55e" : isCurrent ? ft.color : "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, textAlign: "center", whiteSpace: "nowrap" }}>
              {f.type === "boss_arena" ? "BOSS" : f.floor}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══ SPRINT 3: BOSS PHASE UI ══════════════════════════════════
function BossPhaseUI({ rank, bossHp, bossMaxHp, currentPhase, phases }) {
  const phaseData = currentPhase <= phases.length ? phases[currentPhase - 1] : phases[phases.length - 1];
  const hpPercent = Math.max(0, (bossHp / bossMaxHp) * 100);
  const phaseColor = phaseData?.color || "#ef4444";
  return (
    <div style={{
      background: "rgba(8,2,16,0.96)",
      border: `1px solid ${phaseColor}44`,
      borderRadius: 14, padding: "14px 16px", marginBottom: 14,
      animation: "bossPhaseIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 28, animation: "bossShake 0.5s ease", filter: `drop-shadow(0 0 10px ${phaseColor})` }}>
          {phaseData?.iconSrc
            ? <img src={phaseData.iconSrc} alt={phaseData?.name} style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 10px ${phaseColor})` }} />
            : (phaseData?.icon || "👹")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: phaseColor, letterSpacing: 2, fontWeight: 700 }}>
              PHASE {currentPhase}/{phases.length} · {phaseData?.name?.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: phaseColor, fontFamily: "'Cinzel',serif" }}>{Math.round(hpPercent)}%</div>
          </div>
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>{phaseData?.desc}</div>
        </div>
      </div>
      {/* HP Bar */}
      <div style={{ height: 8, background: "#0a0a14", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg,${phaseColor}99,${phaseColor})`,
          width: `${hpPercent}%`,
          transition: "width 0.8s ease",
          boxShadow: `0 0 10px ${phaseColor}66`,
        }} />
        {/* Phase thresholds */}
        {phases.slice(0, -1).map((p, i) => (
          <div key={i} style={{ position: "absolute", top: 0, left: `${p.hp}%`, width: 2, height: "100%", background: "#1e293b", zIndex: 2 }} />
        ))}
      </div>
      {/* Phase dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i + 1 < currentPhase ? "#22c55e" : i + 1 === currentPhase ? p.color : "#1e293b",
            transition: "all 0.4s",
            boxShadow: i + 1 === currentPhase ? `0 0 6px ${p.color}` : "none",
          }} />
        ))}
      </div>
    </div>
  );
}

// ═══ SPRINT 3: DUNGEON BATTLE ═════════════════════════════════
function DungeonBattle({ dungeon, playerStats, theme, onResult, onClose, skillBonuses, modifier, formationBonus, state, persist, notify, onTrigger3D, startAutomatically, onClearStartAuto }) {
  const [phase, setPhase] = useState("strategy");
  const [strategy, setStrategy] = useState(STRATEGIES[0]);
  const [battleLog, setBattleLog] = useState([]);
  const [result, setResult] = useState(null);
  const [portalRot, setPortalRot] = useState(0);
  const [equipDrop, setEquipDrop] = useState(null);
  const animRef = useRef(null);
  // Sprint 3 state
  const [floorPlan] = useState(() => generateFloorPlan(dungeon));
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorsCompleted, setFloorsCompleted] = useState([]);
  const [bossPhase, setBossPhase] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [showExtraction, setShowExtraction] = useState(false);
  const [goldBonus, setGoldBonus] = useState(0);

  const rankData = RANKS.find(r => r.name === dungeon.rank) || RANKS[0];
  const bossPhaseDefs = BOSS_PHASES[dungeon.rank] || BOSS_PHASES.E;
  const jobBonuses = getJobBonuses(state);
  const chance = calcSuccessChance(dungeon, playerStats, strategy.key, skillBonuses, modifier, formationBonus, jobBonuses, state?.level || 1);
  const chanceLabel = chance >= 65 ? "HIGH" : chance >= 40 ? "MEDIUM" : "RISKY";
  const chanceColor = chance >= 65 ? "#22c55e" : chance >= 40 ? "#f59e0b" : "#ef4444";

  // Archmage Insight: Best strategy
  const isInsightActive = jobBonuses.autoSolvePuzzle || (state.jobs.activeAbilityCooldowns?.insight && Date.now() < state.jobs.activeAbilityCooldowns.insight + 43200000);
  const bestStrat = isInsightActive ? CATEGORIES.reduce((best, cur) => {
    const curChance = calcSuccessChance(dungeon, playerStats, cur.key, skillBonuses, modifier, formationBonus, jobBonuses, state?.level || 1);
    return curChance > best.chance ? { key: cur.key, chance: curChance } : best;
  }, { key: "", chance: -1 }) : null;

  useEffect(() => {
    if (phase !== "entering") return;
    let rot = 0;
    const spin = () => { rot += 2; setPortalRot(rot); animRef.current = requestAnimationFrame(spin); };
    animRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const addLog = (log) => setBattleLog(prev => [...prev, log]);

  useEffect(() => {
    if (startAutomatically && phase === "strategy") {
      if (onClearStartAuto) onClearStartAuto();
      startBattle();
    }
  }, [startAutomatically, phase, onClearStartAuto]);

  const handleEnterClick = () => {
    if (onTrigger3D) onTrigger3D();
    else startBattle();
  };

  const startBattle = () => {
    setPhase("entering");
    setTimeout(() => { setPhase("floors"); runNextFloor(1, []); }, 2400);
  };

  const runNextFloor = (floorNum, completedSoFar) => {
    const fl = floorPlan[floorNum - 1];
    if (!fl) { finishAllFloors(completedSoFar); return; }
    setCurrentFloor(floorNum);
    setBattleLog([]);

    const isStrong = (playerStats[strategy.key] || 0) >= (dungeon.requirements[dungeon.primaryStat] || 10) * 1.4;
    const isWeak = (playerStats[strategy.key] || 0) < (dungeon.requirements[dungeon.primaryStat] || 10) * 0.6;

    if (fl.type === "boss_arena") {
      // Boss fight with phases
      setBossHp(100);
      setBossPhase(1);
      setPhase("boss");
      runBossPhase(1, completedSoFar, isStrong, isWeak, floorNum);
      return;
    }

    if (fl.type === "safe_room") {
      const safeLog = [
        { text: `▶ FLOOR ${floorNum}/${dungeon.floors} · 🏕️ SAFE ROOM`, type: "success" },
        { text: "Die Shadow Army erholt sich. Kräfte wiederhergestellt.", type: "success" },
        { text: "Taktische Neuausrichtung abgeschlossen.", type: "info" },
      ];
      let delay = 0;
      safeLog.forEach((l, i) => setTimeout(() => addLog(l), delay += 600));
      setTimeout(() => {
        const next = [...completedSoFar, floorNum];
        setFloorsCompleted(next);
        setTimeout(() => runNextFloor(floorNum + 1, next), 800);
      }, delay + 800);
      return;
    }

    if (fl.type === "treasure") {
      const bonus = Math.floor(dungeon.gold * 0.2);
      setGoldBonus(prev => prev + bonus);
      const tLog = [
        { text: <>▶ FLOOR {floorNum}/{dungeon.floors} · <img src="/icon/coin.png" style={{ width: 14, height: 14, verticalAlign: "middle", marginTop: -2 }} alt="G" /> SCHATZKAMMER</>, type: "gold" },
        { text: `Truhe geöffnet! +${bonus} Gold Bonus geborgen.`, type: "gold" },
      ];
      let delay = 0;
      tLog.forEach((l, i) => setTimeout(() => addLog(l), delay += 700));
      setTimeout(() => {
        const next = [...completedSoFar, floorNum];
        setFloorsCompleted(next);
        setTimeout(() => runNextFloor(floorNum + 1, next), 700);
      }, delay + 700);
      return;
    }

    const ft = FLOOR_TYPES[fl.type];
    const logs = [
      { text: `▶ FLOOR ${floorNum}/${dungeon.floors} · ${ft.icon} ${ft.name.toUpperCase()}`, type: "system" },
      { text: `[${strategy.icon} ${strategy.label}] Taktik angewendet`, type: "info" },
      ...getFloorLogs(fl, dungeon, strategy, playerStats, isStrong, isWeak),
      { text: `Floor ${floorNum} abgeschlossen.`, type: "success" },
    ];
    if (modifier && modifier.id !== "none" && floorNum === 1) logs.splice(2, 0, { text: `[MODIFIER] ${modifier.icon} ${modifier.name}`, type: "info" });
    if (formationBonus?.dungeonBonus > 0 && floorNum === 1) logs.splice(2, 0, { text: `[SHADOW] +${formationBonus.dungeonBonus}% Formation-Bonus`, type: "shadow" });

    let delay = 0;
    logs.forEach((l, i) => setTimeout(() => addLog(l), delay += 750));
    setTimeout(() => {
      const next = [...completedSoFar, floorNum];
      setFloorsCompleted(next);
      setTimeout(() => runNextFloor(floorNum + 1, next), 900);
    }, delay + 700);
  };

  const runBossPhase = (pNum, completedSoFar, isStrong, isWeak, floorNum) => {
    const ph = bossPhaseDefs[pNum - 1];
    if (!ph) { finishBoss(completedSoFar, floorNum); return; }
    setBossPhase(pNum);
    const hpAtPhaseEnd = pNum < bossPhaseDefs.length ? bossPhaseDefs[pNum].hp : 0;

    const phaseLogs = [
      { text: `⚡ BOSS PHASE ${pNum}/${bossPhaseDefs.length} · ${ph.icon} ${ph.name.toUpperCase()}`, type: "danger" },
      { text: ph.desc, type: "warning" },
    ];
    if (pNum === 1) {
      if (isStrong) phaseLogs.push({ text: `${strategy.icon} Überlegene Kraft! Boss zurückgedrängt!`, type: "success" });
      else if (isWeak) phaseLogs.push({ text: "⚠ Kritisches Defizit! Boss dominiert!", type: "danger" });
      else phaseLogs.push({ text: `${strategy.icon} Harter Kampf gegen den Boss...`, type: "action" });
    } else {
      phaseLogs.push({ text: `Boss verstärkt! ATK-Multiplikator ×${ph.atkMod}!`, type: "danger" });
      phaseLogs.push({ text: isStrong ? `${strategy.icon} Entschlossener Gegenschlag!` : "Alle Kräfte mobilisiert – durchhalten!", type: isStrong ? "success" : "action" });
    }

    let delay = 0;
    phaseLogs.forEach((l, i) => setTimeout(() => addLog(l), delay += 800));

    // Animate HP
    const targetHp = hpAtPhaseEnd;
    setTimeout(() => setBossHp(targetHp), delay + 400);

    if (pNum < bossPhaseDefs.length) {
      setTimeout(() => {
        addLog({ text: `Boss-Energie übersteigt Grenzwert... Phase ${pNum + 1} aktiviert!`, type: "danger" });
        setTimeout(() => runBossPhase(pNum + 1, completedSoFar, isStrong, isWeak, floorNum), 1200);
      }, delay + 1800);
    } else {
      setTimeout(() => finishBoss(completedSoFar, floorNum), delay + 1800);
    }
  };

  const finishBoss = (completedSoFar, floorNum) => {
    const won = Math.random() * 100 < chance;
    const next = [...completedSoFar, floorNum];
    setFloorsCompleted(next);
    if (won) {
      setBossHp(0);
      setTimeout(() => setShowExtraction(true), 800);
      setTimeout(() => setShowExtraction(false), 3200);
      setTimeout(() => finishAllFloors(next, true), 3400);
    } else {
      addLog({ text: "💀 HUNTER DEFEATED – Niederlage...", type: "danger" });
      setTimeout(() => finishAllFloors(next, false), 1500);
    }
  };

  const finishAllFloors = (completedFloors, bossWon = undefined) => {
    const won = bossWon !== undefined ? bossWon : Math.random() * 100 < chance;
    const xpMult = modifier?.xpMult || 1;
    const goldMult = modifier?.goldMult || 1;
    const bonusXp = Math.floor(completedFloors.length / dungeon.floors * dungeon.xp * 0.15);
    const xpResult = won ? Math.round(dungeon.xp * xpMult + bonusXp) : Math.round(dungeon.xp * 0.08);
    const goldResult = won ? Math.round((dungeon.gold + goldBonus) * goldMult) : 0;
    const drop = won ? getEquipDropForDungeon(dungeon.rank) : null;
    setEquipDrop(drop);
    setResult({ won, xp: xpResult, gold: goldResult, drop, floorsCleared: completedFloors.length, totalFloors: dungeon.floors, goldBonus, strategy: strategy.key });
    setPhase("result");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,2,8,0.97)", backdropFilter: "blur(8px)", animation: "fadeIn 0.3s", overflowY: "auto" }}>

      {/* EXTRACTION CINEMATIC */}
      {showExtraction && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s" }}>
          <div style={{ animation: "float 1s ease-in-out infinite" }}><img src={GATE_ICONS.normal} alt="Extraction" style={{ width: 88, height: 88, objectFit: "contain", filter: "drop-shadow(0 0 30px #22c55e) hue-rotate(120deg) brightness(1.2)", animation: "spin 3s linear infinite" }} /></div>
          <div style={{ fontSize: 14, letterSpacing: 8, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", animation: "breathe 0.6s infinite" }}>EXTRACTION</div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>DUNGEON VERLASSEN...</div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: `breathe 0.8s infinite`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {phase === "strategy" && (
        <div style={{ width: "100%", maxWidth: 440, padding: "0 20px", animation: "slideUp 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ marginBottom: 10, filter: `drop-shadow(0 0 20px ${rankData.color})`, animation: "gateFloat 2s ease-in-out infinite", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `2px solid ${rankData.color}`, boxShadow: `0 0 20px ${rankData.color}88, inset 0 0 16px ${rankData.color}66`, overflow: "hidden", background: "#0a0814" }}>
                <img src={getDungeonGateImage(dungeon)} alt={dungeon.name} style={{ width: "160%", height: "160%", objectFit: "cover", mixBlendMode: "screen", filter: `brightness(1.5) contrast(1.2)` }} />
              </div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{dungeon.rank}-RANK · {dungeon.floors} FLOORS</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>{dungeon.name}</div>
            {modifier && modifier.id !== "none" && <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: modifier.color + "15", border: `1px solid ${modifier.color}33`, fontSize: 11, color: modifier.color, fontFamily: "'JetBrains Mono',monospace" }}>{modifier.iconSrc ? <img src={modifier.iconSrc} alt={modifier.name} style={{ width: 14, height: 14, objectFit: "contain", filter: `drop-shadow(0 0 4px ${modifier.color}88)` }} /> : modifier.icon} {modifier.name}</div>}
            {formationBonus?.dungeonBonus > 0 && <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "#7c3aed15", border: "1px solid #7c3aed33", fontSize: 11, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace" }}><img src={SHADOW_ICONS.soldier} alt="Shadow" style={{ width: 14, height: 14, objectFit: "contain", filter: "drop-shadow(0 0 4px #a78bfa88) brightness(0.6) invert(1)" }} /> Shadow Army +{formationBonus.dungeonBonus}%</div>}
          </div>
          {/* Floor Preview */}
          <div style={{ background: "rgba(6,6,14,0.9)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1px solid #1e2940" }}>
            <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 8 }}>FLOOR-VORSCHAU</div>
            <div style={{ display: "flex", gap: 3 }}>
              {floorPlan.map((f, i) => {
                const ft = FLOOR_TYPES[f.type];
                return (
                  <div key={i} style={{
                    flex: f.type === "boss_arena" ? 2 : 1,
                    background: ft.color + "18", border: `1px solid ${ft.color}44`,
                    borderRadius: 6, padding: "5px 4px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {ft.iconSrc
                        ? <img src={ft.iconSrc} alt={ft.name} style={{ width: 14, height: 14, objectFit: "contain" }} />
                        : ft.icon}
                    </div>
                    <div style={{ fontSize: 6, color: ft.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>F{f.floor}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>STRATEGIE WäHLEN</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {STRATEGIES.map(s => {
              const isActive = strategy.key === s.key;
              const isBest = bestStrat?.key === s.key;
              return (
                <button key={s.key} onClick={() => setStrategy(s)} style={{ padding: "14px 12px", borderRadius: 12, textAlign: "left", background: isActive ? s.color + "14" : isBest ? s.color + "08" : "rgba(10,10,20,0.6)", border: `1px solid ${isActive ? s.color + "66" : isBest ? s.color + "33" : "#1e2940"}`, color: isActive ? s.color : isBest ? s.color + "aa" : "#64748b", transition: "all 0.22s", position: "relative" }}>
                  {isBest && <div style={{ position: "absolute", top: -8, right: -6, animation: "pulse 2s infinite" }}><img src={JOB_ICONS.insight} alt="Best" style={{ width: 16, height: 16, objectFit: "contain", filter: "drop-shadow(0 0 5px #f59e0b88)" }} /></div>}
                  <div style={{ fontSize: 22, marginBottom: 6 }}>
                    {s.iconSrc ? (
                      <img src={s.iconSrc} alt={s.label} style={{ width: 32, height: 32, objectFit: "contain", filter: `drop-shadow(0 0 8px ${s.color}77) brightness(${isActive ? 1.2 : 0.85})` }} />
                    ) : s.icon}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                  <div style={{ fontSize: 11, marginTop: 8, fontFamily: "'JetBrains Mono',monospace", color: isActive ? s.color : "#475569" }}>{CATEGORIES.find(c => c.key === s.key)?.stat}: <span style={{ fontWeight: 700 }}>{playerStats[s.key] || 0}</span></div>
                </button>
              );
            })}
          </div>
          <div style={{ background: "rgba(8,8,18,0.9)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: `1px solid ${chanceColor}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>ERFOLGSWAHRSCHEINLICHKEIT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: chanceColor, fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 5, background: chanceColor + "15", border: `1px solid ${chanceColor}33` }}>{chanceLabel}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: chanceColor, fontFamily: "'Cinzel',serif" }}>{chance}%</span>
              </div>
            </div>
            <div style={{ height: 5, background: "#0a0a14", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${chance}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${chanceColor}88,${chanceColor})`, transition: "width 0.4s ease", boxShadow: `0 0 8px ${chanceColor}44` }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 12, background: "transparent", color: "#475569", border: "1px solid #1e2940", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>ABBRECHEN</button>
            <button onClick={handleEnterClick} style={{ flex: 2, padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 700, background: `linear-gradient(135deg,${rankData.color}28,${rankData.color}10)`, color: rankData.color, border: `1px solid ${rankData.color}55`, fontFamily: "'Cinzel',serif", letterSpacing: 2, boxShadow: `0 4px 20px ${rankData.color}18`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><img src={SKILL_ICONS.attack} alt="" style={{ width: 18, height: 18, objectFit: "contain", filter: `drop-shadow(0 0 6px ${rankData.color}88)` }} /> BETRETEN</button>
          </div>
        </div>
      )}

      {phase === "entering" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 28px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${rankData.color}55`, borderTopColor: rankData.color, transform: `rotate(${portalRot}deg)` }} />
            <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: `1px solid ${rankData.color}33`, borderBottomColor: rankData.color + "88", transform: `rotate(${-portalRot * 1.6}deg)` }} />
            <div style={{ position: "absolute", inset: 28, borderRadius: "50%", border: `1px solid ${rankData.color}22`, borderTopColor: rankData.color + "55", transform: `rotate(${portalRot * 0.8}deg)` }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", filter: `drop-shadow(0 0 18px ${rankData.color})` }}>
              <div style={{ width: 86, height: 86, borderRadius: "50%", border: `2px solid ${rankData.color}`, boxShadow: `0 0 15px ${rankData.color}88, inset 0 0 10px ${rankData.color}66`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0814" }}>
                <img src={getDungeonGateImage(dungeon)} alt={dungeon.name} style={{ width: "160%", height: "160%", objectFit: "cover", mixBlendMode: "screen", filter: `brightness(1.5) contrast(1.2)` }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 6, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", animation: "breathe 0.9s infinite" }}>{dungeon.name}</div>
        </div>
      )}

      {(phase === "floors" || phase === "boss") && (
        <div style={{ width: "100%", maxWidth: 440, padding: "0 20px 20px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{dungeon.rank}-RANK · {dungeon.name}</div>
            <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>FLOOR {currentFloor}/{dungeon.floors}</div>
          </div>
          {/* Floor Progress */}
          <FloorProgressBar floors={floorPlan} currentFloor={currentFloor} totalFloors={dungeon.floors} />
          {/* Shadow Step Skip Button */}
          {phase === "floors" && state.jobs?.current === "assassin" && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => {
                  const now = Date.now();
                  const lastUsed = state.jobs.activeAbilityCooldowns?.shadow_step || 0;
                  if (now < lastUsed + 28800000) {
                    notify("Shadow Step auf Cooldown.", "info");
                    return;
                  }
                  // Notify and skip
                  addLog({ text: "✓ SHADOW STEP: Floor übersprungen!", type: "shadow" });
                  setTimeout(() => runNextFloor(currentFloor + 1, [...floorsCompleted, currentFloor]), 1000);
                  // Update cooldown in global state
                  const newCooldowns = { ...state.jobs.activeAbilityCooldowns, shadow_step: now };
                  persist({ ...state, jobs: { ...state.jobs, activeAbilityCooldowns: newCooldowns } });
                }}
                disabled={Date.now() < (state.jobs.activeAbilityCooldowns?.shadow_step || 0) + 28800000}
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 10, fontWeight: 900, background: "rgba(20,184,166,0.15)", color: "#14b8a6", border: "1px solid #14b8a655", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}
              >⚡ SHADOW STEP (SKIP FLOOR)</button>
            </div>
          )}
          {/* Boss Phase UI */}
          {phase === "boss" && <BossPhaseUI rank={dungeon.rank} bossHp={bossHp} bossMaxHp={100} currentPhase={bossPhase} phases={bossPhaseDefs} />}
          {/* Battle Log */}
          <div style={{ background: "rgba(3,3,9,0.95)", border: `1px solid ${phase === "boss" ? "#ef444420" : "#0f1628"}`, borderRadius: 14, padding: "16px 16px", minHeight: 180, maxHeight: 300, overflowY: "auto", fontFamily: "'JetBrains Mono',monospace" }}>
            {battleLog.map((log, i) => {
              const colors = { system: "#6366f1", info: "#22d3ee", warning: "#f59e0b", danger: "#ef4444", success: "#22c55e", action: "#e2e8f0", shadow: "#a78bfa", gold: "#fbbf24" };
              return (
                <div key={i} style={{ fontSize: 11, color: colors[log.type] || "#e2e8f0", marginBottom: 10, animation: "battleLogIn 0.4s ease", display: "flex", gap: 8 }}>
                  <span style={{ color: "#1e293b", flexShrink: 0 }}>&gt;</span><span style={{ lineHeight: 1.5 }}>{log.text}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><span style={{ color: "#1e293b", fontSize: 12 }}>&gt;</span><div style={{ width: 7, height: 13, background: "#6366f1", animation: "cursorBlink 1s infinite" }} /></div>
          </div>
          {/* Floor progress indicator */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>{floorsCompleted.length}/{dungeon.floors} FLOORS</div>
            <div style={{ flex: 1, height: 2, background: "#0a0a14", borderRadius: 1, overflow: "hidden", maxWidth: 120 }}>
              <div style={{ height: "100%", background: rankData.color, borderRadius: 1, width: `${(floorsCompleted.length / dungeon.floors) * 100}%`, transition: "width 0.6s ease" }} />
            </div>
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div style={{ textAlign: "center", padding: "0 24px", width: "100%", maxWidth: 420, animation: "dungeonResultIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize: 72, marginBottom: 12, filter: `drop-shadow(0 0 28px ${result.won ? "#22c55e" : "#ef4444"})`, animation: "gateFloat 2s ease-in-out infinite" }}>
            <img src={result.won ? NAV_ICONS.achievements : BOSS_ICONS.deathsdoor} alt={result.won ? "Victory" : "Defeat"} style={{ width: 80, height: 80, objectFit: "contain", filter: `drop-shadow(0 0 28px ${result.won ? "#22c55e" : "#ef4444"})` }} />
          </div>
          <div style={{ fontSize: result.won ? 28 : 22, fontWeight: 900, fontFamily: "'Cinzel',serif", color: result.won ? "#22c55e" : "#ef4444", textShadow: `0 0 32px ${result.won ? "#22c55e" : "#ef4444"}`, marginBottom: 6, letterSpacing: 2 }}>{result.won ? "DUNGEON CLEARED" : "HUNTER DEFEATED"}</div>
          {/* Floors stat */}
          <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 14 }}>
            {result.floorsCleared}/{result.totalFloors} FLOORS CONQUERED
          </div>
          <div style={{ background: "rgba(8,8,18,0.9)", border: `1px solid ${result.won ? "#22c55e22" : "#ef444422"}`, borderRadius: 14, padding: "16px 20px", marginBottom: 12, display: "flex", justifyContent: "center", gap: 28 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 5 }}>XP</div><div style={{ fontSize: 24, fontWeight: 900, color: result.won ? "#a78bfa" : "#334155", fontFamily: "'Cinzel',serif" }}>+{result.xp}</div></div>
            <div style={{ width: 1, background: "#0f1628" }} />
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 5 }}>GOLD</div><div style={{ fontSize: 24, fontWeight: 900, color: result.won ? "#fbbf24" : "#334155", fontFamily: "'Cinzel',serif" }}>+{result.gold}</div></div>
            {result.goldBonus > 0 && <>
              <div style={{ width: 1, background: "#0f1628" }} />
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 5 }}>BONUS</div><div style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>+{Math.round(result.goldBonus * (modifier?.goldMult || 1))}</div></div>
            </>}
          </div>
          {result.drop && (
            <div style={{ background: "rgba(8,8,18,0.9)", border: `1px solid ${RARITY_COLORS[result.drop.rarity]}33`, borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              {result.drop.iconSrc ? (
                <img src={result.drop.iconSrc} alt={result.drop.name} style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0, filter: `drop-shadow(0 0 10px ${RARITY_COLORS[result.drop.rarity]}88) brightness(1.15)` }} />
              ) : (
                <span style={{ fontSize: 26 }}>{result.drop.icon}</span>
              )}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 9, color: RARITY_COLORS[result.drop.rarity], fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 2 }}>{RARITY_LABELS[result.drop.rarity].toUpperCase()} DROP</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{result.drop.name}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{result.drop.desc}</div>
              </div>
            </div>
          )}
          <button onClick={() => onResult(result)} style={{ width: "100%", padding: 16, borderRadius: 14, fontSize: 13, fontWeight: 700, background: result.won ? "linear-gradient(135deg,rgba(34,197,94,0.25),rgba(34,197,94,0.08))" : "linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.08))", color: result.won ? "#22c55e" : "#ef4444", border: `1px solid ${result.won ? "#22c55e44" : "#ef444444"}`, fontFamily: "'Cinzel',serif", letterSpacing: 2, animation: result.won ? "extractionPulse 2s infinite" : "none" }}>{result.won ? "⬡ EXTRACTION ABSCHLIESSEN" : "DUNGEON VERLASSEN"}</button>
        </div>
      )}
    </div>
  );
}

// ═══ JOBS UI ══════════════════════════════════════════════════
function JobCard({ jobKey, level, xp, currentJob, onSwitch, onActivate, theme, requirementsMet, cooldowns }) {
  const job = JOBS[jobKey];
  const isCurrent = currentJob === jobKey;
  const nextXp = JOB_XP_LEVELS[level + 1] || JOB_XP_LEVELS[level];
  const progress = Math.min((xp / nextXp) * 100, 100);
  const title = JOB_TITLES[level] || "Novize";
  const ability = job.activeAbility;

  const lastUsed = cooldowns?.[ability.key] || 0;
  const now = Date.now();
  const isOnCooldown = now < (lastUsed + (ability.cooldown * 1000));
  const remaining = Math.max(0, Math.ceil((lastUsed + (ability.cooldown * 1000) - now) / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);

  return (
    <div style={{
      background: isCurrent ? `linear-gradient(135deg, ${job.color}15, ${theme.card})` : theme.card,
      border: `1px solid ${isCurrent ? job.color + "66" : theme.primary + "12"}`,
      borderRadius: 18, padding: "20px", marginBottom: 12, position: "relative", overflow: "hidden",
      backdropFilter: "blur(12px)", transition: "all 0.3s ease",
      opacity: requirementsMet ? 1 : 0.6,
      boxShadow: isCurrent ? `0 0 30px ${job.color}15` : "none"
    }}>
      {isCurrent && (
        <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, color: job.color, fontWeight: 700, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", animation: "pulse 2s infinite" }}>
          AKTIVE SPEZIALISIERUNG
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${job.color}18, ${job.color}06)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${job.color}${isCurrent ? "55" : "28"}`, boxShadow: isCurrent ? `0 0 24px ${job.color}33, inset 0 0 12px ${job.color}0a` : "none", flexShrink: 0 }}>
          {job.iconSrc ? (
            <img src={job.iconSrc} alt={job.name} style={{ width: 44, height: 44, objectFit: "contain", filter: `drop-shadow(0 0 10px ${job.color}66) brightness(1.1)` }} />
          ) : (
            <span style={{ fontSize: 32 }}>{job.icon}</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, color: job.color, fontWeight: 700, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{title.toUpperCase()}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif" }}>{job.name}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>Lv. {level} / 10</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 6, background: "#0f0f1e", borderRadius: 3, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: job.color, boxShadow: `0 0 15px ${job.color}88`, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>

      {/* Bonuses */}
      <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 14, padding: "14px", marginBottom: 18, border: `1px solid ${job.color}11` }}>
        <div style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>PASSIVE BONI & SYNERGIEN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(job.passives).map(([key, p], i) => {
            const isUnlocked = key === 'base' || (level >= parseInt(key.replace('level', '')) || 0);
            return (
              <div key={i} style={{
                fontSize: 11, color: isUnlocked ? "#cbd5e1" : "#475569",
                display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.4,
                opacity: isUnlocked ? 1 : 0.5
              }}>
                <div style={{
                  fontSize: 8, padding: "2px 5px", borderRadius: 4,
                  background: isUnlocked ? `${job.color}22` : "rgba(255,255,255,0.05)",
                  color: isUnlocked ? job.color : "#334155",
                  minWidth: 45, textAlign: "center", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {key === 'base' ? 'BASIS' : `LV.${key.replace('level', '')}`}
                </div>
                <span>{p}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Ability */}
      <div style={{ background: `${job.color}08`, border: `1px solid ${job.color}22`, borderRadius: 16, padding: "16px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {ability.iconSrc ? (
              <img src={ability.iconSrc} alt={ability.name} style={{ width: 22, height: 22, objectFit: "contain", filter: `drop-shadow(0 0 6px ${job.color}88)` }} />
            ) : (
              <span style={{ fontSize: 18 }}>⚡</span>
            )}
            <div style={{ fontSize: 13, fontWeight: 800, color: job.color, fontFamily: "'Cinzel', serif" }}>{ability.name}</div>
          </div>
          <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono', monospace", background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: 4 }}>
            COOLDOWN: {ability.cooldown / 3600}h
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 14, fontStyle: "italic" }}>"{ability.desc}"</div>

        {isCurrent ? (
          <button
            onClick={() => onActivate(jobKey)}
            disabled={isOnCooldown || level < ability.unlockLevel}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, fontSize: 11, fontWeight: 800,
              background: isOnCooldown || level < ability.unlockLevel ? "rgba(255,255,255,0.02)" : `linear-gradient(135deg, ${job.color}dd, ${job.color}aa)`,
              color: isOnCooldown || level < ability.unlockLevel ? "#334155" : "#fff",
              border: `1px solid ${isOnCooldown || level < ability.unlockLevel ? "rgba(255,255,255,0.05)" : job.color + "44"}`,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, cursor: isOnCooldown || level < ability.unlockLevel ? "not-allowed" : "pointer",
              boxShadow: isOnCooldown || level < ability.unlockLevel ? "none" : `0 4px 15px ${job.color}33`,
              transition: "all 0.3s"
            }}
          >
            {level < ability.unlockLevel ? `FREISCHALTUNG BEI LV. ${ability.unlockLevel}` : isOnCooldown ? `${h}h ${m}m VERBLEIBEND` : "FäHIGKEIT AKTIVIEREN"}
          </button>
        ) : (
          <button
            onClick={() => onSwitch(jobKey)}
            disabled={!requirementsMet}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, fontSize: 11, fontWeight: 800,
              background: requirementsMet ? "rgba(255,255,255,0.05)" : "transparent",
              color: requirementsMet ? "#fff" : "#334155",
              border: `1px solid ${requirementsMet ? job.color + "44" : "rgba(255,255,255,0.05)"}`,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, cursor: requirementsMet ? "pointer" : "not-allowed"
            }}
          >
            {requirementsMet ? "DIESEN JOB WÄHLEN" : "VORAUSSETZUNGEN NICHT ERFÜLLT"}
          </button>
        )}
      </div>
    </div>
  );
}

function JobsView({ state, onSwitch, onActivate, theme }) {
  const currentJob = state.jobs?.current;

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ marginBottom: 24, padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={NAV_ICONS.jobs} alt="Jobs" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(1.3)" }} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", letterSpacing: 4 }}>JOB SYSTEM</h2>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>W├ñhle eine Spezialisierung ab Level 15 um deine Macht als Hunter zu perfektionieren. Jeder Job bietet einzigartige Synergien mit deinem Shadow-System.</p>
      </div>

      {state.level < 15 && (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderLeft: "4px solid #ef4444", borderRadius: 14, padding: "18px", marginBottom: 24, backdropFilter: "blur(8px)" }}>
          <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, marginBottom: 6, letterSpacing: 2 }}>ZUGRIFF VERWEIGERT</div>
          <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.5 }}>Das Job-System wird erst ab Level 15 freigeschaltet. Trainiere h├ñrter, Hunter. <br /><span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>Aktuelles Level: {state.level} / 15</span></div>
        </div>
      )}

      {Object.keys(JOBS).map(jobKey => {
        const req = JOBS[jobKey].unlockRequirement;
        let requirementsMet = state.level >= req.level;

        // Spezielle Requirements pr├╝fen
        if (req.allJobsLevel5) {
          const allLevels = state.jobs?.levels || {};
          const otherJobs = Object.keys(JOBS).filter(k => k !== "necromancer");
          requirementsMet = requirementsMet && otherJobs.every(k => (allLevels[k] || 0) >= 5);
        }
        if (req.minShadows) {
          requirementsMet = requirementsMet && (state.shadowArmy?.shadows?.length || 0) >= req.minShadows;
        }

        return (
          <JobCard
            key={jobKey}
            jobKey={jobKey}
            level={state.jobs?.levels?.[jobKey] || 0}
            xp={state.jobs?.xp?.[jobKey] || 0}
            currentJob={currentJob}
            onSwitch={onSwitch}
            onActivate={onActivate}
            theme={theme}
            requirementsMet={!!requirementsMet}
            cooldowns={state.jobs?.activeAbilityCooldowns}
          />
        );
      })}
    </div>
  );
}

function JobLevelUpCinematic({ job, newLevel, onClose }) {
  const title = JOB_TITLES[newLevel] || "Meister";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(1, 0, 5, 0.98)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer", animation: "fadeIn 0.5s ease" }}>
      <div style={{ textAlign: "center", maxWidth: 400, animation: "slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
        <div style={{ fontSize: 80, marginBottom: 20, animation: "float 3s infinite" }}>
          {job.iconSrc ? (
            <img src={job.iconSrc} alt={job.name} style={{ width: 100, height: 100, objectFit: "contain", filter: `drop-shadow(0 0 30px ${job.color}) drop-shadow(0 0 15px ${job.color}88) brightness(1.2)` }} />
          ) : (
            <span style={{ filter: `drop-shadow(0 0 30px ${job.color})` }}>{job.icon}</span>
          )}
        </div>
        <div style={{ fontSize: 12, letterSpacing: 8, color: job.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, animation: "pulse 2s infinite" }}>JOB LEVEL UP</div>
        <h2 style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", marginBottom: 8 }}>{job.name}</h2>
        <div style={{ fontSize: 20, color: job.color, fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 4, marginBottom: 32 }}>{title.toUpperCase()} (LV. {newLevel})</div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${job.color}33`, borderRadius: 16, padding: "20px", marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>NEUE KRäFTE FREIGESCHALTET</div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>Boni wurden verstärkt. Spezialisierung vertieft.</div>
        </div>

        <button style={{ background: job.color, color: "#fff", padding: "14px 40px", borderRadius: 14, fontSize: 13, fontWeight: 900, fontFamily: "'Cinzel', serif", letterSpacing: 4, border: "none", boxShadow: `0 0 40px ${job.color}44` }}>WEITER</button>
      </div>
    </div>
  );
}

function AbilityActivationCinematic({ ability, job, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(1, 0, 5, 0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer", animation: "fadeIn 0.4s ease" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            width: 2, height: 20 + Math.random() * 100, background: job.color, opacity: 0.3,
            transform: `rotate(${45 + Math.random() * 10}deg)`, animation: `skillFlow ${1 + Math.random()}s infinite linear`
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center", animation: "scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
        <div style={{ fontSize: 100, marginBottom: 20, animation: "pulse 1.5s infinite" }}>
          {ability.iconSrc ? (
            <img src={ability.iconSrc} alt={ability.name} style={{ width: 120, height: 120, objectFit: "contain", filter: `drop-shadow(0 0 40px ${job.color}) drop-shadow(0 0 20px ${job.color}88) brightness(1.2)` }} />
          ) : (
            <span style={{ filter: `drop-shadow(0 0 40px ${job.color})` }}>{ability.icon || "✓¿"}</span>
          )}
        </div>
        <div style={{ fontSize: 14, letterSpacing: 6, color: job.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>FäHIGKEIT AKTIVIERT</div>
        <h2 style={{ fontSize: 48, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", textShadow: `0 0 20px ${job.color}`, marginBottom: 16 }}>{ability.name.toUpperCase()}</h2>
        <div style={{ fontSize: 16, color: "#94a3b8", fontStyle: "italic", maxWidth: 300, margin: "0 auto" }}>"{ability.desc}"</div>
      </div>
    </div>
  );
}

function SystemCLI({ message, onClose }) {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentLineIndex < message.lines.length) {
      const currentLine = message.lines[currentLineIndex];
      if (currentCharIndex < currentLine.length) {
        const timeout = setTimeout(() => {
          setDisplayedLines(prev => {
            const next = [...prev];
            next[currentLineIndex] = (next[currentLineIndex] || "") + currentLine[currentCharIndex];
            return next;
          });
          setCurrentCharIndex(prev => prev + 1);
        }, 25);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }, 350);
        return () => clearTimeout(timeout);
      }
    } else {
      setIsComplete(true);
    }
  }, [currentLineIndex, currentCharIndex, message.lines]);

  const ac = "#6366f1";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(2, 2, 6, 0.88)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.3s ease" }}>
      {/* Ambient noise */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 600, background: "linear-gradient(180deg, rgba(10, 8, 22, 0.98), rgba(6, 4, 16, 0.99))", border: `1px solid ${ac}33`, borderTop: `2px solid ${ac}88`, borderRadius: 14, padding: "26px 28px", boxShadow: `0 0 50px ${ac}15, 0 0 120px ${ac}06, 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`, position: "relative", overflow: "hidden" }}>
        {/* Holographic top shimmer */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${ac}44, ${ac}88, ${ac}44, transparent)`, backgroundSize: "200% 100%", animation: "qcHoloShimmer 2.5s linear infinite" }} />

        {/* Scanline effect */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)", pointerEvents: "none", opacity: 0.4 }} />

        {/* Traveling scan */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent 15%, ${ac}44 50%, transparent 85%)`, animation: "qcScanLine 2.5s linear infinite", pointerEvents: "none" }} />

        {/* Side glow */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1, background: `linear-gradient(180deg, ${ac}55, transparent 30%, transparent 70%, ${ac}22)` }} />

        {/* Corner decorations */}
        <div style={{ position: "absolute", top: 8, left: 8, width: 14, height: 14, borderTop: `1px solid ${ac}44`, borderLeft: `1px solid ${ac}44`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 8, right: 8, width: 14, height: 14, borderTop: `1px solid ${ac}44`, borderRight: `1px solid ${ac}44`, pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: `1px solid ${ac}18`, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: ac, boxShadow: `0 0 10px ${ac}, 0 0 20px ${ac}88`, animation: "pulse 1.2s infinite" }} />
            <div style={{ fontSize: 12, color: ac, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: 4, position: "relative" }}>
              SYSTEM NACHRICHT
              <span style={{ position: "absolute", left: 1.5, top: 0, color: "rgba(255,50,50,0.12)", pointerEvents: "none", animation: "qcTextGlitch 4s step-end infinite" }}>SYSTEM NACHRICHT</span>
            </div>
          </div>
          <button onClick={() => { if (message.onComplete) message.onComplete(); onClose(); }} style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace", background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 4, transition: "color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#475569"; }}
          >[ SKIP ✕ ]</button>
        </div>

        <div style={{ minHeight: 120, marginBottom: 24 }}>
          {displayedLines.map((line, i) => (
            <div key={i} style={{ color: i === 0 && message.title ? "#f1f5f9" : "#b4bfcc", fontSize: i === 0 && message.title ? 18 : 14, fontWeight: i === 0 && message.title ? 900 : 400, fontFamily: i === 0 && message.title ? "'Cinzel', serif" : "'JetBrains Mono', monospace", marginBottom: 12, lineHeight: 1.7, display: "flex", gap: 10 }}>
              <span style={{ color: `${ac}44`, flexShrink: 0, userSelect: "none" }}>›</span>
              <span style={{ textShadow: i === 0 && message.title ? `0 0 8px ${ac}22` : "none" }}>{line}</span>
            </div>
          ))}
          {!isComplete && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ color: `${ac}44`, fontSize: 12 }}>›</span>
              <div style={{ width: 8, height: 16, background: ac, animation: "cursorBlink 0.7s step-end infinite", boxShadow: `0 0 8px ${ac}88, 0 0 16px ${ac}33`, borderRadius: 1 }} />
            </div>
          )}
        </div>

        {isComplete && (
          <button onClick={() => { if (message.onComplete) message.onComplete(); onClose(); }} style={{ width: "100%", padding: "14px", borderRadius: 10, background: `linear-gradient(135deg, ${ac}15, ${ac}08)`, color: ac, border: `1px solid ${ac}44`, fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3, cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden", boxShadow: `0 0 20px ${ac}11` }}
            onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${ac}25, ${ac}12)`; e.currentTarget.style.boxShadow = `0 0 30px ${ac}22`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${ac}15, ${ac}08)`; e.currentTarget.style.boxShadow = `0 0 20px ${ac}11`; }}
          >
            <div style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", animation: "shimmer 2.5s ease-in-out infinite", pointerEvents: "none" }} />
            [ NACHRICHT BESTÄTIGEN ]
          </button>
        )}
      </div>
    </div>
  );
}

// ── JSX COMPONENT EXPORTS ─────────────────────────────────────────────────────
// All data/helper symbols are already exported via the re-export statements at
// the top of this barrel file. Only the React components defined locally below
// need to be exported here.

export {
  ParticleField, MusicPlayer, SystemNotification, AchievementToast, XpFloat,
  LevelUpCinematic, AriseCinematic,
  ShadowCard, ShadowDetailModal, FormationEditor, StatRadar, QuestTimer, QuestTypeBadge,
  EmergencyQuestCard, ChainedQuestProgress, QuestCard, DungeonGate, FloorProgressBar, BossPhaseUI, DungeonBattle,
  JobCard, JobsView, JobLevelUpCinematic, AbilityActivationCinematic, SystemCLI
};


