// ─── PHASE 6: STORY CAMPAIGN ──────────────────────────────────
// StoryView.jsx - Solo Leveling Story Campaign
// Einbinden in solo-leveling-v5.jsx als eigener View
import React, { useState, useEffect } from "react";

// ─── STORY DATA ───────────────────────────────────────────────
export const STORY_ARCS = [
  {
    id: "arc1",
    name: "The Weakest Hunter",
    subtitle: "Der schwächste Jäger der Welt",
    levelRange: { min: 1, max: 10 },
    rank: "E",
    rankColor: "#6b7280",
    icon: "🗡️",
    chapters: [
      { id: "ch1", title: "First Awakening", description: "Das System erwacht", unlockLevel: 1, type: "tutorial", rewards: { xp: 25, gold: 10, unlock: "daily_quest_system" }, icon: "✨" },
      { id: "ch2", title: "The Double Dungeon", description: "Dein erstes Gate erwartet dich", unlockLevel: 5, type: "dungeon_intro", rewards: { xp: 50, gold: 20 }, icon: "🌀" },
      { id: "ch3", title: "System Initialization", description: "Das System offenbart sein wahres Gesicht", unlockLevel: 10, type: "revelation", rewards: { xp: 75, gold: 30 }, icon: "💻" },
    ],
    arcBoss: { name: "Statue of God", rank: "E", rewards: { xp: 125, title: "Survivor" }, icon: "🗿" },
  },
  {
    id: "arc2",
    name: "The Player",
    subtitle: "Der Aufstieg beginnt",
    levelRange: { min: 11, max: 20 },
    rank: "D",
    rankColor: "#22d3ee",
    icon: "⚔️",
    chapters: [
      { id: "ch4", title: "A New Beginning", description: "Erste echte Solo-Dungeons", unlockLevel: 11, type: "exploration", rewards: { xp: 80, gold: 40 }, icon: "🌄" },
      { id: "ch5", title: "The Secret of Levels", description: "Die wahre Natur des Systems", unlockLevel: 15, type: "lore", rewards: { xp: 100, gold: 50 }, icon: "📜" },
      { id: "ch6", title: "Shadows of the Past", description: "Erste Shadow-Begegnung", unlockLevel: 20, type: "shadow_intro", rewards: { xp: 125, gold: 60 }, icon: "🌑" },
    ],
    arcBoss: { name: "Cerberus", rank: "C", rewards: { xp: 250, unlock: "shadow_extraction_ability" }, icon: "🐕" },
  },
  {
    id: "arc3",
    name: "Shadow Extraction",
    subtitle: "ARISE",
    levelRange: { min: 21, max: 35 },
    rank: "C",
    rankColor: "#34d399",
    icon: "🌑",
    chapters: [
      { id: "ch7", title: "ARISE", description: "Deine erste Shadow-Beschwörung", unlockLevel: 21, type: "ability_unlock", cinematicKey: "arise_first", rewards: { xp: 150, gold: 75 }, icon: "⚫" },
      { id: "ch8", title: "Building an Army", description: "Shadow Army Mechaniken entdecken", unlockLevel: 28, type: "system_unlock", rewards: { xp: 200, gold: 100 }, icon: "🪖" },
      { id: "ch9", title: "The Hunter Association", description: "Andere Hunter existieren", unlockLevel: 35, type: "world_building", rewards: { xp: 250, gold: 125 }, icon: "🏛️" },
    ],
    arcBoss: { name: "Igris, the Bloodred Commander", rank: "B", rewards: { namedShadow: "igris", xp: 500 }, icon: "🩸" },
  },
  {
    id: "arc4",
    name: "Red Gates",
    subtitle: "Kein Entkommen",
    levelRange: { min: 36, max: 50 },
    rank: "B",
    rankColor: "#a78bfa",
    icon: "🔴",
    chapters: [
      { id: "ch10", title: "No Escape", description: "Red Gate Mechaniken", unlockLevel: 36, type: "danger_reveal", rewards: { xp: 300, gold: 150 }, icon: "🚪" },
      { id: "ch11", title: "The Ant King", description: "Jeju Island – Die wahre Bedrohung", unlockLevel: 43, type: "major_battle", rewards: { xp: 400, gold: 200 }, icon: "🐜" },
      { id: "ch12", title: "National Level", description: "S-Rank Hunter Existenz", unlockLevel: 50, type: "power_reveal", rewards: { xp: 500, gold: 250 }, icon: "🏆" },
    ],
    arcBoss: { name: "Beru, the Ant King", rank: "A", rewards: { namedShadow: "beru", xp: 750, title: "Ant Slayer" }, icon: "👑" },
  },
  {
    id: "arc5",
    name: "Monarchs",
    subtitle: "Die wahren Mächte",
    levelRange: { min: 51, max: 70 },
    rank: "A",
    rankColor: "#f59e0b",
    icon: "👁️",
    chapters: [
      { id: "ch13", title: "Rulers and Monarchs", description: "Die Wahrheit über die Welt", unlockLevel: 51, type: "lore_heavy", rewards: { xp: 600, gold: 300 }, icon: "⚖️" },
      { id: "ch14", title: "The Shadow Monarch's Legacy", description: "Deine Verbindung zur Vergangenheit", unlockLevel: 60, type: "destiny_reveal", rewards: { xp: 750, gold: 400 }, icon: "🌌" },
      { id: "ch15", title: "Domain Expansion", description: "Shadow Realm Powers erwachen", unlockLevel: 70, type: "power_unlock", rewards: { xp: 1000, gold: 500 }, icon: "🌀" },
    ],
    arcBoss: { name: "Legia, the Monarch of Giants", rank: "S", rewards: { xp: 1500, title: "Giant Slayer" }, icon: "🏔️" },
  },
  {
    id: "arc6",
    name: "Ascension",
    subtitle: "Jenseits der Menschheit",
    levelRange: { min: 71, max: 90 },
    rank: "S",
    rankColor: "#ef4444",
    icon: "🌟",
    chapters: [
      { id: "ch16", title: "Beyond Human", description: "Transzendenz – ein neues Kapitel", unlockLevel: 71, type: "transformation", rewards: { xp: 1250, gold: 600 }, icon: "🦋" },
      { id: "ch17", title: "The Final Army", description: "Bellion erwacht", unlockLevel: 80, type: "army_complete", rewards: { xp: 1750, gold: 800 }, icon: "⚜️" },
      { id: "ch18", title: "War Declaration", description: "Die letzte Schlacht naht", unlockLevel: 90, type: "setup_finale", rewards: { xp: 2250, gold: 1000 }, icon: "⚡" },
    ],
    arcBoss: { name: "Antares, the Monarch of Destruction", rank: "SS", rewards: { xp: 2500, title: "Monarch Slayer" }, icon: "💀" },
  },
  {
    id: "arc7",
    name: "The Shadow Monarch",
    subtitle: "Akzeptiere dein Schicksal",
    levelRange: { min: 91, max: 100 },
    rank: "SSS",
    rankColor: "#e879f9",
    icon: "☠️",
    chapters: [
      { id: "ch19", title: "Acceptance", description: "Akzeptiere dein Schicksal", unlockLevel: 91, type: "character_growth", rewards: { xp: 3000, gold: 1500 }, icon: "🖤" },
      { id: "ch20", title: "The Final Gate", description: "Das ultimative Dungeon", unlockLevel: 100, type: "final_dungeon", rewards: { xp: 5000, gold: 2500, title: "Shadow Monarch" }, icon: "🌑" },
    ],
    finalBoss: { name: "The Absolute Being", rank: "???", rewards: { xp: 6000, title: "Shadow Monarch", namedShadow: "bellion", unlock: "prestige_system" }, icon: "🌌" },
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
        <div style={{ fontSize: 60, marginBottom: 20, animation: "successPulse 0.6s ease" }}>✅</div>
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
          WEITER ⚔️
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
            {chapter.icon} {chapter.title}
          </div>
        </div>

        {/* Panel icon / visual */}
        <div style={{ fontSize: panel.type === "dramatic" ? 120 : 80, marginBottom: 24, filter: `drop-shadow(0 0 40px ${arc.rankColor})`, animation: "float 3s ease-in-out infinite" }}>
          {panel.icon}
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
      narration: getChapterIntro(chapter),
      systemMsg: null,
      type: "intro",
    },
    {
      icon: chapter.icon,
      narration: getChapterMid(chapter),
      systemMsg: getSystemMessage(chapter),
      type: "mid",
    },
    {
      icon: "⚔️",
      dramatic: getDramaticText(chapter, arc),
      narration: getChapterOutro(chapter),
      systemMsg: null,
      type: "dramatic",
    },
  ];
}

function getChapterIntro(ch) {
  const intros = {
    ch1: "Das System erwacht. Eine unbekannte Macht macht sich in dir breit – eine Stimme, die nur du hören kannst, eröffnet dir eine neue Welt.",
    ch2: "Ein Gate öffnet sich vor dir. Die anderen Hunter zögern. Du nicht. Das Double Dungeon wartet – und mit ihm, dein Schicksal.",
    ch3: "Die Zahlen vor deinen Augen sind keine Illusion. Das System hat dich gewählt. Warum? Das wirst du herausfinden.",
    ch4: "Zum ersten Mal betrittst du ein Dungeon allein. Kein Team. Keine Sicherheit. Nur du, deine Stärke und das Ziel: aufzusteigen.",
    ch5: "Du fragst dich, was Level wirklich bedeuten. Bist du der Einzige, der aufsteigen kann? Die Antwort erschüttert alles.",
    ch6: "Im Schatten bewegt sich etwas. Eine Präsenz, die du nicht siehst – aber spürst. Tief. Uralt. Wartend.",
    ch7: "Der Körper des gefallenen Feindes zuckt. Eine Kraft, die du nie zuvor gespürt hast, strömt durch deine Hand. Es ist Zeit.",
    ch8: "Ein Schatten. Dann zwei. Dann zehn. Deine Armee wächst im Verborgenen – und mit ihr, deine Macht über Leben und Tod.",
    ch9: "Die Hunter Association weiß von dir. Du bist kein Geheimnis mehr. Die Welt beginnt, auf dich aufmerksam zu werden.",
    ch10: "Das Gate schließt sich. Von außen. Du bist gefangen – zusammen mit Dutzenden anderen Jägern. Und dem, was sie gejagt hat.",
    ch11: "Jeju Island. Ein Name, der alle Hunter erschaudern lässt. Das Ameisennest. Das Imperium. Und sein König.",
    ch12: "S-Rank. Nationaler Level. Begriffe, die Respekt und Schrecken einflößen. Bald werden sie für dich gelten.",
    ch13: "Monarchen und Herrscher – zwei Seiten eines uralten Krieges. Du stehst mittendrin. Und du weißt es nicht einmal.",
    ch14: "Du siehst Erinnerungen, die nicht deine sind. Ein Monarch, der gefallen ist. Ein Vermächtnis, das auf dich wartet.",
    ch15: "Die Welt um dich dehnt sich aus. Dein Shadow Realm wächst. Du bist nicht mehr nur ein Hunter.",
    ch16: "Du übersteigst die Grenzen des Menschlichen. Kein Schmerz. Keine Erschöpfung. Nur Macht, grenzenlos und dunkel.",
    ch17: "Der Grand Marshal kniet vor dir nieder. Bellion – der mächtigste Schatten – hat sich erhoben. Deine Armee ist komplett.",
    ch18: "Die letzten Monarchen sammeln sich. Du bist ihr Ziel. Aber du bist auch ihre größte Bedrohung.",
    ch19: "Du hast gekämpft. Du hast gesiegt. Jetzt musst du die schwerste Entscheidung treffen – wer du sein willst.",
    ch20: "Das finale Gate pulsiert in absolutem Dunkel. Was auch immer dahinter wartet – du wirst es allein bezwingen.",
  };
  return intros[ch.id] || ch.description;
}

function getChapterMid(ch) {
  const mids = {
    ch1: "Das System zeigt dir deine Stats: alle auf Null. E-Rank. Der schwächste Hunter. Aber das System... es flüstert von Wachstum.",
    ch2: "Die Statuen. Die Falle. Der Tod um dich herum. Und du lebst noch. Warum? Das System hat eine Antwort.",
    ch3: "Tägliche Quests. XP. Levelups. Das System offenbart sich vollständig. Du bist nicht ein Hunter. Du bist der Player.",
    ch4: "Du räumst den Dungeon allein. Deine Stats steigen. Die anderen Hunter gaffen. Gestern noch E-Rank. Heute...?",
    ch5: "Das Leveling-System funktioniert nur für dich. Du bist der Einzige auf der Welt, der wachsen kann. Unbegrenzt.",
    ch6: "Der Feind fällt. Und dann... er bewegt sich nicht weg. Der Schatten bleibt. Wartet. Auf deinen Befehl.",
    ch7: "Deine Hand hebt sich. Dunkle Energie strömt hervor. Der erste Schatten erhebt sich – dir gehorchend. ARISE.",
    ch8: "Igris. Tank. Beru. Namen, die du noch nicht kennst – aber kennen wirst. Die Armee des Shadow Monarchen wächst.",
    ch9: "Die Hunter Association beobachtet dich. Ein Agent nähert sich. Sie wissen nicht, was du bist. Noch nicht.",
    ch10: "Ressourcen schwinden. Moral bricht. Aber du kämpfst weiter. Für dich. Für die, die zurückgeblieben sind.",
    ch11: "Der Ant King ist kein Monster. Er ist ein Krieger. Und als er fällt, erhebt sich sein Schatten – an deiner Seite.",
    ch12: "Jinwoo Sung. National-Level Hunter. Der Name erschallt durch die Welt. Alle wollen dich als Verbündeten... oder fürchten dich.",
    ch13: "Monarchen: Wesen, älter als die Menschheit. Sie wollen die Erde vernichten. Du bist das letzte Hindernis.",
    ch14: "Der ursprüngliche Shadow Monarch. Ein König, der seinen Thron freiwillig aufgab. Du verstehst jetzt, warum.",
    ch15: "Dein Shadow Realm expandiert. Die Schatten spüren es. Ein neues Zeitalter beginnt – und du führst es an.",
    ch16: "Selbstheilung. Unbegrenzte Ausdauer. Du bist kein Mensch mehr – aber du hast dein Herz nicht verloren.",
    ch17: "Bellion verneigt sich. Hinter ihm: Hunderte von Schatten. Deine vollständige Armee. Bereit für den letzten Krieg.",
    ch18: "Die Monarchen greifen an. Städte fallen. Aber wo du erscheinst, weicht die Dunkelheit zurück.",
    ch19: "Du hast alles verloren und gewonnen. Jetzt weißt du: Stärke allein ist nicht genug. Es braucht auch einen Grund.",
    ch20: "Das Absolute Being. Die Entität, die alles erschaffen hat – und nun alles vernichten will. Es gibt kein Zurück.",
  };
  return mids[ch.id] || "Das System beobachtet deinen Fortschritt.";
}

function getSystemMessage(ch) {
  const msgs = {
    ch1: "SYSTEM: Hunter-Klassifizierung abgeschlossen. Rang: E. Potenzial: UNBEKANNT.",
    ch2: "SYSTEM: Kritische Situation detektiert. Überlebe um jeden Preis.",
    ch3: "SYSTEM: Alle Funktionen freigeschaltet. Willkommen, Player.",
    ch4: "SYSTEM: Erster Solo-Dungeon abgeschlossen. Wachstum registriert.",
    ch5: "SYSTEM: Du bist der einzige Player in dieser Welt. Handle weise.",
    ch6: "SYSTEM: Shadow-Extraktion möglich. Bereite dich vor.",
    ch7: "SYSTEM: ERSTE SHADOW-EXTRAKTION ERFOLGREICH. SHADOW ARMY AKTIVIERT.",
    ch8: "SYSTEM: Shadow-Kapazität erhöht. Weitere Einheiten rekrutierbar.",
    ch9: "SYSTEM: Externe Beobachtung detektiert. Vorsicht empfohlen.",
    ch10: "SYSTEM: RED GATE DETEKTIERT. Ausbruch unmöglich. Kämpfe oder stirb.",
    ch11: "SYSTEM: MONARCH-KLASSE FEIND ÜBERWUNDEN. NAMED SHADOW VERFÜGBAR.",
    ch12: "SYSTEM: HUNTER-RANG AKTUALISIERT. NATIONALE EBENE ERREICHT.",
    ch13: "SYSTEM: MONARCH-BEDROHUNG DETEKTIERT. MAXIMALE KAMPFBEREITSCHAFT.",
    ch14: "SYSTEM: SHADOW MONARCH ERBE AKTIVIERT.",
    ch15: "SYSTEM: SHADOW DOMAIN ERWEITERT. HERRSCHAFT GEFESTIGT.",
    ch16: "SYSTEM: BIOLOGISCHE LIMITIERUNGEN AUFGEHOBEN.",
    ch17: "SYSTEM: SHADOW ARMY KOMPLETT. BELLION AKTIVIERT.",
    ch18: "SYSTEM: FINALER KRIEG BEGONNEN. ALLE RESSOURCEN MOBILISIERT.",
    ch19: "SYSTEM: LETZTE ENTSCHEIDUNG STEHT BEVOR.",
    ch20: "SYSTEM: FINALE SEQUENZ AKTIVIERT. ES GIBT KEINEN WEG ZURÜCK.",
  };
  return msgs[ch.id] || null;
}

function getDramaticText(ch, arc) {
  const texts = {
    ch7: "ARISE",
    ch12: "NATIONAL LEVEL",
    ch14: "SHADOW MONARCH",
    ch17: "THE ARMY IS COMPLETE",
    ch20: "IT ENDS HERE",
  };
  return texts[ch.id] || arc.name.toUpperCase();
}

function getChapterOutro(ch) {
  const outros = {
    ch1: "Ein schwacher Hunter mit einem unbekannten System. Was das Schicksal für dich bereithält – das wirst du herausfinden.",
    ch2: "Du hast das Double Dungeon überlebt. Das System hat dich belohnt. Dein Weg beginnt.",
    ch3: "Du bist der Player. Deine Reise zum stärksten Hunter hat erst begonnen.",
    ch4: "Allein. Aufsteigend. Unaufhaltsam. So wird es immer sein.",
    ch5: "Du allein kannst wachsen. Die Last – und das Geschenk – liegt bei dir.",
    ch6: "Die Schatten rufen. Du hörst sie. Bald wirst du sie befehligen.",
    ch7: "Der erste Schatten. Deine Armee beginnt zu wachsen. ARISE.",
    ch8: "Deine Armee nimmt Form an. Der Shadow Monarch erwacht.",
    ch9: "Die Welt schaut auf dich. Zeig ihr, was du bist.",
    ch10: "Überlebt. Gestärkt. Kein Gate kann dich aufhalten.",
    ch11: "Beru an deiner Seite. Die Ameisen sind deine Schwerter geworden.",
    ch12: "National Level. Nun beginnt das echte Spiel.",
    ch13: "Du kennst jetzt deinen Feind. Die Monarchen werden fallen.",
    ch14: "Das Erbe trägt dich. Du trägst das Erbe.",
    ch15: "Dein Reich expandiert. Alles gehört dir.",
    ch16: "Über Menschliches hinaus – aber noch immer du selbst.",
    ch17: "Die größte Armee der Schatten. Bereit für den finalen Kampf.",
    ch18: "Der letzte Krieg hat begonnen. Du wirst gewinnen.",
    ch19: "Wer du bist, bestimmt nur du.",
    ch20: "Dies ist das Ende. Und der Anfang von allem.",
  };
  return outros[ch.id] || "Das Kapitel schließt sich. Neue Herausforderungen warten.";
}

// ─── STORY VIEW COMPONENT ────────────────────────────────────
export default function StoryView({ gameState, onChapterComplete, theme }) {
  const [selectedArc, setSelectedArc] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeArcForChapter, setActiveArcForChapter] = useState(null);

  const playerLevel = gameState?.level || 1;
  const completedChapters = gameState?.story?.completedChapters || [];
  const T = theme || { primary: "#4f6ef7", secondary: "#7c3aed", accent: "#93b4fd", card: "rgba(12,12,24,0.85)", surface: "rgba(20,20,40,0.6)" };

  const isChapterUnlocked = (chapter) => playerLevel >= chapter.unlockLevel;
  const isChapterCompleted = (chapterId) => completedChapters.includes(chapterId);

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
          SOLO LEVELING
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
                <div style={{ width: 50, height: 50, borderRadius: 14, background: arc.rankColor + "22", border: `1px solid ${arc.rankColor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                  {arc.icon}
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
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: chCompleted ? arc.rankColor + "30" : "rgba(30,30,60,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                          {chCompleted ? "✅" : chUnlocked ? ch.icon : "🔒"}
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
                    return (
                      <div style={{ marginTop: 8, padding: "14px 16px", borderRadius: 12, background: allChaptersDone ? "#ef444415" : "rgba(15,15,30,0.3)", border: `1px solid ${allChaptersDone ? "#ef444433" : "#0f172a"}`, opacity: allChaptersDone ? 1 : 0.4, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{boss.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 2 }}>BOSS</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Cinzel', serif" }}>{boss.name}</div>
                          <div style={{ fontSize: 10, color: "#ef4444aa", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{boss.rank}-RANK • +{boss.rewards?.xp} XP{boss.rewards?.namedShadow ? ` • Shadow: ${boss.rewards.namedShadow}` : ""}</div>
                        </div>
                        {!allChaptersDone && <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>Alle Kapitel<br />abschließen</div>}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Locked overlay */}
              {!unlocked && (
                <div style={{ padding: "8px 20px 16px", fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                  🔒 Erfordert Level {arc.levelRange.min}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
