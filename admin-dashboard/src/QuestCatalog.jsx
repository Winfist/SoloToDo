import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CAT_COLORS = { str: '#ef4444', int: '#3b82f6', vit: '#22c55e', agi: '#f59e0b', cha: '#a855f7' };
const CAT_ICONS = { str: '⚔️', int: '📖', vit: '🛡️', agi: '⚡', cha: '👥' };

// ─── QUEST POOL (from questPool.js) ───
const QUEST_POOL=[
{id:"qp_str_01",title:"Sportlicher Start (Leicht)",category:"str",difficulty:"easy",minLevel:1,desc:"Bewege deinen Körper, um fit und gesund zu bleiben.",tags:["fitness","bodyweight"],subQuests:[{title:"10 Liegestütze"},{title:"20 Kniebeugen"}]},
{id:"qp_str_01b",title:"Dehnung & Beweglichkeit",category:"str",difficulty:"easy",minLevel:1,desc:"Stretching löst Verspannungen.",subQuests:[{title:"10 Min aktives Stretching oder Yoga"}]},
{id:"qp_str_02",title:"Ganzkörper-Workout (Mittel)",category:"str",difficulty:"normal",minLevel:3,desc:"Ausgewogenes Workout für Grundmuskulatur.",subQuests:[{title:"30 Liegestütze"},{title:"60s Plank"},{title:"10 Burpees"}]},
{id:"qp_str_02b",title:"Ausdauer-Training: Laufen",category:"str",difficulty:"normal",minLevel:5,desc:"Joggen stärkt Herz-Kreislauf.",subQuests:[{title:"30 Min Laufen"}]},
{id:"qp_str_02c",title:"Intensiv-Intervalle (HIIT)",category:"str",difficulty:"normal",minLevel:5,desc:"Kurze hochintensive Einheiten.",subQuests:[{title:"15 Min HIIT"},{title:"5 Sprints"}]},
{id:"qp_str_03",title:"Krafttraining im Gym",category:"str",difficulty:"hard",minLevel:10,desc:"Fokussierter Muskelaufbau.",subQuests:[{title:"45 Min Krafttraining"},{title:"2 Sätze bis Muskelversagen"}]},
{id:"qp_str_03b",title:"Hohes Übungsvolumen",category:"str",difficulty:"hard",minLevel:15,desc:"Ausdauer durch Wiederholungen.",subQuests:[{title:"100 Liegestütze"},{title:"200 Kniebeugen"}]},
{id:"qp_str_04",title:"Extrem-Herausforderung (Boss)",category:"str",difficulty:"boss",minLevel:25,desc:"Körperlicher Härtetest.",subQuests:[{title:"100 Liegestütze am Stück"},{title:"100 Sit-Ups"},{title:"10km Laufen"}]},
{id:"qp_int_01",title:"Lesen für den Geist",category:"int",difficulty:"easy",minLevel:1,desc:"Lies einen Abschnitt und fasse zusammen.",subQuests:[{title:"15 Seiten lesen"},{title:"Notizen machen"}]},
{id:"qp_int_01b",title:"Gehirnjogging",category:"int",difficulty:"easy",minLevel:1,desc:"Rätsel für logisches Denken.",subQuests:[{title:"Anspruchsvolles Rätsel lösen"}]},
{id:"qp_int_02",title:"Fokussiertes Lernen",category:"int",difficulty:"normal",minLevel:5,desc:"Feste Lernblöcke ohne Ablenkung.",subQuests:[{title:"45 Min konzentriert lernen"},{title:"Mündlich zusammenfassen"}]},
{id:"qp_int_02b",title:"Sprachenlernen",category:"int",difficulty:"normal",minLevel:7,desc:"Neue Sprache üben.",subQuests:[{title:"30 Min Sprachübung"},{title:"20 neue Vokabeln"}]},
{id:"qp_int_03",title:"Deep Work Session",category:"int",difficulty:"hard",minLevel:12,desc:"Ununterbrochen an Projekt arbeiten.",subQuests:[{title:"2h Deep Work"},{title:"Smartphone weglegen"}]},
{id:"qp_int_03b",title:"Komplexes Problemlösen",category:"int",difficulty:"hard",minLevel:15,desc:"Anspruchsvolle Fachaufgabe.",subQuests:[{title:"Fachthema erarbeiten"},{title:"Lösungsweg dokumentieren"}]},
{id:"qp_int_04",title:"Meisterschafts-Abschluss (Boss)",category:"int",difficulty:"boss",minLevel:25,desc:"Großes Lernziel beenden.",subQuests:[{title:"Online-Kurs beenden"},{title:"Praxis anwenden"},{title:"Anderen beibringen"}]},
{id:"qp_vit_01",title:"Ausreichend Schlaf & Hydration",category:"vit",difficulty:"easy",minLevel:1,desc:"Genug Schlaf und Wasser.",subQuests:[{title:"2L Wasser trinken"},{title:"7h Schlaf"}]},
{id:"qp_vit_01b",title:"Tageslicht tanken",category:"vit",difficulty:"easy",minLevel:2,desc:"Morgendliches Sonnenlicht.",subQuests:[{title:"15 Min ans Tageslicht"}]},
{id:"qp_vit_02",title:"Gesunde Ernährung (Zucker-Verzicht)",category:"vit",difficulty:"normal",minLevel:4,desc:"Kein industrieller Zucker.",subQuests:[{title:"Verzicht auf Süßes"},{title:"Vollwertige Mahlzeit kochen"}]},
{id:"qp_vit_02b",title:"Meditation & Achtsamkeit",category:"vit",difficulty:"normal",minLevel:6,desc:"Meditation reduziert Stress.",subQuests:[{title:"15 Min Meditation"},{title:"4h kein Social Media"}]},
{id:"qp_vit_03",title:"Körperliche Abhärtung",category:"vit",difficulty:"hard",minLevel:12,desc:"Kälte fördert Resilienz.",subQuests:[{title:"Kalte Dusche 60s"},{title:"Bildschirme ab 20 Uhr aus"}]},
{id:"qp_vit_04",title:"Der Reset-Tag (Boss)",category:"vit",difficulty:"boss",minLevel:25,desc:"Vollkommener Entlastungstag.",subQuests:[{title:"16h Intervallfasten"},{title:"30 Min Stille"},{title:"1h Waldspaziergang"}]},
{id:"qp_agi_01",title:"Aufräumen: Basis-Ordnung",category:"agi",difficulty:"easy",minLevel:1,desc:"Aufgeräumte Umgebung = klarer Kopf.",subQuests:[{title:"Bett machen"},{title:"Schreibtisch aufräumen"}]},
{id:"qp_agi_01b",title:"Tagesplanung & Prioritäten",category:"agi",difficulty:"easy",minLevel:2,desc:"Strukturierte Aufgaben-Übersicht.",subQuests:[{title:"Aufgaben priorisieren"},{title:"3 Tagesziele festlegen"}]},
{id:"qp_agi_02",title:"Altlasten bereinigen",category:"agi",difficulty:"normal",minLevel:5,desc:"Aufgeschobenes erledigen.",subQuests:[{title:"Inbox Zero"},{title:"Aufgeschobene Aufgabe erledigen"}]},
{id:"qp_agi_02b",title:"Die Pomodoro-Technik",category:"agi",difficulty:"normal",minLevel:8,desc:"Konzentrierte Arbeitsblöcke.",subQuests:[{title:"4 Pomodoro-Phasen"},{title:"Pausen aktiv nutzen"}]},
{id:"qp_agi_03",title:"Effizientes Time-Boxing",category:"agi",difficulty:"hard",minLevel:15,desc:"Tagesplan in Zeitblöcken.",subQuests:[{title:"Kalender-Zeitblöcke"},{title:"Priorität Nr.1 abschließen"}]},
{id:"qp_agi_03b",title:"Der Early-Bird-Vorsprung",category:"agi",difficulty:"hard",minLevel:18,desc:"Frühe Morgenstunden nutzen.",subQuests:[{title:"Vor 6:30 aufstehen"},{title:"Morgenroutine ohne Handy"},{title:"Vor 9 Uhr arbeiten"}]},
{id:"qp_agi_04",title:"Maximale Tagesproduktion (Boss)",category:"agi",difficulty:"boss",minLevel:25,desc:"Ultimativer Auslastungstest.",subQuests:[{title:"Vor Sonnenaufgang starten"},{title:"Wohnung grundreinigen"},{title:"Projekt bis Mittag"}]},
{id:"qp_cha_01",title:"Positiver Kontakt",category:"cha",difficulty:"easy",minLevel:1,desc:"Beziehungen pflegen.",subQuests:[{title:"Bei Freund melden"},{title:"Bewusst lächeln"}]},
{id:"qp_cha_01b",title:"Wertschätzung zeigen",category:"cha",difficulty:"easy",minLevel:2,desc:"Anerkennung zeigen.",subQuests:[{title:"Aufrichtiges Kompliment machen"}]},
{id:"qp_cha_02",title:"Erscheinungsbild & Körpersprache",category:"cha",difficulty:"normal",minLevel:4,desc:"Selbstsicheres Auftreten.",subQuests:[{title:"Bewusst kleiden"},{title:"Haltung korrigieren"}]},
{id:"qp_cha_02b",title:"Das Netzwerk pflegen",category:"cha",difficulty:"normal",minLevel:7,desc:"Persönliche Treffen.",subQuests:[{title:"Zum Essen einladen"},{title:"Handy weglassen"}]},
{id:"qp_cha_03",title:"Soziale Komfortzone verlassen",category:"cha",difficulty:"hard",minLevel:12,desc:"Unangenehme Interaktionen meistern.",subQuests:[{title:"Smalltalk mit Fremdem"},{title:"Konstruktives Feedback geben"}]},
{id:"qp_cha_03b",title:"Echter Kontakt statt Social Media",category:"cha",difficulty:"hard",minLevel:15,desc:"Social Media Detox.",subQuests:[{title:"24h Social-Media-Detox"},{title:"Echtes Telefonat/Treffen"}]},
{id:"qp_cha_04",title:"Präsentation & Leitung (Boss)",category:"cha",difficulty:"boss",minLevel:25,desc:"Gruppe führen.",subQuests:[{title:"Soziales Event initiieren"},{title:"Vor Gruppe präsentieren"}]},
];

// ─── EMERGENCY TEMPLATES ───
const EMERGENCY_TEMPLATES=[
{title:"NOTFALL: Körperlicher Einsatz",category:"str",difficulty:"hard",desc:"20 Liegestütze oder 30 Kniebeugen!"},
{title:"NOTFALL: Geistiger Fokus",category:"int",difficulty:"hard",desc:"15 Min konzentriert lesen/meditieren."},
{title:"NOTFALL: Dehydrations-Warnung",category:"vit",difficulty:"hard",desc:"1 Liter Wasser trinken."},
{title:"NOTFALL: Umgebungswechsel",category:"agi",difficulty:"hard",desc:"10 Min frische Luft."},
{title:"NOTFALL: Soziale Direktive",category:"cha",difficulty:"normal",desc:"Melde dich bei jemandem."},
];

// ─── REDEMPTION TEMPLATES ───
const REDEMPTION_TEMPLATES=[
{title:"Schattenrückforderung I: Körperliche Buße",category:"str",difficulty:"hard",desc:"Überwinde die Schwäche des Körpers."},
{title:"Schattenrückforderung II: Mentale Prüfung",category:"int",difficulty:"hard",desc:"Beweise deine Disziplin."},
{title:"Schattenrückforderung III: Die Rückkehr",category:"vit",difficulty:"hard",desc:"Beweise, dass du zurückgekehrt bist."},
];

// ─── SEASONAL TEMPLATES ───
const SEASONAL_TEMPLATES={
frost:[{title:"Eisige Morgenroutine: Kaltdusche 3 Tage",category:"vit",difficulty:"hard"},{title:"Frost-Training: 30 Min Outdoor-Sport",category:"str",difficulty:"normal"}],
spring:[{title:"Frühlingserwachen: 7-Tage Morgenroutine",category:"vit",difficulty:"boss"},{title:"Neue Fähigkeit – 5 Tage üben",category:"int",difficulty:"hard"}],
inferno:[{title:"Inferno-Challenge: 100 Liegestütze in 5 Tagen",category:"str",difficulty:"boss"},{title:"Hitzewelle: Max Trainingsintensität 3 Tage",category:"str",difficulty:"hard"}],
redgate:[{title:"Rotes Tor: 1h täglich lernen – 7 Tage",category:"int",difficulty:"hard"},{title:"Herbst-Offensive: Finanzplanung",category:"int",difficulty:"normal"}],
};

// ─── JOB QUESTS (simplified) ───
const JOB_QUESTS={
berserker:{name:"Berserker",color:"#ef4444",quests:["Trial of Wrath","Unstoppable Force","Berserker's Fury","Wrath Incarnate","Grand Master of Wrath"]},
archmage:{name:"Archmage",color:"#3b82f6",quests:["Pursuit of Knowledge","Scholarly Mind","Arcane Mastery","Mind Over Matter","Grand Archmage"]},
guardian:{name:"Guardian",color:"#22c55e",quests:["Shield Bearer","Enduring Spirit","Immovable Object","Iron Will","Eternal Guardian"]},
assassin:{name:"Assassin",color:"#f59e0b",quests:["Swift Blade","Treasure Hunter","Shadow Dance","Phantom Strike","Master Assassin"]},
monarch:{name:"Monarch",color:"#a855f7",quests:["Lord of Shadows","Army Builder","Commander","Sovereign","Shadow Monarch"]},
necromancer:{name:"Necromancer",color:"#6366f1",quests:["Death's Apprentice","Soul Harvester","Master of the Dead","Lord of the Undead","True Necromancer"]},
};

// ─── CHARISMA CHAINS ───
const CHARISMA_CHAINS=[
{name:"Soziale Entblößung",icon:"👥",color:"#a855f7",threshold:0,steps:5,reward:"+3 CHA"},
{name:"Gesprächsmeister",icon:"💬",color:"#6366f1",threshold:5,steps:6,reward:"+4 CHA"},
{name:"Dating-Protokoll",icon:"💘",color:"#ec4899",threshold:10,steps:7,reward:"+5 CHA"},
{name:"Public Speaking",icon:"🎤",color:"#f59e0b",threshold:15,steps:7,reward:"+5 CHA"},
{name:"Führungsprotokoll",icon:"👑",color:"#ef4444",threshold:25,steps:5,reward:"+8 CHA"},
];

function Section({ title, icon, color, badge, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="quest-source-section">
      <div className="quest-source-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <span style={{ color }}>{icon}</span>
        <h3>{title}</h3>
        {badge && <span className="quest-source-badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{badge}</span>}
        {open ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
      </div>
      {open && children}
    </div>
  );
}

export default function QuestCatalog() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const s = search.toLowerCase();

  const filteredPool = QUEST_POOL.filter(q => {
    if (catFilter !== 'all' && q.category !== catFilter) return false;
    if (s && !q.title.toLowerCase().includes(s) && !q.desc?.toLowerCase().includes(s)) return false;
    return true;
  });

  const poolStats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0, easy: 0, normal: 0, hard: 0, boss: 0 };
  QUEST_POOL.forEach(q => { poolStats[q.category]++; poolStats[q.difficulty]++; });

  return (
    <div className="animate-fade-in">
      {/* Pool Stats */}
      <div className="quest-stats-grid">
        <div className="quest-stat-card"><span className="stat-number" style={{ color: 'var(--accent)' }}>{QUEST_POOL.length}</span><span className="stat-desc">Quest Pool</span></div>
        <div className="quest-stat-card"><span className="stat-number" style={{ color: '#dc2626' }}>{EMERGENCY_TEMPLATES.length}</span><span className="stat-desc">Emergency</span></div>
        <div className="quest-stat-card"><span className="stat-number" style={{ color: '#ef4444' }}>{REDEMPTION_TEMPLATES.length}</span><span className="stat-desc">Redemption</span></div>
        <div className="quest-stat-card"><span className="stat-number" style={{ color: '#f97316' }}>8</span><span className="stat-desc">Seasonal</span></div>
        <div className="quest-stat-card"><span className="stat-number" style={{ color: '#a855f7' }}>30</span><span className="stat-desc">Job Quests</span></div>
        <div className="quest-stat-card"><span className="stat-number" style={{ color: '#ec4899' }}>{CHARISMA_CHAINS.reduce((a,c) => a+c.steps, 0)}</span><span className="stat-desc">CHA Steps</span></div>
        {Object.entries(poolStats).filter(([k]) => CAT_COLORS[k]).map(([k, v]) => (
          <div key={k} className="quest-stat-card"><span className="stat-number" style={{ color: CAT_COLORS[k] }}>{v}</span><span className="stat-desc">{CAT_ICONS[k]} {k.toUpperCase()}</span></div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input type="text" placeholder="Quest-Vorlage suchen..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 14, width: '100%' }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">Alle Kategorien</option>
          {Object.entries(CAT_COLORS).map(([k]) => <option key={k} value={k}>{CAT_ICONS[k]} {k.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Quest Pool */}
      <Section title="Quest Pool — Statische Vorlagen" icon="📋" color="var(--accent)" badge={`${filteredPool.length} Quests`}>
        <div className="quest-cards-grid">
          {filteredPool.map(q => (
            <div key={q.id} className={`quest-card cat-${q.category}`}>
              <div className="quest-card-title">{CAT_ICONS[q.category]} {q.title}</div>
              <div className="quest-card-desc">{q.desc}</div>
              <div className="quest-card-meta">
                <span className={`quest-meta-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                <span className="quest-meta-tag">Min Lvl {q.minLevel}</span>
              </div>
              {q.subQuests?.length > 0 && (
                <div className="quest-subquests">{q.subQuests.map((sq, i) => <div key={i} className="quest-subquest-item">{sq.title}</div>)}</div>
              )}
              {q.tags?.length > 0 && <div className="quest-tags">{q.tags.map((t,i) => <span key={i} className="quest-tag">{t}</span>)}</div>}
            </div>
          ))}
        </div>
      </Section>

      {/* Emergency Templates */}
      <Section title="Emergency Quest Templates" icon="🚨" color="#dc2626" badge="5 Vorlagen">
        <div className="quest-cards-grid">
          {EMERGENCY_TEMPLATES.map((q,i) => (
            <div key={i} className={`quest-card cat-${q.category}`}>
              <div className="quest-card-title">{CAT_ICONS[q.category]} {q.title}</div>
              <div className="quest-card-desc">{q.desc}</div>
              <div className="quest-card-meta">
                <span className={`quest-meta-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                <span className="quest-meta-tag">×2.5 XP/Gold</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Redemption */}
      <Section title="Redemption Templates (Shadow Regression)" icon="🔥" color="#ef4444" badge="3 Vorlagen">
        <div className="quest-cards-grid">
          {REDEMPTION_TEMPLATES.map((q,i) => (
            <div key={i} className={`quest-card cat-${q.category}`}>
              <div className="quest-card-title">{CAT_ICONS[q.category]} {q.title}</div>
              <div className="quest-card-desc">{q.desc}</div>
              <div className="quest-card-meta">
                <span className={`quest-meta-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                <span className="quest-meta-tag">×1.5 XP</span>
                <span className="quest-meta-tag" style={{ color: '#ef4444' }}>Step {i+1}/3</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Seasonal */}
      <Section title="Seasonal Quest Templates" icon="🌦️" color="#f97316" badge="4 Saisons × 2">
        <div className="quest-cards-grid">
          {Object.entries(SEASONAL_TEMPLATES).map(([season, quests]) => quests.map((q, i) => (
            <div key={`${season}_${i}`} className={`quest-card cat-${q.category}`}>
              <div className="quest-card-title">{CAT_ICONS[q.category]} {q.title}</div>
              <div className="quest-card-meta">
                <span className={`quest-meta-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                <span className="quest-meta-tag" style={{ color: '#f97316' }}>{season}</span>
              </div>
            </div>
          )))}
        </div>
      </Section>

      {/* Job Quests */}
      <Section title="Job Quests (Klassen-Prüfungen)" icon="⚔️" color="#a855f7" badge="6 Jobs × 5">
        <div className="quest-cards-grid">
          {Object.entries(JOB_QUESTS).map(([key, job]) => (
            <div key={key} className="quest-card" style={{ borderLeftColor: job.color }}>
              <div className="quest-card-title" style={{ color: job.color }}>{job.name}</div>
              <div className="quest-step-list">
                {job.quests.map((name, i) => (
                  <div key={i} className="quest-step">
                    <span className="quest-step-title">Lvl {[1,3,5,7,10][i]}: {name}</span>
                    <span className="quest-step-diff" style={{ color: job.color }}>Trial {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Charisma Chains */}
      <Section title="Charisma Dungeon Chains" icon="💜" color="#ec4899" badge="5 Ketten">
        <div className="quest-cards-grid">
          {CHARISMA_CHAINS.map((chain, i) => (
            <div key={i} className="quest-card cat-cha">
              <div className="quest-card-title">{chain.icon} {chain.name}</div>
              <div className="quest-card-meta">
                <span className="quest-meta-tag">{chain.steps} Etagen</span>
                <span className="quest-meta-tag" style={{ color: '#a855f7' }}>{chain.reward}</span>
                <span className="quest-meta-tag">CHA ≥ {chain.threshold}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
