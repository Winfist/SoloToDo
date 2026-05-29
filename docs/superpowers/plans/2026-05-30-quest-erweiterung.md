# Quest-Erweiterung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Großer, voll bilingualer (DE+EN) Ausbau aller Quest-Typen — Haupt-Pool ~65→~140, Emergency 5→~18 mit Zufallswahl, Hidden 5→~13 mit neuen Triggern, Redemption 3→5, Seasonal 8→~20, plus benannte „Operationen"-Missionen.

**Architecture:** Ansatz A — rein additiv in bestehende Strukturen (`QUEST_POOL` + `EN_OVERRIDES`, `translate()`-Locale-Keys). Kein Refactor der Generierungslogik. Eine Node-Validierungs-Skript-Suite (`scripts/`) ersetzt das fehlende Test-Framework und erzwingt Pool-Integrität + DE/EN-Locale-Parität (echtes Rot→Grün über Mindest-Count-Assertions).

**Tech Stack:** Vanilla ESM JavaScript (`type: "module"`), Node (für Validierungs-Skripte, keine neuen Dependencies), Vite (App), i18n via `data/i18n.js` `translate()`.

---

## Wichtige Invarianten (gelten für ALLE Tasks)

- **Keine bestehende Quest-ID, Locale-Key oder Signatur ändern.** Nur additiv.
- **Locale-Parität:** Jeder neue `de.quests.*`-Key braucht denselben Pfad in `en.quests.*`.
- **EN-Override-Pflicht:** Jede neue `qp_*`-Quest braucht einen `EN_OVERRIDES`-Eintrag mit `desc` + `subQuests` (gleiche Anzahl SubQuests wie DE).
- **Kein Balancing-Eingriff:** `DIFFICULTIES`, Multiplikatoren, Reward-Tiers unverändert.
- Nach jedem Content-Task: `npm run validate:quests` muss grün sein.

## Datei-Übersicht

| Datei | Verantwortung | Aktion |
|---|---|---|
| `scripts/validate-quests.mjs` | Pool-Integrität + EN-Override-Coverage + Locale-Parität + Mindest-Counts | Create |
| `scripts/test-emergency.mjs` | Logik-Test: Emergency-Zufallswahl + Exclusion | Create |
| `scripts/test-hidden.mjs` | Logik-Test: neue Hidden-Trigger | Create |
| `scripts/test-redemption.mjs` | Logik-Test: 5 Redemption-Stats + Locale | Create |
| `package.json` | npm-Scripts `validate:quests` etc. | Modify |
| `data/questPool.js` | +~75 Quests (DE) + `OPERATIONS`-Export | Modify |
| `data/localizedQuestPool.js` | EN-Overrides für alle neuen Quests + Operations | Modify |
| `data/helpers.js` | Emergency-Pool + Zufallswahl, Hidden +Trigger, Mission-Generator | Modify |
| `data/protocolHelpers.js` | Redemption 3→5, Seasonal-Ausbau (locale-basiert) | Modify |
| `data/locales/de.js` | Neue Keys: emergency-Pool, hidden, redemption, seasonal, operations | Modify |
| `data/locales/en.js` | Spiegel aller neuen DE-Keys | Modify |
| `hooks/useGameState.jsx:603` | `generateEmergencyQuest(level, s)` + `lastEmergencyTemplateId` persistieren | Modify |

---

## Task 1: Validierungs-Harness

**Files:**
- Create: `scripts/validate-quests.mjs`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Validierungs-Skript schreiben (der „Test")**

Create `scripts/validate-quests.mjs`:

```js
import { QUEST_POOL } from "../data/questPool.js";
import { localizeQuestTemplate } from "../data/localizedQuestPool.js";
import { de } from "../data/locales/de.js";
import { en } from "../data/locales/en.js";

const CATS = ["str", "int", "vit", "agi", "cha"];
const DIFFS = ["easy", "normal", "hard", "boss"];
// Ziel-Mindestmengen nach Ausbau (Start: rot, nach Content: grün)
const MIN_PER_CAT = { str: 26, int: 26, vit: 26, agi: 26, cha: 26 };

const errors = [];
const ids = new Set();

for (const q of QUEST_POOL) {
  if (!/^qp_/.test(q.id || "")) errors.push(`Bad id: ${q.id}`);
  if (ids.has(q.id)) errors.push(`Duplicate id: ${q.id}`);
  ids.add(q.id);
  if (!CATS.includes(q.category)) errors.push(`${q.id}: bad category ${q.category}`);
  if (!DIFFS.includes(q.difficulty)) errors.push(`${q.id}: bad difficulty ${q.difficulty}`);
  if (typeof q.minLevel !== "number" || q.minLevel < 1) errors.push(`${q.id}: bad minLevel`);
  if (!String(q.desc || "").trim()) errors.push(`${q.id}: empty desc`);
  if (!Array.isArray(q.subQuests) || q.subQuests.length === 0) errors.push(`${q.id}: no subQuests`);
  else q.subQuests.forEach((s, i) => { if (!String(s.title || "").trim()) errors.push(`${q.id}: subQuest ${i} empty`); });

  // EN-Override-Pflicht: localize liefert non-fallback desc + gleiche subQuest-Anzahl
  const enT = localizeQuestTemplate(q, "en");
  if (!enT.desc || enT.desc.startsWith("Complete this")) errors.push(`${q.id}: missing EN override desc`);
  if ((enT.subQuests || []).length !== q.subQuests.length) errors.push(`${q.id}: EN subQuest count mismatch`);
}

const counts = Object.fromEntries(CATS.map(c => [c, QUEST_POOL.filter(q => q.category === c).length]));
for (const c of CATS) if (counts[c] < MIN_PER_CAT[c]) errors.push(`Category ${c}: ${counts[c]} < ${MIN_PER_CAT[c]}`);

// Locale-Parität für quest-Sub-Namespaces
function leafPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...leafPaths(v, p));
    else out.push(p);
  }
  return out;
}
for (const ns of ["emergency", "hidden", "redemption", "seasonal", "operations"]) {
  const deNs = de.quests?.[ns] || {};
  const enNs = en.quests?.[ns] || {};
  const deP = new Set(leafPaths(deNs));
  const enP = new Set(leafPaths(enNs));
  for (const p of deP) if (!enP.has(p)) errors.push(`quests.${ns}.${p} fehlt in EN`);
  for (const p of enP) if (!deP.has(p)) errors.push(`quests.${ns}.${p} fehlt in DE`);
}

console.log("Pool counts:", counts);
if (errors.length) { console.error("\nFEHLER:\n" + errors.map(e => " - " + e).join("\n")); process.exit(1); }
console.log("\n✓ Quest-Validierung bestanden");
```

- [ ] **Step 2: npm-Scripts ergänzen**

In `package.json` unter `"scripts"` hinzufügen:

```json
"validate:quests": "node scripts/validate-quests.mjs",
"test:emergency": "node scripts/test-emergency.mjs",
"test:hidden": "node scripts/test-hidden.mjs",
"test:redemption": "node scripts/test-redemption.mjs"
```

- [ ] **Step 3: Skript laufen lassen — muss ROT sein**

Run: `npm run validate:quests`
Expected: FAIL — `Category str: 13 < 26` (und analog int/vit/agi/cha), Rest grün. Damit ist die Count-Assertion der echte „failing test" für die Content-Tasks.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-quests.mjs package.json
git commit -m "test: quest validation harness (pool integrity, EN coverage, locale parity)"
```

---

## Task 2: STR-Pool ausbauen (+13)

**Files:**
- Modify: `data/questPool.js` (STR-Sektion, nach `qp_str_04`)
- Modify: `data/localizedQuestPool.js` (`EN_OVERRIDES`, STR-Block)

**Ziel:** STR von 13 → 26. Verteilung: 2 easy, 4 normal, 4 hard (davon 2 in der Lücke minLevel 15-19), 1 boss + 2 Endgame (minLevel 25 / 30). IDs fortführen: `qp_str_05, _05b, _05c, _06, _06b, _06c, _06d, _07, _07b, _07c, _07d, _08, _08b`. Themen: Mobility-Spezialisierung, Sport-Disziplinen, Outdoor-Challenges.

- [ ] **Step 1: Neue STR-Quests in `questPool.js` ergänzen (DE)**

In `QUEST_POOL`, direkt nach dem `qp_str_04`-Objekt (vor `// ─── INT`), 13 Objekte nach diesem Muster einfügen. Zwei vollständige Beispiele als Vorlage:

```js
  {
    id: "qp_str_05", title: "Active Recovery", category: "str", difficulty: "easy", minLevel: 2,
    desc: "Regeneration ist kein Stillstand. Halte den Kreislauf mit leichter Bewegung in Fahrt.",
    tags: ["recovery", "mobility", "outdoor"],
    subQuests: [{ id: "1", title: "20 Minuten lockeres Gehen oder Radfahren an der frischen Luft", completed: false }]
  },
  {
    id: "qp_str_07", title: "Iron Tempo", category: "str", difficulty: "hard", minLevel: 16,
    desc: "Schließe die Lücke zwischen Stärke und Eliteklasse. Kontrolliertes Tempo unter Last.",
    tags: ["gym", "tempo", "control"],
    subQuests: [{ id: "1", title: "5 Sätze Kniebeugen mit 4 Sekunden exzentrischer Phase", completed: false }, { id: "2", title: "3 Sätze langsame Klimmzüge bis nahe Muskelversagen", completed: false }]
  },
```

Die übrigen 11 nach demselben Schema (gültige `category:"str"`, `difficulty`/`minLevel` gemäß Verteilung oben, sinnvolle `tags`, je 1-3 SubQuests, deutscher Solo-Leveling-„System"-Ton wie im Bestand). Die zwei Endgame-Quests: `difficulty:"boss"`, `minLevel:25` bzw. `30`.

- [ ] **Step 2: EN-Overrides in `localizedQuestPool.js` ergänzen**

Im `EN_OVERRIDES`-Objekt, STR-Block, für JEDE neue ID einen Eintrag mit `desc` + `subQuests` (gleiche Anzahl). Zwei Beispiele passend zu oben:

```js
  qp_str_05: {
    desc: "Recovery is not standstill. Keep circulation going with light movement.",
    subQuests: ["20 minutes of easy walking or cycling in fresh air"],
  },
  qp_str_07: {
    desc: "Close the gap between strength and elite class. Controlled tempo under load.",
    subQuests: ["5 sets of squats with a 4-second eccentric phase", "3 sets of slow pull-ups near muscle failure"],
  },
```

- [ ] **Step 3: Validierung laufen lassen**

Run: `npm run validate:quests`
Expected: `Category str` jetzt grün (≥26); int/vit/agi/cha noch rot. Keine Integritäts-/EN-Fehler für STR.

- [ ] **Step 4: Commit**

```bash
git add data/questPool.js data/localizedQuestPool.js
git commit -m "feat: expand STR quest pool to 26 (bilingual)"
```

---

## Task 3: INT-Pool ausbauen (+13)

**Files:**
- Modify: `data/questPool.js` (INT-Sektion)
- Modify: `data/localizedQuestPool.js` (`EN_OVERRIDES`, INT-Block)

**Ziel:** INT 13 → 26. Verteilung wie Task 2. IDs `qp_int_05`…`qp_int_08b`. Themen: Kreativität & Skills (Musik, Schreiben, Zeichnen, Side-Project), Finanz-Tiefe (Budget, Investment-Lernen), Lücke 15-19 + Endgame 25/30.

- [ ] **Step 1: Neue INT-Quests (DE) nach `qp_int_04` einfügen.** Muster aus Task 2, `category:"int"`. Beispiel:

```js
  {
    id: "qp_int_05", title: "Creative Output", category: "int", difficulty: "normal", minLevel: 5,
    desc: "Wissen aufnehmen reicht nicht. Erschaffe etwas Eigenes aus dem Gelernten.",
    tags: ["creativity", "music", "writing"],
    subQuests: [{ id: "1", title: "30 Minuten an einem kreativen Projekt arbeiten (Musik, Text, Zeichnung, Code)", completed: false }]
  },
```

- [ ] **Step 2: EN-Overrides INT ergänzen.** Beispiel:

```js
  qp_int_05: {
    desc: "Absorbing knowledge is not enough. Create something of your own from what you learned.",
    subQuests: ["Spend 30 minutes on a creative project (music, writing, drawing, code)"],
  },
```

- [ ] **Step 3:** `npm run validate:quests` — INT grün.
- [ ] **Step 4:** `git add data/questPool.js data/localizedQuestPool.js && git commit -m "feat: expand INT quest pool to 26 (bilingual)"`

---

## Task 4: VIT-Pool ausbauen (+13)

**Files:**
- Modify: `data/questPool.js` (VIT-Sektion)
- Modify: `data/localizedQuestPool.js` (`EN_OVERRIDES`, VIT-Block)

**Ziel:** VIT 13 → 26. IDs `qp_vit_05`…`qp_vit_08b`. Themen: Achtsamkeit/Mental Health (Journaling, Atemarbeit, Dankbarkeit, Digital-Detox-Tiefe), Ernährungs-Detail, Natur/Outdoor-Erholung, Lücke 15-19 + Endgame 25/30.

- [ ] **Step 1: Neue VIT-Quests (DE).** Beispiel:

```js
  {
    id: "qp_vit_05", title: "Gratitude Protocol", category: "vit", difficulty: "easy", minLevel: 2,
    desc: "Richte den Fokus des Geistes neu aus. Anerkennung des Guten senkt das Stresslevel messbar.",
    tags: ["mindfulness", "gratitude", "journaling"],
    subQuests: [{ id: "1", title: "Schreibe 3 konkrete Dinge auf, für die du heute dankbar bist", completed: false }]
  },
```

- [ ] **Step 2: EN-Overrides VIT.** Beispiel:

```js
  qp_vit_05: {
    desc: "Realign the mind's focus. Acknowledging the good measurably lowers stress levels.",
    subQuests: ["Write down 3 concrete things you are grateful for today"],
  },
```

- [ ] **Step 3:** `npm run validate:quests` — VIT grün.
- [ ] **Step 4:** `git add data/questPool.js data/localizedQuestPool.js && git commit -m "feat: expand VIT quest pool to 26 (bilingual)"`

---

## Task 5: AGI-Pool ausbauen (+13)

**Files:**
- Modify: `data/questPool.js` (AGI-Sektion)
- Modify: `data/localizedQuestPool.js` (`EN_OVERRIDES`, AGI-Block)

**Ziel:** AGI 13 → 26. IDs `qp_agi_05`…`qp_agi_08b`. Themen: Karriere/Beruf (Bewerbung, Skill-Building, Netzwerk-Pflege), Haushalt/Umgebung, Gewohnheits-Systeme, Lücke 15-19 + Endgame 25/30.

- [ ] **Step 1: Neue AGI-Quests (DE).** Beispiel:

```js
  {
    id: "qp_agi_05", title: "Career Vector", category: "agi", difficulty: "normal", minLevel: 5,
    desc: "Karriere ist ein System, kein Zufall. Investiere gezielt in deinen Marktwert.",
    tags: ["career", "skill", "growth"],
    subQuests: [{ id: "1", title: "30 Minuten an einer beruflich relevanten Fähigkeit arbeiten", completed: false }, { id: "2", title: "Eine konkrete nächste Aktion für deine Karriere notieren", completed: false }]
  },
```

- [ ] **Step 2: EN-Overrides AGI.** Beispiel:

```js
  qp_agi_05: {
    desc: "A career is a system, not chance. Invest deliberately in your market value.",
    subQuests: ["Spend 30 minutes building a professionally relevant skill", "Note one concrete next action for your career"],
  },
```

- [ ] **Step 3:** `npm run validate:quests` — AGI grün.
- [ ] **Step 4:** `git add data/questPool.js data/localizedQuestPool.js && git commit -m "feat: expand AGI quest pool to 26 (bilingual)"`

---

## Task 6: CHA-Pool ausbauen (+13)

**Files:**
- Modify: `data/questPool.js` (CHA-Sektion, am Array-Ende)
- Modify: `data/localizedQuestPool.js` (`EN_OVERRIDES`, CHA-Block)

**Ziel:** CHA 13 → 26. IDs `qp_cha_05`…`qp_cha_08b`. Themen: Beziehungen & Familie (Qualitätszeit, Konflikt klären, Kontakt halten, Wertschätzung zeigen), Lücke 15-19 + Endgame 25/30. **Achtung:** `qp_cha_04` ist letztes Array-Element ohne trailing Komma — Komma ergänzen bevor neue Objekte folgen.

- [ ] **Step 1: Neue CHA-Quests (DE).** Beispiel:

```js
  {
    id: "qp_cha_05", title: "Family Bond", category: "cha", difficulty: "easy", minLevel: 2,
    desc: "Die stärksten Allianzen sind die nächsten. Investiere bewusst in Familie.",
    tags: ["family", "connection", "quality-time"],
    subQuests: [{ id: "1", title: "Verbringe 30 Minuten ungeteilte Zeit mit einem Familienmitglied (ohne Handy)", completed: false }]
  },
```

- [ ] **Step 2: EN-Overrides CHA.** Beispiel:

```js
  qp_cha_05: {
    desc: "The strongest alliances are the closest ones. Invest deliberately in family.",
    subQuests: ["Spend 30 minutes of undivided time with a family member (no phone)"],
  },
```

- [ ] **Step 3:** `npm run validate:quests` — **alle Counts grün**, gesamte Validierung bestanden.
- [ ] **Step 4:** `git add data/questPool.js data/localizedQuestPool.js && git commit -m "feat: expand CHA quest pool to 26 (bilingual)"`

---

## Task 7: Emergency-Pool → ~18 + Zufallswahl

**Files:**
- Modify: `data/helpers.js` (`generateEmergencyQuest`, ~Z781)
- Modify: `data/locales/de.js` + `data/locales/en.js` (`quests.emergency.*`)
- Modify: `hooks/useGameState.jsx:603`
- Create: `scripts/test-emergency.mjs`

**Ziel:** 18 Templates (3-4 pro Stat), zufällige tägliche Auswahl mit Ausschluss der zuletzt genutzten. Bilingual.

- [ ] **Step 1: Logik-Test schreiben (failing)**

Create `scripts/test-emergency.mjs`:

```js
import { generateEmergencyQuest } from "../data/helpers.js";

const seen = new Set();
let excludedHit = 0;
let prev = null;
for (let i = 0; i < 200; i++) {
  const state = { settings: { language: "en" }, lastEmergencyTemplateId: prev };
  const q = generateEmergencyQuest(5, state);
  if (!q.templateId) throw new Error("no templateId");
  if (!q.title || q.title.startsWith("quests.")) throw new Error("EN title not resolved: " + q.title);
  if (prev && q.templateId === prev) excludedHit++;
  seen.add(q.templateId);
  prev = q.templateId;
}
if (excludedHit > 0) { console.error(`Exclusion verletzt: ${excludedHit}x Wiederholung`); process.exit(1); }
if (seen.size < 6) { console.error(`Zu wenig Varianz: nur ${seen.size} Templates`); process.exit(1); }
console.log(`✓ Emergency: ${seen.size} distinct templates, keine direkte Wiederholung`);
```

- [ ] **Step 2: Test laufen — ROT**

Run: `npm run test:emergency`
Expected: FAIL — heutige `generateEmergencyQuest` ignoriert `lastEmergencyTemplateId` (deterministisch), Varianz < 6 bzw. exclusion verletzt.

- [ ] **Step 3: Locale-Keys ergänzen (de.js + en.js)**

In `data/locales/de.js`, `quests.emergency` (~Z321) von 5 auf 18 Keys erweitern (z. B. `physical2`, `physical3`, `cognitive2`, … 3-4 pro Stat), jeweils `{ title, desc }`. In `data/locales/en.js` an gleicher Stelle dieselben Keys mit EN-Text. Beispiel-Zusatz DE:

```js
      physical2: {
        title: "URGENT: Muscular Shutdown",
        desc: "Das System meldet akuten Spannungsverlust. Sofort 40 Kniebeugen oder 25 Liegestuetze ausfuehren.",
      },
```

und EN spiegeln.

- [ ] **Step 4: `generateEmergencyQuest` umbauen**

In `data/helpers.js` die Template-Liste auf alle 18 Keys erweitern und Auswahl randomisieren mit Ausschluss:

```js
export function generateEmergencyQuest(playerLevel, stateOrLanguage = null) {
  const locale = typeof stateOrLanguage === "string" ? resolveLocale(stateOrLanguage) : getStateLocale(stateOrLanguage);
  const lastId = typeof stateOrLanguage === "object" ? stateOrLanguage?.lastEmergencyTemplateId : null;
  const templates = [
    { key: "physical", category: "str", difficulty: "hard" },
    { key: "physical2", category: "str", difficulty: "hard" },
    { key: "physical3", category: "str", difficulty: "normal" },
    { key: "cognitive", category: "int", difficulty: "hard" },
    { key: "cognitive2", category: "int", difficulty: "hard" },
    { key: "cognitive3", category: "int", difficulty: "normal" },
    { key: "hydration", category: "vit", difficulty: "hard" },
    { key: "hydration2", category: "vit", difficulty: "normal" },
    { key: "vitality3", category: "vit", difficulty: "hard" },
    { key: "oxygen", category: "agi", difficulty: "hard" },
    { key: "oxygen2", category: "agi", difficulty: "normal" },
    { key: "agility3", category: "agi", difficulty: "hard" },
    { key: "social", category: "cha", difficulty: "normal" },
    { key: "social2", category: "cha", difficulty: "normal" },
    { key: "social3", category: "cha", difficulty: "hard" },
    { key: "balance", category: "vit", difficulty: "normal" },
    { key: "discipline", category: "str", difficulty: "hard" },
    { key: "clarity", category: "int", difficulty: "normal" },
  ];
  const pool = templates.filter(t => `emergency_${t.key}` !== lastId);
  const tmpl = pool[Math.floor(Math.random() * pool.length)];
  const expires = new Date(); expires.setHours(23, 59, 59, 999);
  return {
    id: `emergency_${getToday()}`,
    templateId: `emergency_${tmpl.key}`,
    title: translate(locale, `quests.emergency.${tmpl.key}.title`),
    desc: translate(locale, `quests.emergency.${tmpl.key}.desc`),
    category: tmpl.category,
    difficulty: tmpl.difficulty,
    type: "emergency",
    timeLimit: expires.toISOString(),
    xpMult: 2.5, goldMult: 2.5,
    createdAt: getToday(),
    systemMessage: translate(locale, "quests.emergencyMessage"),
  };
}
```

(Alle 18 Keys müssen in beiden Locales existieren — durch Task-7-Step-3 sichergestellt. `resolveLocale`/`getStateLocale` sind in `helpers.js` bereits importiert, da heute schon genutzt.)

- [ ] **Step 5: Aufrufstelle + Persistenz anpassen**

In `hooks/useGameState.jsx` (Z602-607) Block ersetzen:

```jsx
            if (!s.emergencyQuest || !s.emergencyQuest.id.endsWith(today)) {
              s.emergencyQuest = generateEmergencyQuest(s.level || 1, s);
              s.lastEmergencyTemplateId = s.emergencyQuest.templateId;
              s.emergencyDone = false;
              s.emergencyFailed = false;
              isNewEmergency = true;
            }
```

- [ ] **Step 6: Tests laufen — GRÜN**

Run: `npm run test:emergency && npm run validate:quests`
Expected: PASS — distinct templates ≥6, keine Wiederholung, EN-Titel aufgelöst, Locale-Parität für `quests.emergency` ok.

- [ ] **Step 7: Commit**

```bash
git add data/helpers.js data/locales/de.js data/locales/en.js hooks/useGameState.jsx scripts/test-emergency.mjs
git commit -m "feat: emergency quest pool 5->18 with randomized non-repeating selection (bilingual)"
```

---

## Task 8: Hidden-Quests → ~13 + neue Trigger

**Files:**
- Modify: `data/helpers.js` (`HIDDEN_QUESTS`, `checkHiddenQuestTriggers`)
- Modify: `data/locales/de.js` + `data/locales/en.js` (`quests.hidden.*`)
- Create: `scripts/test-hidden.mjs`

**Ziel:** 5 → 13, Texte ins i18n, neue Trigger-Typen `perfect_day`, `time_of_day`, `stat_combo`, `dungeon_clears`, `focus_sessions`.

- [ ] **Step 1: Logik-Test schreiben (failing)**

Create `scripts/test-hidden.mjs`:

```js
import { checkHiddenQuestTriggers } from "../data/helpers.js";

function fires(id, state) {
  return checkHiddenQuestTriggers(state).some(q => q.id === id);
}
const base = { hiddenQuests: { discovered: [], completed: [] }, stats: {}, shadowArmy: { shadows: [] } };

// stat_combo: zwei Stats gleichzeitig über Schwelle
if (!fires("hq_dual_mastery", { ...base, stats: { str: 30, int: 30 } })) { console.error("stat_combo trigger broken"); process.exit(1); }
// dungeon_clears
if (!fires("hq_gate_breaker", { ...base, dungeonHistory: Array(15).fill({ won: true }) })) { console.error("dungeon_clears trigger broken"); process.exit(1); }
// focus_sessions
if (!fires("hq_flow_state", { ...base, stats: { focusSessions: 25 } })) { console.error("focus_sessions trigger broken"); process.exit(1); }
console.log("✓ Hidden: neue Trigger feuern korrekt");
```

(IDs `hq_dual_mastery`, `hq_gate_breaker`, `hq_flow_state` in Step 3 anlegen.)

- [ ] **Step 2: Test laufen — ROT**

Run: `npm run test:hidden`
Expected: FAIL — Quests/Trigger existieren noch nicht.

- [ ] **Step 3: `HIDDEN_QUESTS` erweitern + Texte auslagern**

In `data/helpers.js`: bestehende 5 Einträge so umbauen, dass `title`/`desc`/`discoveryMsg` aus i18n kommen (Felder im Array entfernen, dafür beim Discovery-Handling `translate(locale, \`quests.hidden.${id}.title\`)` nutzen — Discovery-Stelle in `useGameState.jsx` analog Emergency anpassen, Locale aus State). 8 neue Einträge ergänzen, u. a.:

```js
  { id: "hq_dual_mastery", category: "str", difficulty: "boss", triggerCondition: { type: "stat_combo", stats: ["str", "int"], value: 30 }, reward: { xpMult: 5, goldMult: 4 } },
  { id: "hq_gate_breaker", category: "agi", difficulty: "hard", triggerCondition: { type: "dungeon_clears", value: 15 }, reward: { xpMult: 4, goldMult: 4 } },
  { id: "hq_flow_state", category: "int", difficulty: "hard", triggerCondition: { type: "focus_sessions", value: 25 }, reward: { xpMult: 4, goldMult: 3 } },
```

(+5 weitere mit `perfect_day` / `time_of_day` / `stat_value` / `streak`-Varianten.)

In `checkHiddenQuestTriggers` neue Typen ergänzen:

```js
    if (tc.type === "stat_combo") triggered = (tc.stats || []).every(st => (state.stats?.[st] || 0) >= tc.value);
    if (tc.type === "dungeon_clears") triggered = (state.dungeonHistory || []).filter(d => d.won).length >= tc.value;
    if (tc.type === "focus_sessions") triggered = (state.stats?.focusSessions || 0) >= tc.value;
    if (tc.type === "perfect_day") triggered = !!state.lastPerfectDay;
    if (tc.type === "time_of_day") triggered = new Date().getHours() < (tc.beforeHour ?? 6);
```

- [ ] **Step 4: Locale-Keys `quests.hidden.<id>.{title,desc,discoveryMsg}` in de.js + en.js** für alle 13 IDs anlegen (bestehende 5 Texte übernehmen + 8 neue).

- [ ] **Step 5: Tests laufen — GRÜN**

Run: `npm run test:hidden && npm run validate:quests`
Expected: PASS — neue Trigger feuern, `quests.hidden` DE/EN-Parität ok.

- [ ] **Step 6: Commit**

```bash
git add data/helpers.js data/locales/de.js data/locales/en.js hooks/useGameState.jsx scripts/test-hidden.mjs
git commit -m "feat: hidden quests 5->13 with new trigger types, migrated to i18n"
```

---

## Task 9: Redemption 3 → 5 (bilingual)

**Files:**
- Modify: `data/protocolHelpers.js` (`generateRedemptionQuests`)
- Modify: `data/locales/de.js` + `data/locales/en.js` (`quests.redemption.*`)
- Modify: `hooks/useGameState.jsx:531` (Aufruf mit State/Locale)
- Create: `scripts/test-redemption.mjs`

**Ziel:** 5 Schritte (einer pro Stat str/int/vit/agi/cha), Texte aus i18n. Abschluss-Bedingung bleibt 3 (kein Balance-Eingriff): es werden 5 generiert, `penaltyZone.redemptionLeft` bleibt 3.

- [ ] **Step 1: Logik-Test (failing)**

Create `scripts/test-redemption.mjs`:

```js
import { generateRedemptionQuests } from "../data/protocolHelpers.js";

const qs = generateRedemptionQuests(10, { settings: { language: "de" } });
const cats = qs.map(q => q.category);
const expect = ["str", "int", "vit", "agi", "cha"];
if (qs.length !== 5) { console.error(`erwartet 5, ist ${qs.length}`); process.exit(1); }
if (JSON.stringify(cats) !== JSON.stringify(expect)) { console.error("Kategorien falsch: " + cats); process.exit(1); }
if (qs.some(q => !q.title || q.title.startsWith("quests."))) { console.error("Titel nicht lokalisiert"); process.exit(1); }
console.log("✓ Redemption: 5 Stats, lokalisiert");
```

- [ ] **Step 2: Test laufen — ROT**

Run: `npm run test:redemption`
Expected: FAIL — heute 3 Einträge, hardcodierte DE-Titel, neue Signatur `(level, state)` ignoriert.

- [ ] **Step 3: `generateRedemptionQuests` umbauen**

```js
import { translate, getStateLocale } from "./i18n.js";

export function generateRedemptionQuests(playerLevel, state = null) {
  const locale = getStateLocale(state);
  const steps = [
    { category: "str" }, { category: "int" }, { category: "vit" }, { category: "agi" }, { category: "cha" },
  ];
  return steps.map((t, i) => ({
    id: genId(),
    title: translate(locale, `quests.redemption.${i + 1}.title`),
    desc: translate(locale, `quests.redemption.${i + 1}.desc`),
    category: t.category,
    difficulty: "hard",
    type: "redemption",
    isSystem: true,
    isRedemption: true,
    createdAt: getToday(),
    createdAtMs: Date.now(),
    xpMult: 1.5,
    regressionStep: i + 1,
  }));
}
```

- [ ] **Step 4: Locale-Keys `quests.redemption.1..5.{title,desc}`** in de.js (bestehende 3 Texte als 1-3 übernehmen, AGI=4 / CHA=5 neu) + en.js spiegeln.

- [ ] **Step 5: Aufruf anpassen** — in `hooks/useGameState.jsx` (Z531) `generateRedemptionQuests(s.level || 1)` → `generateRedemptionQuests(s.level || 1, s)`.

- [ ] **Step 6: Tests — GRÜN**

Run: `npm run test:redemption && npm run validate:quests`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add data/protocolHelpers.js data/locales/de.js data/locales/en.js hooks/useGameState.jsx scripts/test-redemption.mjs
git commit -m "feat: redemption quests 3->5 (all stats), migrated to i18n"
```

---

## Task 10: Seasonal/Weekly-Ausbau (bilingual)

**Files:**
- Modify: `data/protocolHelpers.js` (`generateSeasonalQuests`)
- Modify: `data/locales/de.js` + `data/locales/en.js` (`quests.seasonal.*`)

**Ziel:** Pro Season von 2 → 4-5 Templates, Texte aus i18n. Kategorien/Difficulty pro Eintrag bleiben im Code (nur Titel lokalisiert).

- [ ] **Step 1: `generateSeasonalQuests` umbauen** — Struktur behält `category`/`difficulty` im Code, Titel via Locale:

```js
import { translate, getStateLocale } from "./i18n.js";

export function generateSeasonalQuests(seasonKey, state = null) {
  const locale = getStateLocale(state);
  const SEASON_MAP = {
    frost:  [{ c: "vit", d: "hard" }, { c: "str", d: "normal" }, { c: "vit", d: "normal" }, { c: "int", d: "hard" }],
    spring: [{ c: "vit", d: "boss" }, { c: "int", d: "hard" }, { c: "cha", d: "normal" }, { c: "agi", d: "normal" }],
    inferno:[{ c: "str", d: "boss" }, { c: "str", d: "hard" }, { c: "vit", d: "hard" }, { c: "agi", d: "normal" }],
    redgate:[{ c: "int", d: "hard" }, { c: "int", d: "normal" }, { c: "agi", d: "hard" }, { c: "cha", d: "normal" }],
  };
  const templates = SEASON_MAP[seasonKey] || SEASON_MAP.frost;
  return templates.map((t, i) => ({
    id: genId(),
    title: translate(locale, `quests.seasonal.${seasonKey}.${i + 1}.title`),
    category: t.c,
    difficulty: t.d,
    type: "weekly",
    isSystem: true,
    isSeasonal: true,
    createdAt: getToday(),
    createdAtMs: Date.now(),
  }));
}
```

- [ ] **Step 2: Locale-Keys `quests.seasonal.<season>.<n>.title`** für alle 4 Seasons × 4 = 16 Keys in de.js (bestehende 8 Titel übernehmen + 8 neu) + en.js spiegeln.

- [ ] **Step 3: Aufrufstelle prüfen** — `generateSeasonalQuests`-Aufruf in `hooks/useGameState.jsx` finden (`grep`) und State/Locale-Arg `…(seasonKey, s)` ergänzen.

- [ ] **Step 4: Validierung — GRÜN**

Run: `npm run validate:quests`
Expected: PASS — `quests.seasonal` DE/EN-Parität ok.

- [ ] **Step 5: Commit**

```bash
git add data/protocolHelpers.js data/locales/de.js data/locales/en.js hooks/useGameState.jsx
git commit -m "feat: expand seasonal/weekly quests to ~16 (bilingual, i18n)"
```

---

## Task 11: „Operationen" (benannte Missionen)

**Files:**
- Modify: `data/questPool.js` (neuer `OPERATIONS`-Export am Dateiende)
- Modify: `data/localizedQuestPool.js` (EN-Overrides für Operations)
- Modify: `data/locales/de.js` + `data/locales/en.js` (`quests.operations.*` — optional, falls Texte über Locale statt EN_OVERRIDES)
- Modify: `data/helpers.js` (`generateChainedQuest` erweitern: aus Operation-Template Schritte erzeugen)

**Ziel:** Mehrstufige, benannte Missionen mit festen Schritten + Story-Rahmen, bilingual, über bestehenden `chained`-Mechanismus (Multiplikator `1 + (step-1)*0.25`).

- [ ] **Step 1: `OPERATIONS`-Datenstruktur anlegen** in `data/questPool.js`:

```js
export const OPERATIONS = [
  {
    id: "op_dawn_disciplin", title: "Operation: Morgendämmerung", category: "agi",
    desc: "Eine 3-stufige Mission zur Schmiedung eiserner Morgenroutine.",
    steps: [
      { difficulty: "normal", title: "Tag 1: Aufstehen vor 6 Uhr, kein Handy in der ersten Stunde" },
      { difficulty: "normal", title: "Tag 2: 20 Min Bewegung direkt nach dem Aufwachen" },
      { difficulty: "hard",   title: "Tag 3: 60 Min Deep Work vor 9 Uhr abschließen" },
    ],
  },
  // … weitere 4-6 Operationen über verschiedene Stats
];
```

- [ ] **Step 2: EN-Overrides** für jede Operation (`title`, `desc`, `steps[].title`) in `localizedQuestPool.js` (analog `EN_OVERRIDES`, neuer Export `OPERATION_EN_OVERRIDES` + `localizeOperation(op, locale)`-Funktion nach Vorbild `localizeQuestTemplate`).

- [ ] **Step 3: `generateChainedQuest` erweitern** — Overload, der aus einer Operation den nächsten Schritt als `chained`-Quest erzeugt (Titel = lokalisierter Step-Titel, `category` aus Operation, `chainStep`/`chainTotal` aus `steps.length`). Bestehende dynamische Signatur unverändert lassen (additive Funktion `generateOperationStep(op, step, locale)`).

- [ ] **Step 4: `validate-quests.mjs` erweitern** — Operations-Integrität prüfen (eindeutige `op_*`-IDs, valid category, `steps.length>=2`, EN-Override vorhanden). `quests.operations`-Parität greift bereits (Task 1, falls Locale-Variante genutzt).

- [ ] **Step 5: Validierung — GRÜN**

Run: `npm run validate:quests`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/questPool.js data/localizedQuestPool.js data/helpers.js data/locales/de.js data/locales/en.js scripts/validate-quests.mjs
git commit -m "feat: add named multi-step Operations (missions) over chained mechanic (bilingual)"
```

---

## Task 12: Gesamt-Verifikation

**Files:** keine (nur Ausführung)

- [ ] **Step 1: Alle Validierungen**

Run: `npm run validate:quests && npm run test:emergency && npm run test:hidden && npm run test:redemption`
Expected: alle PASS.

- [ ] **Step 2: Build prüft Importe**

Run: `npm run build`
Expected: Vite-Build ohne Fehler (keine Syntaxfehler/Tippfehler in den geänderten Datendateien).

- [ ] **Step 3: Manuelle UI-Verifikation (Dev-Server)**

Dev-Server starten, Dashboard öffnen. Prüfen:
- Neue Quests erscheinen im Quest-Board (auf höherem Level mehrere neue sichtbar).
- Sprache auf English umstellen → Quest-Titel/Beschreibungen/SubQuests auf EN.
- Emergency-Quest (ab Level 3) erscheint; bei erneutem Tageswechsel andere Variante.
- Keine `quests.…`-Roh-Keys in der UI (Zeichen für fehlende Übersetzung).

Falls die Login-Wall im Weg ist: lokalen Preview-Workflow aus dem Memory nutzen.

- [ ] **Step 4: Abschluss-Commit (falls noch ungetrackte Hilfsdateien)**

```bash
git status
git add -A && git commit -m "chore: quest expansion verification pass"
```

---

## Self-Review (vom Autor durchgeführt)

- **Spec-Coverage:** Pool-Ausbau (T2-6), Emergency (T7), Hidden (T8), Redemption (T9), Seasonal/Weekly (T10), Operationen (T11), Bilingual+Parität (T1 erzwingt, jeder Task spiegelt EN), Level-Lücke+Endgame (T2-6 Verteilung). ✓
- **Placeholder:** Worked Examples + Schema + maschinelle Count-/Parität-Gates statt Inline-Duplikation aller 75 Texte — bewusst, da Content-Generierung die eigentliche Arbeit ist und das Validierungs-Skript Korrektheit garantiert.
- **Typ-Konsistenz:** `templateId`-Format `emergency_<key>`, `lastEmergencyTemplateId`, `generateRedemptionQuests(level, state)`, `generateSeasonalQuests(seasonKey, state)` durchgängig.
- **Risiko:** `qp_cha_04` trailing-Komma (T6 Step 1 markiert); Hidden-Discovery-Anzeige muss Locale aus State ziehen (T8 Step 3).
