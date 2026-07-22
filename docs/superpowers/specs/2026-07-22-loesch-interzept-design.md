# Lösch-Interzept & deleted-Auswertung — Design

**Datum:** 2026-07-22
**Status:** Entwurf zur Review
**Kontext:** Schwächen-Analyse Quest-/KI-System vom 22.07. — Kernbefund: Löschen ist die stärkste Ablehnung, die ein User ausdrücken kann, und der einzige Feedback-Kanal, aus dem das System nichts lernt.

## 1. Problem

`deleteQuest` ([useGameState.jsx:1451](../../../hooks/useGameState.jsx)) filtert die Quest nur aus dem Array. Folgen:

1. **Kein Signal:** Weder `questSignals` (Template/Kategorie) noch der Negativ-Korpus erfahren von der Löschung. Eine gelöschte System-Quest kann am Folgetag wortgleich wiederkommen.
2. **Signal-Vernichtung:** Eine ignorierte System-Daily erzeugt beim Tagesreset ein `expired`-Signal. Eine gelöschte nicht — sie ist beim Reset weg. Je entschiedener der User ablehnt, desto weniger lernt das System.
3. **Forge trackt, wertet aber nicht:** `reconcileForgeLearning` stempelt `deletedAtMs`, aber `getForgeLearningDossier` ignoriert den `deleted`-Zähler bei der `avoided`-Entscheidung.
4. **Mehrdeutigkeit:** „Im echten Leben schon erledigt" und „kein Interesse" sind heute ununterscheidbar — beides verfälscht Completion-Raten in entgegengesetzte Richtungen.

## 2. Ziele

- Jede Löschung einer System-/KI-Quest erzeugt ein Lernsignal — auch ohne User-Zutun.
- Optionaler 1-Tipp-Grund **ohne Friction**: nicht-blockierend, nach der Löschung, auto-dismiss.
- `deleted` fließt in alle drei Auswertungsebenen: Negativ-Korpus (soft), Template-Cooldowns, Kategorie-Meidung — und in die Forge-Rezept-Meidung.
- „Schon erledigt" wird von Ablehnung getrennt und in einen echten Abschluss umgewandelt.

## 3. Nicht-Ziele

- **Eigene Quests bleiben signal- und toast-frei.** Gleiche Philosophie wie die Feedback-Chips („eigene Aufgaben: nerviger als nützlich", [rewardFlowBuilders.js:300](../../../hooks/rewardFlowBuilders.js)).
- Keine Änderung am Forge-Modell-Kontrakt (`sanitizeForgeModelProfile`): `deleted` bleibt aus dem Prompt draußen; die Auswertung passiert client-seitig in Compiler/Dossier.
- Keine adaptive Intensität, keine Themen-Tags — separate Pakete aus der Analyse.
- Kein Undo-Feature für Löschungen.

## 4. Betrachtete Ansätze

**A) Blockierender Bestätigungs-Dialog vor dem Löschen** („Warum weg?" als Modal).
Verworfen: Friction bei jeder Löschung, widerspricht der Anti-Nerv-Schicht. Bestraft genau die User, die aufräumen wollen.

**B) Nicht-blockierender Post-Delete-Toast mit Grund-Chips** *(gewählt)*.
Löschung passiert sofort (optimistisch), danach erscheint für ~6 s ein Toast mit zwei Chips. Tippen ist optional; Weg-Timen kostet nichts. Neutral-Signal entsteht immer, Grund-Signal nur bei Tipp. Nutzt das bestehende `SystemNotification`-System (das bereits `actionLabel` kennt).

**C) Nur stilles Signal, keine UI.**
Verworfen als Alleinlösung: verliert die wertvollste Unterscheidung („schon erledigt" vs. „kein Interesse"). Ist aber als Fallback in B enthalten — der stille Pfad IST Ansatz C.

## 5. UX-Fluss

```
User löscht System-/KI-Quest (Karten-Menü oder QuestDetailModal)
  │
  ├─ Quest verschwindet sofort (wie heute)
  ├─ Neutral-Signal wird IMMER erfasst (recordQuestDeleted, reason=null)
  │
  └─ Toast erscheint (~6 s, auto-dismiss):
       „‚{Titel}' entfernt."   [ Kein Interesse ]  [ Schon erledigt ]
         │
         ├─ Tipp „Kein Interesse" → Dislike-Upgrade des Signals, Toast → „Verstanden."
         ├─ Tipp „Schon erledigt" → Neutral-Signal zurückgenommen, Quest wird
         │    wiederhergestellt + regulär abgeschlossen (voller Reward-Flow)
         └─ Kein Tipp / Dismiss → Neutral-Signal bleibt (schwaches Negativ)
```

Eigene Quests (weder `isSystem` noch `aiGenerated`/`origin: "forge"`): Verhalten exakt wie heute — löschen, kein Toast, kein Signal. (`forgeLearning` stempelt `deletedAtMs` weiterhin automatisch über `reconcileForgeLearning`, das bleibt unberührt.)

**Mehrfach-Löschungen:** Der Toast enthält den Quest-Titel in der Message (verhindert die Dedupe-Kollision in `notify`, die identische msg+type verschluckt). Es lebt maximal ein Delete-Feedback-Toast; ein neuer ersetzt den alten (dessen Neutral-Signal ist bereits erfasst — verlustfrei).

## 6. Datenmodell & Signal-Semantik

### 6.1 `data/signals.js`

- `templateEntry`: neue Felder `deleted: 0`, `lastDeletedAt: null`.
- `categoryEntry`: neues Feld `deleted: 0`.
- `DEFAULT_QUEST_SIGNALS`: neue Liste `recentDeleted: []` (Cap `RECENT_CAP = 10`, Einträge `{ questId, title, category, date }` — gleiche Form wie `recentDisliked`).
- **Neu `recordQuestDeleted(state, quest, today)`** (defensiv, try/catch wie Geschwister):
  - Guard: nur `quest.isSystem || quest.aiGenerated || quest.origin === "forge"`, sonst State unverändert.
  - Bump `deleted` auf Template + Kategorie, `lastDeletedAt = today` am Template.
  - Push in `recentDeleted`.
- **Neu `applyDeletedQuestDislike(state, questSnapshot, today)`** (Chip „Kein Interesse"):
  - Bump `disliked` + `lastDislikedAt` auf Template + Kategorie.
  - Push in `recentDisliked` (→ landet im **harten** Negativ-Korpus, 28 Tage).
  - Entfernt den passenden `recentDeleted`-Eintrag (kein Doppel-Eintrag in zwei Listen).
- **Neu `revertQuestDeleted(state, questSnapshot)`** (Chip „Schon erledigt"):
  - Dekrement `deleted` auf Template + Kategorie (min 0), entfernt `recentDeleted`-Eintrag.
  - `lastDeletedAt` bleibt stehen (harmlos; nur relevant in Kombination mit `deleted >= 2`).

### 6.2 `hooks/useGameState.jsx`

- `deleteQuest(id)` (Signatur unverändert, Aufrufer unverändert):
  1. Quest per id suchen; nicht gefunden → no-op.
  2. Eigene Quest: Pfad byte-identisch zu heute (nur Filter + persist, keine neuen Aufrufe).
  3. System-/KI-Quest: State persistieren mit Quest + Reminder entfernt, `recordQuestDeleted`, `recordUserAction`; danach Toast auslösen. Notification-Objekt trägt statt Callback ein deklaratives Action-Payload (Muster wie `action.view` heute):
     `action: { kind: "delete_feedback", quest: { id, title, category, templateId, difficulty, type, desc, xpMult, createdAt, createdAtMs, isSystem, aiGenerated, origin, forgeMeta, questDNA, subQuests, dueDate } }`
     — der Snapshot muss reich genug sein, um die Quest für „Schon erledigt" wiederherzustellen und regulär abzuschließen.
- **Neu `resolveDeleteFeedback(questSnapshot, reason)`**:
  - `reason === "not_interested"`: `applyDeletedQuestDislike` + persist. Toast wechselt für ~1,5 s auf den `thanks`-Text (ohne Chips) und schließt dann.
  - `reason === "already_done"`:
    1. Guard: Quest-id darf nicht bereits wieder in `state.quests` existieren (Doppel-Tipp, Race mit Tagesreset).
    2. `revertQuestDeleted` + Quest in `state.quests` re-inserten + persist.
    3. Regulären `completeQuest(questSnapshot.id)`-Pfad aufrufen → voller Reward-Flow. (Bewusst volle XP: identisches Vertrauensniveau wie ein normaler Complete-Tipp. Aus einer Löschung wird ein Erfolgsmoment.)
  - Beide Pfade entfernen den Toast.

Hinweis `forgeLearning`: beim „Schon erledigt"-Pfad trägt das Outcome dann `deletedAtMs` **und** `completedAtMs`. Das ist akzeptiert — die neue `avoided`-Regel (6.5) verlangt `completed === 0` und greift damit korrekt nicht.

### 6.3 Rendering (`solo-leveling-v5.jsx` + `SystemNotification`)

- `SystemNotification` wird um eine Zwei-Chip-Variante erweitert: statt einem `actionLabel` optional `chips: [{ key, label }]` + `onChip(key)`; längere Lebensdauer (~6 s statt Standard) für `kind: "delete_feedback"`.
- Der Renderer in `solo-leveling-v5.jsx` interpretiert `n.action.kind === "delete_feedback"` und dispatcht auf `resolveDeleteFeedback(n.action.quest, key)` — keine Funktionen im Notification-State, konsistent mit dem bestehenden `action.view`-Muster.
- Während `rewardFlowActive` sind Notifications ohnehin ausgeblendet (bestehendes Verhalten, kein Konflikt mit dem Reward-Flow aus „Schon erledigt").

### 6.4 Auswertung: Pool-Pfad

- **`hunterDossier.getTemplateCooldowns`** — neue Blockbedingung:
  `deleted >= 2 && completed === 0 && withinDays(lastDeletedAt, today, COOLDOWN_DAYS)`
  (Zweimal gelöscht, nie abgeschlossen → 14 Tage Pause für dieses Template.)
- **`hunterDossier.getAvoidedCategories`** — neue Oder-Bedingung:
  `deleted >= 4 && deleted > completed`
  (Stille Löschungen brauchen bewusst mehr Volumen als explizite Dislikes — `netDislikes >= 2` bleibt der schnelle Pfad über den „Kein Interesse"-Chip.)
- **`questSimilarity.buildQuestExclusionCorpus`** — neue Quelle:
  `["recent_deleted", state?.questSignals?.recentDeleted]` mit Severity **`soft`** (28-Tage-Fenster wie die anderen Negativ-Quellen).
  Soft = Ranking-Demotion (`soft_duplicate`-Fact im Compiler) statt Hard-Block — wer still löscht, hat vielleicht nur heute keine Zeit. „Kein Interesse" landet via `recentDisliked` weiterhin im Hard-Block.

### 6.5 Auswertung: Forge-Pfad

- **`forgeLearning.getForgeLearningDossier`** — `avoided`-Formel erweitert:
  `explicitPreference === "avoid" || (explicitPreference !== "prefer" && (netDislikes >= 2 || (deleted >= 2 && completed === 0)))`
  Der bereits gezählte, bisher tote `deleted`-Wert wird damit entscheidungsrelevant. `preferred`/`reliable` unverändert.
- `forgeAIProfile.buildLearningSummary`: **keine Änderung** — `deleted` zählt dort bereits als `resolved` und drückt das `completionBand` korrekt.

### 6.6 i18n

Neue Keys in `data/locales` (de mit echten Umlauten gemäß aktueller de.js-Konvention, en analog):
`deleteFeedback.removed` („‚{title}' entfernt."), `deleteFeedback.notInterested` („Kein Interesse"), `deleteFeedback.alreadyDone` („Schon erledigt"), `deleteFeedback.thanks` („Verstanden. Das System passt sich an.").

## 7. Edge-Cases

| Fall | Verhalten |
|---|---|
| Eigene Quest gelöscht | Wie heute: kein Toast, kein questSignal (nur forgeLearning-Stempel wie bisher) |
| „Schon erledigt", aber Quest-id existiert wieder (Reset/Race) | No-op, Toast schließt |
| „Schon erledigt" auf Daily nach Mitternacht | Guard über id-Existenz; Restore+Complete läuft mit Original-`createdAt` — Abschluss zählt für den aktuellen Tag (wie ein später Complete) |
| Zwei Deletes kurz nacheinander | Neuer Toast ersetzt alten; Neutral-Signale beider bereits erfasst |
| Doppel-Tipp auf Chip | Erster Tipp entfernt Toast; `resolveDeleteFeedback` idempotent über Guards |
| Signal-Import/Merge alter Stände | `templateEntry`/`categoryEntry` defaulten fehlende `deleted`-Felder auf 0 (bestehendes Spread-Muster) |
| Tagesreset-Expiry vs. Delete | Kein Doppelzählen möglich: gelöschte Quest ist beim Reset nicht mehr in `state.quests` |

## 8. Teststrategie

Bestehende Runner-Konvention (`scripts/test-*.mjs`, npm-Scripts):

- **`test-signals.mjs`** (erweitern): `recordQuestDeleted` neutral (Guard eigene Quest, Bumps, recentDeleted-Cap), `applyDeletedQuestDislike` (Dislike-Bumps, Listen-Umzug recentDeleted→recentDisliked), `revertQuestDeleted` (Dekrement, min 0, Listen-Entfernung), Defensivität (kaputter State wirft nicht).
- **`test-hunter-dossier.mjs`** (erweitern): Template-Cooldown via 2× deleted; Kategorie-Meidung via `deleted>=4 && deleted>completed`; Gegenprobe: viele Deletes + noch mehr Completions ≠ avoided.
- **`test-forge-learning.mjs`** (erweitern): Rezept `avoided` via `deleted>=2 && completed===0`; `prefer`-Override schlägt deleted; „Schon erledigt"-Fall (deleted+completed) nicht avoided.
- **Similarity/Compiler-Test** (bestehende Datei für `buildQuestExclusionCorpus` erweitern): `recent_deleted`-Quelle erscheint mit Severity soft; gleicher Titel in recentDisliked bleibt hard.
- Manueller Smoke über den Harness-Pfad (`/run-solo-todo`): Löschen einer System-Quest → Toast → beide Chip-Pfade einmal durchspielen.

## 9. Erfolgskriterien

- Gelöschte System-Quest taucht innerhalb von 14 Tagen nicht mehr als identisches Template auf (nach 2× Löschen) bzw. wird im Forge-Ranking demotet (nach 1× stillem Löschen).
- „Kein Interesse" wirkt ab dem ersten Tipp wie ein Dislike (Hard-Block 28 Tage, Kategorie-Zähler).
- „Schon erledigt" erzeugt einen regulären Abschluss inkl. Reward-Flow und hinterlässt kein Negativ-Signal.
- Eigene Quests: exakt null Verhaltensänderung.
