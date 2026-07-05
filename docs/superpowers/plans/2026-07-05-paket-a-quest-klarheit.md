# Paket A „Quest-Klarheit" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hidden Quests werden Sofort-Achievements mit Belohnungs-Gutschrift statt leerer Board-Einträge; alle Quest-Erzeuger liefern Beschreibungen; „Geheimnisse"-Galerie im Stats-Bereich.

**Architecture:** Die Trigger-Erkennung (`checkHiddenQuestTriggers`) bleibt; neu ist eine pure Redemption-Funktion in `data/helpers.js`, die von der einzigen Aufrufstelle (`hooks/questActions.js`) und der Boot-Migration (`hooks/useGameState.jsx`) geteilt wird. Belohnung = Basis-XP/Gold der Schwierigkeit × Typ-Multiplikator (`hidden` 3×) × Quest-Multiplikator — deterministisch und pur testbar. UI: bestehendes Entdeckungs-Modal zeigt echte Gutschrift; neue Galerie-Komponente liest `HIDDEN_QUESTS` + `state.hiddenQuests.completed`.

**Tech Stack:** React (JSX, Inline-Styles), reine ES-Module in `data/`, Test-Skripte als `node scripts/*.mjs` (Assertions + `process.exit(1)`), i18n über `data/i18n.js` (`translate(locale, key, params)`) bzw. `useI18n()` in Komponenten.

**Spec:** `docs/superpowers/specs/2026-07-05-quest-klarheit-ziel-quests-design.md`

**WICHTIG:** Nur lokal committen, **nicht pushen** (jeder main-Push cancelt laufende iOS-Builds).

---

## File-Übersicht

- Modify: `data/helpers.js` — `HIDDEN_QUESTS` exportieren, `computeHiddenAchievementReward` + `redeemHiddenAchievements` neu, `generateChainedQuest` desc-Parameter
- Modify: `hooks/questActions.js` — Trigger-Block auf Sofort-Einlösung umstellen (Z. 393–405), Charisma-Folge-Quest desc (Z. 235–242), Chained-Aufruf (Z. 217)
- Modify: `hooks/useGameState.jsx` — Boot-Migration (nach Z. 710), Charisma-Start-Quest desc (~Z. 2385), Chained-Aufruf (Z. 1855)
- Modify: `solo-leveling-v5.jsx` — Hidden-Quest-Modal (Z. 1393–1412): echte Gutschrift + Locale-Keys
- Modify: `data/locales/de.js` + `data/locales/en.js` — neue Keys (`quests.hiddenModal.*`, `quests.hiddenGallery.*`, `questActions.hiddenAchievement`, `questActions.hiddenMigrated`)
- Create: `components/HiddenAchievementsGallery.jsx` — Galerie
- Modify: `components/views/StatsAndShadowViews.jsx` — Galerie in `StatsView` mounten
- Modify: `scripts/test-hidden.mjs` — Redemption-Tests
- Create: `scripts/test-quest-content.mjs` — Content-Audit aller Quest-Erzeuger
- Modify: `package.json` — Skript `test:quest-content`

---

### Task 1: Redemption-Kern in `data/helpers.js` (TDD)

**Files:**
- Modify: `data/helpers.js` (HIDDEN_QUESTS ~Z. 787, danach neue Funktionen)
- Test: `scripts/test-hidden.mjs`

- [ ] **Step 1: Failing Test schreiben** — an `scripts/test-hidden.mjs` unten anhängen (vor der letzten `console.log`-Zeile; beachte: das Skript hat oben `global.Date` gemockt — die neuen Tests sind datumsunabhängig, das stört nicht):

```js
// ── Achievement-Redemption (Paket A) ──
import { redeemHiddenAchievements, computeHiddenAchievementReward, HIDDEN_QUESTS } from "../data/helpers.js";

// Belohnungsformel: normal (15 XP / 25 Gold) × Typ hidden (3×/3×) × Quest-Mult (3×/2×)
const cuts = HIDDEN_QUESTS.find(h => h.id === "hq_thousand_cuts");
const reward = computeHiddenAchievementReward(cuts);
if (reward.xp !== 135) { console.error(`reward.xp expected 135, got ${reward.xp}`); process.exit(1); }
if (reward.gold !== 150) { console.error(`reward.gold expected 150, got ${reward.gold}`); process.exit(1); }

// Redemption: schreibt XP/Gold gut, trägt in completed ein, leert discovered, ist idempotent
const redeemBase = {
  ...base, level: 10, xp: 0, gold: 100, totalGoldEarned: 0,
  hiddenQuests: { discovered: ["hq_thousand_cuts"], completed: [] },
  settings: { language: "de" },
};
const r1 = redeemHiddenAchievements(redeemBase, ["hq_thousand_cuts"]);
if (r1.redeemed.length !== 1) { console.error("redeem should redeem 1"); process.exit(1); }
if (r1.redeemed[0].grantedXp !== 135 || r1.redeemed[0].grantedGold !== 150) { console.error("granted values wrong"); process.exit(1); }
if (!r1.redeemed[0].title || !r1.redeemed[0].desc) { console.error("redeemed must carry locale title+desc"); process.exit(1); }
if (r1.state.gold !== 250) { console.error(`gold expected 250, got ${r1.state.gold}`); process.exit(1); }
if (!r1.state.hiddenQuests.completed.includes("hq_thousand_cuts")) { console.error("not marked completed"); process.exit(1); }
if (r1.state.hiddenQuests.discovered.length !== 0) { console.error("discovered must be emptied"); process.exit(1); }
const r2 = redeemHiddenAchievements(r1.state, ["hq_thousand_cuts"]);
if (r2.redeemed.length !== 0) { console.error("redeem must be idempotent"); process.exit(1); }

console.log("✓ Hidden: Achievement-Redemption korrekt");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npm run test:hidden`
Expected: FAIL — `redeemHiddenAchievements` ist kein Export (SyntaxError/undefined).

- [ ] **Step 3: Implementierung in `data/helpers.js`**

`const HIDDEN_QUESTS` (Z. 787) zu `export const HIDDEN_QUESTS` machen. Sicherstellen, dass oben im File `DIFFICULTIES` und `QUEST_TYPES_CONFIG` aus `./gameData.js` importiert sind (Import ergänzen, falls nicht vorhanden — `calculateLevelUp`, `getStateLocale`, `translate` sind in helpers.js bereits verfügbar/definiert). Direkt nach `checkHiddenQuestTriggers` (Z. 851) einfügen:

```js
// Hidden Quests sind Sofort-Achievements: Belohnung wird bei Entdeckung
// gutgeschrieben, es entsteht kein offener Board-Eintrag mehr.
export function computeHiddenAchievementReward(hq) {
  const diff = DIFFICULTIES.find(d => d.key === hq.difficulty) || DIFFICULTIES[1];
  const typeCfg = QUEST_TYPES_CONFIG.hidden;
  return {
    xp: Math.round(diff.xp * (typeCfg.xpMult || 3) * (hq.reward?.xpMult || 1)),
    gold: Math.round(diff.gold * (typeCfg.goldMult || 3) * (hq.reward?.goldMult || 1)),
  };
}

export function redeemHiddenAchievements(state, hqIds) {
  const locale = getStateLocale(state);
  const alreadyCompleted = new Set(state.hiddenQuests?.completed || []);
  const toRedeem = HIDDEN_QUESTS.filter(hq => hqIds.includes(hq.id) && !alreadyCompleted.has(hq.id));
  const emptied = { discovered: [], completed: [...(state.hiddenQuests?.completed || [])] };
  if (toRedeem.length === 0) {
    return { state: { ...state, hiddenQuests: emptied }, redeemed: [], didLevelUp: false, levelsGained: 0 };
  }
  let next = state;
  let didLevelUp = false;
  let levelsGained = 0;
  const redeemed = [];
  for (const hq of toRedeem) {
    const { xp, gold } = computeHiddenAchievementReward(hq);
    next = calculateLevelUp(next, xp);
    didLevelUp = didLevelUp || !!next._didLevelUp;
    levelsGained += next._levelsGained || 0;
    next = { ...next, gold: (next.gold || 0) + gold, totalGoldEarned: (next.totalGoldEarned || 0) + gold };
    redeemed.push({
      ...hq,
      title: translate(locale, `quests.hidden.${hq.id}.title`) || hq.id,
      desc: translate(locale, `quests.hidden.${hq.id}.desc`) || "",
      discoveryMsg: translate(locale, `quests.hidden.${hq.id}.discoveryMsg`) || "",
      grantedXp: xp,
      grantedGold: gold,
    });
  }
  next = { ...next, hiddenQuests: { discovered: [], completed: [...emptied.completed, ...redeemed.map(r => r.id)] } };
  return { state: next, redeemed, didLevelUp, levelsGained };
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `npm run test:hidden`
Expected: PASS (`✓ Hidden: neue Trigger feuern korrekt` + `✓ Hidden: Achievement-Redemption korrekt`)

- [ ] **Step 5: Commit**

```bash
git add data/helpers.js scripts/test-hidden.mjs
git commit -m "feat(hidden): Achievement-Redemption-Kern (Sofort-Belohnung, pur, idempotent)"
```

---

### Task 2: Trigger-Block in `hooks/questActions.js` auf Sofort-Einlösung umstellen (TDD)

**Files:**
- Modify: `hooks/questActions.js` (Import Z. 8–13, Locals Z. 128–130, Trigger-Block Z. 393–405)
- Modify: `data/locales/de.js` + `data/locales/en.js` (Key `questActions.hiddenAchievement`)
- Test: `scripts/test-hidden.mjs`

- [ ] **Step 1: Failing Integrationstest anhängen** (ans Ende von `scripts/test-hidden.mjs`):

```js
// ── Integration: Quest-Abschluss löst Achievement sofort ein, kein Board-Eintrag ──
import { buildCompleteQuestState } from "../hooks/questActions.js";
import { DEFAULT_STATE } from "../data/defaultState.js";

const passThrough = (s) => ({ nextState: s, newAchievements: [] });
const intState = structuredClone(DEFAULT_STATE);
intState.level = 99; // hidden_quests-Feature sicher freigeschaltet
intState.settings = { ...(intState.settings || {}), language: "de" };
intState.totalQuestsCompleted = 9; // Abschluss Nr. 10 triggert hq_thousand_cuts
intState.hiddenQuests = { discovered: [], completed: [] };
intState.quests = [{ id: "tq1", title: "Testquest", category: "int", difficulty: "easy", type: "side", isSystem: true, createdAt: "2023-01-01", createdAtMs: Date.now() - 3600000 }];
const intResult = buildCompleteQuestState("tq1", intState, passThrough);
if (!intResult) { console.error("buildCompleteQuestState returned null"); process.exit(1); }
if (intResult.nextState.quests.some(q => q.type === "hidden")) { console.error("hidden board entry must not be created"); process.exit(1); }
if (!intResult.nextState.hiddenQuests.completed.includes("hq_thousand_cuts")) { console.error("achievement not completed"); process.exit(1); }
if (intResult.nextState.hiddenQuests.discovered.length !== 0) { console.error("discovered must stay empty"); process.exit(1); }
const cutsRedeemed = intResult.newlyDiscoveredHQ.find(h => h.id === "hq_thousand_cuts");
if (!cutsRedeemed || !cutsRedeemed.grantedXp || !cutsRedeemed.grantedGold) { console.error("newlyDiscoveredHQ must carry granted rewards"); process.exit(1); }
console.log("✓ Hidden: Integration Sofort-Einlösung korrekt");
```

Hinweis: Das Skript mockt weiter oben `global.Date` auf Samstag 00:00 UTC — dadurch können zusätzlich `hq_night_owl`/`hq_weekend_warrior` mit einlösen. Die Assertions oben prüfen deshalb gezielt per `find`/`includes` statt auf Array-Längen.

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npm run test:hidden`
Expected: FAIL — `hidden board entry must not be created` (alter Code legt Board-Quest an).

- [ ] **Step 3: Umbau in `hooks/questActions.js`**

(a) Import Z. 8–13 erweitern: `redeemHiddenAchievements` zur Liste aus `'../data/helpers.js'` hinzufügen.

(b) Z. 128–130 von `const` auf `let` ändern:

```js
  let next = calculateLevelUp(state, xpGain);   // war schon let
  let didLevelUp = next._didLevelUp;
  let earnedPoints = next._levelsGained;
  let newLevel = next.level;
```

(c) Trigger-Block Z. 393–405 komplett ersetzen:

```js
  // Hidden quest triggers → Sofort-Achievements (kein Board-Eintrag)
  const hqCandidates = isFeatureUnlocked('hidden_quests', next.level) ? checkHiddenQuestTriggers(next) : [];
  let newlyDiscoveredHQ = [];
  if (hqCandidates.length > 0) {
    const redemption = redeemHiddenAchievements(next, hqCandidates.map(hq => hq.id));
    next = redemption.state;
    newlyDiscoveredHQ = redemption.redeemed;
    didLevelUp = didLevelUp || redemption.didLevelUp;
    earnedPoints = (earnedPoints || 0) + redemption.levelsGained;
    newLevel = next.level;
    newlyDiscoveredHQ.forEach(hq => notifications.push({
      msg: ltState(state, "questActions.hiddenAchievement", { title: hq.title, xp: hq.grantedXp, gold: hq.grantedGold }),
      type: "named",
    }));
  }
```

Der Legacy-Zweig `if (quest.type === "hidden")` (Z. 271–277) bleibt vorerst als Sicherheitsnetz für noch nicht migrierte Boards bestehen (Entfernung nach Migrationsphase).

(d) Locale-Keys ergänzen — `data/locales/de.js`, im `questActions`-Objekt neben `hiddenCompleted` (Z. 667):

```js
    hiddenAchievement: "Verborgener Erfolg freigeschaltet: {title} — +{xp} XP, +{gold} Gold!",
```

`data/locales/en.js`, gleiche Stelle im `questActions`-Objekt:

```js
    hiddenAchievement: "Hidden achievement unlocked: {title} — +{xp} XP, +{gold} gold!",
```

- [ ] **Step 4: Tests laufen lassen — müssen bestehen**

Run: `npm run test:hidden`
Expected: PASS, alle vier `✓`-Zeilen.

- [ ] **Step 5: Commit**

```bash
git add hooks/questActions.js data/locales/de.js data/locales/en.js scripts/test-hidden.mjs
git commit -m "feat(hidden): Trigger loest Achievements sofort ein statt leerer Board-Quests"
```

---

### Task 3: Boot-Migration in `hooks/useGameState.jsx`

**Files:**
- Modify: `hooks/useGameState.jsx` (Import ~Z. 14–19, Boot-Block Z. 710)
- Modify: `data/locales/de.js` + `en.js` (Key `questActions.hiddenMigrated`)
- Test: `scripts/test-hidden.mjs` (Migrationslogik ist `redeemHiddenAchievements`, bereits getestet — hier nur Verdrahtung)

- [ ] **Step 1: Import ergänzen** — in der Import-Liste aus `'../data/constants'` (Z. 14–19) `redeemHiddenAchievements` ergänzen. Prüfen, ob `data/constants.jsx` helpers re-exportiert (`export * from './helpers.js'` o. ä.); falls es eine explizite Export-Liste ist, `redeemHiddenAchievements` dort mit aufnehmen.

- [ ] **Step 2: Migrationsblock einbauen** — Z. 710 (`if (!s.hiddenQuests) ...`) ersetzen durch:

```js
          if (!s.hiddenQuests) s.hiddenQuests = { discovered: [], completed: [] };
          // MIGRATION (07/2026): Hidden Quests sind Sofort-Achievements.
          // Alte offene Board-Eintraege und liegengebliebene discovered-IDs einmalig einloesen.
          const legacyHiddenBoard = (s.quests || []).filter(q => q.type === "hidden");
          const legacyHiddenIds = [...new Set([
            ...legacyHiddenBoard.map(q => q.hiddenId || q.id),
            ...(s.hiddenQuests.discovered || []),
          ])].filter(id => !(s.hiddenQuests.completed || []).includes(id));
          if (legacyHiddenBoard.length > 0 || legacyHiddenIds.length > 0) {
            s.quests = (s.quests || []).filter(q => q.type !== "hidden");
            const redemption = redeemHiddenAchievements(s, legacyHiddenIds);
            Object.assign(s, redemption.state);
            if (redemption.redeemed.length > 0) {
              const migratedCount = redemption.redeemed.length;
              setTimeout(() => notify(
                translate(getStateLocale(s), "questActions.hiddenMigrated", { count: migratedCount }),
                "named"
              ), 1500);
            }
          }
```

Falls `notify`/`translate`/`getStateLocale` an dieser Stelle nicht im Scope sind (der Block liegt im `onAuthStateChanged`-Boot-Pfad desselben Hooks; `notify` wird z. B. in Z. 1161 verwendet, `translate`/`getStateLocale` ggf. als Import ergänzen aus `'../data/i18n.js'`): Imports ergänzen — **nicht** die Meldung weglassen.

- [ ] **Step 3: Build prüfen**

Run: `npm run build`
Expected: Build grün (Vite + admin-dashboard).

- [ ] **Step 4: Commit**

```bash
git add hooks/useGameState.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(hidden): Boot-Migration loest Alt-Eintraege als Achievements ein"
```

---

### Task 4: Entdeckungs-Modal zeigt echte Gutschrift

**Files:**
- Modify: `solo-leveling-v5.jsx` (Modal Z. 1393–1412; `tr` aus `useI18n()` ist in dieser Komponente ab Z. 338 verfügbar)
- Modify: `data/locales/de.js` + `en.js` (neuer Block `quests.hiddenModal`)

- [ ] **Step 1: Locale-Keys anlegen** — in `data/locales/de.js` innerhalb von `quests` als Geschwister von `hidden:` (Z. 411):

```js
    hiddenModal: {
      heading: "VERBORGENER ERFOLG FREIGESCHALTET",
      xpGained: "XP ERHALTEN",
      goldGained: "GOLD ERHALTEN",
      claim: "BELOHNUNG ANGENOMMEN",
    },
```

`data/locales/en.js`, gleiche Stelle:

```js
    hiddenModal: {
      heading: "HIDDEN ACHIEVEMENT UNLOCKED",
      xpGained: "XP GAINED",
      goldGained: "GOLD GAINED",
      claim: "REWARD CLAIMED",
    },
```

- [ ] **Step 2: Modal umbauen** — Block Z. 1393–1412 lesen und anpassen (Styles/Struktur beibehalten):
  - Etwaige hartkodierte Überschrift über dem Titel → `{tr("quests.hiddenModal.heading")}`.
  - Die zwei Multiplikator-Kacheln (Z. 1405–1406, `XP MULT x{...}` / `GOLD MULT x{...}`) ersetzen durch echte Gutschrift:

```jsx
<div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.hiddenModal.xpGained")}</div><div style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa", fontFamily: "'Cinzel',serif" }}>+{showHiddenQuestModal.grantedXp ?? "?"}</div></div>
<div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.hiddenModal.goldGained")}</div><div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>+{showHiddenQuestModal.grantedGold ?? "?"}</div></div>
```

  - Button-Text Z. 1409 `QUEST ANNEHMEN` → `{tr("quests.hiddenModal.claim")}`.
  - Zusätzlich zur `discoveryMsg` (Z. 1400) die Story-Beschreibung anzeigen, direkt darunter:

```jsx
<p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginTop: 8 }}>{showHiddenQuestModal.desc}</p>
```

- [ ] **Step 3: Build prüfen**

Run: `npm run build`
Expected: Build grün.

- [ ] **Step 4: Commit**

```bash
git add solo-leveling-v5.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(hidden): Entdeckungs-Modal zeigt echte XP/Gold-Gutschrift"
```

---

### Task 5: desc-Durchreichung für Chained- und Charisma-Quests

**Files:**
- Modify: `data/helpers.js` (`generateChainedQuest` Z. 904)
- Modify: `hooks/questActions.js` (Z. 217 Chained-Folge, Z. 235–242 Charisma-Folge)
- Modify: `hooks/useGameState.jsx` (Z. 1855 Chained-Start, ~Z. 2385 Charisma-Start)
- Test: via `scripts/test-quest-content.mjs` (Task 7) + gezielte Asserts hier

- [ ] **Step 1: `generateChainedQuest` erweitern** — Signatur + Feld:

```js
export function generateChainedQuest(baseTitle, category, difficulty, step, totalSteps, desc = "") {
  return {
    id: genId(),
    title: baseTitle,
    desc,
    category, difficulty,
    type: "chained",
    isSystem: true,
    chainStep: step,
    chainTotal: totalSteps,
    chainMultiplier: 1 + (step - 1) * 0.25,
    createdAt: getToday(),
  };
}
```

`generateOperationStep` (Z. 918–928) übergibt weiterhin nachträglich `quest.desc = ...` — funktioniert unverändert.

- [ ] **Step 2: Aufrufstellen anpassen**

`hooks/questActions.js:217`:

```js
      nextStep = generateChainedQuest(quest.title, quest.category, quest.difficulty, quest.chainStep + 1, quest.chainTotal, quest.desc || quest.description || "");
```

`hooks/useGameState.jsx:1855` — dort wird die Kette vom User gestartet; den vorhandenen Aufruf um den desc-Parameter der Quelle erweitern (die umgebende Funktion lesen; falls dort eine Beschreibung des Users existiert, diese durchreichen, sonst `""` — der Audit in Task 7 prüft nur System-Erzeuger mit Datenquelle).

`hooks/questActions.js` Charisma-Folge-Quest (Block Z. 235–242), Feld ergänzen:

```js
          desc: nextStepData.desc || chain.description || "",
```

`hooks/useGameState.jsx` Charisma-Start-Quest (~Z. 2385, Objekt mit `isCharismaQuest: true, charismaStep: 1`), Feld analog ergänzen — der erste Step kommt aus `chain.steps[0]`:

```js
      desc: step.desc || chain.description || "",
```

(Variablennamen an den tatsächlichen Block anpassen — dort existieren bereits Referenzen auf den Step und die Chain.)

- [ ] **Step 3: Build prüfen**

Run: `npm run build`
Expected: Build grün.

- [ ] **Step 4: Commit**

```bash
git add data/helpers.js hooks/questActions.js hooks/useGameState.jsx
git commit -m "fix(quests): Chained- und Charisma-Quests reichen Beschreibung durch"
```

---

### Task 6: „Geheimnisse"-Galerie im Stats-Bereich

**Files:**
- Create: `components/HiddenAchievementsGallery.jsx`
- Modify: `components/views/StatsAndShadowViews.jsx` (`StatsView`, Z. 13–120: am Ende des JSX mounten)
- Modify: `data/locales/de.js` + `en.js` (Block `quests.hiddenGallery`)

- [ ] **Step 1: Locale-Keys** — `de.js`, neben `hiddenModal` aus Task 4:

```js
    hiddenGallery: {
      title: "GEHEIMNISSE",
      subtitle: "Verborgene Erfolge des Systems",
      progress: "{found}/{total} entdeckt",
      locked: "???",
      lockedHint: "Noch nicht entdeckt",
    },
```

`en.js`:

```js
    hiddenGallery: {
      title: "SECRETS",
      subtitle: "Hidden achievements of the System",
      progress: "{found}/{total} discovered",
      locked: "???",
      lockedHint: "Not yet discovered",
    },
```

- [ ] **Step 2: Komponente erstellen** — `components/HiddenAchievementsGallery.jsx` (minimal-luxe, kein Neon; Stilmittel wie im Modal: Cinzel-Überschriften, JetBrains-Mono-Labels, dunkle Karten):

```jsx
import React from "react";
import { HIDDEN_QUESTS, computeHiddenAchievementReward } from "../data/helpers.js";
import { CATEGORIES } from "../data/gameData.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

// „Geheimnisse"-Galerie: eingelöste Hidden-Achievements mit Story-Text,
// unentdeckte als ???-Silhouette mit Kategorie-Hinweis (Trigger bleibt geheim).
export default function HiddenAchievementsGallery({ state }) {
  const { t } = useI18n();
  const completed = new Set(state.hiddenQuests?.completed || []);
  const found = HIDDEN_QUESTS.filter(hq => completed.has(hq.id)).length;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>{t("quests.hiddenGallery.title")}</h3>
        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t("quests.hiddenGallery.progress", { found, total: HIDDEN_QUESTS.length })}</span>
      </div>
      <p style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>{t("quests.hiddenGallery.subtitle")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {HIDDEN_QUESTS.map(hq => {
          const isFound = completed.has(hq.id);
          const cat = CATEGORIES.find(c => c.key === hq.category);
          const reward = computeHiddenAchievementReward(hq);
          return (
            <div key={hq.id} style={{
              borderRadius: 14, padding: "12px 14px", minHeight: 86,
              background: isFound ? "rgba(99,102,241,0.07)" : "rgba(15,15,30,0.6)",
              border: `1px solid ${isFound ? "#6366f144" : "rgba(100,116,139,0.15)"}`,
            }}>
              {isFound ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#c7d2fe", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>{t(`quests.hidden.${hq.id}.title`)}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5, marginBottom: 6 }}>{t(`quests.hidden.${hq.id}.desc`)}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>+{reward.xp} XP · +{reward.gold} GOLD</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>{t("quests.hiddenGallery.locked")}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{t("quests.hiddenGallery.lockedHint")}</div>
                  {cat && <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>{cat.stat}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Hinweis: `useI18n`-`t` muss Parameter unterstützen (`t(key, params)`); prüfen in `components/i18n/I18nProvider.jsx` — falls die Signatur anders ist, `translate(locale, key, params)` aus `../data/i18n.js` mit `locale` aus `useI18n()` verwenden.

- [ ] **Step 3: In StatsView mounten** — `components/views/StatsAndShadowViews.jsx`: `StatsView` (Z. 13) lesen, am Ende des zurückgegebenen JSX (vor dem schließenden Container) einfügen, gated auf Feature-Unlock:

```jsx
{isFeatureUnlocked('hidden_quests', state.level || 1) && <HiddenAchievementsGallery state={state} />}
```

Imports oben ergänzen:

```js
import HiddenAchievementsGallery from "../HiddenAchievementsGallery.jsx";
import { isFeatureUnlocked } from "../../data/featureUnlocks.js";
```

- [ ] **Step 4: Build + Smoke**

Run: `npm run build`
Expected: Build grün. Danach Smoke-Test via `/run-solo-todo`-Harness: Stats-View rendern, Galerie sichtbar (mit Test-State: 1 completed-Eintrag → Karte aufgedeckt, Rest `???`).

- [ ] **Step 5: Commit**

```bash
git add components/HiddenAchievementsGallery.jsx components/views/StatsAndShadowViews.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(hidden): Geheimnisse-Galerie im Stats-Bereich"
```

---

### Task 7: Content-Audit `scripts/test-quest-content.mjs`

**Files:**
- Create: `scripts/test-quest-content.mjs`
- Modify: `package.json` (Skript `test:quest-content`)

- [ ] **Step 1: Audit-Skript schreiben**

```js
// Audit: Jede vom System erzeugte Quest muss Beschreibung ODER Teilaufgaben haben.
// Verhindert die Rueckkehr von "Titel ohne alles"-Quests (Paket A, Spec 2026-07-05).
import { QUEST_POOL, OPERATIONS } from "../data/questPool.js";
import { getSystemQuestPoolForLocale } from "../data/localizedQuestPool.js";
import { generateEmergencyQuest, generateChainedQuest, generateOperationStep, HIDDEN_QUESTS } from "../data/helpers.js";
import { CHARISMA_CHAINS } from "../data/charismaDungeons.js";
import { translate } from "../data/i18n.js";

let failures = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); failures += 1; };
const hasContent = (q) =>
  Boolean((q.desc && String(q.desc).trim()) || (q.description && String(q.description).trim()) || (Array.isArray(q.subQuests) && q.subQuests.length > 0));

// 1. Statischer Pool (beide Locales)
for (const locale of ["de", "en"]) {
  for (const tpl of getSystemQuestPoolForLocale(locale)) {
    if (!hasContent(tpl)) fail(`Pool[${locale}] ${tpl.id || tpl.title}: kein desc/subQuests`);
  }
}
for (const tpl of QUEST_POOL) {
  if (!hasContent(tpl)) fail(`QUEST_POOL ${tpl.id}: kein desc/subQuests`);
}

// 2. Emergency (Zufallsauswahl -> 100 Ziehungen je Locale decken alle Templates ab)
for (const locale of ["de", "en"]) {
  for (let i = 0; i < 100; i += 1) {
    const q = generateEmergencyQuest(10, locale);
    if (!hasContent(q)) fail(`Emergency[${locale}] ${q.templateId}: kein desc`);
    if (!q.title || !String(q.title).trim()) fail(`Emergency[${locale}] ${q.templateId}: kein title`);
  }
}

// 3. Chained: desc-Parameter kommt an
const chained = generateChainedQuest("Basis", "str", "normal", 2, 3, "Beschreibung der Kette");
if (chained.desc !== "Beschreibung der Kette") fail("generateChainedQuest reicht desc nicht durch");

// 4. Operations: jeder Step hat desc
for (const op of OPERATIONS) {
  for (let step = 1; step <= op.steps.length; step += 1) {
    const q = generateOperationStep(op, step, "de");
    if (!q || !hasContent(q)) fail(`Operation ${op.id} Step ${step}: kein desc`);
  }
}

// 5. Charisma: jeder Step hat desc in den Daten
for (const chain of CHARISMA_CHAINS) {
  for (const step of chain.steps) {
    if (!step.desc || !String(step.desc).trim()) fail(`Charisma ${chain.id} Step ${step.step}: kein desc`);
  }
}

// 6. Hidden Achievements: Locale-Texte vollstaendig (de + en)
for (const locale of ["de", "en"]) {
  for (const hq of HIDDEN_QUESTS) {
    if (!translate(locale, `quests.hidden.${hq.id}.title`)) fail(`Hidden[${locale}] ${hq.id}: title fehlt`);
    if (!translate(locale, `quests.hidden.${hq.id}.desc`)) fail(`Hidden[${locale}] ${hq.id}: desc fehlt`);
    if (!translate(locale, `quests.hidden.${hq.id}.discoveryMsg`)) fail(`Hidden[${locale}] ${hq.id}: discoveryMsg fehlt`);
  }
}

if (failures > 0) { console.error(`${failures} Quest-Content-Verstoesse`); process.exit(1); }
console.log("✓ Quest-Content: alle Erzeuger liefern Beschreibung oder Teilaufgaben");
```

Falls `OPERATIONS` nicht aus `data/questPool.js` exportiert wird (Import prüfen — `hooks/questActions.js:14` importiert es von dort, sollte also passen), Importpfad entsprechend korrigieren.

- [ ] **Step 2: npm-Skript ergänzen** — `package.json`, in `scripts` neben `test:hidden`:

```json
    "test:quest-content": "node scripts/test-quest-content.mjs",
```

- [ ] **Step 3: Laufen lassen**

Run: `npm run test:quest-content`
Expected: PASS (`✓ Quest-Content: ...`). Falls Verstöße auftauchen (z. B. Pool-Template ohne desc): die betroffenen Datensätze fixen — das ist Zweck des Audits — und erneut laufen lassen.

- [ ] **Step 4: Commit**

```bash
git add scripts/test-quest-content.mjs package.json
git commit -m "test(quests): Content-Audit gegen Titel-ohne-alles-Quests"
```

---

### Task 8: Gesamtverifikation

**Files:** keine neuen Änderungen (nur Verifikation; Fixes falls rot)

- [ ] **Step 1: Alle Test-Skripte laufen lassen**

Run (PowerShell):

```powershell
npm run test:hidden; npm run test:quest-content; npm run test:emergency; npm run test:redemption; npm run test:streak; npm run test:system-mark; npm run test:state-merge; npm run test:quest-utils; npm run test:quest-planning; npm run test:quest-verification; npm run test:free-limits; npm run validate:quests
```

Expected: alle `✓`, Exit-Code 0 überall.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: grün.

- [ ] **Step 3: Smoke-Test im Harness** — via `/run-solo-todo`: App booten mit Test-State, der (a) eine offene Legacy-Hidden-Quest im Board enthält → nach Boot verschwunden + Toast + Galerie zeigt sie als entdeckt; (b) 9 abgeschlossene Quests → 10. abschließen → Modal mit echter XP/Gold-Anzeige erscheint, kein neuer Board-Eintrag.

- [ ] **Step 4: Abschluss-Commit (falls Smoke-Fixes nötig waren) — NICHT pushen**

```bash
git add -A
git commit -m "polish(hidden): Smoke-Test-Fixes Paket A"
```

---

## Self-Review (gegen Spec-Abschnitt „Paket A")

- Hidden → Sofort-Achievement + Modal mit Belohnung: Tasks 1, 2, 4 ✓
- Migration (Board-Einträge + verwaiste discovered, idempotent): Task 3 + Idempotenz-Test Task 1 ✓
- Sammel-Galerie mit ???-Silhouetten: Task 6 ✓
- Chained-Desc (+ gefundene Charisma-Lücke, gleiche Bug-Klasse): Task 5 ✓
- Test-Audit `test-quest-content.mjs`: Task 7 ✓
- Legacy-Completion-Zweig bleibt (Spec: „bleibt für Migrationsphase erhalten"): Task 2 Step 3(c) ✓
