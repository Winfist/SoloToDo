# Quest-Schmiede 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Quest-Schmiede wird vom stillen Black-Box-Tausch zum sichtbaren Vollbild-Ritual mit echter Auswahl (3 Vorschläge, N wählbar), eigener Board-Sektion und einem PROD-Hotfix gegen Platzhalter-Subquests („Schritt 1/2/3").

**Architecture:** Neues pures Modul `data/forge.js` verwaltet `forge.pending` (Vorschlags-Set mit Tages-Lebenszyklus); das Vollbild-`ForgeRitualModal` rendert Schmieden→Auswahl→Annehmen; `handleForge` und der Pro-Autoflow erzeugen nur noch Pending-Sets statt still zu tauschen; die Annahme läuft über den bestehenden `swapSystemQuests`-Manual-Pfad inkl. Signal-Stempeln. Der Platzhalter-Fix sitzt in Prompt-Beispiel + Validierung (Cloud Functions) und nutzt den bestehenden Strikt-Retry.

**Tech Stack:** Vite + React 18 (JSX, Inline-Styles), Firebase Cloud Functions (CommonJS), reine ES-Module in `data/`, Node-Testskripte in `scripts/` (`node scripts/test-x.mjs`).

**Spec:** `docs/superpowers/specs/2026-07-18-quest-schmiede-2.0-design.md` (ca4970f).

## Global Constraints

- `data/forge.js` bleibt pur (nur `data/`-Imports, kein React/Firebase); alle Helfer defensiv (fehlende Felder = Default, nie werfen).
- de.js mit ECHTEN Umlauten; `functions/` bleibt ASCII-Deutsch (ue/ae/oe); jede neue UI-Zeile in de UND en.
- Design: NEXUS-Ästhetik, dunkel + Indigo-Akzent (#6366f1/#818cf8), KEIN Neon/Glow/Fake-HUD; Muster = bestehende Modals (QuestDetailModal-Overlay, GoalRitualModal-State-Maschine idle/loading/failed).
- Ehrlichkeits-Prinzip: Ritual-Phase 1 dauert exakt so lange wie der echte API-Call — kein Fake-Timer, kein Abbruch-Rennen.
- Slot-Ökonomie unantastbar: Annahme ersetzt System-Dailies 1:1 via `swapSystemQuests` (mode "manual"); nie mehr ersetzen als `countManualForgeTargets`; Questanzahl konstant (keine XP-Inflation).
- Free/Pro unverändert: Earn-it-Gate (Lv3+5 Quests), Free 1 Schmiede-Credit/Tag — Credit stempelt bei erfolgreicher GENERIERUNG (Pending-Set erstellt), Annahme/Auswahl frei; Pro on-demand + „Neu schmieden", serverseitige Rate-Limits.
- Anti-Farming: existiert ein gültiges Pending-Set für heute, wird nicht neu generiert (nur Pro-„Neu schmieden" überschreibt explizit).
- Beide Generierungspfade fordern IMMER 3 Vorschläge an (`generateDailySystemQuestsAsync(3, …)`), Begrenzung erst bei Annahme.
- Tests: Muster `scripts/test-quest-feedback.mjs` (check-Helper, `process.exit(1)`, Abschlusszeile `"✓ test-<name>: alles gruen"`).
- Commits klein und deutsch (`feat(forge): …` / `fix(ai): …`), jeweils am Task-Ende.

---

### Task 1: PROD-Hotfix — Platzhalter-Subquests (Prompt + Validierung)

**Files:**
- Modify: `functions/geminiPrompts.js` (GENERATE_QUESTS_PROMPT: JSON-Beispiele Z. ~210 (en) und ~237 (de) + je 1 neue Regel)
- Modify: `functions/aiQuestValidation.js` (validateGeneratedQuests, Z. 43-61)
- Test: `scripts/test-ai-quest-validation.mjs`, `scripts/test-gemini-prompts.mjs` (erweitern)

**Interfaces:**
- Consumes: bestehendes `normalizeTitle` in aiQuestValidation.js; bestehender Strikt-Retry in `functions/index.js:229-239` (validiert, bei `!verdict.ok` zweiter Versuch mit `strict: true`) — bleibt unangetastet.
- Produces: neuer Reject-Grund-String `"placeholder-subquests"` in `validateGeneratedQuests(...).reasons`.

- [ ] **Step 1: Failing Tests schreiben**

An `scripts/test-ai-quest-validation.mjs` vor der Fehler-Auswertung anfügen (check-Helper existiert dort):

```js
// ── Platzhalter-Subquests (Spec 2026-07-18 §2) ──
const basePlaceholderQuest = {
  title: "Geh 30 Minuten spazieren im Park",
  desc: "Du gehst eine halbe Stunde im Park spazieren. Das macht den Kopf frei und bewegt deinen Koerper.",
  doneWhen: "Fertig, wenn du 30 Minuten gegangen bist.",
};
const placeholderDe = { ...basePlaceholderQuest, subQuests: [{ title: "Schritt 1" }, { title: "Schritt 2" }] };
const placeholderEn = { ...basePlaceholderQuest, subQuests: [{ title: "Step 1" }, { title: "step 3." }] };
const placeholderMixed = { ...basePlaceholderQuest, subQuests: [{ title: "Jacke anziehen und losgehen" }, { title: "Schritt 2" }] };
const placeholderIdentical = { ...basePlaceholderQuest, subQuests: [{ title: "Mach es" }, { title: "  mach   ES " }] };
const realQuest = { ...basePlaceholderQuest, subQuests: [{ title: "Jacke anziehen und losgehen" }, { title: "30 Minuten im Park gehen" }] };

check(validateGeneratedQuests([placeholderDe], { language: "de" }).reasons.includes("placeholder-subquests"), "Schritt 1/2 -> placeholder-subquests");
check(validateGeneratedQuests([placeholderEn], { language: "en" }).reasons.includes("placeholder-subquests"), "Step N (case/Punkt) -> placeholder-subquests");
check(validateGeneratedQuests([placeholderMixed], { language: "de" }).reasons.includes("placeholder-subquests"), "ein Platzhalter reicht fuer Reject");
check(validateGeneratedQuests([placeholderIdentical], { language: "de" }).reasons.includes("placeholder-subquests"), "alle Titel identisch (normalisiert) -> Reject");
check(!validateGeneratedQuests([realQuest], { language: "de" }).reasons.includes("placeholder-subquests"), "echte Subquests passieren");
check(validateGeneratedQuests([realQuest], { language: "de", minCount: 1 }).ok === true, "echte Quest insgesamt ok");
```

An `scripts/test-gemini-prompts.mjs` vor der Fehler-Auswertung:

```js
// ── Prompt-Beispiel darf keine Platzhalter-Subquests mehr enthalten ──
const promptDe = GENERATE_QUESTS_PROMPT({ str: 1 }, 3, "str", [], {}, "de");
const promptEn = GENERATE_QUESTS_PROMPT({ str: 1 }, 3, "str", [], {}, "en");
check(!/Schritt 1/.test(promptDe) && !/Schritt 2/.test(promptDe), "de-Beispiel ohne Schritt-Platzhalter");
check(!/"Step 1"/.test(promptEn) && !/"Step 2"/.test(promptEn), "en-Beispiel ohne Step-Platzhalter");
check(promptDe.includes("NIEMALS generische Platzhalter"), "de-Regel gegen Platzhalter vorhanden");
check(promptEn.includes("NEVER generic placeholders"), "en-Regel gegen Platzhalter vorhanden");
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `node scripts/test-ai-quest-validation.mjs; node scripts/test-gemini-prompts.mjs`
Expected: beide FAIL an den neuen Checks

- [ ] **Step 3: Validierung erweitern**

In `functions/aiQuestValidation.js` oberhalb von `validateGeneratedQuests` ergänzen:

```js
const PLACEHOLDER_SUBQUEST = /^(schritt|step|teil|part)\s*\d+\.?$/i;
```

In der `for (const quest of quests)`-Schleife nach der `missing-subQuests`-Zeile (Z. 57) einfügen:

```js
    const subTitles = (Array.isArray(quest?.subQuests) ? quest.subQuests : [])
      .map((sq) => normalizeTitle(typeof sq === "string" ? sq : sq?.title));
    if (subTitles.some((t) => PLACEHOLDER_SUBQUEST.test(t))) {
      reasons.push("placeholder-subquests");
    } else if (subTitles.length >= 2 && new Set(subTitles).size === 1) {
      reasons.push("placeholder-subquests");
    }
```

- [ ] **Step 4: Prompt-Beispiele + Regel ersetzen**

In `functions/geminiPrompts.js`, deutsches JSON-Beispiel (Z. ~237): den Teil
`"subQuests": [{"title": "Schritt 1"}, {"title": "Schritt 2"}]` ersetzen durch:

```
"subQuests": [{"title": "Laufschuhe anziehen und rausgehen"}, {"title": "25 Minuten im Wohlfuehltempo laufen"}]
```

Englisches Beispiel (Z. ~210): `"subQuests": [{"title": "Step 1"}, {"title": "Step 2"}]` ersetzen durch:

```
"subQuests": [{"title": "Put on your running shoes and head out"}, {"title": "Run 25 minutes at an easy pace"}]
```

Im deutschen REGELN-Block nach der `"subQuests": 2-4 konkrete, ausfuehrbare Schritte.`-Zeile ergänzen:

```
- "subQuests" sind konkrete Handlungen mit eigenem Inhalt - NIEMALS generische Platzhalter wie "Schritt 1" oder "Teil 2".
```

Im englischen RULES-Block nach der `"subQuests": 2-4 concrete executable steps.`-Zeile:

```
- "subQuests" are concrete actions with real content - NEVER generic placeholders like "Step 1" or "Part 2".
```

- [ ] **Step 5: Tests laufen lassen — müssen grün sein**

Run: `node scripts/test-ai-quest-validation.mjs && node scripts/test-gemini-prompts.mjs && node scripts/test-ai-quest-profile.mjs`
Expected: alle grün (dritter Lauf = Regressionscheck)

- [ ] **Step 6: Commit**

```bash
git add functions/aiQuestValidation.js functions/geminiPrompts.js scripts/test-ai-quest-validation.mjs scripts/test-gemini-prompts.mjs
git commit -m "fix(ai): Platzhalter-Subquests — realistisches Prompt-Beispiel + placeholder-subquests-Reject"
```

---

### Task 2: `data/forge.js` — Pending-Set + Annahme (pur)

**Files:**
- Create: `data/forge.js`
- Modify: `data/defaultState.js` (nach dem `coachSignals`-Block)
- Test: `scripts/test-forge.mjs`

**Interfaces:**
- Consumes: `swapSystemQuests(quests, aiQuests, { mode })`, `getSwappedQuests(quests, aiQuests, { mode })`, `countManualForgeTargets(quests)` aus `data/questSwap.js`; `getDailySystemQuestCount(state)` aus `data/questIntensity.js`; `recordQuestsSwapped(state, quests, today)`, `recordQuestsAssigned(state, quests, today)`, `recordUserAction(state, today)` aus `data/signals.js`.
- Produces (spätere Tasks verlassen sich exakt hierauf):
  - `createPendingSet(proposals, { source, today, nowMs }) → { proposals, date, generatedAtMs, source }` — stempelt jedem Vorschlag `origin: "forge"` auf; max 3; source `"manual"|"auto"`.
  - `isPendingSetValid(state, today) → boolean`
  - `clearPendingSet(state) → state`
  - `getSelectableCount(state) → number` = `min(getDailySystemQuestCount(state), countManualForgeTargets(state.quests))`
  - `acceptProposals(state, proposalIds, { today }) → { state, acceptedCount }` — ersetzt exakt die Gewählten (gekappt), stempelt Signale, leert pending, fasst `state.ai` NICHT an.
  - `DEFAULT_FORGE = { pending: null }`

- [ ] **Step 1: Failing Test schreiben**

`scripts/test-forge.mjs` (vollständig):

```js
import {
  DEFAULT_FORGE, createPendingSet, isPendingSetValid, clearPendingSet,
  getSelectableCount, acceptProposals,
} from "../data/forge.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const TODAY = "2026-07-18";
const proposal = (id, title) => ({
  id: `sys_ai_${id}`, title, category: "str", difficulty: "normal", type: "daily",
  isSystem: true, aiGenerated: true, subQuests: [], createdAt: TODAY, dueDate: TODAY,
});
const poolDaily = (id) => ({ id, templateId: `t_${id}`, title: `Pool ${id}`, category: "int", type: "daily", isSystem: true });

// ── createPendingSet ──
const set = createPendingSet([proposal("a", "A"), proposal("b", "B"), proposal("c", "C"), proposal("d", "D")], { source: "manual", today: TODAY, nowMs: 111 });
check(set.proposals.length === 3, "max 3 Vorschlaege");
check(set.proposals.every(p => p.origin === "forge"), "origin forge gestempelt");
check(set.date === TODAY && set.generatedAtMs === 111 && set.source === "manual", "Metadaten gesetzt");

// ── isPendingSetValid / clearPendingSet ──
const withPending = { forge: { pending: set } };
check(isPendingSetValid(withPending, TODAY) === true, "gueltig am selben Tag");
check(isPendingSetValid(withPending, "2026-07-19") === false, "ungueltig am Folgetag");
check(isPendingSetValid({}, TODAY) === false, "kein pending -> ungueltig");
check(isPendingSetValid({ forge: { pending: { ...set, proposals: [] } } }, TODAY) === false, "leere proposals -> ungueltig");
const cleared = clearPendingSet(withPending);
check(cleared.forge.pending === null, "clear leert pending");
check(clearPendingSet({}).forge.pending === null, "clear defensiv ohne forge-Feld");

// ── getSelectableCount: min(Slots, freie Dailies) ──
const baseState = {
  settings: { questIntensity: "baby_gate" }, premium: { tier: "free", status: "inactive" },
  quests: [poolDaily("p1"), poolDaily("p2")],
};
check(getSelectableCount(baseState) === 1, "Free: 1 Slot trotz 2 freier Dailies");
check(getSelectableCount({ ...baseState, quests: [] }) === 0, "keine freien Dailies -> 0");
check(getSelectableCount({ ...baseState, quests: [{ ...poolDaily("p1"), completed: true }] }) === 0, "angefasste Daily zaehlt nicht");

// ── acceptProposals ──
const acceptState = {
  ...baseState,
  quests: [poolDaily("p1"), poolDaily("p2"), { id: "own", title: "Eigene", type: "daily", isSystem: false }],
  forge: { pending: createPendingSet([proposal("a", "A"), proposal("b", "B"), proposal("c", "C")], { source: "manual", today: TODAY, nowMs: 1 }) },
};
const result = acceptProposals(acceptState, ["sys_ai_a"], { today: TODAY });
check(result.acceptedCount === 1, "genau 1 angenommen");
check(result.state.quests.some(q => q.id === "sys_ai_a" && q.origin === "forge"), "Vorschlag im Quest-Log mit origin forge");
check(result.state.quests.length === acceptState.quests.length, "Questanzahl konstant (Ersatz, nie Zusatz)");
check(result.state.quests.some(q => q.id === "own"), "eigene Quest unberuehrt");
check(result.state.forge.pending === null, "pending nach Annahme geleert");
check((result.state.questSignals?.byCategory?.str?.assigned || 0) === 1, "recordQuestsAssigned gestempelt");
check((result.state.sessionSignals?.days?.[TODAY]?.actions || 0) === 1, "recordUserAction gestempelt");
check(result.state.ai === acceptState.ai, "ai-Feld (Credits) unangetastet");

// Kappung: 2 IDs gewaehlt, aber Free-Slot = 1
const twoResult = acceptProposals(acceptState, ["sys_ai_a", "sys_ai_b"], { today: TODAY });
check(twoResult.acceptedCount === 1, "Auswahl auf getSelectableCount gekappt");

// Unbekannte IDs / leere Auswahl -> state unveraendert
const nullResult = acceptProposals(acceptState, ["nope"], { today: TODAY });
check(nullResult.acceptedCount === 0 && nullResult.state === acceptState, "unbekannte IDs -> no-op");
check(acceptProposals(acceptState, [], { today: TODAY }).state === acceptState, "leere Auswahl -> no-op");
check(acceptProposals({}, ["x"], { today: TODAY }).acceptedCount === 0, "kaputter State wirft nicht");

// ── defaultState enthaelt forge ──
import { DEFAULT_STATE } from "../data/defaultState.js";
check(JSON.stringify(DEFAULT_STATE.forge) === JSON.stringify(DEFAULT_FORGE), "DEFAULT_STATE.forge = DEFAULT_FORGE-Shape");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-forge: alles gruen");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-forge.mjs`
Expected: FAIL (`Cannot find module '../data/forge.js'`)

- [ ] **Step 3: `data/forge.js` implementieren**

```js
// forge.js — Pending-Set der Quest-Schmiede (Spec 2026-07-18 §3).
// Pur & defensiv: Vorschlaege entstehen bei der Generierung, leben genau einen
// Tag und werden erst bei der Annahme in echte Board-Quests getauscht.

import { swapSystemQuests, getSwappedQuests, countManualForgeTargets } from "./questSwap.js";
import { getDailySystemQuestCount } from "./questIntensity.js";
import { recordQuestsSwapped, recordQuestsAssigned, recordUserAction } from "./signals.js";

const MAX_PROPOSALS = 3;

export const DEFAULT_FORGE = { pending: null };

export function createPendingSet(proposals, { source = "manual", today = "", nowMs = Date.now() } = {}) {
  const list = (Array.isArray(proposals) ? proposals : [])
    .filter(Boolean)
    .slice(0, MAX_PROPOSALS)
    .map((quest) => ({ ...quest, origin: "forge" }));
  return {
    proposals: list,
    date: String(today || ""),
    generatedAtMs: Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now(),
    source: source === "auto" ? "auto" : "manual",
  };
}

export function isPendingSetValid(state, today) {
  const pending = state?.forge?.pending;
  return Boolean(pending
    && pending.date === String(today || "")
    && Array.isArray(pending.proposals)
    && pending.proposals.length > 0);
}

export function clearPendingSet(state) {
  return { ...(state || {}), forge: { ...(state?.forge || {}), pending: null } };
}

export function getSelectableCount(state) {
  try {
    return Math.max(0, Math.min(
      getDailySystemQuestCount(state || {}),
      countManualForgeTargets(state?.quests || [])
    ));
  } catch {
    return 0;
  }
}

// Annahme: ersetzt exakt die gewaehlten Vorschlaege (gekappt auf Slots/freie
// Dailies) via bestehendem Manual-Swap. Fasst state.ai NICHT an — der
// Schmiede-Credit ist bereits bei der Generierung gestempelt.
export function acceptProposals(state, proposalIds, { today = "" } = {}) {
  try {
    const pending = state?.forge?.pending;
    const wanted = new Set(Array.isArray(proposalIds) ? proposalIds : []);
    const selected = (pending?.proposals || [])
      .filter((quest) => quest && wanted.has(quest.id))
      .slice(0, getSelectableCount(state));
    if (selected.length === 0) return { state: state || {}, acceptedCount: 0 };

    const replaced = getSwappedQuests(state.quests || [], selected, { mode: "manual" });
    let next = { ...state, quests: swapSystemQuests(state.quests || [], selected, { mode: "manual" }) };
    next = recordQuestsSwapped(next, replaced, today);
    next = recordQuestsAssigned(next, selected.slice(0, replaced.length || selected.length), today);
    next = recordUserAction(next, today);
    next = { ...next, forge: { ...(next.forge || {}), pending: null } };
    return { state: next, acceptedCount: selected.length };
  } catch {
    return { state: state || {}, acceptedCount: 0 };
  }
}
```

- [ ] **Step 4: defaultState erweitern**

In `data/defaultState.js` direkt nach dem `coachSignals: { … },`-Block einfügen:

```js
  forge: { pending: null },
```

- [ ] **Step 5: Test laufen lassen — muss grün sein**

Run: `node scripts/test-forge.mjs && node scripts/test-quest-swap.mjs && node scripts/test-signals.mjs`
Expected: alle grün

- [ ] **Step 6: Commit**

```bash
git add data/forge.js data/defaultState.js scripts/test-forge.mjs
git commit -m "feat(forge): Pending-Set-Lebenszyklus + Annahme mit Slot-Kappung und Signal-Stempeln"
```

---

### Task 3: Storage-Merge + Rollover-Verfall

**Files:**
- Modify: `data/storage.js` (Merge-Rückgabe neben `coachSignals`; Normalisierung neben `s.coachSignals = …`)
- Modify: `hooks/useGameState.jsx` (Tagesreset-Block: Verfall)
- Test: `scripts/test-state-merge.mjs` (erweitern)

**Interfaces:**
- Consumes: `DEFAULT_STATE.forge` (Task 2); Merge-Helfer `toFiniteNumber` (existiert in storage.js).
- Produces: `forge` im Merge-Ergebnis — das Pending-Set mit höherem `generatedAtMs` gewinnt KOMPLETT (kein Feld-Merge).

- [ ] **Step 1: Failing Test ergänzen**

An `scripts/test-state-merge.mjs` vor der Fehler-Auswertung (nutzt den dortigen Import `mergeStateProgress` und `check`-Stil):

```js
// ── forge.pending: neueres generatedAtMs gewinnt komplett ──
const forgeOld = { forge: { pending: { proposals: [{ id: "old", title: "Alt", origin: "forge" }], date: "2026-07-18", generatedAtMs: 100, source: "manual" } } };
const forgeNew = { forge: { pending: { proposals: [{ id: "new", title: "Neu", origin: "forge" }], date: "2026-07-18", generatedAtMs: 200, source: "auto" } } };
const forgeMerged = mergeStateProgress(forgeOld, forgeNew);
check(forgeMerged.forge.pending.proposals[0].id === "new", "neueres Set gewinnt komplett");
check(mergeStateProgress(forgeNew, forgeOld).forge.pending.proposals[0].id === "new", "Richtung egal");
check(mergeStateProgress(forgeOld, {}).forge.pending.proposals[0].id === "old", "einseitig fehlend -> vorhandenes Set");
check(mergeStateProgress({}, {}).forge.pending === null, "beidseitig fehlend -> null");
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `node scripts/test-state-merge.mjs`
Expected: FAIL an den forge-Checks

- [ ] **Step 3: Merge + Normalisierung implementieren**

In `data/storage.js`, im Rückgabe-Objekt von `mergeStateProgress` direkt nach dem `coachSignals: { … },`-Block:

```js
    forge: toFiniteNumber(primary.forge?.pending?.generatedAtMs) >= toFiniteNumber(fallback.forge?.pending?.generatedAtMs)
      ? { pending: primary.forge?.pending || fallback.forge?.pending || null }
      : { pending: fallback.forge?.pending || null },
```

In der Normalisierung alter States (direkt nach `s.coachSignals = …`):

```js
  s.forge = { ...DEFAULT_STATE.forge, ...(oldState.forge || {}) };
```

- [ ] **Step 4: Rollover-Verfall**

In `hooks/useGameState.jsx`, im Tagesreset-Block (`if (s.lastActiveDate && s.lastActiveDate !== today)`), direkt neben `s.questReplacements = { date: today, used: 0, replacedKeys: [] };`:

```js
            if (s.forge?.pending && s.forge.pending.date !== today) {
              s.forge = { ...(s.forge || {}), pending: null };
            }
```

- [ ] **Step 5: Tests laufen lassen — müssen grün sein**

Run: `node scripts/test-state-merge.mjs && node scripts/test-forge.mjs && node scripts/test-streak.mjs`
Expected: alle grün

- [ ] **Step 6: Commit**

```bash
git add data/storage.js hooks/useGameState.jsx scripts/test-state-merge.mjs
git commit -m "feat(forge): pending-Merge (neueres Set gewinnt) + Verfall beim Tagesreset"
```

---

### Task 4: `components/ForgeRitualModal.jsx` + i18n

**Files:**
- Create: `components/ForgeRitualModal.jsx`
- Modify: `data/locales/de.js` + `data/locales/en.js` (neuer Namespace `forgeRitual`, im `ai.forge`-Objekt 2 Zusatz-Keys)

**Interfaces:**
- Consumes: `getDossierSummary(state)` aus `data/hunterDossier.js` (Felder: `bestTime {bucket,percent}|null`, `avoidCategories`, `reliableCategories`); i18n-Keys `systemAnalysis.bucket_*` (existieren); `useI18n` aus `./i18n/I18nProvider.jsx`; `CATEGORIES`/`DIFFICULTIES` aus `data/gameData.js` für Chips (wie QuestDetailModal sie nutzt — beim Implementieren dort das Chip-Muster übernehmen).
- Produces: `<ForgeRitualModal theme gameState pendingSet generating failed selectableCount canReforge onGenerate onReforge onAccept(ids) onClose />` — Parent (Task 5) steuert Phasen über Props: `generating=true` → Phase Schmieden; `failed=true` → Fehlerzustand; `pendingSet` gesetzt → Phase Auswahl.

- [ ] **Step 1: Komponente implementieren**

`components/ForgeRitualModal.jsx` (vollständig):

```jsx
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { getDossierSummary } from "../data/hunterDossier.js";

// Schmiede-Ritual (Spec 2026-07-18 §4): Vollbild-Overlay mit ehrlicher
// Schmiede-Phase (Dauer = echter API-Call), Auswahl-Phase (3 Karten, N
// waehlbar) und Annahme. Schliessen verwirft NIE — pending bleibt im State.

const CAT_COLORS = { str: "#ef4444", int: "#3b82f6", vit: "#22c55e", agi: "#f59e0b", cha: "#a855f7" };
const mono = "'JetBrains Mono',monospace";
const sans = "'Outfit',sans-serif";

export default function ForgeRitualModal({
  theme, gameState, pendingSet, generating = false, failed = false,
  selectableCount = 0, canReforge = false,
  onGenerate, onReforge, onAccept, onClose,
}) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const proposals = pendingSet?.proposals || [];
  const phase = generating ? "forging" : failed ? "failed" : proposals.length > 0 ? "choose" : "idle";

  // Sequenz-Zeilen rotieren, solange der echte Call laeuft (kein Fake-Ende).
  useEffect(() => {
    if (phase !== "forging") return undefined;
    setStepIndex(0);
    const timer = setInterval(() => setStepIndex((s) => Math.min(s + 1, 2)), 2500);
    return () => clearInterval(timer);
  }, [phase]);

  // Neues Set -> Auswahl zuruecksetzen.
  useEffect(() => { setSelectedIds([]); setExpandedId(null); }, [pendingSet?.generatedAtMs]);

  const dossierLines = useMemo(() => {
    const dossier = getDossierSummary(gameState || {});
    const lines = [];
    if (dossier.bestTime) lines.push(t("forgeRitual.insightBestTime", { bucket: t(`systemAnalysis.bucket_${dossier.bestTime.bucket}`) }));
    if (dossier.reliableCategories[0]) lines.push(t("forgeRitual.insightReliable", { stat: dossier.reliableCategories[0].toUpperCase() }));
    if (dossier.avoidCategories[0]) lines.push(t("forgeRitual.insightAvoided", { stat: dossier.avoidCategories[0].toUpperCase() }));
    return lines.length > 0 ? lines.slice(0, 3) : [t("forgeRitual.insightCalibrating")];
  }, [gameState, t]);

  const toggle = (id) => setSelectedIds((ids) => {
    if (ids.includes(id)) return ids.filter((x) => x !== id);
    if (ids.length >= selectableCount) return ids;
    return [...ids, id];
  });

  const steps = [t("ai.forge.step1"), t("ai.forge.step2"), t("ai.forge.step3")];

  return ReactDOM.createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,7,15,0.94)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", color: "#e2e8f0", fontFamily: sans }}>
      {/* Kopf */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 10px" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#818cf8", fontFamily: mono, fontWeight: 800 }}>{t("forgeRitual.eyebrow")}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{t("forgeRitual.title")}</div>
        </div>
        <button onClick={onClose} className="press-feedback" aria-label={t("forgeRitual.close")}
          style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)", fontSize: 16, cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 20px" }}>
        {phase === "forging" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 18, textAlign: "center" }}>
            <div className="forge-pulse" style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid #6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>⚒</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono, letterSpacing: 1 }}>{steps[stepIndex]}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {dossierLines.map((line, i) => (
                <div key={i} style={{ fontSize: 11, color: "#94a3b8" }}>▸ {line}</div>
              ))}
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 14, textAlign: "center" }}>
            <div style={{ fontSize: 26 }}>⚠</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", maxWidth: 280, lineHeight: 1.5 }}>{t("ai.forge.failed")}</div>
            <button onClick={onGenerate} className="press-feedback"
              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: 1, fontFamily: mono, cursor: "pointer", background: "linear-gradient(135deg,#6366f133,#6366f11a)", color: "#a5b4fc", border: "1px solid #6366f155" }}>
              {t("forgeRitual.retry")}
            </button>
          </div>
        )}

        {phase === "choose" && (
          <>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
              {selectableCount > 0
                ? t("forgeRitual.chooseHint", { count: selectableCount })
                : t("forgeRitual.noSlots")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {proposals.map((quest) => {
                const selected = selectedIds.includes(quest.id);
                const expanded = expandedId === quest.id;
                const catColor = CAT_COLORS[quest.category] || "#818cf8";
                return (
                  <div key={quest.id} onClick={() => selectableCount > 0 && toggle(quest.id)}
                    style={{ padding: "14px 16px", borderRadius: 14, cursor: selectableCount > 0 ? "pointer" : "default", background: selected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected ? "#6366f1" : "rgba(148,163,184,0.15)"}`, transition: "border-color .15s, background .15s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>{quest.title}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 9, fontFamily: mono, fontWeight: 800, letterSpacing: 1, color: catColor, border: `1px solid ${catColor}55`, borderRadius: 6, padding: "2px 7px" }}>{String(quest.category || "").toUpperCase()}</span>
                          <span style={{ fontSize: 9, fontFamily: mono, letterSpacing: 1, color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 6, padding: "2px 7px" }}>{String(quest.difficulty || "normal").toUpperCase()}</span>
                          {quest.estimatedMinutes ? (
                            <span style={{ fontSize: 9, fontFamily: mono, letterSpacing: 1, color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 6, padding: "2px 7px" }}>{t("forgeRitual.minutes", { m: quest.estimatedMinutes })}</span>
                          ) : null}
                        </div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${selected ? "#6366f1" : "rgba(148,163,184,0.35)"}`, background: selected ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{selected ? "✓" : ""}</div>
                    </div>
                    {quest.desc || quest.description ? (
                      <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>{quest.desc || quest.description}</div>
                    ) : null}
                    {(quest.subQuests || []).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : quest.id); }} className="press-feedback"
                          style={{ fontSize: 10, fontFamily: mono, letterSpacing: 1, color: "#818cf8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          {expanded ? t("forgeRitual.hideSteps") : t("forgeRitual.showSteps", { n: quest.subQuests.length })}
                        </button>
                        {expanded && (
                          <ul style={{ margin: "6px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                            {quest.subQuests.map((sq, i) => (
                              <li key={i} style={{ fontSize: 11, color: "#cbd5e1" }}>{sq.title || sq}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Fuss (nur Auswahl-Phase) */}
      {phase === "choose" && (
        <div style={{ padding: "12px 20px 24px", borderTop: "1px solid rgba(148,163,184,0.12)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10.5, fontFamily: mono, letterSpacing: 1, color: "#94a3b8" }}>
              {t("forgeRitual.chosen", { k: selectedIds.length, n: selectableCount })}
            </span>
            {canReforge && (
              <button onClick={onReforge} className="press-feedback"
                style={{ fontSize: 10.5, fontFamily: mono, letterSpacing: 1, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                ↻ {t("forgeRitual.reforge")}
              </button>
            )}
          </div>
          <button onClick={() => selectedIds.length > 0 && onAccept(selectedIds)} disabled={selectedIds.length === 0} className="press-feedback"
            style={{ padding: "13px 16px", borderRadius: 12, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, fontFamily: mono, cursor: selectedIds.length > 0 ? "pointer" : "default", background: selectedIds.length > 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", color: selectedIds.length > 0 ? "#fff" : "#475569", border: "none" }}>
            {t("forgeRitual.accept")}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: i18n-Keys**

`data/locales/de.js` — neuer Top-Level-Namespace (z.B. nach `questRating`):

```js
  forgeRitual: {
    eyebrow: "SYSTEM-SCHMIEDE",
    title: "Quests werden geschmiedet",
    close: "Schließen",
    retry: "Erneut versuchen",
    chooseHint: "Das System hat 3 Vorschläge geschmiedet. Wähle bis zu {count} für dein Quest-Log — der Rest verfällt um Mitternacht.",
    noSlots: "Heute ist alles erledigt — die Vorschläge verfallen um Mitternacht.",
    chosen: "Gewählt: {k} von {n}",
    accept: "INS QUEST-LOG ÜBERNEHMEN",
    reforge: "Neu schmieden",
    minutes: "{m} MIN",
    showSteps: "{n} Schritte anzeigen",
    hideSteps: "Schritte verbergen",
    insightBestTime: "Beste Aktivzeit: {bucket}",
    insightReliable: "Zuverlässig: {stat}",
    insightAvoided: "Angepasst: weniger {stat}",
    insightCalibrating: "Das System kalibriert sich noch",
  },
```

Im bestehenden `ai.forge`-Objekt (de ~Z. 243) ergänzen:

```js
      ready: "{n} Vorschläge bereit",
      viewCta: "ANSEHEN",
```

`data/locales/en.js` — analog:

```js
  forgeRitual: {
    eyebrow: "SYSTEM FORGE",
    title: "Forging quests",
    close: "Close",
    retry: "Try again",
    chooseHint: "The System forged 3 proposals. Pick up to {count} for your quest log — the rest expires at midnight.",
    noSlots: "Everything is done today — the proposals expire at midnight.",
    chosen: "Chosen: {k} of {n}",
    accept: "ADD TO QUEST LOG",
    reforge: "Reforge",
    minutes: "{m} MIN",
    showSteps: "Show {n} steps",
    hideSteps: "Hide steps",
    insightBestTime: "Peak activity: {bucket}",
    insightReliable: "Reliable: {stat}",
    insightAvoided: "Adjusted: less {stat}",
    insightCalibrating: "The System is still calibrating",
  },
```

und im `ai.forge`-Objekt (en ~Z. 243): `ready: "{n} proposals ready",` + `viewCta: "VIEW",`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Exit 0

- [ ] **Step 4: Commit**

```bash
git add components/ForgeRitualModal.jsx data/locales/de.js data/locales/en.js
git commit -m "feat(forge): Vollbild-Ritual — Schmiede-Phase mit Dossier-Einblick, Auswahl, Annahme"
```

---

### Task 5: Verdrahtung — handleForge, Autoflow, Karte

**Files:**
- Modify: `solo-leveling-v5.jsx` (`handleForge` Z. ~835-869; Autoflow-Effekt Z. ~908-945; Modal-Render neben QuestDetailModal Z. ~1476; QuestForgeCard-Props-Stelle via `forgeStatus` Z. ~1866)
- Modify: `components/QuestForgeCard.jsx` (Pending-Zustand)
- Modify: `components/views/DashboardView.jsx` (Props-Durchreichung der Karte, Z. ~246/994)

**Interfaces:**
- Consumes: `createPendingSet`, `isPendingSetValid`, `getSelectableCount`, `acceptProposals`, `clearPendingSet` (Task 2); `ForgeRitualModal` (Task 4); bestehende `generateDailySystemQuestsAsync`, `applyForgeUsage`, `getForgeStatus`, `getToday`, `persist`, `setState`, `notify`, `premiumStatus`, `geminiAI`.
- Produces: Karte öffnet Ritual; Autoflow erzeugt nur noch Pending-Sets; QuestForgeCard bekommt neue Props `pendingCount` (number) und unverändert `onForge`.

- [ ] **Step 1: handleForge zum Ritual-Opener umbauen**

In `solo-leveling-v5.jsx`: neuen UI-State neben den anderen Modal-States anlegen (`const [showForgeRitual, setShowForgeRitual] = useState(false);` — `forgePhase`/`forgeStep` bleiben für die Generierung). Imports oben ergänzen:

```js
import ForgeRitualModal from './components/ForgeRitualModal.jsx';
import { createPendingSet, isPendingSetValid, getSelectableCount, acceptProposals } from './data/forge.js';
```

`handleForge` (Z. 835-869) ersetzen durch:

```js
  const runForgeGeneration = useCallback(async ({ force = false } = {}) => {
    if (forgePhase === "loading") return;
    if (!force && isPendingSetValid(state, getToday())) return; // Anti-Farming: Set existiert
    if (!state?.ai?.enabled || geminiAI.isRateLimited()) { setForgePhase("failed"); return; }
    setForgePhase("loading");
    try {
      const { generateDailySystemQuestsAsync } = await import('./data/helpers.js');
      // Immer 3 anfordern — Auswahlbreite; begrenzt wird erst bei der Annahme.
      const aiQuests = await generateDailySystemQuestsAsync(3, state, geminiAI.generateQuests);
      if (!aiQuests?.length || !aiQuests.some(q => q.aiGenerated)) { setForgePhase("failed"); return; }
      setState(currentState => {
        const pending = createPendingSet(aiQuests, { source: "manual", today: getToday(), nowMs: Date.now() });
        // Credit stempelt bei erfolgreicher GENERIERUNG (Spec §7), nicht beim Swap.
        const next = applyForgeUsage({ ...currentState, forge: { ...(currentState.forge || {}), pending } }, { premiumActive: premiumStatus?.active, today: getToday() });
        persist(next);
        return next;
      });
      setForgePhase("idle");
    } catch {
      setForgePhase("failed");
    }
  }, [forgePhase, state, premiumStatus?.active, geminiAI, persist]);

  const handleForge = useCallback(() => {
    if (!forgeStatus.allowed && !isPendingSetValid(state, getToday())) return;
    setShowForgeRitual(true);
    if (!isPendingSetValid(state, getToday())) runForgeGeneration();
  }, [forgeStatus.allowed, state, runForgeGeneration]);

  const handleAcceptProposals = useCallback((proposalIds) => {
    setState(currentState => {
      const { state: next, acceptedCount } = acceptProposals(currentState, proposalIds, { today: getToday() });
      if (acceptedCount === 0) return currentState;
      persist(next);
      setTimeout(() => notify(tr("ai.recalibrated"), "success"), 200);
      return next;
    });
    setShowForgeRitual(false);
  }, [persist, notify, tr]);
```

- [ ] **Step 2: Ritual rendern**

Neben dem QuestDetailModal-Render (Z. ~1476) einfügen:

```jsx
            {/* SCHMIEDE-RITUAL */}
            {showForgeRitual && (
              <ForgeRitualModal
                theme={theme}
                gameState={state}
                pendingSet={isPendingSetValid(state, getToday()) ? state.forge.pending : null}
                generating={forgePhase === "loading"}
                failed={forgePhase === "failed"}
                selectableCount={getSelectableCount(state)}
                canReforge={Boolean(premiumStatus?.active)}
                onGenerate={() => runForgeGeneration()}
                onReforge={() => runForgeGeneration({ force: true })}
                onAccept={handleAcceptProposals}
                onClose={() => { setShowForgeRitual(false); setForgePhase("idle"); }}
              />
            )}
```

- [ ] **Step 3: Autoflow — vorbereiten statt tauschen**

Im Autoflow-Effekt (Z. ~908-945): den Erfolgs-Block (`setState(currentState => { … canAutoSwapSystemQuests … swapSystemQuests … })`) ersetzen durch:

```js
      const aiQuests = await generateDailySystemQuestsAsync(3, state, geminiAI.generateQuests);
      if (!aiQuests?.length || !aiQuests.some(q => q.aiGenerated)) return; // kein KI-Ergebnis -> Guard NICHT setzen
      setState(currentState => {
        if (isPendingSetValid(currentState, today)) return currentState; // manuell war schneller
        localStorage.setItem(doneKey, today);
        const pending = createPendingSet(aiQuests, { source: "auto", today, nowMs: Date.now() });
        const updated = { ...currentState, forge: { ...(currentState.forge || {}), pending } };
        persist(updated);
        return updated;
      });
```

Die nicht mehr benötigten Imports in diesem Effekt (`canAutoSwapSystemQuests`, `swapSystemQuests`, `getSwappedQuests` sowie die `recordQuestsSwapped/recordQuestsAssigned`-Aufrufe dieses Pfads) entfernen — Signal-Stempel passieren jetzt zentral in `acceptProposals`. Der `getDailySystemQuestCount`-Aufruf in diesem Pfad entfällt (immer 3).

- [ ] **Step 4: Karte mit Pending-Zustand**

`components/QuestForgeCard.jsx` — Props um `pendingCount = 0` erweitern; vor der bestehenden Hint-Logik:

```jsx
  const hasPending = pendingCount > 0;
```

Anzeige-Logik: wenn `hasPending`, ersetzt der Bereitschafts-Zustand alles andere —
Hint-Zeile: `t("ai.forge.ready", { n: pendingCount })`, CTA-Text: `t("ai.forge.viewCta")`, Button enabled (auch wenn `usedToday` — Ansehen ist immer erlaubt), `onForge` bleibt der Klick-Handler. Konkret: `const disabled = phase === "loading" || (!hasPending && (locked || usedToday || noTargets));` und im Button-Label `hasPending ? t("ai.forge.viewCta") : (phase === "loading" ? t("ai.forge.working") : t("ai.forge.cta"))`; Hint analog mit `hasPending`-Zweig zuerst.

In `components/views/DashboardView.jsx`: die Karte (Z. ~994) bekommt `pendingCount={forgePendingCount}` — neue Prop `forgePendingCount` in der Signatur (Z. ~246) ergänzen. In `solo-leveling-v5.jsx` an der DashboardView-Verwendung (Z. ~1866, wo `forgeStatus` übergeben wird): `forgePendingCount={isPendingSetValid(state, getToday()) ? state.forge.pending.proposals.length : 0}`.

- [ ] **Step 5: Tests + Build**

Run: `node scripts/test-forge.mjs && node scripts/test-forge-limits.mjs && npm run build`
Expected: Tests grün, Build Exit 0

- [ ] **Step 6: Commit**

```bash
git add solo-leveling-v5.jsx components/QuestForgeCard.jsx components/views/DashboardView.jsx
git commit -m "feat(forge): Ritual verdrahtet — Generierung im Ritual, Autoflow bereitet vor, Karte zeigt Vorschlaege"
```

---

### Task 6: Board-Sektion „AUS DER SCHMIEDE"

**Files:**
- Modify: `components/views/DashboardView.jsx` (Sektionsbildung Z. ~627-629)
- Modify: `data/locales/de.js` + `data/locales/en.js` (1 Key)

**Interfaces:**
- Consumes: `origin: "forge"` auf angenommenen Quests (Task 2 stempelt es in `createPendingSet`).
- Produces: eigener Board-Block vor dem Loadout.

- [ ] **Step 1: Sektion einfügen**

In `components/views/DashboardView.jsx`, die Zeilen (~627-629)

```js
  const questBoardSections = [
    { key: "loadout", title: locale === "en" ? "YOUR LOADOUT" : "DEIN LOADOUT", color: theme.primary, quests: groupQuestStacks(dashboardLoadout) },
  ].filter(section => section.quests.length > 0);
```

ersetzen durch:

```js
  const forgeLoadout = dashboardLoadout.filter(q => q.origin === "forge");
  const questBoardSections = [
    { key: "forge", title: locale === "en" ? "⚒ FROM THE FORGE" : "⚒ AUS DER SCHMIEDE", color: "#818cf8", quests: groupQuestStacks(forgeLoadout) },
    { key: "loadout", title: locale === "en" ? "YOUR LOADOUT" : "DEIN LOADOUT", color: theme.primary, quests: groupQuestStacks(dashboardLoadout.filter(q => q.origin !== "forge")) },
  ].filter(section => section.quests.length > 0);
```

Beim Implementieren prüfen, wie `questBoardSections` gerendert wird (Sektions-Titel + `color`): Die Forge-Sektion erbt damit automatisch Indigo als Sektionsfarbe. Falls das Rendering pro Sektion einen Container zeichnet, dem Forge-Container zusätzlich einen dezenten Rahmen geben: `border: "1px solid rgba(129,140,248,0.25)", borderRadius: 14, padding: 10` — nur für `section.key === "forge"`. KEIN Glow, keine Animation.

- [ ] **Step 2: Build + Sichtprüfung**

Run: `npm run build`
Expected: Exit 0. (Sichtprüfung folgt im Task-7-Smoke; die Sektionstitel sind bewusst inline lokalisiert wie die Nachbar-Sektion — kein i18n-Key nötig, Step „i18n" entfällt.)

- [ ] **Step 3: Commit**

```bash
git add components/views/DashboardView.jsx
git commit -m "feat(forge): Board-Sektion AUS DER SCHMIEDE fuer angenommene Vorschlaege"
```

---

### Task 7: Finale Verifikation + E2E-Smoke

**Files:**
- Keine neuen; Wegwerf-Harness (untracked, danach löschen).

- [ ] **Step 1: Volle Test-Batterie**

```bash
node scripts/test-forge.mjs && node scripts/test-ai-quest-validation.mjs && node scripts/test-gemini-prompts.mjs && node scripts/test-state-merge.mjs && node scripts/test-quest-swap.mjs && node scripts/test-signals.mjs && node scripts/test-forge-limits.mjs && node scripts/test-hunter-dossier.mjs && node scripts/test-quest-utils.mjs && node scripts/test-streak.mjs && npm run build
```

Expected: alle `alles gruen`/passed, Build Exit 0.

- [ ] **Step 2: E2E-Smoke (Harness-Pfad, `/run-solo-todo`-Muster)**

Wegwerf-Harness `forge-smoke.html`/`forge-smoke.jsx` (Muster `island-preview.*`): mountet `ForgeRitualModal` mit Mock-`gameState` (präpariertes Dossier) und einem Mock-Pending-Set (3 realistische Vorschläge). Prüfen:
1. Phase Schmieden: Sequenz-Zeilen + Dossier-Einblicke sichtbar (Screenshot).
2. Phase Auswahl: 3 Karten, Antippen wählt (max `selectableCount`), Zähler stimmt, Subquests klappen auf (Screenshot).
3. `onAccept` liefert exakt die gewählten IDs; Annahme über `acceptProposals` auf Mock-State: Questanzahl konstant, `origin: "forge"` gesetzt, pending geleert.
4. `selectableCount = 0`: noSlots-Hinweis, kein toter CTA.
5. Harness-Dateien löschen, `git status` sauber.

- [ ] **Step 3: Commit (nur falls Smoke Fixes erzwang)**

```bash
git status --short   # muss leer sein bzw. nur gewollte Fixes zeigen
```

---

## Offene Punkte nach Abschluss (außerhalb dieses Plans)

- **Functions-Deploy für Task 1** (Platzhalter-Hotfix wirkt erst in PROD nach `firebase deploy --only functions` bzw. `npm run deploy`) — PROD generiert seit 18.07. live; Hotfix früh ausliefern.
- **Web-Deploy** via `npm run deploy` (nie `firebase deploy` direkt — Stale-Bundle-Gotcha).
- Ritual auf echtem Gerät ansehen (Portal-Overlay + Safe-Areas iPhone).
