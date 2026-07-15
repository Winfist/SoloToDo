# Signal-Fundament & Hunter-Dossier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verhaltenssignale (ignorierte/getauschte/bewertete Quests, Ghost-Sessions, Zeitmuster) erfassen, als Hunter-Dossier ableiten und in KI-Prompts, regelbasierte Vergabe und eine Anti-Nerv-Coach-Policy einspeisen — inkl. Like/Dislike-UI, Systemanalyse-Block und Settings-Reset.

**Architecture:** Direkt-Aggregation im User-State (drei neue Felder `questSignals`/`sessionSignals`/`coachSignals`), gepflegt von reinen Recorder-Funktionen in `data/signals.js`. Das Dossier ist KEIN gespeichertes Dokument, sondern reine Selektoren in `data/hunterDossier.js`. Eine reine Policy in `data/coachPolicy.js` deckelt Coach-Meldungen (Budget/Mute/Posture) und behebt dabei zwei Live-Bugs (30-Min-Re-Fire, nie persistiertes Weekly-Report-Flag).

**Tech Stack:** Vite + React (JSX, Inline-Styles), Firebase (State-Spiegel), reine ES-Module in `data/`, Node-Testskripte in `scripts/` (`node scripts/test-x.mjs`).

**Spec:** `docs/superpowers/specs/2026-07-14-signal-fundament-hunter-dossier-design.md` (v3, Commit 80a8a91).

## Global Constraints

- `data/`-Module bleiben pur: keine React-/Firebase-Imports; `data/signals.js` importiert höchstens `./dateUtils.js`.
- Alle Recorder/Selektoren sind defensiv: fehlende Felder = Default, **niemals werfen** (sie laufen im Boot-Pfad).
- de.js-Strings mit **echten Umlauten** (Sweep-Konvention seit 10.06.); jede neue UI-Zeile in de UND en.
- Deckel exakt wie Spec: `byTemplate` max 200 Einträge, `recentExpired`/`recentDisliked` max 10, Session-Ringpuffer exakt 14 Kalendertage, Notizen max 140 Zeichen, Backoff = 3x ignoriert → 7 Tage Mute, Budget = 1 „coaching" + 1 „warning"/Tag (Celebrations nie gedeckelt).
- Free/Pro-Verhalten unverändert: alles hier gilt für beide Tiers.
- Tageszeit-Buckets exakt: morgen 5–10, mittag 10–14, abend 14–20, nacht 20–5 Uhr.
- Zähler sind monoton; Merge = punktweise `Math.max`.
- Commits klein und deutsch im bestehenden Stil (`feat(signals): …`), jeweils am Task-Ende.
- Tests: Muster von `scripts/test-quest-feedback.mjs` (check-Helper, `process.exit(1)` bei Fehlern, Abschlusszeile `"✓ test-<name>: alles gruen"`).

---

### Task 1: Recorder-Modul `data/signals.js` + defaultState-Felder

**Files:**
- Create: `data/signals.js`
- Modify: `data/defaultState.js` (nach Zeile 48, `questReplacements`)
- Test: `scripts/test-signals.mjs`

**Interfaces:**
- Consumes: `getLocalDateKey(date)` aus `data/dateUtils.js` (existiert, liefert `"YYYY-MM-DD"`).
- Produces (spätere Tasks verlassen sich exakt hierauf):
  - `DEFAULT_QUEST_SIGNALS`, `DEFAULT_SESSION_SIGNALS`, `DEFAULT_COACH_SIGNALS` (Objekt-Shapes s.u.)
  - `recordQuestsAssigned(state, quests, today) → state`
  - `recordQuestsExpired(state, quests, today) → state`
  - `recordQuestCompleted(state, quest, nowMs) → state`
  - `recordQuestsSwapped(state, replacedQuests, today, { implicitDislike = false } = {}) → state`
  - `applyQuestRating(state, questId, rating /* "liked"|"disliked"|null */, today) → state` (setzt auch `quest.userRating`)
  - `applyDislikeNote(state, questId, note) → state`
  - `recordAppOpen(state, today) → state`
  - `recordUserAction(state, today) → state`
  - `recordInterventionShown(state, checkId, kind /* "coaching"|"warning" */, today) → state`
  - `resolveInterventionOutcomes(state, today) → state`
  - `getHourBucket(hour) → "morgen"|"mittag"|"abend"|"nacht"`

- [ ] **Step 1: Failing Test schreiben**

`scripts/test-signals.mjs` (vollständig):

```js
import {
  DEFAULT_QUEST_SIGNALS, DEFAULT_SESSION_SIGNALS, DEFAULT_COACH_SIGNALS,
  recordQuestsAssigned, recordQuestsExpired, recordQuestCompleted, recordQuestsSwapped,
  applyQuestRating, applyDislikeNote, recordAppOpen, recordUserAction,
  recordInterventionShown, resolveInterventionOutcomes, getHourBucket,
} from "../data/signals.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

// ── Buckets ──
check(getHourBucket(6) === "morgen" && getHourBucket(11) === "mittag"
  && getHourBucket(15) === "abend" && getHourBucket(22) === "nacht" && getHourBucket(2) === "nacht", "Stunden-Buckets");

// ── Assigned / Expired ──
const q1 = { id: "a", templateId: "t_run", category: "str", title: "Lauf 30 Minuten", isSystem: true, type: "daily" };
const q2 = { id: "b", category: "int", title: "KI-Quest ohne Template", isSystem: true, type: "daily", aiGenerated: true };
let s = recordQuestsAssigned({}, [q1, q2], "2026-07-15");
check(s.questSignals.byTemplate.t_run.assigned === 1, "assigned je Template");
check(s.questSignals.byTemplate.t_run.lastAssignedAt === "2026-07-15", "lastAssignedAt gestempelt");
check(s.questSignals.byCategory.str.assigned === 1 && s.questSignals.byCategory.int.assigned === 1, "assigned je Kategorie (auch ohne templateId)");
check(!s.questSignals.byTemplate.undefined, "kein Muell-Key fuer fehlende templateId");

s = recordQuestsExpired(s, [q1, q2], "2026-07-16");
check(s.questSignals.byTemplate.t_run.expired === 1 && s.questSignals.byCategory.int.expired === 1, "expired gezaehlt");
check(s.questSignals.recentExpired.length === 2 && s.questSignals.recentExpired[0].title === "Lauf 30 Minuten", "recentExpired gefuellt, neueste zuerst");

// recentExpired-Deckel 10
let sCap = s;
for (let i = 0; i < 12; i++) sCap = recordQuestsExpired(sCap, [{ id: `x${i}`, category: "str", title: `Q${i}`, isSystem: true }], "2026-07-17");
check(sCap.questSignals.recentExpired.length === 10, "recentExpired Deckel 10");

// ── Completed: Zaehler + Zeit-Buckets + Wochentag ──
const mondayMorning = new Date("2026-07-13T07:30:00").getTime(); // Montag, 7:30
s = recordQuestCompleted(s, q1, mondayMorning);
check(s.questSignals.byTemplate.t_run.completed === 1 && s.questSignals.byCategory.str.completed === 1, "completed gezaehlt");
check(s.questSignals.completionHours.morgen === 1, "Zeit-Bucket morgen");
check(s.questSignals.completionWeekdays[1] === 1, "Wochentag Montag");
// eigene Quest: nur Buckets, keine byCategory.assigned-Verzerrung
const own = { id: "o", category: "cha", title: "Eigene Aufgabe", isSystem: false };
const sOwn = recordQuestCompleted(s, own, mondayMorning);
check(sOwn.questSignals.completionHours.morgen === 2, "eigene Quest zaehlt in Buckets");
check((sOwn.questSignals.byCategory.cha?.assigned || 0) === 0, "eigene Quest erhoeht assigned nicht");

// ── Swap: Schmiede vs. manuelle Ersetzung ──
s = recordQuestsSwapped(s, [q1], "2026-07-16");
check(s.questSignals.byTemplate.t_run.swapped === 1 && (s.questSignals.byTemplate.t_run.disliked || 0) === 0, "Schmiede-Swap ohne Dislike");
s = recordQuestsSwapped(s, [q1], "2026-07-16", { implicitDislike: true });
check(s.questSignals.byTemplate.t_run.disliked === 1 && s.questSignals.byTemplate.t_run.lastDislikedAt === "2026-07-16", "Ersetzung = implizites Dislike");
check(s.questSignals.recentDisliked[0].title === "Lauf 30 Minuten", "recentDisliked gefuellt");

// ── Rating: like/dislike/undo auf offener Quest ──
let sr = { quests: [{ ...q1 }], questSignals: undefined };
sr = applyQuestRating(sr, "a", "liked", "2026-07-15");
check(sr.quests[0].userRating === "liked" && sr.questSignals.byCategory.str.liked === 1, "Like setzt Rating + Zaehler");
sr = applyQuestRating(sr, "a", null, "2026-07-15");
check(sr.quests[0].userRating === null && sr.questSignals.byCategory.str.liked === 0, "Undo dekrementiert (Floor 0)");
sr = applyQuestRating(sr, "a", "disliked", "2026-07-15");
check(sr.questSignals.byTemplate.t_run.disliked === 1 && sr.questSignals.recentDisliked[0].questId === "a", "Dislike erzeugt recentDisliked-Eintrag");
sr = applyDislikeNote(sr, "a", "  zu   lang und " + "x".repeat(300));
check(sr.questSignals.recentDisliked[0].note.length <= 140, "Notiz bereinigt + 140-Deckel");
sr = applyQuestRating(sr, "a", null, "2026-07-15");
check(sr.questSignals.recentDisliked.length === 0, "Dislike-Undo entfernt Eintrag");

// ── Sessions ──
let ss = recordAppOpen({}, "2026-07-15");
ss = recordAppOpen(ss, "2026-07-15");
ss = recordUserAction(ss, "2026-07-15");
check(ss.sessionSignals.days["2026-07-15"].opens === 2 && ss.sessionSignals.days["2026-07-15"].actions === 1, "opens/actions gezaehlt");
// Ringpuffer: 20 Tage einspeisen -> nur 14 bleiben
let sw = {};
for (let i = 1; i <= 20; i++) sw = recordAppOpen(sw, `2026-07-${String(i).padStart(2, "0")}`);
check(Object.keys(sw.sessionSignals.days).length === 14 && !sw.sessionSignals.days["2026-07-01"], "Ringpuffer exakt 14 Tage");

// ── Coach: shown/Budget-Zaehler + Outcome-Aufloesung + Backoff ──
let sc = recordInterventionShown({}, "habitReminder", "coaching", "2026-07-15");
check(sc.coachSignals.byType.habitReminder.shown === 1, "shown gezaehlt");
check(sc.coachSignals.daily.date === "2026-07-15" && sc.coachSignals.daily.coachingShown === 1, "Tagesbudget-Zaehler");
check(sc.coachSignals.pendingOutcome.length === 1, "pendingOutcome angelegt");
// Tag hatte KEINE Aktion -> ignoriert
sc = resolveInterventionOutcomes(sc, "2026-07-16");
check(sc.coachSignals.byType.habitReminder.consecutiveIgnored === 1 && sc.coachSignals.pendingOutcome.length === 0, "ignoriert aufgeloest");
// 2x weiter ignorieren -> Mute 7 Tage
sc = recordInterventionShown(sc, "habitReminder", "coaching", "2026-07-16");
sc = resolveInterventionOutcomes(sc, "2026-07-17");
sc = recordInterventionShown(sc, "habitReminder", "coaching", "2026-07-17");
sc = resolveInterventionOutcomes(sc, "2026-07-18");
check(sc.coachSignals.byType.habitReminder.consecutiveIgnored === 3 && sc.coachSignals.byType.habitReminder.mutedUntil === "2026-07-25", "3x ignoriert -> mutedUntil +7 Tage");
// Tag MIT Aktion -> acted, Reset
sc = recordUserAction(sc, "2026-07-26");
sc = recordInterventionShown(sc, "habitReminder", "coaching", "2026-07-26");
sc = resolveInterventionOutcomes(sc, "2026-07-27");
check(sc.coachSignals.byType.habitReminder.actedSameDay === 1 && sc.coachSignals.byType.habitReminder.consecutiveIgnored === 0, "acted setzt Ignoranz zurueck");

// ── Defensiv ──
check(recordQuestsAssigned(null, null, null), "null-State wirft nicht");
check(recordQuestCompleted({}, null, NaN), "kaputte Inputs werfen nicht");
check(applyQuestRating({}, "missing", "liked", "2026-07-15"), "unbekannte Quest wirft nicht");

// ── defaultState enthaelt die Felder ──
import { DEFAULT_STATE } from "../data/defaultState.js";
check(DEFAULT_STATE.questSignals && DEFAULT_STATE.sessionSignals && DEFAULT_STATE.coachSignals, "DEFAULT_STATE hat alle drei Felder");
check(JSON.stringify(DEFAULT_STATE.questSignals) === JSON.stringify(DEFAULT_QUEST_SIGNALS), "DEFAULT_STATE nutzt DEFAULT_QUEST_SIGNALS-Shape");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-signals: alles gruen");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-signals.mjs`
Expected: FAIL (`Cannot find module '../data/signals.js'`)

- [ ] **Step 3: `data/signals.js` implementieren**

```js
// signals.js — Verhaltenssignale als Direkt-Aggregation (Spec 2026-07-14 §3).
// Reine state->state-Recorder, defensiv: sie laufen im Boot-Pfad und duerfen
// niemals werfen. Einziger Import: dateUtils.

import { getLocalDateKey } from "./dateUtils.js";

const CATS = ["str", "int", "vit", "agi", "cha"];
const TEMPLATE_CAP = 200;
const RECENT_CAP = 10;
const SESSION_WINDOW_DAYS = 14;
const NOTE_MAX = 140;
const MUTE_AFTER_IGNORED = 3;
const MUTE_DAYS = 7;

export const DEFAULT_QUEST_SIGNALS = {
  byTemplate: {},
  byCategory: {},
  completionHours: { morgen: 0, mittag: 0, abend: 0, nacht: 0 },
  completionWeekdays: [0, 0, 0, 0, 0, 0, 0],
  recentExpired: [],
  recentDisliked: [],
};
export const DEFAULT_SESSION_SIGNALS = { days: {} };
export const DEFAULT_COACH_SIGNALS = {
  byType: {},
  daily: { date: null, coachingShown: 0, warningShown: 0 },
  pendingOutcome: [],
};

export function getHourBucket(hour) {
  const h = Number(hour);
  if (h >= 5 && h < 10) return "morgen";
  if (h >= 10 && h < 14) return "mittag";
  if (h >= 14 && h < 20) return "abend";
  return "nacht";
}

const cleanNote = (value) => typeof value === "string"
  ? value.trim().replace(/\s+/g, " ").slice(0, NOTE_MAX)
  : "";
const dayKey = (value) => (typeof value === "string" && value ? value : getLocalDateKey(new Date()));
const addDays = (key, days) => {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  d.setDate(d.getDate() + days);
  return getLocalDateKey(d);
};

function getQuestSignals(state) {
  const qs = state?.questSignals || {};
  return {
    byTemplate: { ...(qs.byTemplate || {}) },
    byCategory: { ...(qs.byCategory || {}) },
    completionHours: { ...DEFAULT_QUEST_SIGNALS.completionHours, ...(qs.completionHours || {}) },
    completionWeekdays: Array.isArray(qs.completionWeekdays) && qs.completionWeekdays.length === 7
      ? [...qs.completionWeekdays] : [0, 0, 0, 0, 0, 0, 0],
    recentExpired: Array.isArray(qs.recentExpired) ? [...qs.recentExpired] : [],
    recentDisliked: Array.isArray(qs.recentDisliked) ? [...qs.recentDisliked] : [],
  };
}

const templateEntry = (map, id) => ({
  assigned: 0, completed: 0, expired: 0, swapped: 0, liked: 0, disliked: 0,
  lastAssignedAt: null, lastDislikedAt: null,
  ...(map[id] || {}),
});
const categoryEntry = (map, cat) => ({
  assigned: 0, completed: 0, expired: 0, liked: 0, disliked: 0,
  ...(map[cat] || {}),
});
const bump = (entry, field, delta = 1) => ({ ...entry, [field]: Math.max(0, (Number(entry[field]) || 0) + delta) });

function capTemplates(byTemplate) {
  const keys = Object.keys(byTemplate);
  if (keys.length <= TEMPLATE_CAP) return byTemplate;
  const sorted = keys.sort((a, b) => String(byTemplate[a].lastAssignedAt || "").localeCompare(String(byTemplate[b].lastAssignedAt || "")));
  const next = { ...byTemplate };
  for (const key of sorted.slice(0, keys.length - TEMPLATE_CAP)) delete next[key];
  return next;
}

function pushRecent(list, entry) {
  return [entry, ...list].slice(0, RECENT_CAP);
}

function forQuests(state, quests, fn) {
  try {
    const qs = getQuestSignals(state);
    for (const quest of Array.isArray(quests) ? quests : []) {
      if (!quest) continue;
      fn(qs, quest);
    }
    qs.byTemplate = capTemplates(qs.byTemplate);
    return { ...(state || {}), questSignals: qs };
  } catch {
    return state || {};
  }
}

export function recordQuestsAssigned(state, quests, today) {
  const day = dayKey(today);
  return forQuests(state, quests, (qs, quest) => {
    if (quest.templateId) {
      qs.byTemplate[quest.templateId] = { ...bump(templateEntry(qs.byTemplate, quest.templateId), "assigned"), lastAssignedAt: day };
    }
    if (CATS.includes(quest.category)) {
      qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "assigned");
    }
  });
}

export function recordQuestsExpired(state, quests, today) {
  const day = dayKey(today);
  return forQuests(state, quests, (qs, quest) => {
    if (quest.templateId) qs.byTemplate[quest.templateId] = bump(templateEntry(qs.byTemplate, quest.templateId), "expired");
    if (CATS.includes(quest.category)) qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "expired");
    if (quest.title) qs.recentExpired = pushRecent(qs.recentExpired, { title: String(quest.title).slice(0, 140), category: quest.category || null, date: day });
  });
}

export function recordQuestCompleted(state, quest, nowMs) {
  try {
    if (!quest) return state || {};
    const qs = getQuestSignals(state);
    const at = Number.isFinite(Number(nowMs)) ? new Date(Number(nowMs)) : new Date();
    qs.completionHours[getHourBucket(at.getHours())] += 1;
    qs.completionWeekdays[at.getDay()] += 1;
    if (quest.isSystem) {
      if (quest.templateId) qs.byTemplate[quest.templateId] = bump(templateEntry(qs.byTemplate, quest.templateId), "completed");
      if (CATS.includes(quest.category)) qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "completed");
    }
    qs.byTemplate = capTemplates(qs.byTemplate);
    return { ...(state || {}), questSignals: qs };
  } catch {
    return state || {};
  }
}

export function recordQuestsSwapped(state, replacedQuests, today, { implicitDislike = false } = {}) {
  const day = dayKey(today);
  return forQuests(state, replacedQuests, (qs, quest) => {
    if (quest.templateId) {
      let entry = bump(templateEntry(qs.byTemplate, quest.templateId), "swapped");
      if (implicitDislike) entry = { ...bump(entry, "disliked"), lastDislikedAt: day };
      qs.byTemplate[quest.templateId] = entry;
    }
    if (CATS.includes(quest.category) && implicitDislike) {
      qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "disliked");
    }
    if (implicitDislike && quest.title) {
      qs.recentDisliked = pushRecent(qs.recentDisliked, { questId: quest.id || null, title: String(quest.title).slice(0, 140), category: quest.category || null, note: "", date: day });
    }
  });
}

// rating: "liked" | "disliked" | null (null = Undo). Setzt quest.userRating
// und haelt die Zaehler per Delta konsistent.
export function applyQuestRating(state, questId, rating, today) {
  try {
    const quests = Array.isArray(state?.quests) ? state.quests : [];
    const quest = quests.find((q) => q && q.id === questId);
    if (!quest) return state || {};
    const previous = quest.userRating || null;
    const nextRating = rating === "liked" || rating === "disliked" ? rating : null;
    if (previous === nextRating) return state;
    const day = dayKey(today);
    const qs = getQuestSignals(state);

    const applyDelta = (which, delta) => {
      if (quest.templateId) qs.byTemplate[quest.templateId] = bump(templateEntry(qs.byTemplate, quest.templateId), which, delta);
      if (CATS.includes(quest.category)) qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), which, delta);
    };
    if (previous) applyDelta(previous, -1);
    if (nextRating) applyDelta(nextRating, +1);

    if (nextRating === "disliked") {
      if (quest.templateId) qs.byTemplate[quest.templateId] = { ...templateEntry(qs.byTemplate, quest.templateId), lastDislikedAt: day };
      qs.recentDisliked = pushRecent(qs.recentDisliked, { questId, title: String(quest.title || "").slice(0, 140), category: quest.category || null, note: "", date: day });
    }
    if (previous === "disliked" && nextRating !== "disliked") {
      qs.recentDisliked = qs.recentDisliked.filter((entry) => entry.questId !== questId);
    }
    qs.byTemplate = capTemplates(qs.byTemplate);
    return {
      ...state,
      quests: quests.map((q) => (q.id === questId ? { ...q, userRating: nextRating } : q)),
      questSignals: qs,
    };
  } catch {
    return state || {};
  }
}

export function applyDislikeNote(state, questId, note) {
  try {
    const clean = cleanNote(note);
    const qs = getQuestSignals(state);
    const index = qs.recentDisliked.findIndex((entry) => entry.questId === questId);
    if (index === -1) return state || {};
    qs.recentDisliked = qs.recentDisliked.map((entry, i) => (i === index ? { ...entry, note: clean } : entry));
    return { ...(state || {}), questSignals: qs };
  } catch {
    return state || {};
  }
}

function getSessionSignals(state) {
  const days = state?.sessionSignals?.days;
  return { days: days && typeof days === "object" ? { ...days } : {} };
}

function trimSessionDays(days, today) {
  const cutoff = addDays(today, -(SESSION_WINDOW_DAYS - 1));
  const next = {};
  for (const [key, value] of Object.entries(days)) {
    if (key >= cutoff && key <= today) next[key] = value;
  }
  return next;
}

function bumpSessionDay(state, today, field) {
  try {
    const day = dayKey(today);
    const session = getSessionSignals(state);
    const entry = { opens: 0, actions: 0, ...(session.days[day] || {}) };
    entry[field] = Math.max(0, (Number(entry[field]) || 0) + 1);
    session.days = trimSessionDays({ ...session.days, [day]: entry }, day);
    return { ...(state || {}), sessionSignals: session };
  } catch {
    return state || {};
  }
}

export function recordAppOpen(state, today) { return bumpSessionDay(state, today, "opens"); }
export function recordUserAction(state, today) { return bumpSessionDay(state, today, "actions"); }

function getCoachSignals(state) {
  const cs = state?.coachSignals || {};
  return {
    byType: { ...(cs.byType || {}) },
    daily: { ...DEFAULT_COACH_SIGNALS.daily, ...(cs.daily || {}) },
    pendingOutcome: Array.isArray(cs.pendingOutcome) ? [...cs.pendingOutcome] : [],
  };
}
const coachTypeEntry = (map, type) => ({
  shown: 0, actedSameDay: 0, consecutiveIgnored: 0, mutedUntil: null,
  ...(map[type] || {}),
});

export function recordInterventionShown(state, checkId, kind, today) {
  try {
    if (!checkId) return state || {};
    const day = dayKey(today);
    const cs = getCoachSignals(state);
    cs.byType[checkId] = bump(coachTypeEntry(cs.byType, checkId), "shown");
    const daily = cs.daily.date === day ? cs.daily : { date: day, coachingShown: 0, warningShown: 0 };
    cs.daily = kind === "warning"
      ? { ...daily, warningShown: daily.warningShown + 1 }
      : { ...daily, coachingShown: daily.coachingShown + 1 };
    if (!cs.pendingOutcome.some((p) => p.type === checkId && p.date === day)) {
      cs.pendingOutcome = [...cs.pendingOutcome, { type: checkId, date: day }];
    }
    return { ...(state || {}), coachSignals: cs };
  } catch {
    return state || {};
  }
}

export function resolveInterventionOutcomes(state, today) {
  try {
    const day = dayKey(today);
    const cs = getCoachSignals(state);
    const days = state?.sessionSignals?.days || {};
    const open = [];
    for (const pending of cs.pendingOutcome) {
      if (!pending?.type || !pending?.date || pending.date >= day) { if (pending?.date >= day) open.push(pending); continue; }
      const acted = (Number(days[pending.date]?.actions) || 0) > 0;
      let entry = coachTypeEntry(cs.byType, pending.type);
      entry = acted
        ? { ...bump(entry, "actedSameDay"), consecutiveIgnored: 0 }
        : bump(entry, "consecutiveIgnored");
      if (!acted && entry.consecutiveIgnored >= MUTE_AFTER_IGNORED) {
        entry = { ...entry, consecutiveIgnored: entry.consecutiveIgnored, mutedUntil: addDays(day, MUTE_DAYS) };
      }
      cs.byType[pending.type] = entry;
    }
    cs.pendingOutcome = open;
    return { ...(state || {}), coachSignals: cs };
  } catch {
    return state || {};
  }
}
```

- [ ] **Step 4: defaultState erweitern**

In `data/defaultState.js` direkt nach Zeile 48 (`questReplacements: …`) einfügen:

```js
  questSignals: {
    byTemplate: {},
    byCategory: {},
    completionHours: { morgen: 0, mittag: 0, abend: 0, nacht: 0 },
    completionWeekdays: [0, 0, 0, 0, 0, 0, 0],
    recentExpired: [],
    recentDisliked: [],
  },
  sessionSignals: { days: {} },
  coachSignals: {
    byType: {},
    daily: { date: null, coachingShown: 0, warningShown: 0 },
    pendingOutcome: [],
  },
```

- [ ] **Step 5: Test laufen lassen — muss grün sein**

Run: `node scripts/test-signals.mjs`
Expected: `✓ test-signals: alles gruen`, Exit 0

- [ ] **Step 6: Commit**

```bash
git add data/signals.js data/defaultState.js scripts/test-signals.mjs
git commit -m "feat(signals): Verhaltenssignal-Recorder (Quests, Sessions, Coach) + defaultState-Felder"
```

---

### Task 2: Dossier-Selektoren `data/hunterDossier.js`

**Files:**
- Create: `data/hunterDossier.js`
- Test: `scripts/test-hunter-dossier.mjs`

**Interfaces:**
- Consumes: State-Shapes aus Task 1 (`questSignals`, `sessionSignals`), `state.streak`.
- Produces:
  - `getBestTimeBucket(state) → { bucket, percent } | null` (Gate: ≥10 Abschlüsse gesamt)
  - `getAvoidedCategories(state) → string[]` (Quote <0.25 bei ≥5 assigned ODER netDislikes ≥2)
  - `getReliableCategories(state) → string[]` (Quote >0.75 bei ≥5 assigned)
  - `getLikedCategories(state) → string[]` (netLikes ≥2)
  - `getCategoryCompletionRates(state) → { [cat]: number }` (nur Kategorien mit ≥5 assigned)
  - `getGhostStats(state) → { ghostDays, daysWithData } | null` (Gate: ≥7 Tage mit Daten)
  - `getWeakestWeekday(state) → number | null` (0–6; Gate: ≥10 Abschlüsse)
  - `getTemplateCooldowns(state, todayKey) → Set<string>` (gesperrt: `assigned≥3 && completed===0 && lastAssignedAt < 14 Tage her` ODER `disliked≥1 && lastDislikedAt < 14 Tage her`)
  - `getCoachPosture(state) → "struggling" | "cruising" | "neutral"`
  - `getDossierSummary(state) → { bestTime, avoidCategories, reliableCategories, likedCategories, categoryCompletionRates, ghost, weakestWeekday, posture }`

- [ ] **Step 1: Failing Test schreiben**

`scripts/test-hunter-dossier.mjs` (vollständig):

```js
import {
  getBestTimeBucket, getAvoidedCategories, getReliableCategories, getLikedCategories,
  getCategoryCompletionRates, getGhostStats, getWeakestWeekday, getTemplateCooldowns,
  getCoachPosture, getDossierSummary,
} from "../data/hunterDossier.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const cat = (assigned, completed, extra = {}) => ({ assigned, completed, expired: 0, liked: 0, disliked: 0, ...extra });

// ── Gates: leerer State liefert null/leer, wirft nie ──
check(getBestTimeBucket({}) === null, "bestTime Gate");
check(getAvoidedCategories({}).length === 0, "avoided leer");
check(getGhostStats({}) === null, "ghost Gate");
check(getCoachPosture({}) === "neutral", "posture default neutral");

// ── bestTime: 9 Abschluesse -> null, 10 -> Bucket ──
const nine = { questSignals: { completionHours: { morgen: 6, mittag: 1, abend: 1, nacht: 1 } } };
check(getBestTimeBucket(nine) === null, "unter 10 Abschluessen null");
const ten = { questSignals: { completionHours: { morgen: 7, mittag: 1, abend: 1, nacht: 1 } } };
const best = getBestTimeBucket(ten);
check(best.bucket === "morgen" && best.percent === 70, "bester Bucket + Prozent");

// ── Kategorien ──
const catState = { questSignals: { byCategory: {
  vit: cat(11, 2),                       // 18% -> gemieden
  int: cat(9, 8),                        // 89% -> zuverlaessig
  str: cat(4, 0),                        // unter Gate -> weder noch
  cha: cat(0, 0, { liked: 3, disliked: 1 }), // netLikes 2 -> liked
  agi: cat(0, 0, { disliked: 2 }),       // netDislikes 2 -> gemieden ohne assigned-Gate
} } };
check(getAvoidedCategories(catState).includes("vit") && getAvoidedCategories(catState).includes("agi"), "avoided: Quote + netDislikes");
check(!getAvoidedCategories(catState).includes("str"), "unter Gate nicht gemieden");
check(getReliableCategories(catState).includes("int"), "reliable");
check(getLikedCategories(catState).includes("cha"), "liked");
const rates = getCategoryCompletionRates(catState);
check(Math.abs(rates.vit - 0.18) < 0.01 && rates.str === undefined, "Quoten nur ab 5 assigned");

// ── Ghost ──
const days = {};
for (let i = 10; i <= 17; i++) days[`2026-07-${i}`] = { opens: 1, actions: i % 2 === 0 ? 0 : 1 };
const ghost = getGhostStats({ sessionSignals: { days } });
check(ghost.daysWithData === 8 && ghost.ghostDays === 4, "Ghost-Tage gezaehlt");
check(getGhostStats({ sessionSignals: { days: { "2026-07-15": { opens: 1, actions: 0 } } } }) === null, "unter 7 Tagen null");

// ── Wochentag ──
const wk = { questSignals: { completionWeekdays: [0, 3, 2, 1, 2, 1, 1] } };
check(getWeakestWeekday(wk) === 0, "schwaechster Wochentag");
check(getWeakestWeekday({ questSignals: { completionWeekdays: [0, 1, 1, 1, 1, 1, 1] } }) === null, "unter 10 Abschluessen null");

// ── Cooldowns ──
const cools = getTemplateCooldowns({ questSignals: { byTemplate: {
  t_ignored: { assigned: 3, completed: 0, expired: 3, swapped: 0, liked: 0, disliked: 0, lastAssignedAt: "2026-07-10", lastDislikedAt: null },
  t_old:     { assigned: 5, completed: 0, expired: 5, swapped: 0, liked: 0, disliked: 0, lastAssignedAt: "2026-06-01", lastDislikedAt: null },
  t_dislike: { assigned: 1, completed: 1, expired: 0, swapped: 0, liked: 0, disliked: 1, lastAssignedAt: "2026-07-14", lastDislikedAt: "2026-07-14" },
  t_fine:    { assigned: 3, completed: 1, expired: 2, swapped: 0, liked: 0, disliked: 0, lastAssignedAt: "2026-07-10", lastDislikedAt: null },
} } }, "2026-07-15");
check(cools.has("t_ignored") && cools.has("t_dislike"), "ignoriert + disliked gesperrt");
check(!cools.has("t_old") && !cools.has("t_fine"), "alt/erledigt nicht gesperrt");

// ── Posture ──
const struggling = { questSignals: { byCategory: { str: cat(10, 2) } }, sessionSignals: { days } };
check(getCoachPosture(struggling) === "struggling", "struggling bei niedriger Quote");
const cruisingDays = {};
for (let i = 10; i <= 17; i++) cruisingDays[`2026-07-${i}`] = { opens: 1, actions: 2 };
const cruising = { streak: 8, questSignals: { byCategory: { str: cat(10, 8) } }, sessionSignals: { days: cruisingDays } };
check(getCoachPosture(cruising) === "cruising", "cruising bei Streak+Quote");
check(getCoachPosture({ streak: 8, questSignals: { byCategory: { str: cat(4, 4) } } }) === "neutral", "unter Daten-Gate neutral");

// ── Summary ──
const summary = getDossierSummary(cruising);
check(summary.posture === "cruising" && Array.isArray(summary.reliableCategories), "Summary buendelt Selektoren");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-hunter-dossier: alles gruen");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-hunter-dossier.mjs`
Expected: FAIL (`Cannot find module '../data/hunterDossier.js'`)

- [ ] **Step 3: `data/hunterDossier.js` implementieren**

```js
// hunterDossier.js — Das Dossier ist kein Dokument, sondern reine Selektoren
// ueber questSignals/sessionSignals (Spec 2026-07-14 §5). Jeder Selektor hat
// ein Mindestdaten-Gate und liefert darunter null/leer.

const CATS = ["str", "int", "vit", "agi", "cha"];
const MIN_COMPLETIONS_FOR_TIME = 10;
const MIN_ASSIGNED_PER_CATEGORY = 5;
const MIN_SESSION_DAYS = 7;
const NET_RATING_THRESHOLD = 2;
const COOLDOWN_DAYS = 14;
const AVOID_RATE = 0.25;
const RELIABLE_RATE = 0.75;
const STRUGGLING_GHOST_RATE = 0.4;
const STRUGGLING_COMPLETION_RATE = 0.3;
const CRUISING_STREAK = 7;
const CRUISING_COMPLETION_RATE = 0.7;

const categories = (state) => state?.questSignals?.byCategory || {};
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export function getBestTimeBucket(state) {
  const hours = state?.questSignals?.completionHours || {};
  const entries = ["morgen", "mittag", "abend", "nacht"].map((bucket) => [bucket, num(hours[bucket])]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total < MIN_COMPLETIONS_FOR_TIME) return null;
  const [bucket, count] = entries.reduce((top, entry) => (entry[1] > top[1] ? entry : top));
  return { bucket, percent: Math.round((count / total) * 100) };
}

export function getCategoryCompletionRates(state) {
  const rates = {};
  for (const cat of CATS) {
    const entry = categories(state)[cat];
    if (num(entry?.assigned) >= MIN_ASSIGNED_PER_CATEGORY) {
      rates[cat] = num(entry.completed) / num(entry.assigned);
    }
  }
  return rates;
}

export function getAvoidedCategories(state) {
  const rates = getCategoryCompletionRates(state);
  return CATS.filter((cat) => {
    const entry = categories(state)[cat];
    const netDislikes = num(entry?.disliked) - num(entry?.liked);
    return (rates[cat] !== undefined && rates[cat] < AVOID_RATE) || netDislikes >= NET_RATING_THRESHOLD;
  });
}

export function getReliableCategories(state) {
  const rates = getCategoryCompletionRates(state);
  return CATS.filter((cat) => rates[cat] !== undefined && rates[cat] > RELIABLE_RATE);
}

export function getLikedCategories(state) {
  return CATS.filter((cat) => {
    const entry = categories(state)[cat];
    return num(entry?.liked) - num(entry?.disliked) >= NET_RATING_THRESHOLD;
  });
}

export function getGhostStats(state) {
  const days = Object.values(state?.sessionSignals?.days || {});
  const withData = days.filter((day) => num(day?.opens) > 0 || num(day?.actions) > 0);
  if (withData.length < MIN_SESSION_DAYS) return null;
  const ghostDays = withData.filter((day) => num(day?.opens) > 0 && num(day?.actions) === 0).length;
  return { ghostDays, daysWithData: withData.length };
}

export function getWeakestWeekday(state) {
  const weekdays = state?.questSignals?.completionWeekdays;
  if (!Array.isArray(weekdays) || weekdays.length !== 7) return null;
  const total = weekdays.reduce((sum, count) => sum + num(count), 0);
  if (total < MIN_COMPLETIONS_FOR_TIME) return null;
  return weekdays.reduce((weakest, count, index) => (num(count) < num(weekdays[weakest]) ? index : weakest), 0);
}

const withinDays = (dateKey, todayKey, days) => {
  if (!dateKey || !todayKey) return false;
  const then = new Date(`${dateKey}T12:00:00`).getTime();
  const now = new Date(`${todayKey}T12:00:00`).getTime();
  if (!Number.isFinite(then) || !Number.isFinite(now)) return false;
  return now - then < days * 86400000;
};

export function getTemplateCooldowns(state, todayKey) {
  const blocked = new Set();
  for (const [templateId, entry] of Object.entries(state?.questSignals?.byTemplate || {})) {
    const ignoredHard = num(entry?.assigned) >= 3 && num(entry?.completed) === 0
      && withinDays(entry?.lastAssignedAt, todayKey, COOLDOWN_DAYS);
    const disliked = num(entry?.disliked) >= 1 && withinDays(entry?.lastDislikedAt, todayKey, COOLDOWN_DAYS);
    if (ignoredHard || disliked) blocked.add(templateId);
  }
  return blocked;
}

function getOverallSystemCompletionRate(state) {
  let assigned = 0;
  let completed = 0;
  for (const cat of CATS) {
    assigned += num(categories(state)[cat]?.assigned);
    completed += num(categories(state)[cat]?.completed);
  }
  if (assigned < MIN_COMPLETIONS_FOR_TIME) return null;
  return completed / assigned;
}

export function getCoachPosture(state) {
  const ghost = getGhostStats(state);
  const rate = getOverallSystemCompletionRate(state);
  if ((ghost && ghost.ghostDays / ghost.daysWithData >= STRUGGLING_GHOST_RATE)
    || (rate !== null && rate < STRUGGLING_COMPLETION_RATE)) return "struggling";
  if ((Number(state?.streak) || 0) >= CRUISING_STREAK && rate !== null && rate > CRUISING_COMPLETION_RATE) return "cruising";
  return "neutral";
}

export function getDossierSummary(state) {
  return {
    bestTime: getBestTimeBucket(state),
    avoidCategories: getAvoidedCategories(state),
    reliableCategories: getReliableCategories(state),
    likedCategories: getLikedCategories(state),
    categoryCompletionRates: getCategoryCompletionRates(state),
    ghost: getGhostStats(state),
    weakestWeekday: getWeakestWeekday(state),
    posture: getCoachPosture(state),
  };
}
```

- [ ] **Step 4: Test laufen lassen — muss grün sein**

Run: `node scripts/test-hunter-dossier.mjs`
Expected: `✓ test-hunter-dossier: alles gruen`, Exit 0

- [ ] **Step 5: Commit**

```bash
git add data/hunterDossier.js scripts/test-hunter-dossier.mjs
git commit -m "feat(signals): Hunter-Dossier-Selektoren mit Mindestdaten-Gates"
```

---

### Task 3: Storage-Merge für die drei Signal-Felder

**Files:**
- Modify: `data/storage.js` (Merge-Funktion, in den Rückgabe-Block bei ~Z. 470–530 einfügen; Normalisierung bei ~Z. 876 neben `questReplacements`)
- Test: `scripts/test-state-merge.mjs` (erweitern)

**Interfaces:**
- Consumes: vorhandene Helfer in `storage.js`: `toFiniteNumber`, `mergeNumericMaps` (beide existieren dort bereits).
- Produces: gemergte Felder `questSignals`, `sessionSignals`, `coachSignals` im Ergebnis der Merge-Funktion.

- [ ] **Step 1: Failing Test ergänzen**

Am Ende von `scripts/test-state-merge.mjs` VOR der Fehler-Auswertung anfügen (die Datei exportiert nichts; sie importiert die Merge-Funktion bereits — denselben Import wiederverwenden; der dortige Name der Funktion ist beim Editieren aus dem Datei-Kopf zu übernehmen, z.B. `mergeStates`):

```js
// ── Signal-Felder: punktweises Math.max, Union, Deckel ──
const sigA = {
  questSignals: {
    byTemplate: { t1: { assigned: 3, completed: 1, expired: 2, swapped: 0, liked: 1, disliked: 0, lastAssignedAt: "2026-07-10", lastDislikedAt: null } },
    byCategory: { str: { assigned: 3, completed: 1, expired: 2, liked: 1, disliked: 0 } },
    completionHours: { morgen: 2, mittag: 0, abend: 1, nacht: 0 },
    completionWeekdays: [1, 0, 0, 0, 0, 0, 0],
    recentExpired: [{ title: "A", category: "str", date: "2026-07-10" }],
    recentDisliked: [],
  },
  sessionSignals: { days: { "2026-07-10": { opens: 2, actions: 1 } } },
  coachSignals: { byType: { inactivity: { shown: 2, actedSameDay: 1, consecutiveIgnored: 1, mutedUntil: null } }, daily: { date: "2026-07-10", coachingShown: 1, warningShown: 0 }, pendingOutcome: [{ type: "inactivity", date: "2026-07-10" }] },
};
const sigB = {
  questSignals: {
    byTemplate: { t1: { assigned: 5, completed: 1, expired: 4, swapped: 1, liked: 1, disliked: 1, lastAssignedAt: "2026-07-12", lastDislikedAt: "2026-07-12" } },
    byCategory: { str: { assigned: 5, completed: 1, expired: 4, liked: 1, disliked: 1 } },
    completionHours: { morgen: 1, mittag: 3, abend: 1, nacht: 0 },
    completionWeekdays: [0, 2, 0, 0, 0, 0, 0],
    recentExpired: [{ title: "B", category: "int", date: "2026-07-12" }],
    recentDisliked: [{ questId: "x", title: "C", category: "vit", note: "zu lang", date: "2026-07-12" }],
  },
  sessionSignals: { days: { "2026-07-10": { opens: 1, actions: 2 }, "2026-07-12": { opens: 1, actions: 0 } } },
  coachSignals: { byType: { inactivity: { shown: 3, actedSameDay: 1, consecutiveIgnored: 2, mutedUntil: "2026-07-19" } }, daily: { date: "2026-07-12", coachingShown: 1, warningShown: 1 }, pendingOutcome: [{ type: "inactivity", date: "2026-07-12" }] },
};
const mergedSig = mergeStates(sigA, sigB);
check(mergedSig.questSignals.byTemplate.t1.assigned === 5 && mergedSig.questSignals.byTemplate.t1.liked === 1, "byTemplate punktweise Max");
check(mergedSig.questSignals.byTemplate.t1.lastAssignedAt === "2026-07-12" && mergedSig.questSignals.byTemplate.t1.lastDislikedAt === "2026-07-12", "Datums-Max");
check(mergedSig.questSignals.completionHours.morgen === 2 && mergedSig.questSignals.completionHours.mittag === 3, "Buckets Max");
check(mergedSig.questSignals.completionWeekdays[0] === 1 && mergedSig.questSignals.completionWeekdays[1] === 2, "Wochentage Max");
check(mergedSig.questSignals.recentExpired.length === 2, "recentExpired Union");
check(mergedSig.sessionSignals.days["2026-07-10"].opens === 2 && mergedSig.sessionSignals.days["2026-07-10"].actions === 2, "Session-Tage punktweise Max");
check(mergedSig.coachSignals.byType.inactivity.mutedUntil === "2026-07-19", "mutedUntil Max");
check(mergedSig.coachSignals.pendingOutcome.length === 2, "pendingOutcome Union");
check(mergeStates({}, sigB).questSignals.byTemplate.t1.assigned === 5, "einseitig fehlend -> uebernommen");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-state-merge.mjs`
Expected: FAIL (Signal-Checks schlagen fehl, weil die Merge-Funktion die Felder verwirft)

- [ ] **Step 3: Merge implementieren**

In `data/storage.js` oberhalb der Merge-Funktion drei Helfer ergänzen (direkt neben den bestehenden wie `mergeNumericMaps`):

```js
const maxDateString = (a, b) => (String(a || "") >= String(b || "") ? a || null : b || null);

function mergeCounterMapDeep(primary = {}, fallback = {}) {
  const keys = new Set([...Object.keys(primary || {}), ...Object.keys(fallback || {})]);
  const result = {};
  for (const key of keys) {
    const left = primary?.[key] || {};
    const right = fallback?.[key] || {};
    const fields = new Set([...Object.keys(left), ...Object.keys(right)]);
    const entry = {};
    for (const field of fields) {
      entry[field] = field === "lastAssignedAt" || field === "lastDislikedAt" || field === "mutedUntil"
        ? maxDateString(left[field], right[field])
        : Math.max(toFiniteNumber(left[field]), toFiniteNumber(right[field]));
    }
    result[key] = entry;
  }
  return result;
}

function mergeRecentList(primary = [], fallback = [], cap = 10) {
  const seen = new Set();
  const merged = [];
  for (const entry of [...(primary || []), ...(fallback || [])]) {
    if (!entry?.title) continue;
    const key = `${entry.title}|${entry.date || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
  }
  return merged.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, cap);
}
```

Im Rückgabe-Objekt der Merge-Funktion (neben `questReplacements`/`dailyUserQuestsCreated`, ~Z. 498) einfügen:

```js
    questSignals: {
      byTemplate: mergeCounterMapDeep(primary.questSignals?.byTemplate, fallback.questSignals?.byTemplate),
      byCategory: mergeCounterMapDeep(primary.questSignals?.byCategory, fallback.questSignals?.byCategory),
      completionHours: mergeNumericMaps(primary.questSignals?.completionHours, fallback.questSignals?.completionHours),
      completionWeekdays: Array.from({ length: 7 }, (_, i) => Math.max(
        toFiniteNumber(primary.questSignals?.completionWeekdays?.[i]),
        toFiniteNumber(fallback.questSignals?.completionWeekdays?.[i])
      )),
      recentExpired: mergeRecentList(primary.questSignals?.recentExpired, fallback.questSignals?.recentExpired),
      recentDisliked: mergeRecentList(primary.questSignals?.recentDisliked, fallback.questSignals?.recentDisliked),
    },
    sessionSignals: { days: mergeCounterMapDeep(primary.sessionSignals?.days, fallback.sessionSignals?.days) },
    coachSignals: {
      byType: mergeCounterMapDeep(primary.coachSignals?.byType, fallback.coachSignals?.byType),
      daily: String(primary.coachSignals?.daily?.date || "") >= String(fallback.coachSignals?.daily?.date || "")
        ? { date: null, coachingShown: 0, warningShown: 0, ...(primary.coachSignals?.daily || {}) }
        : { date: null, coachingShown: 0, warningShown: 0, ...(fallback.coachSignals?.daily || {}) },
      pendingOutcome: mergeArrayByKey(primary.coachSignals?.pendingOutcome, fallback.coachSignals?.pendingOutcome, item => `${item?.type}|${item?.date}`),
    },
```

In der Normalisierung alter States (~Z. 876, neben `s.questReplacements = …`) ergänzen:

```js
  s.questSignals = { ...DEFAULT_STATE.questSignals, ...(oldState.questSignals || {}) };
  s.sessionSignals = { ...DEFAULT_STATE.sessionSignals, ...(oldState.sessionSignals || {}) };
  s.coachSignals = { ...DEFAULT_STATE.coachSignals, ...(oldState.coachSignals || {}) };
```

- [ ] **Step 4: Tests laufen lassen — müssen grün sein**

Run: `node scripts/test-state-merge.mjs && node scripts/test-signals.mjs`
Expected: beide `alles gruen`, Exit 0

- [ ] **Step 5: Commit**

```bash
git add data/storage.js scripts/test-state-merge.mjs
git commit -m "feat(signals): Konflikt-Merge fuer questSignals/sessionSignals/coachSignals"
```

---

### Task 4: Vergabe-Intelligenz (Gewichte, Cooldown, Stepdown, Ersatz-Kandidaten)

**Files:**
- Modify: `data/questPoolWeighting.js` (in `computeCategoryWeights`)
- Modify: `data/helpers.js:168-253` (`generateDailySystemQuests`)
- Modify: `hooks/useGameState.jsx:1245-1292` (`getReplacementCandidates`)
- Test: `scripts/test-quest-pool-weighting.mjs` (erweitern)

**Interfaces:**
- Consumes: `getAvoidedCategories`, `getLikedCategories`, `getTemplateCooldowns` aus Task 2.
- Produces: unveränderte Signaturen — `computeCategoryWeights(state)`, `generateDailySystemQuests(count, state)`, `getReplacementCandidates(questId)`. Verhalten neu: Dämpfung/Boost/Cooldown/Stepdown.

- [ ] **Step 1: Failing Tests ergänzen**

Am Ende von `scripts/test-quest-pool-weighting.mjs` vor der Fehler-Auswertung:

```js
// ── Dossier-Integration: avoided halbiert, liked +1 ──
const sigWeights = computeCategoryWeights({
  questSignals: { byCategory: {
    vit: { assigned: 10, completed: 1, expired: 9, liked: 0, disliked: 0 }, // 10% -> gemieden
    cha: { assigned: 0, completed: 0, expired: 0, liked: 2, disliked: 0 },  // netLikes 2 -> liked
  } },
});
check(sigWeights.vit === Math.max(0.25, 1 * 0.5), "gemiedene Kategorie halbiert (Floor 0.25)");
check(sigWeights.cha === 2, "liked Kategorie +1");

// ── Template-Cooldown filtert den Pool ──
import { generateDailySystemQuests } from "../data/helpers.js";
const poolProbe = generateDailySystemQuests(3, { level: 1, stats: { str: 0, int: 0, vit: 0, agi: 0, cha: 0 } });
check(poolProbe.length > 0 && poolProbe[0].templateId, "Basisvergabe liefert templateIds");
const blockedId = poolProbe[0].templateId;
const blockedState = {
  level: 1, stats: { str: 0, int: 0, vit: 0, agi: 0, cha: 0 },
  questSignals: { byTemplate: { [blockedId]: {
    assigned: 3, completed: 0, expired: 3, swapped: 0, liked: 0, disliked: 0,
    lastAssignedAt: new Date().toISOString().slice(0, 10), lastDislikedAt: null,
  } } },
};
for (let i = 0; i < 15; i++) {
  const roll = generateDailySystemQuests(4, blockedState);
  check(!roll.some(q => q.templateId === blockedId), `Cooldown-Template nie vergeben (Lauf ${i})`);
}
```

(`computeCategoryWeights` wird in der Datei bereits importiert; `check` existiert dort bereits.)

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-quest-pool-weighting.mjs`
Expected: FAIL („gemiedene Kategorie halbiert" u.a.)

- [ ] **Step 3: `computeCategoryWeights` erweitern**

In `data/questPoolWeighting.js` importieren und VOR dem `lowest`-Block (Z. 31) einfügen:

```js
import { getAvoidedCategories, getLikedCategories } from "./hunterDossier.js";
```

```js
  // Dossier-Signale (Spec §8.1): Meidung daempft, Vorliebe verstaerkt.
  for (const cat of getAvoidedCategories(state)) {
    if (weights[cat] != null) weights[cat] = Math.max(0.25, weights[cat] * 0.5);
  }
  for (const cat of getLikedCategories(state)) {
    if (weights[cat] != null) weights[cat] += 1;
  }
```

- [ ] **Step 4: Cooldown + Stepdown in `generateDailySystemQuests`**

In `data/helpers.js`: Import ergänzen (`import { getTemplateCooldowns, getAvoidedCategories } from "./hunterDossier.js";`). Dann Z. 176 ersetzen:

```js
  // Pool nach Level filtern + Dossier-Cooldowns raus (Spec §8.3)
  const cooldowns = getTemplateCooldowns(state || {}, today);
  const validPool = getSystemQuestPoolForLocale(locale)
    .filter(q => level >= (q.minLevel || 1))
    .filter(q => !cooldowns.has(q.templateId || q.id));
```

Und im Defizit-Block (Z. 192–209) die Pool-Zeile ersetzen — Stepdown, wenn die Defizit-Kategorie gemieden wird:

```js
    const avoided = getAvoidedCategories(state || {});
    let penaltyPool = validPool.filter(q => q.category === lowestStat);
    if (avoided.includes(lowestStat)) {
      const easyPool = penaltyPool.filter(q => q.difficulty === "easy");
      if (easyPool.length > 0) penaltyPool = easyPool; // Stepdown statt Verzicht
    }
```

- [ ] **Step 5: Ersatz-Kandidaten lernen mit**

In `hooks/useGameState.jsx` `getReplacementCandidates` (Z. 1245): Import oben ergänzen (`import { getTemplateCooldowns, getLikedCategories } from '../data/hunterDossier.js';`). Nach Z. 1259 (`const level = …`) einfügen und den `pool`-Filter erweitern:

```js
    const cooldowns = getTemplateCooldowns(current, today);
    const likedCategories = getLikedCategories(current);
```

Im bestehenden `.filter(template => {...})` (Z. 1271–1274) die Rückgabe erweitern:

```js
        return key !== currentKey && !activeKeys.has(key) && !blockedKeys.has(key)
          && !cooldowns.has(template.templateId);
```

Und die Kandidaten-Auffüllung (Z. 1287–1290) um eine Liked-Stufe ergänzen — NACH der Kategorie/Schwierigkeits-Stufe, VOR dem Gesamt-Pool:

```js
    const candidates = [];
    addUnique(candidates, pool.filter(t => t.category === quest.category && t.difficulty === quest.difficulty));
    addUnique(candidates, pool.filter(t => t.category === quest.category));
    addUnique(candidates, pool.filter(t => likedCategories.includes(t.category)));
    addUnique(candidates, pool);
```

- [ ] **Step 6: Tests + Build**

Run: `node scripts/test-quest-pool-weighting.mjs && node scripts/test-quest-utils.mjs && npm run build`
Expected: Tests `alles gruen`, Build Exit 0

- [ ] **Step 7: Commit**

```bash
git add data/questPoolWeighting.js data/helpers.js hooks/useGameState.jsx scripts/test-quest-pool-weighting.mjs
git commit -m "feat(vergabe): Dossier-Signale in Gewichtung, Cooldowns und Ersatz-Kandidaten"
```

---

### Task 5: `behaviorSignals` in KI-Profil, Server-Sanitizer und Prompt

**Files:**
- Modify: `data/aiQuestProfile.js` (`buildAIQuestProfile`, Rückgabe-Objekt Z. 115-128)
- Modify: `functions/aiQuestProfile.js` (`sanitizeAIQuestProfile`, Rückgabe Z. 96-109)
- Modify: `functions/geminiPrompts.js` (`GENERATE_QUESTS_PROMPT`, de- und en-Regelblock)
- Test: `scripts/test-ai-quest-profile.mjs`, `scripts/test-gemini-prompts.mjs` (erweitern)

**Interfaces:**
- Consumes: `getDossierSummary` aus Task 2; `state.questSignals.recentExpired/recentDisliked`.
- Produces: `profile.behaviorSignals` mit exakt diesen Feldern:
  `{ bestTime: string|null, categoryCompletionRates: {[cat]: number(2 Dezimalen)}, avoidCategories: string[], reliableCategories: string[], likedCategories: string[], ghostDaysLast14: number, recentExpiredTitles: string[](max 5), recentDislikedTitles: string[](max 5), userNotes: string[](max 3) }`

- [ ] **Step 1: Failing Tests ergänzen**

In `scripts/test-ai-quest-profile.mjs` vor der Fehler-Auswertung:

```js
// ── behaviorSignals (Spec §7) ──
const sigDays = {};
for (let i = 10; i <= 17; i++) sigDays[`2026-07-${i}`] = { opens: 1, actions: i % 2 === 0 ? 0 : 1 };
const sigState = {
  questSignals: {
    byCategory: { vit: { assigned: 10, completed: 1, expired: 9, liked: 0, disliked: 0 } },
    completionHours: { morgen: 8, mittag: 1, abend: 1, nacht: 0 },
    completionWeekdays: [0, 0, 0, 0, 0, 0, 0],
    recentExpired: Array.from({ length: 8 }, (_, i) => ({ title: `Verfallen ${i}`, category: "vit", date: "2026-07-10" })),
    recentDisliked: [
      { questId: "a", title: "Meditiere 20 Minuten", category: "vit", note: "Meditation ist nichts fuer mich", date: "2026-07-11" },
      { questId: "b", title: "Kalt duschen", category: "vit", note: "", date: "2026-07-10" },
    ],
  },
  sessionSignals: { days: sigDays },
};
const sigProfile = buildAIQuestProfile(sigState);
check(sigProfile.behaviorSignals.bestTime === "morgen", "bestTime im Profil");
check(sigProfile.behaviorSignals.avoidCategories.includes("vit"), "avoidCategories im Profil");
check(sigProfile.behaviorSignals.ghostDaysLast14 === 4, "ghostDays im Profil");
check(sigProfile.behaviorSignals.recentExpiredTitles.length === 5, "expiredTitles Deckel 5");
check(sigProfile.behaviorSignals.userNotes[0] === "Meditation ist nichts fuer mich" && sigProfile.behaviorSignals.userNotes.length === 1, "nur nicht-leere Notizen, max 3");
check(buildAIQuestProfile({}).behaviorSignals.bestTime === null, "leerer State -> neutrale Signals");
```

In `scripts/test-gemini-prompts.mjs` vor der Fehler-Auswertung:

```js
// ── behaviorSignals-Regeln im Quest-Prompt ──
const sigPrompt = GENERATE_QUESTS_PROMPT({ str: 1 }, 3, "str", [], {
  behaviorSignals: { bestTime: "morgen", avoidCategories: ["vit"], recentDislikedTitles: ["Meditiere 20 Minuten"], userNotes: ["lieber draussen"], ghostDaysLast14: 4 },
}, "de");
check(sigPrompt.includes("recentDislikedTitles") || sigPrompt.includes("behaviorSignals"), "Signals landen im Profil-JSON");
check(sigPrompt.includes("nicht in gleicher Form wiederholen"), "Dislike/Expired-Regel de");
check(sigPrompt.includes("staerkste Praeferenzquelle") || sigPrompt.includes("stärkste Präferenzquelle"), "Notiz-Regel de");
check(sigPrompt.includes("bestTime"), "bestTime-Regel referenziert Feld");
check(sigPrompt.includes("10 Minuten"), "Ghost-Einstiegsregel de");
const sigPromptEn = GENERATE_QUESTS_PROMPT({ str: 1 }, 3, "str", [], { behaviorSignals: { ghostDaysLast14: 4 } }, "en");
check(sigPromptEn.includes("strongest preference source"), "Notiz-Regel en");
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `node scripts/test-ai-quest-profile.mjs; node scripts/test-gemini-prompts.mjs`
Expected: beide FAIL an den neuen Checks

- [ ] **Step 3: Client-Profil erweitern**

`data/aiQuestProfile.js`: Import ergänzen (`import { getDossierSummary } from "./hunterDossier.js";`). In `buildAIQuestProfile` vor dem `return` einfügen und das Feld im Rückgabe-Objekt ergänzen:

```js
  const dossier = getDossierSummary(state);
  const behaviorSignals = {
    bestTime: dossier.bestTime?.bucket || null,
    categoryCompletionRates: Object.fromEntries(
      Object.entries(dossier.categoryCompletionRates).map(([cat, rate]) => [cat, Math.round(rate * 100) / 100])
    ),
    avoidCategories: dossier.avoidCategories,
    reliableCategories: dossier.reliableCategories,
    likedCategories: dossier.likedCategories,
    ghostDaysLast14: dossier.ghost?.ghostDays || 0,
    recentExpiredTitles: (state.questSignals?.recentExpired || []).map((e) => cleanText(e?.title, 140)).filter(Boolean).slice(0, 5),
    recentDislikedTitles: (state.questSignals?.recentDisliked || []).map((e) => cleanText(e?.title, 140)).filter(Boolean).slice(0, 5),
    userNotes: (state.questSignals?.recentDisliked || []).map((e) => cleanText(e?.note, 140)).filter(Boolean).slice(0, 3),
  };
```

```js
  return {
    lifeDomains,
    // … bestehende Felder unverändert …
    behaviorSignals,
  };
```

- [ ] **Step 4: Server-Sanitizer spiegeln**

`functions/aiQuestProfile.js`, in `sanitizeAIQuestProfile` vor dem `return` einfügen und im Rückgabe-Objekt ergänzen:

```js
  const rawSignals = value.behaviorSignals && typeof value.behaviorSignals === "object" ? value.behaviorSignals : {};
  const TIME_BUCKETS = new Set(["morgen", "mittag", "abend", "nacht"]);
  const cleanCategoryList = (list) => [...new Set(Array.isArray(list) ? list : [])]
    .filter((cat) => CATEGORY_ID_SET.has(cat)).slice(0, CATEGORY_IDS.length);
  const behaviorSignals = {
    bestTime: TIME_BUCKETS.has(rawSignals.bestTime) ? rawSignals.bestTime : null,
    categoryCompletionRates: Object.fromEntries(CATEGORY_IDS
      .filter((cat) => Number.isFinite(Number(rawSignals.categoryCompletionRates?.[cat])))
      .map((cat) => [cat, Math.min(1, Math.max(0, Number(rawSignals.categoryCompletionRates[cat])))])),
    avoidCategories: cleanCategoryList(rawSignals.avoidCategories),
    reliableCategories: cleanCategoryList(rawSignals.reliableCategories),
    likedCategories: cleanCategoryList(rawSignals.likedCategories),
    ghostDaysLast14: clampInteger(rawSignals.ghostDaysLast14, 0, 14),
    recentExpiredTitles: uniqueSafeTexts(rawSignals.recentExpiredTitles, 5, 140),
    recentDislikedTitles: uniqueSafeTexts(rawSignals.recentDislikedTitles, 5, 140),
    userNotes: uniqueSafeTexts(rawSignals.userNotes, 3, 140),
  };
```

```js
    focusSummary: { /* … unverändert … */ },
    behaviorSignals,
```

- [ ] **Step 5: Prompt-Regeln ergänzen**

`functions/geminiPrompts.js`, in `GENERATE_QUESTS_PROMPT`: im deutschen REGELN-Block nach der Feedback-Zeile (Z. 232) einfügen:

```
- behaviorSignals im Profil: Quests, deren Titel in recentDislikedTitles oder recentExpiredTitles stehen oder deren Kategorie in avoidCategories liegt, nicht in gleicher Form wiederholen — biete stattdessen leichtere oder kuerzere Varianten an.
- userNotes sind nach dem Fragebogen die staerkste Praeferenzquelle: konkrete Wuensche darin haben Vorrang vor abgeleiteten Mustern.
- Wenn behaviorSignals.bestTime gesetzt ist, formuliere mindestens 1 Quest so, dass sie in dieses Zeitfenster passt.
- Wenn behaviorSignals.ghostDaysLast14 >= 3: mindestens 1 Quest mit Einstiegshuerde von maximal 10 Minuten.
```

Im englischen RULES-Block (nach Z. 205) das Pendant:

```
- behaviorSignals in the profile: never repeat quests whose titles appear in recentDislikedTitles or recentExpiredTitles, or whose category is in avoidCategories, in the same form — offer lighter or shorter variants instead.
- userNotes are the strongest preference source after the questionnaire: concrete wishes there outrank derived patterns.
- If behaviorSignals.bestTime is set, phrase at least 1 quest to fit that time window.
- If behaviorSignals.ghostDaysLast14 >= 3: at least 1 quest with an entry barrier of 10 minutes or less.
```

- [ ] **Step 6: Tests laufen lassen — müssen grün sein**

Run: `node scripts/test-ai-quest-profile.mjs && node scripts/test-gemini-prompts.mjs && node scripts/test-ai-quest-validation.mjs`
Expected: alle `alles gruen`

- [ ] **Step 7: Commit**

```bash
git add data/aiQuestProfile.js functions/aiQuestProfile.js functions/geminiPrompts.js scripts/test-ai-quest-profile.mjs scripts/test-gemini-prompts.mjs
git commit -m "feat(ai): behaviorSignals in Profil, Sanitizer und Quest-Prompt"
```

---

### Task 6: Coach-Policy `data/coachPolicy.js`

**Files:**
- Create: `data/coachPolicy.js`
- Test: `scripts/test-coach-policy.mjs`

**Interfaces:**
- Consumes: `coachSignals`-Shape (Task 1), `getCoachPosture` (Task 2). Messages tragen ab Task 7 `checkId` (string) und `type` (`"coaching" | "warning" | "celebration"`).
- Produces:
  - `pickCoachMessage(state, messages, today) → message | null` — wendet Mute, Tagesbudget und Posture an und liefert die EINE anzeigbare Meldung (höchste Priorität zuerst, Reihenfolge von `runCoachChecks` bleibt maßgeblich).
  - `POSTURE_SUPPRESSED = { struggling: ["imbalance"], cruising: ["inactivity", "overexertion", "imbalance", "habitReminder", "openedButIdle", "questOverload"] }`

- [ ] **Step 1: Failing Test schreiben**

`scripts/test-coach-policy.mjs` (vollständig):

```js
import { pickCoachMessage } from "../data/coachPolicy.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const msg = (checkId, type, priority = 1) => ({ checkId, type, priority, title: checkId, lines: [checkId] });
const TODAY = "2026-07-15";

// ── Budget: 1 coaching + 1 warning pro Tag; Re-Fire am selben Tag blockiert ──
const fresh = {};
check(pickCoachMessage(fresh, [msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "erste Coaching-Meldung erlaubt");
const afterCoaching = { coachSignals: { byType: {}, daily: { date: TODAY, coachingShown: 1, warningShown: 0 }, pendingOutcome: [] } };
check(pickCoachMessage(afterCoaching, [msg("habitReminder", "coaching")], TODAY) === null, "zweites Coaching am selben Tag blockiert (Re-Fire-Fix)");
check(pickCoachMessage(afterCoaching, [msg("streakDanger", "warning", 3)], TODAY)?.checkId === "streakDanger", "Warnung hat eigenes Budget");
const afterBoth = { coachSignals: { byType: {}, daily: { date: TODAY, coachingShown: 1, warningShown: 1 }, pendingOutcome: [] } };
check(pickCoachMessage(afterBoth, [msg("streakDanger", "warning", 3)], TODAY) === null, "Warnbudget verbraucht");
check(pickCoachMessage(afterBoth, [msg("firstQuest", "celebration", 2)], TODAY)?.type === "celebration", "Celebrations nie gedeckelt");
// Budget von gestern zaehlt heute nicht
const yesterday = { coachSignals: { byType: {}, daily: { date: "2026-07-14", coachingShown: 1, warningShown: 1 }, pendingOutcome: [] } };
check(pickCoachMessage(yesterday, [msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "Budget reset am neuen Tag");

// ── Mute ──
const muted = { coachSignals: { byType: { habitReminder: { shown: 3, actedSameDay: 0, consecutiveIgnored: 3, mutedUntil: "2026-07-20" } }, daily: { date: null, coachingShown: 0, warningShown: 0 }, pendingOutcome: [] } };
check(pickCoachMessage(muted, [msg("habitReminder", "coaching")], TODAY) === null, "gemuteter Typ blockiert");
check(pickCoachMessage(muted, [msg("habitReminder", "coaching")], "2026-07-21")?.checkId === "habitReminder", "Mute laeuft ab");
check(pickCoachMessage(muted, [msg("habitReminder", "coaching"), msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "naechste erlaubte Meldung rueckt nach");

// ── Posture ──
const ghostDays = {};
for (let i = 10; i <= 17; i++) ghostDays[`2026-07-${i}`] = { opens: 1, actions: 0 };
const struggling = { sessionSignals: { days: ghostDays }, questSignals: { byCategory: {} } };
check(pickCoachMessage(struggling, [msg("imbalance", "coaching", 2)], TODAY) === null, "struggling: Imbalance entfaellt");
check(pickCoachMessage(struggling, [msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "struggling: sanftes Coaching bleibt");
const actionDays = {};
for (let i = 10; i <= 17; i++) actionDays[`2026-07-${i}`] = { opens: 1, actions: 2 };
const cruising = { streak: 10, sessionSignals: { days: actionDays }, questSignals: { byCategory: { str: { assigned: 10, completed: 9, expired: 1, liked: 0, disliked: 0 } } } };
check(pickCoachMessage(cruising, [msg("habitReminder", "coaching")], TODAY) === null, "cruising: proaktives Coaching entfaellt");
check(pickCoachMessage(cruising, [msg("weeklyPathReport", "coaching", 2)], TODAY)?.checkId === "weeklyPathReport", "cruising: Weekly Report bleibt");
check(pickCoachMessage(cruising, [msg("streakDanger", "warning", 3)], TODAY)?.checkId === "streakDanger", "cruising: streakDanger bleibt");

// ── Defensiv ──
check(pickCoachMessage(null, null, TODAY) === null, "null-Inputs werfen nicht");
check(pickCoachMessage({}, [{ type: "coaching", lines: ["ohne checkId"] }], TODAY)?.lines[0] === "ohne checkId", "Meldung ohne checkId faellt auf Budget-only zurueck");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-coach-policy: alles gruen");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-coach-policy.mjs`
Expected: FAIL (`Cannot find module '../data/coachPolicy.js'`)

- [ ] **Step 3: `data/coachPolicy.js` implementieren**

```js
// coachPolicy.js — Anti-Nerv-Schicht (Spec 2026-07-14 §9): Budget, Mute,
// Posture. Pur und defensiv; die Anzeige (checkCoach in solo-leveling-v5)
// zeigt genau EINE Meldung und stempelt sie via recordInterventionShown.

import { getCoachPosture } from "./hunterDossier.js";

export const POSTURE_SUPPRESSED = {
  struggling: ["imbalance"],
  cruising: ["inactivity", "overexertion", "imbalance", "habitReminder", "openedButIdle", "questOverload"],
};

const DAILY_BUDGET = { coaching: 1, warning: 1 };

export function pickCoachMessage(state, messages, today) {
  try {
    const list = Array.isArray(messages) ? messages : [];
    if (list.length === 0) return null;
    const cs = state?.coachSignals || {};
    const daily = cs.daily?.date === today ? cs.daily : { coachingShown: 0, warningShown: 0 };
    const posture = getCoachPosture(state || {});
    const suppressed = new Set(POSTURE_SUPPRESSED[posture] || []);

    for (const message of list) {
      if (!message) continue;
      if (message.type === "celebration") return message;
      const checkId = message.checkId || null;
      if (checkId && suppressed.has(checkId)) continue;
      const mutedUntil = checkId ? cs.byType?.[checkId]?.mutedUntil : null;
      if (mutedUntil && String(today) <= String(mutedUntil)) continue;
      if (message.type === "warning") {
        if ((Number(daily.warningShown) || 0) >= DAILY_BUDGET.warning) continue;
        return message;
      }
      if ((Number(daily.coachingShown) || 0) >= DAILY_BUDGET.coaching) continue;
      return message;
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Test laufen lassen — muss grün sein**

Run: `node scripts/test-coach-policy.mjs`
Expected: `✓ test-coach-policy: alles gruen`

- [ ] **Step 5: Commit**

```bash
git add data/coachPolicy.js scripts/test-coach-policy.mjs
git commit -m "feat(coach): Anti-Nerv-Policy — Tagesbudget, Mute-Backoff, Posture-Filter"
```

---

### Task 7: Erfassung verdrahten (Rollover, Abschluss, Swaps, Ersetzung, Boot)

**Files:**
- Modify: `hooks/useGameState.jsx` (Boot-Effekt Z. ~571–714, `replaceSystemQuest` Z. ~1294–1341)
- Modify: `hooks/questActions.js` (Abschlusspfad, `next = { … }`-Block Z. ~364–392)
- Modify: `solo-leveling-v5.jsx` (Swap-Stellen Z. ~844 und ~928)

**Interfaces:**
- Consumes: alle Recorder aus Task 1 (exakte Signaturen s. Task 1).
- Produces: keine neuen Exporte — State enthält ab jetzt echte Signale. Ghost-Erfassung liefert die Daten für Task 8 (`openedButIdle`).

- [ ] **Step 1: Imports ergänzen**

`hooks/useGameState.jsx` (bei den anderen `../data/`-Imports):

```js
import { recordQuestsAssigned, recordQuestsExpired, recordQuestsSwapped, recordAppOpen, recordUserAction, resolveInterventionOutcomes, applyQuestRating, applyDislikeNote } from '../data/signals.js';
```

`hooks/questActions.js` (bei den bestehenden Imports):

```js
import { recordQuestCompleted, recordUserAction } from "../data/signals.js";
```

- [ ] **Step 2: Tagesreset — Verfall VOR dem Filter, Vergabe NACH der Generierung, Outcomes auflösen**

In `useGameState.jsx`, im Block `if (s.lastActiveDate && s.lastActiveDate !== today)`:

Direkt VOR Z. 618 (`s.quests = (s.quests || []).filter(q => shouldRetainQuestAtReset(...))`):

```js
            // Signal: alle offenen System-Dailies des Vortags verfallen jetzt (Spec §4)
            const expiredSystemDailies = (s.quests || []).filter(q => q && q.isSystem && q.type === "daily" && !q.completed);
            Object.assign(s, recordQuestsExpired(s, expiredSystemDailies, today));
            Object.assign(s, resolveInterventionOutcomes(s, today));
```

Direkt NACH Z. 649 (`s.quests = [...s.quests, ...newSysQuests];`):

```js
            Object.assign(s, recordQuestsAssigned(s, newSysQuests, today));
```

Und im Ziel-Quest-Zweig nach `s.quests = [...s.quests, ...goalGen.quests];` (Z. 656):

```js
                Object.assign(s, recordQuestsAssigned(s, goalGen.quests, today));
```

- [ ] **Step 3: Boot = App-Öffnung zählen**

In `useGameState.jsx` direkt nach Z. 578 (`s.lastInteractionTimeMs = Date.now();`):

```js
          Object.assign(s, recordAppOpen(s, getToday()));
```

- [ ] **Step 4: Abschluss zählt (Quest + Aktion)**

In `hooks/questActions.js`, unmittelbar NACH dem großen `next = { … };`-Block (nach Z. 392):

```js
  next = recordQuestCompleted(next, quest, Date.now());
  next = recordUserAction(next, today);
```

- [ ] **Step 5: Schmiede-Swaps zählen (kein Dislike)**

`solo-leveling-v5.jsx`, manuelle Schmiede (~Z. 844) — vor dem Bau von `swappedState` die ersetzten Dailies festhalten und das Ergebnis stempeln:

```js
        const replacedManual = currentState.quests.filter(q => q.isSystem && q.type === "daily" && !q.completed);
        let swappedState = { ...currentState, quests: swapSystemQuests(currentState.quests, aiQuests, { mode: "manual" }) };
        swappedState = recordQuestsSwapped(swappedState, replacedManual, getToday());
        swappedState = recordQuestsAssigned(swappedState, aiQuests, getToday());
```

Auto-Swap (~Z. 928) analog:

```js
        const replacedAuto = currentState.quests.filter(q => q.isSystem && q.type === "daily" && !q.completed);
        let updated = { ...currentState, quests: swapSystemQuests(currentState.quests, aiQuests, { mode: "auto" }) };
        updated = recordQuestsSwapped(updated, replacedAuto, getToday());
        updated = recordQuestsAssigned(updated, aiQuests, getToday());
```

(Dazu oben in der Datei importieren: `import { recordQuestsSwapped, recordQuestsAssigned } from './data/signals.js';` — plus `getToday` ist dort bereits verfügbar; falls nicht, `import { getToday } from './data/dateUtils.js';`.)

- [ ] **Step 6: Manuelle Ersetzung = implizites Dislike**

In `useGameState.jsx` `replaceSystemQuest` (Z. ~1329), das `persist({ … })`-Objekt durch eine Variable ziehen und stempeln:

```js
    let nextState = {
      ...current,
      quests: (current.quests || []).map(q => q.id === questId ? replacement : q),
      reminders: (current.reminders || []).filter(r => r.questId !== questId),
      questReplacements: {
        date: today,
        used: status.used + 1,
        replacedKeys: [...new Set([...(status.replacedKeys || []), sourceKey, replacementKey])],
      },
    };
    nextState = recordQuestsSwapped(nextState, [quest], today, { implicitDislike: true });
    nextState = recordQuestsAssigned(nextState, [replacement], today);
    nextState = recordUserAction(nextState, today);
    persist(nextState);
```

- [ ] **Step 7: Weitere Aktionen zählen**

In `useGameState.jsx` jeweils EINE Zeile am Erfolgs-Ende der bestehenden Callbacks (State-Variable ggf. anpassen — Muster: `next = recordUserAction(next, getToday());` vor dem `persist`):
- Quest-Erstellung (der Callback, der `dailyUserQuestsCreated` hochzählt)
- Sub-Quest-Toggle (`completeSubQuest`)
- Habit-Toggle (der Callback, der `habit.history[today]` setzt)
- Dungeon-Start (der Callback, der `trackEvent('dungeon_entered', …)` feuert, Z. ~2063)

- [ ] **Step 8: Tests + Build + Smoke**

Run: `node scripts/test-signals.mjs && node scripts/test-streak.mjs && node scripts/test-operations.mjs && npm run build`
Expected: Tests grün, Build Exit 0.
Smoke (Harness-Pfad aus `/run-solo-todo`): App starten, eine Quest abschließen, dann in der Konsole `JSON.parse(localStorage.getItem(...)).questSignals` prüfen → `completionHours`-Bucket und `byCategory.completed` sind > 0.

- [ ] **Step 9: Commit**

```bash
git add hooks/useGameState.jsx hooks/questActions.js solo-leveling-v5.jsx
git commit -m "feat(signals): Erfassung verdrahtet — Rollover, Abschluss, Swaps, Ersetzung, Boot"
```

---

### Task 8: checkCoach-Integration — Policy, checkIds, openedButIdle, Weekly-Fix

**Files:**
- Modify: `components/SystemCoach.jsx` (checkIds an alle Meldungen; neuer Check `checkOpenedButIdle`; Soft-Varianten)
- Modify: `solo-leveling-v5.jsx:1008-1027` (checkCoach-Effekt)
- Modify: `data/locales/de.js` + `data/locales/en.js` (`systemCoach`-Namespace, de ~Z. 1851, en ~Z. 1915)

**Interfaces:**
- Consumes: `pickCoachMessage` (Task 6), `recordInterventionShown` (Task 1), `getCoachPosture` (Task 2), `sessionSignals.days` (Task 7).
- Produces: jede Coach-Meldung trägt `checkId`; `runCoachChecks` enthält zusätzlich `checkOpenedButIdle`.

- [ ] **Step 1: checkIds + neuer Check in SystemCoach.jsx**

In jeder check-Funktion das Rückgabe-Objekt um `checkId` ergänzen (exakt diese Werte): `checkInactivity → "inactivity"`, `checkOverexertion → "overexertion"`, `checkQuestOverload → "questOverload"`, `checkImbalance → "imbalance"`, `checkStreakDanger → "streakDanger"`, `checkHabitReminder → "habitReminder"`, `checkCelebrations → "celebration"`, `checkWeeklyPathReport → "weeklyPathReport"`.

Neuen Check ergänzen (nach `checkHabitReminder`) und in das `checks`-Array von `runCoachChecks` (Z. 303) aufnehmen:

```js
export function checkOpenedButIdle(state) {
    const today = getToday();
    const day = state.sessionSignals?.days?.[today];
    if (!day || (day.opens || 0) < 3 || (day.actions || 0) > 0) return null;
    return {
        type: "coaching",
        checkId: "openedButIdle",
        icon: "◈",
        iconSrc: NAV_ICONS.dashboard,
        title: ct(state, "systemCoach.openedButIdleTitle"),
        lines: [
            ct(state, "systemCoach.openedButIdleLine1"),
            ct(state, "systemCoach.openedButIdleLine2"),
        ],
        priority: 2,
    };
}
```

Soft-Varianten für struggling (in `runCoachChecks` NACH dem Prioritäts-Sort, vor `return messages`):

```js
    // Struggling-Posture: erste Zeile (= Toast-Text) wird sanft, plus Mini-Einstieg.
    if (getCoachPosture(state) === "struggling") {
        const SOFT_KEYS = { inactivity: "systemCoach.inactivitySoft", habitReminder: "systemCoach.habitReminderSoft", openedButIdle: "systemCoach.openedButIdleSoft" };
        return messages.map(msg => SOFT_KEYS[msg.checkId]
            ? { ...msg, lines: [ct(state, SOFT_KEYS[msg.checkId]), ...msg.lines.slice(1), ct(state, "systemCoach.miniStep")] }
            : msg);
    }
```

(Import oben ergänzen: `import { getCoachPosture } from "../data/hunterDossier.js";`)

- [ ] **Step 2: i18n-Keys ergänzen**

`data/locales/de.js`, im `systemCoach:`-Objekt (~Z. 1851):

```js
    openedButIdleTitle: "SYSTEM-BEOBACHTUNG",
    openedButIdleLine1: "Das System registriert Beobachtung ohne Handlung.",
    openedButIdleLine2: "Eine Quest. Fünf Minuten reichen für heute.",
    inactivitySoft: "Der Wiedereinstieg zählt mehr als die Pause.",
    habitReminderSoft: "Ein kleiner Haken heute genügt.",
    openedButIdleSoft: "Kein Druck. Eine kleine Quest genügt für heute.",
    miniStep: "Eine Quest. Fünf Minuten reichen.",
```

`data/locales/en.js`, im `systemCoach:`-Objekt:

```js
    openedButIdleTitle: "SYSTEM OBSERVATION",
    openedButIdleLine1: "The System registers observation without action.",
    openedButIdleLine2: "One quest. Five minutes is enough for today.",
    inactivitySoft: "Returning matters more than the pause.",
    habitReminderSoft: "One small check today is enough.",
    openedButIdleSoft: "No pressure. One small quest is enough for today.",
    miniStep: "One quest. Five minutes is enough.",
```

- [ ] **Step 3: checkCoach-Effekt umbauen (Policy + Stempeln + Weekly-Fix)**

`solo-leveling-v5.jsx` Z. 1012–1022, `checkCoach` ersetzen durch:

```js
    const checkCoach = async () => {
      const today = getToday();
      let messages = runCoachChecks(state, prevStateRef.current);
      const picked = pickCoachMessage(state, messages, today);
      if (picked) {
        if (premiumStatus?.active && can('ai_coach') && state?.ai?.dynamicMessagesEnabled && state?.ai?.enabled && !geminiAI.isRateLimited()) {
          const enriched = await enrichCoachMessagesAsync([picked], state, geminiAI.generateSystemMsg);
          if (enriched[0]) Object.assign(picked, enriched[0]);
        }
        notify(`${picked.icon} ${picked.lines[0]}`, picked.type === "warning" ? "warning" : "info");
        let stamped = recordInterventionShown(state, picked.checkId || "unknown", picked.type === "warning" ? "warning" : "coaching", today);
        // Bugfix (Spec Befund 8): Weekly-Report-Flag wurde nie persistiert.
        if (picked._setLastWeeklyPathReport) stamped = { ...stamped, lastWeeklyPathReport: picked._setLastWeeklyPathReport };
        setState(stamped);
        persist(stamped);
      }
      prevStateRef.current = { ...state };
    };
```

(Imports oben ergänzen: `import { pickCoachMessage } from './data/coachPolicy.js';` und `import { recordInterventionShown } from './data/signals.js';` — `getToday`/`persist`/`setState` sind in der Komponente bereits verfügbar; Celebrations zählen bewusst als "coaching"-Stempel, werden von der Policy aber nie blockiert.)

- [ ] **Step 4: Tests + Build**

Run: `node scripts/test-coach-policy.mjs && node scripts/test-signals.mjs && npm run build`
Expected: grün + Build Exit 0

- [ ] **Step 5: Commit**

```bash
git add components/SystemCoach.jsx solo-leveling-v5.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(coach): Policy im Anzeigepfad, openedButIdle, Soft-Varianten, Weekly-Report-Fix"
```

---

### Task 9: Like/Dislike-UI im QuestDetailModal

**Files:**
- Modify: `components/QuestDetailModal.jsx` (neue Props + Rating-Sektion)
- Modify: `solo-leveling-v5.jsx:1476-1500` (Props verdrahten)
- Modify: `hooks/useGameState.jsx` (2 neue Callbacks `rateQuest`, `addDislikeNote`; im Rückgabe-Objekt des Hooks exportieren)
- Modify: `data/locales/de.js` + `data/locales/en.js` (neuer Namespace `questRating`)

**Interfaces:**
- Consumes: `applyQuestRating`, `applyDislikeNote`, `recordUserAction` (Task 1); bestehende `getReplacementCandidates`/`replaceSystemQuest` (Task 4-Version).
- Produces:
  - `rateQuest(questId, rating /* "liked"|"disliked"|null */) → void` (persistiert)
  - `addDislikeNote(questId, note) → void` (persistiert)
  - QuestDetailModal-Props: `onRateQuest(questId, rating)`, `onDislikeNote(questId, note)`, `onReplaceFromDislike(quest)` — alle optional; UI nur bei `quest.isSystem && !quest.completed && !readOnly`.

- [ ] **Step 1: useGameState-Callbacks**

In `hooks/useGameState.jsx` (neben `replaceSystemQuest`):

```js
  const rateQuest = useCallback((questId, rating) => {
    const current = stateRef.current || state;
    if (!current) return;
    let next = applyQuestRating(current, questId, rating, getToday());
    if (next === current) return;
    if (rating) next = recordUserAction(next, getToday());
    setState(next);
    persist(next);
  }, [state, persist]);

  const addDislikeNote = useCallback((questId, note) => {
    const current = stateRef.current || state;
    if (!current) return;
    const next = applyDislikeNote(current, questId, note);
    if (next === current) return;
    setState(next);
    persist(next);
  }, [state, persist]);
```

Beide im Rückgabe-Objekt des Hooks exportieren (dort, wo `replaceSystemQuest` exportiert wird).

- [ ] **Step 2: Rating-Sektion im Modal**

In `components/QuestDetailModal.jsx`: Props `onRateQuest, onDislikeNote, onReplaceFromDislike` ergänzen (Signatur Z. 35–50). Lokaler State + Sektion (einfügen im Details-Tab, unterhalb der Beschreibung / oberhalb der Notizen — an der Stelle, an der `activeTab === "details"` rendert):

```jsx
  const [noteDraft, setNoteDraft] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const showRating = Boolean(quest.isSystem && !quest.completed && !readOnly && onRateQuest);
  const rating = quest.userRating || null;
```

```jsx
      {showRating && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, flex: 1 }}>{t("questRating.prompt")}</span>
            <button className="press-feedback" onClick={() => onRateQuest(quest.id, rating === "liked" ? null : "liked")}
              style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: rating === "liked" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.04)", color: rating === "liked" ? "#4ade80" : "#94a3b8", border: `1px solid ${rating === "liked" ? "#22c55e55" : "rgba(148,163,184,0.2)"}` }}>
              ▲ {t("questRating.like")}
            </button>
            <button className="press-feedback" onClick={() => { onRateQuest(quest.id, rating === "disliked" ? null : "disliked"); setShowNoteField(false); }}
              style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: rating === "disliked" ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.04)", color: rating === "disliked" ? "#f87171" : "#94a3b8", border: `1px solid ${rating === "disliked" ? "#ef444455" : "rgba(148,163,184,0.2)"}` }}>
              ▼ {t("questRating.dislike")}
            </button>
          </div>
          {rating === "disliked" && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {onReplaceFromDislike && (
                  <button className="press-feedback" onClick={() => onReplaceFromDislike(quest)}
                    style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid #6366f155" }}>
                    {t("questRating.replaceCta")}
                  </button>
                )}
                <button className="press-feedback" onClick={() => setShowNoteField(v => !v)}
                  style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" }}>
                  {t("questRating.noteCta")}
                </button>
              </div>
              {showNoteField && (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={noteDraft} maxLength={140} onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder={t("questRating.notePlaceholder")}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12, background: "rgba(10,12,24,0.6)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.2)" }} />
                  <button className="press-feedback" disabled={!noteDraft.trim()}
                    onClick={() => { onDislikeNote?.(quest.id, noteDraft); setNoteDraft(""); setShowNoteField(false); }}
                    style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid #6366f155" }}>
                    {t("questRating.noteSave")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 3: Parent verdrahten**

`solo-leveling-v5.jsx` Z. 1478 (QuestDetailModal-Props ergänzen):

```jsx
                onRateQuest={rateQuest}
                onDislikeNote={addDislikeNote}
                onReplaceFromDislike={(quest) => {
                  const candidates = getReplacementCandidates(quest.id);
                  if (candidates.length > 0 && replaceSystemQuest(quest.id, candidates[0])) {
                    setDetailQuest(null);
                  }
                }}
```

(`rateQuest`, `addDislikeNote`, `getReplacementCandidates`, `replaceSystemQuest` kommen aus dem useGameState-Hook-Destructuring am Komponenten-Kopf — dort ergänzen. `replaceSystemQuest` meldet Limit-Fälle selbst per Toast.)

- [ ] **Step 4: i18n**

`data/locales/de.js` (Top-Level-Namespace, z.B. nach `systemCoach`):

```js
  questRating: {
    prompt: "PASST DIESE QUEST?",
    like: "Gefällt mir",
    dislike: "Nicht meins",
    replaceCta: "Ersetzen",
    noteCta: "Notiz",
    notePlaceholder: "Warum passt sie nicht? (optional)",
    noteSave: "Merken",
  },
```

`data/locales/en.js`:

```js
  questRating: {
    prompt: "DOES THIS QUEST FIT?",
    like: "Like",
    dislike: "Not for me",
    replaceCta: "Replace",
    noteCta: "Note",
    notePlaceholder: "Why doesn't it fit? (optional)",
    noteSave: "Save",
  },
```

- [ ] **Step 5: Build + Smoke**

Run: `npm run build`
Expected: Exit 0.
Smoke (Harness): System-Quest öffnen → Daumen runter → Notiz „zu lang" speichern → State prüfen: `questSignals.recentDisliked[0].note === "zu lang"`, `quests[i].userRating === "disliked"`. Daumen-runter erneut tippen → Eintrag verschwindet.

- [ ] **Step 6: Commit**

```bash
git add components/QuestDetailModal.jsx solo-leveling-v5.jsx hooks/useGameState.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(quests): Like/Dislike mit optionaler Notiz und 1-Tap-Ersetzen im Detail-Modal"
```

---

### Task 10: Systemanalyse-Block im AnalyticsDashboard

**Files:**
- Modify: `components/AnalyticsDashboard.jsx` (neuer Block, als erste Sektion im Haupt-Scroll-Bereich)
- Modify: `data/locales/de.js` + `data/locales/en.js` (Namespace `systemAnalysis`)

**Interfaces:**
- Consumes: `getDossierSummary` (Task 2).
- Produces: reine Anzeige, keine neuen Exporte.

- [ ] **Step 1: Block implementieren**

In `components/AnalyticsDashboard.jsx`: Import `import { getDossierSummary } from "../data/hunterDossier.js";` (die Komponente erhält den State als `gameState`-Prop — vorhandene Verwendung Z. 719 prüfen und denselben Prop nutzen). Falls die Datei kein `t` aus `useI18n` hat, ergänzen: `import { useI18n } from "./i18n/I18nProvider.jsx";` und im Komponenten-Kopf `const { t } = useI18n();` — Muster wie in `components/QuestForgeCard.jsx:9`. Sektion einfügen (Ton-Regel Spec §10: Beobachtung IMMER mit System-Anpassung gepaart; Ghost-Zeile nie zuerst):

```jsx
      {(() => {
        const dossier = getDossierSummary(gameState || {});
        const bucketLabel = (bucket) => t(`systemAnalysis.bucket_${bucket}`);
        const statLabel = { str: "STR", int: "INT", vit: "VIT", agi: "AGI", cha: "CHA" };
        const lines = [];
        if (dossier.bestTime) lines.push(t("systemAnalysis.bestTime", { bucket: bucketLabel(dossier.bestTime.bucket), percent: dossier.bestTime.percent }));
        for (const cat of dossier.reliableCategories.slice(0, 1)) {
          lines.push(t("systemAnalysis.reliable", { stat: statLabel[cat], percent: Math.round((dossier.categoryCompletionRates[cat] || 0) * 100) }));
        }
        for (const cat of dossier.avoidCategories.slice(0, 1)) {
          const rate = dossier.categoryCompletionRates[cat];
          if (rate !== undefined) lines.push(t("systemAnalysis.avoided", { stat: statLabel[cat], percent: Math.round(rate * 100) }));
        }
        if (dossier.ghost && dossier.ghost.ghostDays >= 3) {
          lines.push(t("systemAnalysis.ghost", { ghost: dossier.ghost.ghostDays, days: dossier.ghost.daysWithData }));
        }
        return (
          <section style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(10,12,24,0.6))", border: "1px solid rgba(99,102,241,0.25)" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#818cf8", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{t("systemAnalysis.title")}</div>
            {lines.length === 0 ? (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{t("systemAnalysis.collecting")}</div>
            ) : (
              <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {lines.slice(0, 4).map((line, i) => (
                  <li key={i} style={{ fontSize: 11.5, color: "#cbd5e1", lineHeight: 1.5 }}>▸ {line}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })()}
```

- [ ] **Step 2: i18n**

`data/locales/de.js`:

```js
  systemAnalysis: {
    title: "SYSTEMANALYSE",
    collecting: "Das System sammelt noch Daten.",
    bestTime: "Beste Aktivzeit: {bucket} — {percent}% deiner Abschlüsse.",
    reliable: "Zuverlässig: {stat} ({percent}% erledigt).",
    avoided: "{stat}-Quests bleiben oft liegen ({percent}% erledigt). Das System vergibt hier jetzt kürzere Einstiege.",
    ghost: "Beobachtung ohne Handlung: {ghost} von {days} Tagen. Das System reduziert seine Rufe.",
    bucket_morgen: "morgens",
    bucket_mittag: "mittags",
    bucket_abend: "abends",
    bucket_nacht: "nachts",
  },
```

`data/locales/en.js`:

```js
  systemAnalysis: {
    title: "SYSTEM ANALYSIS",
    collecting: "The System is still gathering data.",
    bestTime: "Peak activity: {bucket} — {percent}% of your completions.",
    reliable: "Reliable: {stat} ({percent}% completed).",
    avoided: "{stat} quests often stay open ({percent}% completed). The System now assigns shorter entries here.",
    ghost: "Observation without action: {ghost} of {days} days. The System is reducing its calls.",
    bucket_morgen: "mornings",
    bucket_mittag: "midday",
    bucket_abend: "evenings",
    bucket_nacht: "nights",
  },
```

- [ ] **Step 3: Build + Smoke**

Run: `npm run build`
Expected: Exit 0. Smoke: Analytics-View öffnen — bei frischem Account erscheint „Das System sammelt noch Daten."; mit präpariertem State (10+ Abschlüsse in `completionHours`) erscheinen die Muster-Zeilen.

- [ ] **Step 4: Commit**

```bash
git add components/AnalyticsDashboard.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(analytics): Systemanalyse-Block aus dem Hunter-Dossier"
```

---

### Task 11: Settings-Reset + finale Verifikation

**Files:**
- Modify: `components/SettingsView.jsx` (Reset-Eintrag; dem Muster bestehender destruktiver Aktionen dort folgen)
- Modify: `hooks/useGameState.jsx` (Callback `resetSignals`)
- Modify: `data/locales/de.js` + `data/locales/en.js`

**Interfaces:**
- Consumes: `DEFAULT_QUEST_SIGNALS`, `DEFAULT_SESSION_SIGNALS`, `DEFAULT_COACH_SIGNALS` (Task 1).
- Produces: `resetSignals() → void` (setzt die drei Felder auf Default, persistiert; `completedQuests`/Chips bleiben unberührt).

- [ ] **Step 1: Callback**

`hooks/useGameState.jsx` (Import der drei Defaults aus `../data/signals.js` ergänzen):

```js
  const resetSignals = useCallback(() => {
    const current = stateRef.current || state;
    if (!current) return;
    const next = {
      ...current,
      questSignals: structuredClone(DEFAULT_QUEST_SIGNALS),
      sessionSignals: structuredClone(DEFAULT_SESSION_SIGNALS),
      coachSignals: structuredClone(DEFAULT_COACH_SIGNALS),
      quests: (current.quests || []).map(q => (q.userRating ? { ...q, userRating: null } : q)),
    };
    setState(next);
    persist(next);
    notify(ltState(next, "settings.signalsResetDone"), "success");
  }, [state, persist, notify]);
```

Im Hook-Rückgabe-Objekt exportieren.

- [ ] **Step 2: Settings-Eintrag**

In `components/SettingsView.jsx` einen Eintrag im Daten-/Privacy-Bereich ergänzen (bestehendes Button-Muster der View übernehmen; mit `window.confirm`-Bestätigung wie andere destruktive Aktionen dort — falls die View ein eigenes Confirm-Pattern hat, dieses verwenden):

```jsx
        <button className="press-feedback" onClick={() => {
          if (window.confirm(t("settings.signalsResetConfirm"))) onResetSignals?.();
        }} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", textAlign: "left" }}>
          {t("settings.signalsReset")}
        </button>
```

Prop `onResetSignals` durchreichen (`solo-leveling-v5.jsx` rendert SettingsView — dort `onResetSignals={resetSignals}` ergänzen).

- [ ] **Step 3: i18n**

`data/locales/de.js` (im `settings:`-Namespace):

```js
    signalsReset: "Systemanalyse zurücksetzen",
    signalsResetConfirm: "Alle gesammelten Verhaltensmuster (Analyse, Bewertungen, Coach-Historie) löschen? Dein Spielfortschritt bleibt unberührt.",
    signalsResetDone: "Systemanalyse zurückgesetzt. Das System beginnt neu zu lernen.",
```

`data/locales/en.js`:

```js
    signalsReset: "Reset system analysis",
    signalsResetConfirm: "Delete all collected behavior patterns (analysis, ratings, coach history)? Your game progress stays untouched.",
    signalsResetDone: "System analysis reset. The System starts learning anew.",
```

- [ ] **Step 4: Finale Verifikation (alles)**

```bash
node scripts/test-signals.mjs && node scripts/test-hunter-dossier.mjs && node scripts/test-coach-policy.mjs && node scripts/test-state-merge.mjs && node scripts/test-quest-pool-weighting.mjs && node scripts/test-ai-quest-profile.mjs && node scripts/test-gemini-prompts.mjs && node scripts/test-quest-feedback.mjs && node scripts/test-quest-swap.mjs && node scripts/test-quest-utils.mjs && node scripts/test-operations.mjs && node scripts/test-streak.mjs && npm run build
```

Expected: alle Tests `alles gruen`, Build Exit 0.

End-to-End-Smoke (Harness-Pfad `/run-solo-todo`, als skeptischer User):
1. Frischer Account: Analytics zeigt „sammelt noch Daten", kein openedButIdle-Spam.
2. Quest abschließen → `questSignals`-Zähler steigen.
3. System-Quest disliken + Notiz → `recentDisliked` mit Notiz; „Ersetzen" ersetzt die Quest (Limit-Toast bei zweitem Versuch als Free).
4. Tageswechsel simulieren (lastActiveDate zurückstellen) → offene System-Dailies landen in `recentExpired`.
5. Coach: zweiter checkCoach-Lauf am selben Tag zeigt KEINE zweite Coaching-Meldung.

- [ ] **Step 5: Commit**

```bash
git add components/SettingsView.jsx hooks/useGameState.jsx solo-leveling-v5.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(settings): Systemanalyse-Reset + finale Signal-Verifikation"
```

---

## Offene Punkte nach Abschluss (bewusst außerhalb dieses Plans)

- **Functions-Deploy:** Task 5 wirkt in PROD erst nach dem ausstehenden `firebase deploy --only functions` (PROD-Functions sind seit 14.07. veraltet — gemeinsam mit dem Personalisierungs-Paket deployen).
- **Web-Deploy:** via `npm run deploy` (niemals `firebase deploy` direkt — Stale-Bundle-Gotcha).
- **Privacy-Label:** beim Finalisieren gegenprüfen, dass „Nutzungsdaten, mit Account verknüpft" deklariert ist (`docs/app-store-privacy-label.md`).
