# Quest-Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quest-Erstellung in einen 3-Schritt-Wizard überführen (③) und eine „Systemruf-Frequenz"-Steuerung am Quest-Board einbauen (④).

**Architecture:** In-Place-Refactor des bestehenden „Quest Forge"-Modals in `solo-leveling-v5.jsx` (kein Auslagern — minimiert Prop-Plumbing-Risiko in der 169-KB-Datei). Frequenz wiederverwendet die bestehende `QuestIntensityControl` in einem Popover am Board; die Generierungs-Engine bleibt unverändert.

**Tech Stack:** React 18 (Vite), Inline-Styles, i18n via `useI18n`/`tr`. **Kein** Component-Test-Runner vorhanden → Verifikation = esbuild-Parsecheck + `npx vite build` + bestehende Node-Harnesses (`npm run test:quest-planning`) + manuelle Preview-Checkliste (Auth-Wall siehe Memory `local_preview_workflow`).

**Verifikations-Helfer (PowerShell, Windows):**
- Parsecheck: `npx --no-install esbuild "<pfad>" --jsx=automatic > $null 2>$null; "exit=$LASTEXITCODE"` → erwartet `exit=0`
- App-Build: `npx vite build` → erwartet `✓ built in …`, Exit 0

---

## Pre-Flight

- [ ] **P1: Branch anlegen** (wir sind auf `main`)

```bash
git checkout -b feature/quest-screen-redesign
```

- [ ] **P2: Baseline-Build grün?**

Run: `npx vite build`
Expected: `✓ built in …` (Exit 0). Falls schon rot → erst klären, nicht weiterbauen.

---

# Part A — ③ Quest-Erstellungs-Wizard

**Datei:** `solo-leveling-v5.jsx` (alle Änderungen im Erstellungs-Modal, `forgeTab === "create"`-Zweig, ~Z. 2174–2515) + lokaler State (~Z. 329).

**Mapping der bestehenden Feld-Blöcke (Anker = Kommentar-Marker):**
- `{/* QUEST TITLE */}` (~2177) + `{/* TYPE */}` (~2189) → **Schritt 1**
- `{/* DIFFICULTY */}` (~2224) + `{/* CATEGORY */}` (~2251) + `{/* XP PREVIEW */}` (~2480) → **Schritt 2**
- `{/* ── DETAILS PANEL ── */}`-Inhalt (~2297–2409) + `{/* PRODUCTIVITY SIGNALS */}` (~2411) + `{/* DUE DATE */}` (~2432) + `{/* REMINDER */}` (~2451) + `{/* HABIT SYNC */}` (~2464) → **Schritt 3**
- `{/* ── DETAILS TOGGLE ── */}` (~2278–2295) → **entfernen** (Schritt 3 zeigt Details direkt)
- Top-3-Tab-Bar (~2062–2084) → durch **Stepper** ersetzen (nur wenn `forgeTab==="create"`); Pool/Bibliothek-Zugang wandert in Schritt-1-Buttons. Die `forgeTab`-Zweige „pool"/„library" (~2089–2173) **bleiben unverändert**.

---

### Task A1: Wizard-State + Reset

**Files:** Modify: `solo-leveling-v5.jsx:329`

- [ ] **Step 1: State ergänzen** — direkt nach `const [forgeTab, setForgeTab] = useState("create");` (Z. 329):

```jsx
  const [forgeTab, setForgeTab] = useState("create");
  const [wizardStep, setWizardStep] = useState(1); // ③ Quest-Wizard: 1=Was? 2=Einstufung 3=Feinschliff
```

- [ ] **Step 2: Reset beim Öffnen** — unmittelbar nach der `requestShowCreate`-Definition (endet Z. 598) einfügen:

```jsx
  // Wizard immer auf Schritt 1 starten, sobald das Erstellen-Modal sichtbar wird
  useEffect(() => { if (showCreate) setWizardStep(1); }, [showCreate]);
```

- [ ] **Step 3: Parsecheck**

Run: `npx --no-install esbuild "solo-leveling-v5.jsx" --jsx=automatic > $null 2>$null; "exit=$LASTEXITCODE"`
Expected: `exit=0`

- [ ] **Step 4: Commit**

```bash
git add solo-leveling-v5.jsx
git commit -m "feat(quest-wizard): add wizardStep state + reset on open"
```

---

### Task A2: 3-Tab-Bar durch Wizard-Stepper ersetzen

**Files:** Modify: `solo-leveling-v5.jsx` (~Z. 2062–2084, der `{/* 3 Mode tabs … */}`-Block)

- [ ] **Step 1: Den kompletten 3-Tab-`<div>`** (von `{/* 3 Mode tabs: Erstellen / Mein Pool / Bibliothek */}` bis zum schließenden `</div>` vor `{/* Scrollable content */}`) **ersetzen** durch den Stepper (nur im Create-Tab sichtbar) + schlanke Zurück-zu-Wizard-Leiste für Pool/Bibliothek:

```jsx
                    {/* ③ Wizard-Stepper (nur im Erstellen-Modus) */}
                    {forgeTab === "create" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                        {[1, 2, 3].map((s, i) => {
                          const reached = wizardStep >= s;
                          const done = wizardStep > s;
                          const labels = { 1: tr("quests.forge.step1") || "Was?", 2: tr("quests.forge.step2") || "Einstufung", 3: tr("quests.forge.step3") || "Feinschliff" };
                          return (
                            <React.Fragment key={s}>
                              <button
                                onClick={() => { if (qTitle.trim() || s === 1) setWizardStep(s); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
                                  cursor: (qTitle.trim() || s === 1) ? "pointer" : "default", padding: 0,
                                }}
                              >
                                <span style={{
                                  width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace",
                                  background: reached ? theme.primary : "rgba(255,255,255,0.08)",
                                  color: reached ? "#04121a" : "#64748b",
                                  boxShadow: wizardStep === s ? `0 0 12px ${theme.primary}66` : "none",
                                }}>{done ? "✓" : s}</span>
                                <span style={{ fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: wizardStep === s ? theme.primary : "#475569", letterSpacing: 1 }}>{labels[s]}</span>
                              </button>
                              {i < 2 && <span style={{ flex: 1, height: 2, borderRadius: 2, background: wizardStep > s ? theme.primary + "88" : "rgba(255,255,255,0.08)" }} />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <button onClick={() => setForgeTab("create")} style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: theme.accent || theme.primary, fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                        ‹ {tr("quests.forge.backToCreate") || "Zurück zum Erstellen"}
                      </button>
                    )}
```

> Hinweis: i18n-Keys `quests.forge.step1/step2/step3/backToCreate` existieren evtl. noch nicht — der `|| "Fallback"` greift dann. Optional später in `data/i18n/*` ergänzen (nicht blockierend).

- [ ] **Step 2: Parsecheck** → `npx --no-install esbuild "solo-leveling-v5.jsx" --jsx=automatic > $null 2>$null; "exit=$LASTEXITCODE"` → `exit=0`
- [ ] **Step 3: Commit** → `git commit -am "feat(quest-wizard): replace mode tabs with step indicator"`

---

### Task A3: Schritt 1 — Titel + Typ + Einstieg

**Files:** Modify: `solo-leveling-v5.jsx` (Create-Tab-Inhalt, `{/* QUEST TITLE */}` … Ende `{/* TYPE */}`)

- [ ] **Step 1: Einstieg-Buttons + Step-1-Wrapper öffnen.** Direkt vor `{/* QUEST TITLE */}` (~Z. 2177) einfügen:

```jsx
                        {/* ③ Schritt 1: Was? */}
                        {wizardStep === 1 && (<>
                        {/* Einstieg: Zufall / Vorlage / Pool */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                          <button onClick={() => {
                            const pool = QUEST_POOL; const pick = pool[Math.floor(Math.random() * pool.length)];
                            setRandomizing(true);
                            setQTitle(pick.title); setQCat(pick.category); setQDiff(pick.difficulty); setQType("side");
                            setQDescription(pick.desc || ""); setQSubQuests(pick.subQuests ? [...pick.subQuests] : []); setQTags(pick.tags ? pick.tags.join(", ") : "");
                            setTimeout(() => setRandomizing(false), 600);
                          }} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 9, fontWeight: 800, background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b33", color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>🎲 {tr("quests.forge.randomIdea") || "Zufall"}</button>
                          <button onClick={() => setForgeTab("library")} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>📋 {tr("quests.forge.tabs.library") || "Vorlage"}</button>
                          <button onClick={() => setForgeTab("pool")} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>⭐ {tr("quests.forge.tabs.pool") || "Pool"}</button>
                        </div>
```

- [ ] **Step 2: Step-1-Wrapper schließen.** Unmittelbar nach dem Ende des `{/* TYPE */}`-Blocks (das `</div>` das den Typ-`<div style={{ marginBottom: 14 }}>` schließt, ~Z. 2222) einfügen:

```jsx
                        </>)}
                        {/* ── Ende Schritt 1 ── */}
```

- [ ] **Step 3: Parsecheck** → `exit=0`. (JSX-Balance: ein `<>…</>` neu geöffnet/geschlossen.)
- [ ] **Step 4: Commit** → `git commit -am "feat(quest-wizard): step 1 (title, type, entry shortcuts)"`

---

### Task A4: Schritt 2 — Einstufung + XP

**Files:** Modify: `solo-leveling-v5.jsx` (`{/* DIFFICULTY */}`, `{/* CATEGORY */}`, `{/* XP PREVIEW */}`)

- [ ] **Step 1: Step-2-Wrapper öffnen** direkt vor `{/* DIFFICULTY */}` (~Z. 2224):

```jsx
                        {/* ③ Schritt 2: Einstufung */}
                        {wizardStep === 2 && (<>
```

- [ ] **Step 2: Wrapper schließen** direkt nach dem Ende des `{/* CATEGORY */}`-Blocks (schließendes `</div>` ~Z. 2276):

```jsx
                        </>)}
                        {/* ── Ende Schritt 2 (XP-Preview folgt separat) ── */}
```

- [ ] **Step 3: XP-Preview in Schritt 2 zeigen.** Den bestehenden `{/* XP PREVIEW */}`-Block (~2480–2497) verschieben ist riskant; stattdessen seine Sichtbarkeits-Bedingung erweitern. Die öffnende Zeile `{qTitle.trim() && (() => {` ersetzen durch:

```jsx
                        {wizardStep === 2 && qTitle.trim() && (() => {
```

- [ ] **Step 4: Parsecheck** → `exit=0`
- [ ] **Step 5: Commit** → `git commit -am "feat(quest-wizard): step 2 (difficulty, category, xp preview)"`

---

### Task A5: Schritt 3 — Feinschliff

**Files:** Modify: `solo-leveling-v5.jsx` (Details-Toggle entfernen, Details-Panel + Productivity + Due + Reminder + Habit-Sync als Schritt 3)

- [ ] **Step 1: Details-Toggle-Button entfernen.** Den kompletten Block `{/* ── DETAILS TOGGLE ── */}` … `</button>` (~Z. 2278–2295) löschen.

- [ ] **Step 2: Details-Panel „immer offen" in Schritt 3.** Die Zeile `{showDetails && (` (öffnet das Details-Panel, ~Z. 2298) ersetzen durch den Step-3-Wrapper:

```jsx
                        {/* ③ Schritt 3: Feinschliff (optional) */}
                        {wizardStep === 3 && (
                        <>
                        <div style={{ animation: "slideDown 0.3s ease", marginBottom: 14, padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.015)", border: `1px solid ${theme.primary}15` }}>
```

> Damit ersetzt der neue `<div>` exakt den alten Panel-Container, der bisher hinter `{showDetails && (` stand. Das alte `{showDetails && (` **und** seine öffnende `<div style={{ animation: "slideDown 0.3s ease" … }}>`-Zeile werden durch obigen Block ersetzt (eine Zeile rein, Bedingung weg).

- [ ] **Step 3: Altes Panel-Ende anpassen.** Das Details-Panel endet mit `</div>\n                        )}` (~Z. 2408–2409, das `)}` gehörte zu `{showDetails && (`). Das `)}` **entfernen**, nur das `</div>` behalten — die Productivity/Due/Reminder/Habit-Blöcke liegen jetzt im selben Schritt-3-Fragment.

- [ ] **Step 4: Schritt 3 schließen.** Direkt nach dem Ende des `{/* HABIT SYNC */}`-Blocks (~Z. 2478, vor `{/* XP PREVIEW */}`) einfügen:

```jsx
                        </>
                        )}
                        {/* ── Ende Schritt 3 ── */}
```

- [ ] **Step 5: Parsecheck** → `exit=0`. Bei Ungleichgewicht: Klammerbilanz um 2298 und 2408 prüfen.
- [ ] **Step 6: Commit** → `git commit -am "feat(quest-wizard): step 3 (details, signals, schedule, habit-sync)"`

---

### Task A6: Schritt-abhängige Navigation (Footer)

**Files:** Modify: `solo-leveling-v5.jsx` (Footer-Block `{!showTemplates && (` … `)}`, ~Z. 2503–2515)

- [ ] **Step 1: Footer ersetzen.** Den kompletten Footer-`<div>` (innerhalb `{!showTemplates && (`) ersetzen durch eine step-abhängige Leiste. Nur im Create-Tab navigierbar; Pool/Bibliothek behalten keinen Footer:

```jsx
                  {!showTemplates && forgeTab === "create" && (
                    <div style={{ padding: "14px 24px 20px", flexShrink: 0, borderTop: `1px solid ${theme.primary}1a`, display: "flex", gap: 10, alignItems: "center" }}>
                      {wizardStep > 1 && (
                        <button onClick={() => setWizardStep(s => Math.max(1, s - 1))} style={{ padding: "13px 16px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 13, fontWeight: 900, fontFamily: "'Cinzel',serif", cursor: "pointer" }}>‹</button>
                      )}
                      {wizardStep < 3 ? (
                        <>
                          <button
                            data-tutorial="quest-submit-btn"
                            disabled={!qTitle.trim()}
                            onClick={() => setWizardStep(s => Math.min(3, s + 1))}
                            style={{ flex: 1, padding: "15px", borderRadius: 16, fontSize: 14, fontWeight: 900, background: qTitle.trim() ? `linear-gradient(135deg,${theme.primary},${theme.secondary})` : "rgba(10,10,24,0.6)", color: qTitle.trim() ? "#fff" : "#334155", letterSpacing: 2, fontFamily: "'Cinzel',serif", boxShadow: qTitle.trim() ? `0 6px 30px ${theme.glow}` : "none", cursor: qTitle.trim() ? "pointer" : "not-allowed", border: "none" }}
                          >{tr("quests.forge.next") || "Weiter"} ›</button>
                          {wizardStep === 2 && (
                            <button onClick={handleWizardSubmit} disabled={!qTitle.trim()} title={tr("quests.forge.createNow") || "Sofort erstellen"} style={{ padding: "15px 14px", borderRadius: 16, fontSize: 12, fontWeight: 900, background: "transparent", border: `1px solid ${theme.primary}55`, color: theme.accent || theme.primary, fontFamily: "'Cinzel',serif", cursor: qTitle.trim() ? "pointer" : "not-allowed" }}>✦</button>
                          )}
                        </>
                      ) : (
                        <button data-tutorial="quest-submit-btn" onClick={handleWizardSubmit} disabled={!qTitle.trim()} style={{ flex: 1, padding: "15px", borderRadius: 16, fontSize: 14, fontWeight: 900, background: qTitle.trim() ? `linear-gradient(135deg,${theme.primary},${theme.secondary})` : "rgba(10,10,24,0.6)", color: qTitle.trim() ? "#fff" : "#334155", letterSpacing: 3, fontFamily: "'Cinzel',serif", boxShadow: qTitle.trim() ? `0 6px 30px ${theme.glow}` : "none", cursor: qTitle.trim() ? "pointer" : "not-allowed", border: "none" }}>{editingQuestId ? `✦ ${tr("quests.forge.submitSave")} ✦` : `✦ ${tr("quests.forge.submitAccept")} ✦`}</button>
                      )}
                    </div>
                  )}
```

- [ ] **Step 2: `handleWizardSubmit` definieren.** Die alte Inline-`onClick`-Logik des Submit-Buttons in eine benannte Funktion ziehen. Nahe `requestShowCreate` (~Z. 598) einfügen:

```jsx
  const handleWizardSubmit = useCallback(() => {
    if (!editingQuestId && !requireQuestSlot(null, { bypassDailyLimit: tutorialBypassesQuestLimit })) return;
    if (qType === "chained") addChainedQuest(qTitle, qCat, qDiff, { bypassDailyLimit: tutorialBypassesQuestLimit });
    else createQuest(null, { bypassDailyLimit: tutorialBypassesQuestLimit });
    setForgeTab("create");
  }, [editingQuestId, requireQuestSlot, tutorialBypassesQuestLimit, qType, qTitle, qCat, qDiff, addChainedQuest, createQuest]);
```

> Prüfe, dass `tutorialBypassesQuestLimit`, `addChainedQuest`, `createQuest`, `requireQuestSlot` im Scope sind (sie waren es im alten Inline-Handler, Z. 2505–2509). Falls ein Name abweicht, exakt den aus dem alten Handler verwenden.

- [ ] **Step 3: Parsecheck** → `exit=0`
- [ ] **Step 4: App-Build** → `npx vite build` → `✓ built in …`, Exit 0
- [ ] **Step 5: Commit** → `git commit -am "feat(quest-wizard): step-aware footer navigation + handleWizardSubmit"`

---

### Task A7: Wizard manuell verifizieren

- [ ] **Step 1: Dev-Server** → `npm run dev` (Auth-Wall-Workaround siehe Memory `local_preview_workflow`).
- [ ] **Step 2: Checkliste** (Quest-Board → „Erstellen"):
  - Schritt 1: Titel eingeben, Typ wählen; „Weiter" erst aktiv mit Titel.
  - Zufall/Vorlage/Pool: 🎲 befüllt Felder; 📋/⭐ öffnen Picker, Auswahl springt zurück in den Wizard.
  - Schritt 2: Schwierigkeit/Bereich, XP-Vorschau sichtbar; „✦" erstellt sofort.
  - Schritt 3: Beschreibung/Etappen/Termin/Erinnerung/Habit-Sync; „✦ Erstellen" legt Quest an.
  - „‹" geht je einen Schritt zurück; Stepper-Tippen springt direkt.
  - Edit einer Quest: Modal öffnet auf Schritt 1 mit Werten; „Speichern" persistiert.
  - Chained-Typ: erzeugt Ketten-Quest.
- [ ] **Step 3:** Screenshot/Notiz an User. Bei Fehlern: Quelle fixen, ab Schritt 3 erneut prüfen.

---

# Part B — ④ Systemruf-Frequenz am Board

---

### Task B1: Adaptiv-Status in QuestIntensityControl

**Files:** Modify: `components/QuestIntensityControl.jsx`

- [ ] **Step 1: Import ergänzen** (oben bei den Imports):

```jsx
import { getQuestPlanningSnapshot } from "../data/questPlanning.js";
```

- [ ] **Step 2: Overload berechnen** — in der Komponente nach `const enabled = state.settings?.autoSystemTasks === true;`:

```jsx
  const overloaded = getQuestPlanningSnapshot(state).overloadStatus.overloaded;
```

- [ ] **Step 3: Status-Zeile rendern** — direkt vor dem schließenden `</div>` des Haupt-`return`-Containers (nach dem Preset-Grid / `compact`-Block) einfügen:

```jsx
        {overloaded && (
          <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", fontSize: 10, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.4 }}>
            ⚠️ {`Gedrosselt — zu viele offene Quests. Statt neuer Rufe gibt's eine Comeback-Quest.`}
          </div>
        )}
```

- [ ] **Step 4: Parsecheck** `components/QuestIntensityControl.jsx` → `exit=0`
- [ ] **Step 5: Commit** → `git commit -am "feat(intensity): surface adaptive overload status"`

---

### Task B2: Free-Teil-Sperre (lockMode-Prop)

**Files:** Modify: `components/QuestIntensityControl.jsx`

- [ ] **Step 1: Prop ergänzen.** Signatur (Z. 222) erweitern:

```jsx
export default function QuestIntensityControl({ state, persist, theme, compact = false, surface = "card", premiumStatus, onOpenPremium, lockMode = "full" }) {
```

- [ ] **Step 2: Voll-Overlay nur bei `lockMode === "full"`.** Die Zeile `{isLocked && <PremiumLockedOverlay theme={theme} onOpenPremium={onOpenPremium} compact={compact} embedded={embedded} />}` ersetzen durch:

```jsx
      {isLocked && lockMode === "full" && <PremiumLockedOverlay theme={theme} onOpenPremium={onOpenPremium} compact={compact} embedded={embedded} />}
```

- [ ] **Step 3: Preset-Buttons im Partial-Lock sperren.** Im `QUEST_INTENSITY_PRESETS.map(preset => { … })`-Grid: `active` bleibt für den Baseline (`baby_gate`) sichtbar, andere bekommen ein 🔒 und sind nicht klickbar, wenn `isLocked && lockMode === "partial"`. Den `onClick` der Preset-`<button>` ändern zu:

```jsx
                onClick={() => { if (isLocked && lockMode === "partial" && preset.key !== "baby_gate") { onOpenPremium?.("quest_intensity"); return; } selectPreset(preset); }}
```

  und im Button-`children` (nach dem Label-`<div>…{compact ? preset.shortLabel : preset.label}</div>`) ein Schloss anhängen:

```jsx
                  {isLocked && lockMode === "partial" && preset.key !== "baby_gate" && (
                    <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9, opacity: 0.7 }}>🔒</span>
                  )}
```

- [ ] **Step 4: Kompakter Upsell-Streifen bei Partial-Lock.** Vor dem schließenden `</div>` des Hauptcontainers:

```jsx
        {isLocked && lockMode === "partial" && (
          <button onClick={() => onOpenPremium?.("quest_intensity")} style={{ marginTop: 10, width: "100%", padding: "9px", borderRadius: 10, border: `1px solid ${theme.primary}55`, background: `linear-gradient(135deg, ${theme.primary}22, rgba(168,85,247,0.12))`, color: "#fff", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer" }}>
            {`MEHR SYSTEMRUFE → PRO`}
          </button>
        )}
```

- [ ] **Step 5: Parsecheck** → `exit=0`. (Settings nutzt weiter Default `lockMode="full"` → unverändert.)
- [ ] **Step 6: Commit** → `git commit -am "feat(intensity): partial-lock mode (free baseline visible + upsell)"`

---

### Task B3: „Frequenz"-Button + Popover am Board

**Files:** Modify: `components/views/DashboardView.jsx`

- [ ] **Step 1: Imports ergänzen** (oben):

```jsx
import QuestIntensityControl from "../QuestIntensityControl.jsx";
import { getDailySystemQuestCount } from "../../data/questIntensity.js";
```

- [ ] **Step 2: State ergänzen** — neben `const [filtersOpen, setFiltersOpen] = useState(false);` (~Z. 274):

```jsx
  const [freqOpen, setFreqOpen] = useState(false);
```

- [ ] **Step 3: Button neben „Filter".** In der Filter-Summary-Zeile (~Z. 819–838) **nach** dem `can('quest_filters') && (<button …Filter…/>)`-Block, noch innerhalb des umschließenden `<div style={{ display: "flex", … }}>`, einfügen:

```jsx
                  <button
                    onClick={() => setFreqOpen(o => !o)}
                    aria-expanded={freqOpen}
                    style={{ minHeight: 30, padding: "0 10px", borderRadius: 999, background: `${theme.primary}10`, color: theme.accent || theme.primary, border: "none", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    ⚡ {t("dashboard.board.frequency") || "Frequenz"} · {getDailySystemQuestCount(state)}/{t("dashboard.board.perDayShort") || "Tag"}
                  </button>
```

> Tipp: Den umschließenden `<div>` der Summary-Zeile ggf. auf `flexWrap: "wrap"` setzen, falls es auf schmalen Screens eng wird.

- [ ] **Step 4: Popover rendern.** Direkt nach dem Filter-Panel-Block (`can('quest_filters') && (filtersOpen || hasActiveQuestFilters) && ( … )`, endet ~Z. 917) einfügen:

```jsx
                {freqOpen && (
                  <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                    <QuestIntensityControl
                      state={state}
                      persist={persist}
                      theme={theme}
                      compact
                      premiumStatus={premiumStatus}
                      onOpenPremium={openPremiumModal}
                      lockMode={premiumStatus?.active ? "full" : "partial"}
                    />
                  </div>
                )}
```

- [ ] **Step 5: Parsecheck** `components/views/DashboardView.jsx` → `exit=0`
- [ ] **Step 6: App-Build** → `npx vite build` → `✓ built in …`, Exit 0
- [ ] **Step 7: Commit** → `git commit -am "feat(quest-board): add frequency control next to filter"`

---

### Task B4: Frequenz verifizieren + Regression

- [ ] **Step 1: Regression-Harness** → `npm run test:quest-planning` → erwartet bestehende Pass-Ausgabe (keine neuen Fehler). Engine ist unverändert; dient als Sicherheitsnetz.
- [ ] **Step 2: Dev-Server** `npm run dev`, Checkliste:
  - „⚡ Frequenz · 1/Tag" erscheint neben „Filter" und ist **immer** sichtbar (auch ohne `quest_filters`-Unlock).
  - Tippen öffnet das Popover.
  - **Free** (premiumStatus inaktiv): Baseline „Baby Gate / 1" sichtbar, höhere Presets 🔒 + „MEHR SYSTEMRUFE → PRO" öffnet Premium-Modal. Kein Voll-Overlay.
  - **Premium** (premiumStatus aktiv): Presets frei wählbar, AKTIV/AUS-Toggle, Infozeilen.
  - Overload provozieren (viele offene Quests): Adaptiv-Zeile erscheint.
  - Settings-Ansicht (`SettingsView`): `QuestIntensityControl` weiterhin **Voll-Sperre** für Free (Default `lockMode="full"` unverändert).
- [ ] **Step 3:** Screenshot/Notiz an User.

---

## Schluss-Integration

- [ ] **S1: Voller Build** → `npx vite build` grün.
- [ ] **S2: Alle Quest-Harnesses** → `npm run validate:quests`, `npm run test:quest-planning`, `npm run test:quest-verification` → keine neuen Fehler.
- [ ] **S3:** Branch zur Review/zum Merge anbieten (separat; nicht ungefragt nach `main` mergen).

---

## Self-Review (vom Plan-Autor geprüft)

- **Spec-Abdeckung:** ③ Wizard (A1–A7) ✓ · ④ Frequenz Board + Free/Premium + Adaptiv (B1–B4) ✓ · Engine/Detailmodal/Presets unverändert (Nicht-Ziele) ✓.
- **Platzhalter:** keine — alle neuen Blöcke mit vollem Code; bestehende Blöcke per Kommentar-Anker + Zeilenbereich referenziert.
- **Typ-/Namens-Konsistenz:** `wizardStep`/`setWizardStep`, `handleWizardSubmit`, `freqOpen`/`setFreqOpen`, `lockMode` durchgängig identisch verwendet; `QuestIntensityControl`-Props decken sich mit der erweiterten Signatur.
