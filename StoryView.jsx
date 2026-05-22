// ─── PHASE 6: STORY CAMPAIGN ──────────────────────────────────
// StoryView.jsx - Abyssal Sovereign Campaign
// Einbinden in solo-leveling-v5.jsx als eigener View
import React, { useState, useEffect } from "react";
import { STORY_ICONS, BOSS_ICONS, SHADOW_ICONS, GATE_ICONS, SKILL_ICONS, STAT_ICONS } from "./data/icons.js";
import GameIcon from "./components/GameIcon.jsx";

// ─── STORY DATA ───────────────────────────────────────────────
export const STORY_ARCS = [
  {
    id: "arc1",
    name: "The Broken Vessel",
    subtitle: "Das zerbrochene Gefäß",
    levelRange: { min: 1, max: 10 },
    rank: "E",
    rankColor: "#6b7280",
    icon: "🗡️",
    chapters: [
      { id: "ch1", title: "First Awakening", description: "Der Nexus erwacht in dir", unlockLevel: 1, type: "tutorial", rewards: { xp: 25, gold: 10, unlock: "daily_quest_system" }, icon: "✨" },
      { id: "ch2", title: "The Prime Rift", description: "Dein erster Abyssal Rift erwartet dich", unlockLevel: 5, type: "dungeon_intro", rewards: { xp: 50, gold: 25 }, icon: "🌀" },
      { id: "ch3", title: "Nexus Initialization", description: "Der Nexus offenbart sein wahres Gesicht", unlockLevel: 10, type: "revelation", rewards: { xp: 75, gold: 60 }, icon: "💻", iconSrc: STORY_ICONS.systeminit },
    ],
    arcBoss: { name: "The Ancient Sentinel", rank: "E", rewards: { xp: 125, gold: 150, title: "Survivor" }, icon: "🗿", iconSrc: STORY_ICONS.sentinel },
  },
  {
    id: "arc2",
    name: "The Nexus Player",
    subtitle: "Der Aufstieg beginnt",
    levelRange: { min: 11, max: 20 },
    rank: "D",
    rankColor: "#22d3ee",
    icon: "⚔️",
    chapters: [
      { id: "ch4", title: "A New Beginning", description: "Erste Solo-Rifts bezwingen", unlockLevel: 11, type: "exploration", rewards: { xp: 80, gold: 60 }, icon: "🌄", iconSrc: STORY_ICONS.dawn },
      { id: "ch5", title: "The Secret of Levels", description: "Die wahre Natur des Nexus", unlockLevel: 15, type: "lore", rewards: { xp: 100, gold: 100 }, icon: "📜", iconSrc: STORY_ICONS.scroll },
      { id: "ch6", title: "Echoes of the Past", description: "Erste Phantom-Begegnung", unlockLevel: 20, type: "shadow_intro", rewards: { xp: 125, gold: 125 }, icon: "🌑" },
    ],
    arcBoss: { name: "The Void Hound", rank: "C", rewards: { xp: 250, gold: 150, unlock: "shadow_extraction_ability" }, icon: "🐕", iconSrc: STORY_ICONS.voidhound },
  },
  {
    id: "arc3",
    name: "Phantom Calling",
    subtitle: "MANIFEST",
    levelRange: { min: 21, max: 35 },
    rank: "C",
    rankColor: "#34d399",
    icon: "🌑",
    chapters: [
      { id: "ch7", title: "MANIFEST", description: "Deine erste Phantom-Beschwörung", unlockLevel: 21, type: "ability_unlock", cinematicKey: "arise_first", rewards: { xp: 150, gold: 150 }, icon: "⚫", iconSrc: STORY_ICONS.awaken },
      { id: "ch8", title: "Building a Legion", description: "Phantom Legion Mechaniken entdecken", unlockLevel: 28, type: "system_unlock", rewards: { xp: 200, gold: 200 }, icon: "🪖", iconSrc: STORY_ICONS.helmet },
      { id: "ch9", title: "The Vanguard Council", description: "Andere Vanguards existieren", unlockLevel: 35, type: "world_building", rewards: { xp: 250, gold: 250 }, icon: "🏛️", iconSrc: STORY_ICONS.association },
    ],
    arcBoss: { name: "Vaelin, the Crimson Knight", rank: "B", rewards: { namedShadow: "vaelin", xp: 500, gold: 500 }, icon: "🩸", iconSrc: SHADOW_ICONS.vaelin },
  },
  {
    id: "arc4",
    name: "Crimson Rifts",
    subtitle: "Kein Entkommen",
    levelRange: { min: 36, max: 50 },
    rank: "B",
    rankColor: "#a78bfa",
    icon: "🔴",
    chapters: [
      { id: "ch10", title: "No Escape", description: "Crimson Rift Mechaniken", unlockLevel: 36, type: "danger_reveal", rewards: { xp: 300, gold: 300 }, icon: "🚪", iconSrc: STORY_ICONS.door },
      { id: "ch11", title: "The Swarm Tyrant", description: "Todesinsel – Die wahre Bedrohung", unlockLevel: 43, type: "major_battle", rewards: { xp: 400, gold: 500 }, icon: "🐜" },
      { id: "ch12", title: "Apex Class", description: "S-Rank Vanguard Existenz", unlockLevel: 50, type: "power_reveal", rewards: { xp: 500, gold: 750 }, icon: "🏆" },
    ],
    arcBoss: { name: "Xerath, the Swarm Tyrant", rank: "A", rewards: { namedShadow: "xerath", xp: 750, gold: 1000, title: "Swarm Breaker" }, icon: "👑", iconSrc: SHADOW_ICONS.xerath },
  },
  {
    id: "arc5",
    name: "The Archons",
    subtitle: "Die wahren Mächte",
    levelRange: { min: 51, max: 70 },
    rank: "A",
    rankColor: "#f59e0b",
    icon: "👁️",
    chapters: [
      { id: "ch13", title: "Primordials and Archons", description: "Die Wahrheit über die Abgründe", unlockLevel: 51, type: "lore_heavy", rewards: { xp: 600, gold: 1000 }, icon: "⚖️", iconSrc: STORY_ICONS.scales },
      { id: "ch14", title: "The Sovereign's Legacy", description: "Deine Verbindung zur Leere", unlockLevel: 60, type: "destiny_reveal", rewards: { xp: 750, gold: 1500 }, icon: "🌌" },
      { id: "ch15", title: "Abyssal Expansion", description: "Phantom Realm Powers erwachen", unlockLevel: 70, type: "power_unlock", rewards: { xp: 1000, gold: 2000 }, icon: "🌀" },
    ],
    arcBoss: { name: "Goliath, the Earth Archon", rank: "S", rewards: { xp: 1500, gold: 3000, title: "Giant Slayer" }, icon: "🏔️", iconSrc: STORY_ICONS.mountain },
  },
  {
    id: "arc6",
    name: "Transcendence",
    subtitle: "Jenseits der Menschheit",
    levelRange: { min: 71, max: 90 },
    rank: "S",
    rankColor: "#ef4444",
    icon: "🌟",
    chapters: [
      { id: "ch16", title: "Beyond Human", description: "Transzendenz – ein neues Kapitel", unlockLevel: 71, type: "transformation", rewards: { xp: 1250, gold: 2500 }, icon: "🦋", iconSrc: STORY_ICONS.butterfly },
      { id: "ch17", title: "The Final Legion", description: "Kaelen erwacht", unlockLevel: 80, type: "army_complete", rewards: { xp: 1750, gold: 3500 }, icon: "⚜️" },
      { id: "ch18", title: "War Declaration", description: "Die letzte Schlacht naht", unlockLevel: 90, type: "setup_finale", rewards: { xp: 2250, gold: 5000 }, icon: "⚡" },
    ],
    arcBoss: { name: "Ignis, the Archon of Ruin", rank: "SS", rewards: { xp: 2500, gold: 7500, title: "Archon Slayer" }, icon: "💀", iconSrc: BOSS_ICONS.unleashed },
  },
  {
    id: "arc7",
    name: "The Abyssal Sovereign",
    subtitle: "Akzeptiere dein Schicksal",
    levelRange: { min: 91, max: 100 },
    rank: "SSS",
    rankColor: "#e879f9",
    icon: "☠️",
    chapters: [
      { id: "ch19", title: "Acceptance", description: "Akzeptiere den Abgrund", unlockLevel: 91, type: "character_growth", rewards: { xp: 3000, gold: 10000 }, icon: "🖤", iconSrc: STORY_ICONS.blackheart },
      { id: "ch20", title: "The Final Rift", description: "Die Quelle des Nexus", unlockLevel: 100, type: "final_dungeon", rewards: { xp: 5000, gold: 25000, title: "Abyssal Sovereign" }, icon: "🌑" },
    ],
    finalBoss: { name: "The Prime Architect", rank: "???", rewards: { xp: 6000, gold: 50000, title: "Abyssal Sovereign", namedShadow: "kaelen", unlock: "prestige_system" }, icon: "🌌", iconSrc: BOSS_ICONS.awakening },
  },
];

// ─── STORY PANEL (manga style) ─────────────────────────────────
function StoryPanel({ arc, chapter, onClose, onComplete, playerLevel, isCompleted }) {
  const [panelIndex, setPanelIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [completed, setCompleted] = useState(false);

  const panels = getPanelsForChapter(chapter, arc);

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 400);
    return () => clearTimeout(timer);
  }, [panelIndex]);

  const nextPanel = () => {
    if (panelIndex < panels.length - 1) {
      setTextVisible(false);
      setTimeout(() => setPanelIndex(p => p + 1), 200);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,1,8,0.98)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 20, animation: "successPulse 0.6s ease" }}><GameIcon src={chapter.iconSrc} fallback="✅" size={56} glow glowColor="#7c3aed" /></div>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>KAPITEL ABGESCHLOSSEN</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", letterSpacing: 3, textShadow: "0 0 30px #7c3aed", marginBottom: 24 }}>{chapter.title}</div>
        {isCompleted ? (
          <div style={{ display: "flex", gap: 16, padding: "16px 24px", borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid #334155" }}>
            <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>Keine Belohnung bei Wiederholung</span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, padding: "16px 24px", borderRadius: 16, background: "rgba(124,58,237,0.1)", border: "1px solid #7c3aed33" }}>
            <span style={{ color: "#f59e0b", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>+{chapter.rewards?.xp} XP</span>
            <span style={{ color: "#fbbf24", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>+{chapter.rewards?.gold} Gold</span>
            {chapter.rewards?.title && <span style={{ color: "#a78bfa", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>Titel: "{chapter.rewards.title}"</span>}
          </div>
        )}
        <button onClick={() => onComplete(chapter)} style={{ marginTop: 32, padding: "16px 40px", borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 3, cursor: "pointer" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>WEITER <img src={SKILL_ICONS.attack} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} /></span>
        </button>
      </div>
    );
  }

  const panel = panels[panelIndex];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0612", display: "flex", flexDirection: "column" }}
      onClick={nextPanel}
    >
      {/* Panel background */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: 24 }}>
        {/* Chapter indicator */}
        <div style={{ position: "absolute", top: 20, left: 20, display: "flex", gap: 8 }}>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: arc.rankColor + "22", border: `1px solid ${arc.rankColor}44`, color: arc.rankColor, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
            {arc.rank}-RANK
          </div>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(124,58,237,0.15)", border: "1px solid #7c3aed44", color: "#a78bfa", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            {chapter.iconSrc ? <img src={chapter.iconSrc} alt={chapter.title} style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 4, filter: `drop-shadow(0 0 4px ${arc.rankColor}88)` }} /> : chapter.icon} {chapter.title}
          </div>
        </div>

        {/* Panel icon / visual — cinematic image or emoji */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {panel.iconSrc ? (
            <img src={panel.iconSrc} alt="" style={{
              width: panel.type === "dramatic" ? 260 : 200,
              height: panel.type === "dramatic" ? 260 : 200,
              objectFit: "contain",
              filter: `drop-shadow(0 0 40px ${arc.rankColor}99) drop-shadow(0 8px 24px rgba(0,0,0,0.8)) brightness(1.1)`,
              animation: "float 3s ease-in-out infinite",
            }} />
          ) : (
            <span style={{ fontSize: panel.type === "dramatic" ? 120 : 80, filter: `drop-shadow(0 0 40px ${arc.rankColor})`, animation: "float 3s ease-in-out infinite", display: "block" }}>
              {panel.icon}
            </span>
          )}
        </div>

        {/* Narrative text */}
        <div style={{ maxWidth: 520, textAlign: "center", transition: "opacity 0.4s ease", opacity: textVisible ? 1 : 0 }}>
          {panel.systemMsg && (
            <div style={{ marginBottom: 16, padding: "12px 20px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px solid #7c3aed44", color: "#a78bfa", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
              ▶ {panel.systemMsg}
            </div>
          )}
          {panel.dramatic && (
            <div style={{ fontSize: 56, fontWeight: 900, color: arc.rankColor, fontFamily: "'Cinzel', serif", letterSpacing: 8, textShadow: `0 0 60px ${arc.rankColor}`, marginBottom: 16 }}>
              {panel.dramatic}
            </div>
          )}
          <p style={{ fontSize: 18, color: "#c4b5fd", fontFamily: "'Outfit', sans-serif", lineHeight: 1.7 }}>
            {panel.narration}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8 }}>
          {panels.map((_, i) => (
            <div key={i} style={{ width: i === panelIndex ? 20 : 6, height: 6, borderRadius: 3, background: i <= panelIndex ? arc.rankColor : "#1e1e3f", transition: "all 0.3s ease" }} />
          ))}
        </div>

        {/* Tap to continue */}
        <div style={{ position: "absolute", bottom: 48, right: 24, fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, animation: "pulse 2s ease-in-out infinite" }}>
          TIPPEN UM FORTZUFAHREN ›
        </div>
      </div>

      {/* Close button */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid #334155", color: "#64748b", cursor: "pointer", fontSize: 16 }}>
        ✕
      </button>
    </div>
  );
}

// Generate panel content for a chapter
function getPanelsForChapter(chapter, arc) {
  const typeIconMap = {
    tutorial: "📖", dungeon_intro: "🌀", revelation: "💻", exploration: "🌄",
    lore: "📜", shadow_intro: "🌑", ability_unlock: "⚫", system_unlock: "🪖",
    world_building: "🏛️", danger_reveal: "🚨", major_battle: "⚔️", power_reveal: "👑",
    lore_heavy: "📚", destiny_reveal: "🌌", power_unlock: "🌀", transformation: "🦋",
    army_complete: "⚜️", setup_finale: "⚡", character_growth: "🖤", final_dungeon: "🌑",
  };
  const icon = typeIconMap[chapter.type] || chapter.icon;
  return [
    {
      icon,
      iconSrc: chapter.iconSrc || null,
      narration: getChapterIntro(chapter),
      systemMsg: null,
      type: "intro",
    },
    {
      icon: chapter.icon,
      iconSrc: chapter.iconSrc || null,
      narration: getChapterMid(chapter),
      systemMsg: getSystemMessage(chapter),
      type: "mid",
    },
    {
      icon: "⚔️",
      iconSrc: chapter.iconSrc || null,
      dramatic: getDramaticText(chapter, arc),
      narration: getChapterOutro(chapter),
      systemMsg: null,
      type: "dramatic",
    },
  ];
}

function getChapterIntro(ch) {
  const intros = {
    ch1: "Der Nexus erwacht. Eine uralte Resonanz durchdringt deinen Geist – eine Schnittstelle, die nur für dich bestimmt ist.",
    ch2: "Ein Abyssal Rift pulsiert in purpurnem Licht. Die anderen Vanguards weichen zurück. Du nicht. Der Abgrund ruft dich.",
    ch3: "Die Fraktale vor deinen Augen sind real. Der Nexus hat dich als Avatar gewählt. Warum ausgerechnet dich? Das gilt es herauszufinden.",
    ch4: "Dein erster Abyssal Rift im Alleingang. Kein Squad. Keine Rückendeckung. Nur du und das Echo deiner eigenen Stärke.",
    ch5: "Du fragst dich, was diese Level bedeuten. Bist du der Einzige, der über sich hinauswachsen kann? Die Antwort ist erschreckend.",
    ch6: "In der Dunkelheit bewegt sich etwas. Ein Phantom, das keine physische Form hat – aber darauf wartet, dass du es bindest.",
    ch7: "Der besiegte Feind zerfällt zu Staub, doch seine Essenz bleibt. Die Macht der Leere fließt in dich. Es ist Zeit zu gebieten.",
    ch8: "Ein Phantom. Dann zwei. Dann zehn. Deine Legion entsteht aus dem Nichts – unsterblich, absolut loyal und gnadenlos.",
    ch9: "Der Vanguard Council hat dich bemerkt. Du bist kein Geheimnis mehr. Die globale Elite richtet ihren Blick auf dich.",
    ch10: "Der Crimson Rift schließt sich hinter dir. Keine Flucht möglich. Du bist gefangen – zusammen mit denen, die bereits aufgegeben haben.",
    ch11: "Die Todesinsel. Ein Ort, der selbst den Stärksten das Blut in den Adern gefrieren lässt. Das Schwarm-Imperium und sein Tyrann warten.",
    ch12: "Apex Class. Ein Titel für die Götter unter den Menschen. Bald wird diese Klassifizierung für dich zu eng sein.",
    ch13: "Archonten und Primordials – zwei Seiten eines kosmischen Krieges. Du wurdest als Waffe geschmiedet, und nun kennst du dein Ziel.",
    ch14: "Fremde Erinnerungen fluten deinen Geist. Ein gefallener Herrscher der Leere. Sein Thron ist nun deiner.",
    ch15: "Die Realität um dich herum zersplittert. Deine Abyssal Domain manifestiert sich in der physischen Welt.",
    ch16: "Du legst deine Menschlichkeit ab wie eine alte Haut. Keine Erschöpfung. Kein Zögern. Nur reine, unendliche Transzendenz.",
    ch17: "Kaelen, der Grand Marshal, materialisiert sich aus reiner Antimaterie. Hinter ihm Millionen. Deine Legion ist vollständig.",
    ch18: "Die verbleibenden Archonten sammeln ihre Truppen. Sie kommen wegen dir. Es wird ihr letzter Fehler sein.",
    ch19: "Du hast alles erobert. Jetzt musst du dich der Leere selbst stellen und entscheiden, wer du wirklich sein willst.",
    ch20: "Der Final Rift bricht auf. Das Zentrum des Nexus. Wer oder was auch immer dort wartet – du wirst es auslöschen.",
  };
  return intros[ch.id] || ch.description;
}

function getChapterMid(ch) {
  const mids = {
    ch1: "Die Diagnose des Nexus: Physische Attribute bei Null. E-Rank. Doch tief im Code... ein Versprechen von unendlichem Potenzial.",
    ch2: "Die Wächter. Das Ritual. Blutvergießen. Du atmest noch. Der Nexus hat in diesem Moment der Verzweiflung geantwortet.",
    ch3: "Tägliche Protokolle. XP. Evolution. Der Nexus hat sich vollständig synchronisiert. Du bist kein Soldat mehr. Du bist der Player.",
    ch4: "Du säuberst den Rift im Alleingang. Deine Resonanz steigt rapide. Die Welt sieht noch einen E-Rank – aber du weißt es besser.",
    ch5: "Das Fortschrittssystem ist exklusiv. Du bist die einzige Anomalie im gesamten Netzwerk, die sich unendlich anpassen kann.",
    ch6: "Die Anomalie verblasst nicht nach dem Tod. Ein Phantom bleibt zurück, fixiert dich und wartet auf ein einziges Kommando.",
    ch7: "Dunkle Materie bricht aus deinen Händen. Das erste Phantom kniet vor dir nieder. Deine Seele befiehlt: MANIFEST.",
    ch8: "Vaelin. Xerath. Namen, die in der Dunkelheit geboren wurden. Die Legion des Abyssal Sovereign nimmt Form an.",
    ch9: "Der Vanguard Council schickt Beobachter. Sie versuchen deine Resonanz zu messen – und scheitern an den Limits ihrer Technologie.",
    ch10: "Panik bricht aus. Die Ressourcen der anderen Vanguards schwinden. Aber in diesem Chaos findest du nur noch mehr Kraft.",
    ch11: "Der Swarm Tyrant ist mehr als eine Bestie. Er ist reine Evolution. Als er fällt, wird er deine stärkste Waffe.",
    ch12: "Dein Name wird zur Legende. Nationen bieten dir alles an, was sie besitzen. Doch weltliche Macht bedeutet dir nichts mehr.",
    ch13: "Die Archonten wollen das System löschen und die Welten kollabieren lassen. Du bist die Firewall, die sie vernichten wird.",
    ch14: "Der ursprüngliche Abyssal Sovereign. Ein Herrscher, der den Tod überwand. Du bist sein Echo, sein Nachfolger, seine Perfektion.",
    ch15: "Deine Domain dehnt sich aus, färbt den Himmel schwarz. Die Phantome jubeln in der Dunkelheit. Eine neue Ära bricht an.",
    ch16: "Zelluläre Regeneration. Absolute Immunität. Du bist eine Naturgewalt geworden – unaufhaltsam und ewig.",
    ch17: "Kaelen verneigt sich. Der Himmel verdunkelt sich durch die unzähligen Phantome. Die Armee der Leere erwartet deine Befehle.",
    ch18: "Die Dimensionen reißen auf. Archonten fallen über die Erde her. Wo du auftauchst, wird aus Zerstörung absolute Stille.",
    ch19: "Macht hat ihren Preis. Die Leere versucht, dich zu konsumieren. Doch du bist nicht ihr Gefangener – du bist ihr Meister.",
    ch20: "Der Prime Architect. Die Entität, die den Nexus codierte. Er wollte einen Avatar. Er erschuf seinen eigenen Untergang.",
  };
  return mids[ch.id] || "Der Nexus protokolliert deinen Fortschritt.";
}

function getSystemMessage(ch) {
  const msgs = {
    ch1: "NEXUS: Vanguard-Klassifizierung abgeschlossen. Rang: E. Potenzial: UNBEGRENZT.",
    ch2: "NEXUS: Kritische Anomalie detektiert. Überleben ist imperativ.",
    ch3: "NEXUS: Vollständige System-Synchronisation. Willkommen im Mainframe.",
    ch4: "NEXUS: Rift-Clearance bestätigt. Resonanz-Wachstum registriert.",
    ch5: "NEXUS: Du bist die Singularität. Handle mit absoluter Präzision.",
    ch6: "NEXUS: Phantom-Bindung verfügbar. Initiierung steht bevor.",
    ch7: "NEXUS: ERSTE PHANTOM-BINDUNG ERFOLGREICH. LEGION AKTIVIERT.",
    ch8: "NEXUS: Speicherplatz für Phantome erweitert. Rekrutierung optimiert.",
    ch9: "NEXUS: Externe Scans abgewehrt. Wahre Stärke verborgen.",
    ch10: "NEXUS: CRIMSON RIFT ISOLATION PROTOKOLL. Kampf bis zum Tod.",
    ch11: "NEXUS: APEX-FEIND ÜBERWUNDEN. NEUES PHANTOM IN DIE LEGION INTEGRIERT.",
    ch12: "NEXUS: RESO-LEVEL AKTUALISIERT. APEX CLASS TRANZENDIERT.",
    ch13: "NEXUS: ARCHON-BEDROHUNG DETEKTIERT. MAXIMALE OVERRIDE-BEREITSCHAFT.",
    ch14: "NEXUS: ABYSSAL SOVEREIGN PROTOKOLL AKTIVIERT.",
    ch15: "NEXUS: PHANTOM DOMAIN ERWEITERT. REALITÄTS-OVERRIDE 100%.",
    ch16: "NEXUS: BIOLOGISCHE LIMITIERUNGEN PERMANENT GELÖSCHT.",
    ch17: "NEXUS: LEGION KOMPLETT. GRAND MARSHAL KAELEN ONLINE.",
    ch18: "NEXUS: KOSMISCHER KRIEG BEGONNEN. ALLE SYSTEME AUF VERNICHTUNG GERICHTET.",
    ch19: "NEXUS: LETZTE SYNCHRONISATION STEHT BEVOR.",
    ch20: "NEXUS: FATAL ERROR. PRIME ARCHITECT DETEKTIERT. SYSTEM OVERLOAD.",
  };
  return msgs[ch.id] || null;
}

function getDramaticText(ch, arc) {
  const texts = {
    ch7: "MANIFEST",
    ch12: "APEX CLASS",
    ch14: "ABYSSAL SOVEREIGN",
    ch17: "THE LEGION IS COMPLETE",
    ch20: "SYSTEM OVERRIDE",
  };
  return texts[ch.id] || arc.name.toUpperCase();
}

function getChapterOutro(ch) {
  const outros = {
    ch1: "Ein scheinbar schwacher Vanguard mit einer Verbindung zum Unbekannten. Dein Code wird neu geschrieben.",
    ch2: "Du hast den Prime Rift überlebt. Der Nexus hat deine Anpassungsfähigkeit belohnt. Dein Aufstieg beginnt.",
    ch3: "Du bist die Anomalie. Der einzige Spieler in einem Spiel, das für alle anderen starr ist.",
    ch4: "Allein im Abgrund. Deine Resonanz steigt. Die Welt hat keine Ahnung, was auf sie zukommt.",
    ch5: "Du allein kannst die Grenzen sprengen. Diese Bürde ist nun deine absolute Freiheit.",
    ch6: "Die Phantome flüstern in der Dunkelheit. Bald wirst du ihre Sprache sprechen.",
    ch7: "Das erste Phantom gehorcht dir. Deine Legion ist geboren. MANIFEST.",
    ch8: "Deine Schattenarmee wächst. Der Herrscher des Abgrunds nimmt seinen Platz ein.",
    ch9: "Die Augen der Welt sind auf dich gerichtet. Zeig ihnen, dass du außerhalb ihrer Skalen existierst.",
    ch10: "Überlebt. Adaptiert. Gestärkt. Kein Rift kann dich mehr festhalten.",
    ch11: "Xerath ist an deiner Seite. Der Schwarm ist nun dein eigenes Werkzeug der Vernichtung.",
    ch12: "Apex Class. Die Spitze der Nahrungskette. Doch für dich ist es nur der Anfang.",
    ch13: "Die Archonten sind keine Götter. Sie sind nur veralteter Code, den du löschen wirst.",
    ch14: "Das Vermächtnis der Leere. Du bist nicht länger nur ein Avatar – du bist der Sovereign.",
    ch15: "Die Dunkelheit ist nicht mehr dein Feind. Sie ist dein Königreich.",
    ch16: "Mehr als menschlich. Du bist die Evolution selbst.",
    ch17: "Die gewaltigste Armee, die das Universum je gesehen hat. Bereit, die Realität zu zerreißen.",
    ch18: "Der Krieg hat begonnen. Du wirst ihn beenden.",
    ch19: "Die Dunkelheit hat dich nicht korrumpiert. Du hast sie perfektioniert.",
    ch20: "Das System bricht zusammen. Nur du bleibst bestehen. Der ewige Abyssal Sovereign.",
  };
  return outros[ch.id] || "Ein neues Fragment der Geschichte wurde geschrieben.";
}

// ─── BOSS FIGHT PANEL ────────────────────────────────────────
function BossFightPanel({ arc, boss, onClose, onComplete, isDefeated }) {
  const [phase, setPhase] = useState(0); // 0=approach 1=battle 2=victory
  const [textVisible, setTextVisible] = useState(false);

  const bossPhases = [
    {
      icon: boss.icon,
      iconSrc: boss.iconSrc || null,
      dramatic: null,
      narration: `${boss.name}. ${arc.rank}-Rank Boss. Du hast alle Etagen überwunden – jetzt wartet die finale Prüfung. Kein Rückzug mehr.`,
      systemMsg: `SYSTEM: BOSS-GEGNER DETEKTIERT — ${boss.name.toUpperCase()}`,
    },
    {
      icon: "⚔️",
      dramatic: "BOSS FIGHT",
      narration: `Die Welt scheint sich zu verlangsamen. Deine Schatten sammeln sich um dich. Du kennst diesen Kampf – du wirst gewinnen.`,
      systemMsg: `SYSTEM: KAMPFBEREITSCHAFT MAXIMIERT — ALLE FÄHIGKEITEN AKTIV`,
    },
    {
      icon: "🏆",
      dramatic: "VICTORY",
      narration: `${boss.name} ist gefallen. Deine Macht wächst. Ein neuer Weg öffnet sich – dunkel, unbekannt und dein.`,
      systemMsg: `SYSTEM: BOGEN-BOSS ÜBERWUNDEN — BELOHNUNGEN WERDEN GEWÄHRT`,
    },
  ];

  useEffect(() => {
    setTextVisible(false);
    const t = setTimeout(() => setTextVisible(true), 300);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 3) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,0,0,0.98)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 16, animation: "successPulse 0.6s ease" }}><GameIcon src={boss.iconSrc} fallback="⚔️" size={72} glow glowColor="#ef4444" /></div>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>BOSS BESIEGT</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", letterSpacing: 3, textShadow: "0 0 40px #ef4444", marginBottom: 8, textAlign: "center", padding: "0 1rem" }}>{boss.name}</div>
        <div style={{ fontSize: 12, color: "#ef4444aa", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, marginBottom: 24 }}>{arc.rank}-RANK BOSS — ÜBERWUNDEN</div>
        {!isDefeated ? (
          <div style={{ display: "flex", gap: 16, padding: "16px 24px", borderRadius: 16, background: "rgba(239,68,68,0.1)", border: "1px solid #ef444433", marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {boss.rewards?.xp && <span style={{ color: "#f59e0b", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>+{boss.rewards.xp} XP</span>}
            {boss.rewards?.gold && <span style={{ color: "#fbbf24", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>+{boss.rewards.gold} Gold</span>}
            {boss.rewards?.title && <span style={{ color: "#a78bfa", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>Titel: "{boss.rewards.title}"</span>}
            {boss.rewards?.namedShadow && <span style={{ color: "#22d3ee", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>Shadow: {boss.rewards.namedShadow}</span>}
          </div>
        ) : (
          <div style={{ color: "#475569", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginBottom: 24 }}>Dieser Boss wurde bereits besiegt.</div>
        )}
        <button onClick={() => onComplete(boss)} style={{ padding: "16px 40px", borderRadius: 14, background: "linear-gradient(135deg,#ef4444,#b91c1c)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 3, cursor: "pointer" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>WEITER <img src={SKILL_ICONS.attack} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} /></span>
        </button>
      </div>
    );
  }

  const current = bossPhases[phase];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "radial-gradient(ellipse at center, #1a0000 0%, #0a0004 60%, #000 100%)", display: "flex", flexDirection: "column" }}
      onClick={() => setPhase(p => p + 1)}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: 24 }}>
        <div style={{ position: "absolute", top: 20, left: 20, display: "flex", gap: 8 }}>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: "#ef444422", border: "1px solid #ef444444", color: "#ef4444", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
            {arc.rank}-RANK BOSS
          </div>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid #ef444433", color: "#fca5a5", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            {boss.iconSrc ? <img src={boss.iconSrc} alt="" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> : null} {boss.name}
          </div>
        </div>

        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(current.iconSrc || (phase <= 1 && boss.iconSrc)) ? (
            <img src={current.iconSrc || boss.iconSrc} alt={boss.name} style={{
              width: phase === 1 ? 180 : 240, height: phase === 1 ? 180 : 240,
              objectFit: "contain",
              filter: phase === 1
                ? "drop-shadow(0 0 80px #ef4444cc) drop-shadow(0 0 40px #ef444488) brightness(1.3) saturate(1.2)"
                : "drop-shadow(0 0 60px #ef444499) drop-shadow(0 8px 32px rgba(0,0,0,0.9)) brightness(1.1)",
              animation: phase === 1 ? "pulse 0.8s ease-in-out infinite" : "float 3s ease-in-out infinite",
            }} />
          ) : (
            <span style={{ fontSize: phase === 1 ? 120 : 80, filter: "drop-shadow(0 0 60px #ef4444)", animation: "float 3s ease-in-out infinite", display: "block" }}>
              {current.icon}
            </span>
          )}
        </div>

        <div style={{ maxWidth: 520, textAlign: "center", transition: "opacity 0.4s ease", opacity: textVisible ? 1 : 0 }}>
          {current.systemMsg && (
            <div style={{ marginBottom: 16, padding: "12px 20px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid #ef444444", color: "#fca5a5", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
              ▶ {current.systemMsg}
            </div>
          )}
          {current.dramatic && (
            <div style={{ fontSize: 52, fontWeight: 900, color: "#ef4444", fontFamily: "'Cinzel', serif", letterSpacing: 8, textShadow: "0 0 60px #ef4444", marginBottom: 16 }}>
              {current.dramatic}
            </div>
          )}
          <p style={{ fontSize: 18, color: "#fca5a5", fontFamily: "'Outfit', sans-serif", lineHeight: 1.7 }}>
            {current.narration}
          </p>
        </div>

        <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8 }}>
          {bossPhases.map((_, i) => (
            <div key={i} style={{ width: i === phase ? 20 : 6, height: 6, borderRadius: 3, background: i <= phase ? "#ef4444" : "#1e1e3f", transition: "all 0.3s ease" }} />
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 48, right: 24, fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, animation: "pulse 2s ease-in-out infinite" }}>
          TIPPEN UM FORTZUFAHREN ›
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid #334155", color: "#64748b", cursor: "pointer", fontSize: 16 }}>
        ✕
      </button>
    </div>
  );
}

// ─── STORY VIEW COMPONENT ────────────────────────────────────
export default function StoryView({ gameState, onChapterComplete, onBossComplete, theme }) {
  const [selectedArc, setSelectedArc] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeArcForChapter, setActiveArcForChapter] = useState(null);
  const [activeBoss, setActiveBoss] = useState(null);
  const [activeBossArc, setActiveBossArc] = useState(null);

  const playerLevel = gameState?.level || 1;
  const completedChapters = gameState?.story?.completedChapters || [];
  const defeatedBosses = gameState?.story?.defeatedBosses || [];
  const T = theme || { primary: "#4f6ef7", secondary: "#7c3aed", accent: "#93b4fd", card: "rgba(12,12,24,0.85)", surface: "rgba(20,20,40,0.6)" };

  const isChapterUnlocked = (chapter) => playerLevel >= chapter.unlockLevel;
  const isChapterCompleted = (chapterId) => completedChapters.includes(chapterId);
  const isBossDefeated = (arcId) => defeatedBosses.includes(arcId);

  const getArcProgress = (arc) => {
    const total = arc.chapters.length;
    const done = arc.chapters.filter(ch => isChapterCompleted(ch.id)).length;
    return { done, total, pct: total > 0 ? (done / total) * 100 : 0 };
  };

  const isArcUnlocked = (arc) => playerLevel >= arc.levelRange.min;

  const handleChapterComplete = (chapter) => {
    setActiveChapter(null);
    setActiveArcForChapter(null);
    if (onChapterComplete) {
      onChapterComplete(chapter);
    }
  };

  const handleBossComplete = (boss) => {
    const arcId = activeBossArc?.id;
    setActiveBoss(null);
    setActiveBossArc(null);
    if (onBossComplete) onBossComplete(boss, arcId);
    else if (onChapterComplete) onChapterComplete({ ...boss, id: `boss_${arcId}`, isBoss: true });
  };

  if (activeBoss && activeBossArc) {
    return (
      <BossFightPanel
        arc={activeBossArc}
        boss={activeBoss}
        onClose={() => { setActiveBoss(null); setActiveBossArc(null); }}
        onComplete={handleBossComplete}
        isDefeated={isBossDefeated(activeBossArc.id)}
      />
    );
  }

  if (activeChapter && activeArcForChapter) {
    return (
      <StoryPanel
        arc={activeArcForChapter}
        chapter={activeChapter}
        onClose={() => { setActiveChapter(null); setActiveArcForChapter(null); }}
        onComplete={handleChapterComplete}
        playerLevel={playerLevel}
        isCompleted={isChapterCompleted(activeChapter.id)}
      />
    );
  }

  return (
    <div style={{ padding: "0 0 80px 0" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, paddingTop: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: T.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
          STORY CAMPAIGN
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", letterSpacing: 4, textShadow: `0 0 30px ${T.secondary}` }}>
          ABYSSAL SOVEREIGN
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
          {completedChapters.length} von {STORY_ARCS.reduce((s, a) => s + a.chapters.length, 0)} Kapiteln abgeschlossen
        </div>
      </div>

      {/* Arc list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {STORY_ARCS.map((arc, arcIdx) => {
          const unlocked = isArcUnlocked(arc);
          const prog = getArcProgress(arc);
          const expanded = selectedArc === arc.id;

          return (
            <div key={arc.id} style={{ borderRadius: 18, border: `1px solid ${unlocked ? arc.rankColor + "33" : "#1e1e3f"}`, background: T.card, overflow: "hidden", opacity: unlocked ? 1 : 0.5, transition: "all 0.3s ease" }}>
              {/* Arc header */}
              <div
                onClick={() => unlocked && setSelectedArc(expanded ? null : arc.id)}
                style={{ padding: "20px 20px", display: "flex", alignItems: "center", gap: 16, cursor: unlocked ? "pointer" : "default" }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 14, background: arc.rankColor + "22", border: `1px solid ${arc.rankColor}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {arc.chapters[0]?.iconSrc || arc.arcBoss?.iconSrc || arc.finalBoss?.iconSrc ? (
                    <img src={arc.chapters[0]?.iconSrc || arc.arcBoss?.iconSrc || arc.finalBoss?.iconSrc} alt={arc.name} style={{ width: 38, height: 38, objectFit: "contain", filter: `drop-shadow(0 0 6px ${arc.rankColor}88) brightness(1.1)` }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>{arc.icon}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Cinzel', serif" }}>{arc.name}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: arc.rankColor + "22", color: arc.rankColor, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>{arc.rank}-RANK</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>{arc.subtitle} • Lv. {arc.levelRange.min}–{arc.levelRange.max}</div>
                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: "#1e1e3f", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${prog.pct}%`, background: `linear-gradient(90deg, ${arc.rankColor}, ${arc.rankColor}88)`, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{prog.done}/{prog.total} Kapitel</div>
                </div>
                <div style={{ color: "#475569", fontSize: 14, transition: "transform 0.3s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
              </div>

              {/* Chapters */}
              {expanded && (
                <div style={{ borderTop: `1px solid ${arc.rankColor}22`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {arc.chapters.map((ch, chIdx) => {
                    const chUnlocked = isChapterUnlocked(ch);
                    const chCompleted = isChapterCompleted(ch.id);
                    return (
                      <div
                        key={ch.id}
                        onClick={() => { if (chUnlocked) { setActiveChapter(ch); setActiveArcForChapter(arc); } }}
                        style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12,
                          background: chCompleted ? arc.rankColor + "15" : chUnlocked ? T.surface : "rgba(15,15,30,0.3)",
                          border: `1px solid ${chCompleted ? arc.rankColor + "44" : chUnlocked ? "#1e1e3f" : "#0f172a"}`,
                          cursor: chUnlocked ? "pointer" : "default",
                          opacity: chUnlocked ? 1 : 0.4,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: chCompleted ? arc.rankColor + "30" : "rgba(30,30,60,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {chCompleted ? (
                            ch.iconSrc ? <img src={ch.iconSrc} alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 6px ${arc.rankColor}88) brightness(1.2)` }} /> : <img src={STAT_ICONS.vit} alt="done" style={{ width: 22, height: 22, objectFit: "contain", filter: "drop-shadow(0 0 4px #22c55e88) hue-rotate(60deg)" }} />
                          ) : chUnlocked ? (
                            ch.iconSrc ? <img src={ch.iconSrc} alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: "brightness(0.8)" }} /> : <span style={{ fontSize: 18 }}>{ch.icon}</span>
                          ) : <img src={GATE_ICONS.normal} alt="locked" style={{ width: 22, height: 22, objectFit: "contain", filter: "grayscale(100%) brightness(0.4)" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: chCompleted ? arc.rankColor : chUnlocked ? "#e2e8f0" : "#475569", fontFamily: "'Outfit', sans-serif" }}>{ch.title}</div>
                          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                            {chUnlocked ? ch.description : `Lv. ${ch.unlockLevel} erforderlich`}
                          </div>
                        </div>
                        {chUnlocked && !chCompleted && (
                          <div style={{ padding: "6px 12px", borderRadius: 8, background: arc.rankColor + "22", color: arc.rankColor, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, flexShrink: 0 }}>
                            SPIELEN ›
                          </div>
                        )}
                        {chCompleted && (
                          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, flexShrink: 0 }}>
                            ERNEUT LESEN ›
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Arc Boss */}
                  {(arc.arcBoss || arc.finalBoss) && (() => {
                    const boss = arc.arcBoss || arc.finalBoss;
                    const allChaptersDone = arc.chapters.every(ch => isChapterCompleted(ch.id));
                    const bossDefeated = isBossDefeated(arc.id);
                    return (
                      <div
                        onClick={() => allChaptersDone && (setActiveBoss(boss), setActiveBossArc(arc))}
                        style={{
                          marginTop: 8, padding: "14px 16px", borderRadius: 12,
                          background: bossDefeated ? "#22c55e12" : allChaptersDone ? "#ef444415" : "rgba(15,15,30,0.3)",
                          border: `1px solid ${bossDefeated ? "#22c55e30" : allChaptersDone ? "#ef444444" : "#0f172a"}`,
                          opacity: allChaptersDone ? 1 : 0.4,
                          display: "flex", alignItems: "center", gap: 14,
                          cursor: allChaptersDone && !bossDefeated ? "pointer" : bossDefeated ? "default" : "not-allowed",
                          transition: "all 0.2s ease",
                          boxShadow: allChaptersDone && !bossDefeated ? "0 0 0 0 rgba(239,68,68,0)" : "none",
                          animation: allChaptersDone && !bossDefeated ? "bossGlow 2s ease-in-out infinite" : "none",
                        }}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: bossDefeated ? "#22c55e22" : "#ef444422", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                          {bossDefeated ? <img src={STAT_ICONS.vit} alt="done" style={{ width: 24, height: 24, objectFit: "contain", filter: "drop-shadow(0 0 4px #22c55e88) hue-rotate(60deg)" }} /> : boss.iconSrc ? (
                            <img src={boss.iconSrc} alt={boss.name} style={{ width: 30, height: 30, objectFit: "contain", filter: "drop-shadow(0 0 8px #ef444499) brightness(1.1)" }} />
                          ) : boss.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: bossDefeated ? "#22c55e" : "#ef4444", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 2 }}>
                            {bossDefeated ? "BOSS BESIEGT" : "BOSS"}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Cinzel', serif" }}>{boss.name}</div>
                          <div style={{ fontSize: 10, color: bossDefeated ? "#22c55eaa" : "#ef4444aa", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                            {boss.rank}-RANK • +{boss.rewards?.xp} XP{boss.rewards?.namedShadow ? ` • Shadow: ${boss.rewards.namedShadow}` : ""}
                          </div>
                        </div>
                        {!allChaptersDone && <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>Alle Kapitel<br />abschließen</div>}
                        {allChaptersDone && !bossDefeated && (
                          <div style={{ padding: "6px 12px", borderRadius: 8, background: "#ef444422", color: "#ef4444", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, flexShrink: 0 }}>
                            KÄMPFEN ›
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Locked overlay */}
              {!unlocked && (
                <div style={{ padding: "8px 20px 16px", fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                  Erfordert Level {arc.levelRange.min}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
