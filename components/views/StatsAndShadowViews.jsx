import React from "react";
import { CATEGORIES, SHADOW_TIERS, NAMED_SHADOWS, SHADOW_CLASSES, FORMATION_SLOTS, SKILLS } from "../../data/gameData.js";
import { ARTIFACT_POOL } from "../../data/artifactHelpers.js";
import { STAT_ICONS, SHADOW_ICONS, SKILL_ICONS } from "../../data/icons.js";
import { StatRadar, ShadowCard, FormationEditor, ShadowDetailModal } from "../../data/constants";
import { checkSkillUnlocks } from "../../data/helpers.js";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { getLocalizedCatalog } from "../../data/localizedGameData.js";
import { isFeatureUnlocked } from "../../data/featureUnlocks.js";
import HiddenAchievementsGallery from "../HiddenAchievementsGallery.jsx";

/**
 * StatsView – rendered when view === "stats".
 */
export function StatsView({ state, theme, equipBonuses, powerLevel, increaseStat }) {
  const { t, locale } = useI18n();
  const { categories, skills } = React.useMemo(() => getLocalizedCatalog(locale), [locale]);
  const unlockedSkills = skills.filter(sk => (state?.stats?.[sk.stat] || 0) >= sk.threshold);
  const discoveredArtifacts = state?.artifacts?.discovered || [];
  return (
    <div data-tutorial="stats-view" style={{ animation: "fadeIn 0.35s ease" }}>
      <div data-tutorial="stats-overview" style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "20px", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", backdropFilter: "blur(12px)", position: "relative" }}>
        {state.statPoints > 0 && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "#f59e0b22", border: "1px solid #f59e0b44", padding: "4px 10px", borderRadius: 20, fontSize: 10, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, animation: "pulse 1.5s infinite" }}>
            {t("stats.pointsAvailable", { count: state.statPoints })}
          </div>
        )}
        <StatRadar stats={state.stats} theme={theme} size={200} />
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap", justifyContent: "center", marginTop: 4, width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: 12, overflow: "hidden" }}>
          {[{ label: t("stats.totalXp"), value: (state.totalXpEarned || 0).toLocaleString(), color: theme.accent }, { label: t("stats.quests"), value: state.totalQuestsCompleted || 0, color: theme.accent }, { label: t("stats.streak"), value: `${state.streak}d`, color: "#f59e0b" }, { label: t("stats.powerLevel"), value: powerLevel, color: "#e879f9" }, { label: t("stats.cleared"), value: (state.dungeonHistory || []).filter(d => d.won).length, color: "#22d3ee" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 10px", flex: "1 0 33%", background: `radial-gradient(135deg, ${s.color}08 0%, transparent 100%)`, border: `1px solid ${s.color}15`, boxShadow: `inset 0 0 10px ${s.color}05` }}>
              <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4, letterSpacing: 1.5 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: "'Cinzel',serif", textShadow: `0 0 12px ${s.color}66` }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div data-tutorial="stats-attributes-list">
        {categories.map((cat, i) => {
          const val = (state.stats[cat.key] || 0) + (equipBonuses[cat.key + "Bonus"] || 0);
          const base = state.stats[cat.key] || 0;
          const maxD = Math.max(val, 50);
          return (
            <div key={cat.key} data-tutorial={i === 0 ? "stats-attributes" : undefined} style={{ background: `radial-gradient(120% 100% at 50% 0%, ${cat.color}15 0%, rgba(10,10,24,0.7) 100%)`, border: `1px solid ${cat.color}25`, borderRadius: 16, padding: "16px", marginBottom: 12, backdropFilter: "blur(12px)", boxShadow: `0 8px 32px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.05)`, animation: `cardEnter 0.4s ease ${i * 0.06}s both`, transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + "55"; e.currentTarget.style.boxShadow = `0 12px 40px ${cat.color}15, inset 0 1px 0 rgba(255,255,255,0.1)`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = cat.color + "25"; e.currentTarget.style.boxShadow = `0 8px 32px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.05)`; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle, ${cat.color}18, transparent)`, border: `1px solid ${cat.color}25`, overflow: "hidden", flexShrink: 0 }}>
                  {cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15) drop-shadow(0 0 4px ${cat.color}55)`, transform: "scale(1.1)" }} /> : <span style={{ fontSize: 22 }}>{cat.icon}</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{cat.full}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {state.statPoints > 0 && (
                  <button onClick={() => increaseStat(cat.key)} style={{ width: 26, height: 26, borderRadius: 6, background: cat.color + "22", border: `1px solid ${cat.color}44`, color: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, cursor: "pointer", transition: "all 0.2s" }}>+</button>
                )}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: cat.color, fontFamily: "'Cinzel',serif" }}>{val}</div>
                  {equipBonuses[cat.key + "Bonus"] > 0 && <div style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace" }}>({base}+{equipBonuses[cat.key + "Bonus"]})</div>}
                </div>
              </div>
            </div>
            <div style={{ height: 5, background: "#0f0f1e", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min((val / maxD) * 100, 100)}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${cat.color}aa,${cat.color})`, boxShadow: `0 0 8px ${cat.color}44`, animation: "statBarFill 1s ease-out" }} />
            </div>
            </div>
          );
        })}
      </div>
      {unlockedSkills.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>{t("stats.unlockedSkills", { count: unlockedSkills.length })}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {unlockedSkills.map((sk, i) => {
              const cat = categories.find(c => c.key === sk.stat) || CATEGORIES.find(c => c.key === sk.stat); return (
                <div key={sk.id} style={{ background: theme.card, border: `1px solid ${cat.color}22`, borderRadius: 12, padding: "12px", animation: `scaleIn 0.4s ease ${i * 0.07}s both` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{sk.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, fontFamily: "'Cinzel',serif" }}>{sk.name}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>{sk.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ GATE ARTIFACTS ═══ */}
      {discoveredArtifacts.length > 0 && (
        <div style={{ marginTop: 28, animation: "fadeIn 0.6s ease 0.15s both" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>{t("stats.artifacts", { count: discoveredArtifacts.length })}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {discoveredArtifacts.map((artId, i) => {
              const artDef = ARTIFACT_POOL.find(a => a.id === artId);
              if (!artDef) return null;
              return (
                <div key={artId} style={{ background: theme.card, border: `1px solid ${artDef.color || "#f59e0b"}44`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 0 15px ${artDef.color || "#f59e0b"}11`, animation: `cardEnter 0.4s ease ${i * 0.08}s both` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: (artDef.color || "#f59e0b") + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${artDef.color || "#f59e0b"}44` }}>
                    {artDef.iconSrc ? <img src={artDef.iconSrc} alt={artDef.name} style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 6px ${artDef.color || "#f59e0b"}88)` }} /> : artDef.icon || "⚡"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: artDef.color || "#f59e0b", fontFamily: "'Cinzel',serif", marginBottom: 2 }}>{artDef.name}</div>
                    <div style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.4 }}>{artDef.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {isFeatureUnlocked('hidden_quests', state.level || 1) && <HiddenAchievementsGallery state={state} />}
    </div>
  );
}

/**
 * ShadowArmyView – rendered when view === "shadows".
 */
export function ShadowArmyView({
  state, theme,
  shadowArmy, formationBonus, namedShadows, totalShadows,
  shadowSubView, setShadowSubView,
  setSelectedShadow,
  deployShadow, undeployShadow,
}) {
  const { t, locale } = useI18n();
  const { shadowClasses, shadowTiers, namedShadows: localizedNamedShadows } = React.useMemo(() => getLocalizedCatalog(locale), [locale]);
  return (
    <div data-tutorial="shadow-view" style={{ animation: "fadeIn 0.35s ease" }}>
      {/* Monarch's Banner */}
      <div style={{ position: "relative", background: "linear-gradient(160deg,rgba(4,3,12,0.99) 0%,rgba(16,6,32,0.97) 100%)", border: "1px solid #7c3aed44", borderRadius: 20, padding: "22px 20px 16px", marginBottom: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(124,58,237,0.12), inset 0 1px 0 rgba(167,139,250,0.06)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 340, height: 340, background: "conic-gradient(from 0deg,transparent 0%,#7c3aed04 8%,transparent 16%)", animation: "monarchRays 25s linear infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, background: "radial-gradient(circle,#7c3aed0d 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 24, height: 1, background: "linear-gradient(90deg,transparent,#7c3aed66)" }} />
                <div style={{ fontSize: 7, letterSpacing: 5, color: "#7c3aed", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{t("shadows.eyebrow")}</div>
                <div style={{ width: 24, height: 1, background: "linear-gradient(90deg,#7c3aed66,transparent)" }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Cinzel',serif", lineHeight: 1, textShadow: "0 0 30px #7c3aed55, 0 2px 4px rgba(0,0,0,0.8)" }}>{t("shadows.title")}</div>
              {namedShadows.length > 0 && (
                <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 6, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ animation: "namedGlow 2s ease-in-out infinite", filter: "drop-shadow(0 0 4px #f59e0b88)", fontSize: 10 }}>★</span>
                  {t("shadows.namedCount", { count: namedShadows.length, plural: namedShadows.length > 1 ? "s" : "" })}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", padding: "10px 16px", background: "rgba(124,58,237,0.08)", border: "1px solid #7c3aed33", borderRadius: 14 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#a78bfa", fontFamily: "'Cinzel',serif", lineHeight: 1, textShadow: "0 0 20px #7c3aed88" }}>{totalShadows}</div>
              <div style={{ fontSize: 7, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginTop: 2 }}>{t("shadows.capacity", { capacity: shadowArmy.capacity })}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: t("shadows.deployed"), value: shadowArmy.shadows.filter(s => s.isDeployed).length, color: "#22c55e", iconSrc: SHADOW_ICONS.soldier },
              { label: t("shadows.dungeonBoost"), value: `+${formationBonus.dungeonBonus}%`, color: "#ef4444", iconSrc: SKILL_ICONS.attack },
              { label: t("shadows.xpBoost"), value: `+${Math.round(formationBonus.xpBonus * 100)}%`, color: "#a78bfa", iconSrc: STAT_ICONS.int }
            ].map(({ label, value, color, iconSrc }) => (
              <div key={label} style={{ padding: "10px 6px", background: `radial-gradient(circle at 50% 0%,${color}14,${color}04)`, borderRadius: 12, border: `1px solid ${color}25`, textAlign: "center" }}>
                <div style={{ fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {iconSrc ? <img src={iconSrc} alt={label} style={{ width: 16, height: 16, objectFit: "contain", filter: `drop-shadow(0 0 4px ${color}88)` }} /> : null}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color, fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 7, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 3, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 3, background: "rgba(6,4,16,0.9)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(totalShadows / shadowArmy.capacity) * 100}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", transition: "width 0.6s ease", boxShadow: "0 0 8px #7c3aed88" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ key: "army", label: t("shadows.tabs.army"), iconSrc: SHADOW_ICONS.soldier }, { key: "formation", label: t("shadows.tabs.formation"), iconSrc: SKILL_ICONS.attack }, { key: "named", label: t("shadows.tabs.named") }].map(sv => (
              <button key={sv.key} onClick={() => setShadowSubView(sv.key)} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: shadowSubView === sv.key ? "linear-gradient(135deg,#7c3aed22,#a78bfa08)" : "transparent", color: shadowSubView === sv.key ? "#a78bfa" : "#334155", border: `1px solid ${shadowSubView === sv.key ? "#7c3aed55" : "#1a1e30"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s", boxShadow: shadowSubView === sv.key ? "0 0 14px #7c3aed20" : "none", cursor: "pointer" }}>
                {sv.iconSrc ? <img src={sv.iconSrc} alt={sv.label} style={{ width: 13, height: 13, objectFit: "contain", filter: shadowSubView === sv.key ? "drop-shadow(0 0 4px #a78bfa88)" : "brightness(0.5)" }} /> : <span style={{ fontSize: 11 }}>★</span>}
                <span>{sv.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARMY sub-view */}
      {shadowSubView === "army" && (
        totalShadows === 0 ? (
          <div style={{ textAlign: "center", padding: "52px 24px", background: "linear-gradient(160deg,rgba(4,3,12,0.98),rgba(12,6,24,0.95))", borderRadius: 18, border: "1px dashed #7c3aed28", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 180, height: 180, background: "radial-gradient(circle,#7c3aed08,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ marginBottom: 16, opacity: 0.2, animation: "float 3s ease-in-out infinite" }}><img src={SHADOW_ICONS.soldier} alt="Shadow" style={{ width: 56, height: 56, objectFit: "contain", filter: "drop-shadow(0 0 20px #7c3aed) brightness(0.5) invert(1)" }} /></div>
            <div style={{ fontSize: 14, color: "#334155", fontFamily: "'Cinzel',serif", marginBottom: 8, letterSpacing: 1 }}>{t("shadows.emptyTitle")}</div>
            <div style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.7 }}>{t("shadows.emptyDesc")}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {shadowArmy.shadows.map((s, i) => <ShadowCard key={s.id} shadow={s} theme={theme} index={i} onClick={() => setSelectedShadow(s)} />)}
          </div>
        )
      )}

      {/* FORMATION sub-view */}
      {shadowSubView === "formation" && (
        <FormationEditor shadowArmy={shadowArmy} theme={theme} onDeploy={deployShadow} onUndeploy={undeployShadow} formationBonus={formationBonus} />
      )}

      {/* NAMED sub-view */}
      {shadowSubView === "named" && (
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 14 }}>{t("shadows.namedUnlockable")}</div>
          {Object.values(localizedNamedShadows).map((ns, i) => {
            const isOwned = shadowArmy.shadows.some(s => s.namedId === ns.id || s.id === ns.id);
            const cls = shadowClasses[ns.class] || shadowClasses.soldier;
            const tierData = shadowTiers[ns.tier] || shadowTiers[4];
            return (
              <div key={ns.id} style={{ background: isOwned ? "rgba(8,8,20,0.9)" : theme.card, border: `1px solid ${isOwned ? ns.glowColor + "44" : "#1e2940"}`, borderRadius: 16, padding: "16px", marginBottom: 10, opacity: isOwned ? 1 : 0.65, animation: `cardEnter 0.4s ease ${i * 0.08}s both`, boxShadow: isOwned ? `0 0 16px ${ns.glowColor}18` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: isOwned ? ns.glowColor + "18" : "rgba(255,255,255,0.03)", border: `2px solid ${isOwned ? ns.glowColor + "66" : "#1e2940"}`, fontSize: 28 }}>
                    {!isOwned ? <span style={{ opacity: 0.2 }}>?</span> : ns.iconSrc ? (
                      <img src={ns.iconSrc} alt={ns.name} style={{ width: 38, height: 38, objectFit: "contain", filter: `drop-shadow(0 0 10px ${ns.glowColor}99) brightness(1.1)` }} />
                    ) : ns.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: isOwned ? ns.glowColor : "#475569", fontFamily: "'Cinzel',serif" }}>{isOwned ? ns.name : "???"}</div>
                    <div style={{ fontSize: 10, color: isOwned ? ns.glowColor + "99" : "#334155", fontFamily: "'Cinzel',serif", letterSpacing: 1, marginTop: 2 }}>{isOwned ? ns.title : t("shadows.unknown")}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: cls.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 5px", borderRadius: 4, background: cls.color + "15", display: "inline-flex", alignItems: "center", gap: 3 }}>{cls.iconSrc ? <img src={cls.iconSrc} alt={cls.name} style={{ width: 10, height: 10, objectFit: "contain" }} /> : cls.icon} {ns.class.toUpperCase()}</span>
                      <span style={{ fontSize: 9, color: tierData.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 5px", borderRadius: 4, background: tierData.color + "15" }}>TIER {ns.tier}</span>
                    </div>
                  </div>
                  {isOwned && <div style={{ fontSize: 9, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", padding: "3px 8px", borderRadius: 6, background: "#22c55e12", border: "1px solid #22c55e33" }}>{t("shadows.owned")}</div>}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>{t("shadows.unlockCondition")}</div>
                  <div style={{ fontSize: 11, color: isOwned ? "#22c55e" : "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    {isOwned ? <span>✓</span> : <span style={{ opacity: 0.5 }}>○</span>}
                    {ns.unlockCondition.desc}
                  </div>
                </div>
                {isOwned && ns.uniqueAbility && (
                  <div style={{ background: `${ns.glowColor}0a`, border: `1px solid ${ns.glowColor}22`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>{t("shadows.uniqueAbility")}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{ns.uniqueAbility.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: ns.glowColor, fontFamily: "'Cinzel',serif" }}>{ns.uniqueAbility.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{ns.uniqueAbility.effect}</div>
                      </div>
                    </div>
                  </div>
                )}
                {isOwned && <div style={{ fontStyle: "italic", fontSize: 11, color: "#475569", lineHeight: 1.6, borderLeft: `2px solid ${ns.glowColor}33`, paddingLeft: 10 }}>"{ns.lore}"</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
