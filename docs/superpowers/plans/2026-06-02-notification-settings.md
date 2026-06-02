# Notification Settings (Penetrance Presets) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free, preset-only notification-intensity dial (Funkstille / Dezent / Standard / Intensiv) that gates which reminder categories fire, caps the daily count, and applies quiet hours — across both NotificationManager delivery paths.

**Architecture:** A new pure, import-free data module (`data/notificationPresets.js`) is the single source of truth and holds all logic; it is unit-tested with a standalone Node script. `components/NotificationManager.jsx` tags each reminder with a `category` and calls the module's `canFireNotification(...)` gate in both the foreground (`runReminderChecks`) and background (`scheduleBackgroundNotifications`) paths. `components/SettingsView.jsx` gets a preset-card picker persisting `state.settings.notificationLevel`.

**Tech Stack:** ES modules, React 18 (inline-style components), Capacitor Local Notifications, plain-Node `.mjs` test scripts.

**Spec:** `docs/superpowers/specs/2026-06-02-notification-settings-design.md`

**Branch:** `feat/notification-settings` (already checked out; the spec is already committed there).

---

## Deviation from spec (intentional)

The spec's "i18n" section called for preset strings in `data/locales/de.js` / `en.js`. The
sibling dial `data/questIntensity.js` instead **hardcodes** its German `label`/`desc`
strings directly in the preset objects (no i18n override exists for it). To follow the
established pattern, this plan puts German `label`/`desc` strings directly in
`NOTIFICATION_PRESETS` and adds **no** locale-file changes. Umlauts must be correct.

---

## File Structure

- **Create `data/notificationPresets.js`** — single source of truth: category→tier map,
  preset table (with German label/desc), and pure helpers (`getNotificationPreset`,
  `getCategoryTier`, `isCategoryEnabled`, `isWithinQuietHours`, `canFireNotification`,
  `isEssentialCategory`, `formatNotificationPresetSummary`). Zero imports.
- **Create `scripts/test-notification-presets.mjs`** — standalone Node test, mirrors
  `scripts/test-free-limits.mjs`.
- **Modify `package.json`** — add `test:notification-presets` script.
- **Modify `data/defaultState.js`** — add `notificationLevel: "standard"` to `settings`.
- **Modify `components/NotificationManager.jsx`** — tag 13 checks with `category`; gate
  `runReminderChecks` (foreground) and `scheduleBackgroundNotifications` (background).
- **Modify `components/SettingsView.jsx`** — add the preset-card picker to the existing
  "Benachrichtigungen" section.

---

## Task 1: Pure preset module + tests

**Files:**
- Create: `data/notificationPresets.js`
- Create: `scripts/test-notification-presets.mjs`
- Modify: `package.json:24`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-notification-presets.mjs`:

```js
import {
  NOTIFICATION_PRESETS, DEFAULT_NOTIFICATION_PRESET_KEY,
  getNotificationPreset, getCategoryTier, isCategoryEnabled, isWithinQuietHours,
  canFireNotification, isEssentialCategory, formatNotificationPresetSummary,
} from "../data/notificationPresets.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

// ── config sanity ──
assert(DEFAULT_NOTIFICATION_PRESET_KEY === "standard", "default preset is standard");
assert(NOTIFICATION_PRESETS.length === 4, "four presets exist");
assert(NOTIFICATION_PRESETS.every(p => p.key && Number.isInteger(p.maxTier)), "presets well-formed");
assert(NOTIFICATION_PRESETS.every(p => p.label && p.desc), "presets have label + desc");

// ── getNotificationPreset resolution + fallback ──
assert(getNotificationPreset("intensiv").key === "intensiv", "resolve by key string");
assert(getNotificationPreset("nope").key === "standard", "unknown key falls back to standard");
assert(getNotificationPreset(undefined).key === "standard", "undefined falls back to standard");
assert(getNotificationPreset({ settings: { notificationLevel: "dezent" } }).key === "dezent", "resolve from state object");
assert(getNotificationPreset({ settings: {} }).key === "standard", "state without level falls back");

// ── tiers ──
assert(getCategoryTier("emergency_expiry") === 0, "emergency is tier 0");
assert(getCategoryTier("habit_nudge") === 1, "habit nudge is tier 1");
assert(getCategoryTier("daily_activity") === 2, "daily activity is tier 2");
assert(getCategoryTier("totally_unknown") === 0, "unknown category treated as essential (fail-open)");
assert(isEssentialCategory("due_warning") === true, "due_warning is essential");
assert(isEssentialCategory("streak_protection") === false, "streak_protection is not essential");

// ── isCategoryEnabled across all presets ──
assert(isCategoryEnabled("funkstille", "custom_reminder") === true, "funkstille keeps essentials");
assert(isCategoryEnabled("funkstille", "habit_nudge") === false, "funkstille drops nudges");
assert(isCategoryEnabled("funkstille", "daily_activity") === false, "funkstille drops pressure");
assert(isCategoryEnabled("dezent", "habit_nudge") === true, "dezent keeps nudges");
assert(isCategoryEnabled("dezent", "streak_protection") === false, "dezent drops streak protection");
assert(isCategoryEnabled("standard", "habit_nudge") === true, "standard keeps nudges");
assert(isCategoryEnabled("standard", "streak_protection") === true, "standard adds streak protection via plus");
assert(isCategoryEnabled("standard", "daily_activity") === false, "standard drops daily_activity");
assert(isCategoryEnabled("standard", "late_night") === false, "standard drops late_night");
assert(isCategoryEnabled("intensiv", "daily_activity") === true, "intensiv keeps daily_activity");
assert(isCategoryEnabled("intensiv", "late_night") === true, "intensiv keeps late_night");

// ── quiet hours: wrap, same-day, boundaries ──
const std = getNotificationPreset("standard");   // 22 -> 8 wraps midnight
assert(isWithinQuietHours(23, std) === true, "23:00 within 22-8");
assert(isWithinQuietHours(3, std) === true, "03:00 within 22-8");
assert(isWithinQuietHours(22, std) === true, "22:00 start boundary inclusive");
assert(isWithinQuietHours(8, std) === false, "08:00 end boundary exclusive");
assert(isWithinQuietHours(12, std) === false, "noon outside 22-8");
const intens = getNotificationPreset("intensiv"); // 0 -> 7 same-day
assert(isWithinQuietHours(3, intens) === true, "03:00 within 0-7");
assert(isWithinQuietHours(7, intens) === false, "07:00 end boundary exclusive");
assert(isWithinQuietHours(9, intens) === false, "09:00 outside 0-7");

// ── canFireNotification ──
assert(canFireNotification({ presetOrKey: "standard", category: "emergency_expiry", firedToday: 99, hour: 3 }) === true, "essential bypasses cap + quiet hours");
assert(canFireNotification({ presetOrKey: "standard", category: "daily_activity", firedToday: 0, hour: 12 }) === false, "disabled category never fires");
assert(canFireNotification({ presetOrKey: "standard", category: "habit_nudge", firedToday: 0, hour: 23 }) === false, "nudge blocked during quiet hours");
assert(canFireNotification({ presetOrKey: "standard", category: "habit_nudge", firedToday: 0, hour: 19 }) === true, "nudge allowed daytime under cap");
assert(canFireNotification({ presetOrKey: "standard", category: "habit_nudge", firedToday: 5, hour: 19 }) === false, "nudge blocked at cap (5)");
assert(canFireNotification({ presetOrKey: "funkstille", category: "due_warning", firedToday: 999, hour: 3 }) === true, "funkstille essential always fires (no cap)");

// ── summary formatter ──
assert(formatNotificationPresetSummary(getNotificationPreset("standard")).includes("max 5/Tag"), "standard summary shows cap");
assert(formatNotificationPresetSummary(getNotificationPreset("funkstille")).includes("Essentielles"), "funkstille summary shows essentials-only");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("test-notification-presets: all assertions passed.");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-notification-presets.mjs`
Expected: FAIL — `Cannot find module '.../data/notificationPresets.js'` (module not created yet).

- [ ] **Step 3: Create the module**

Create `data/notificationPresets.js`:

```js
// ─── NOTIFICATION INTENSITY PRESETS ───────────────────────────
// Single source of truth for the user-facing notification dial. ZERO imports so it
// stays trivially unit-testable (no i18n / DOM / Capacitor coupling). This is SEPARATE
// from QUEST_INTENSITY (which controls quest generation) — it only gates reminders.

// category key -> tier. 0 = essential (bypasses cap + quiet hours), 1 = nudge, 2 = pressure.
export const NOTIFICATION_CATEGORIES = {
  // tier 0 — essential
  custom_reminder: 0,
  due_warning: 0,
  emergency_expiry: 0,
  rune_deadline: 0,
  // tier 1 — nudges
  due_upcoming: 1,
  habit_nudge: 1,
  weekly_summary: 1,
  gate_reset: 1,
  weekly_expiry: 1,
  emergency_morning: 1,
  // tier 2 — pressure
  daily_activity: 2,
  streak_protection: 2,
  late_night: 2,
};

export const DEFAULT_NOTIFICATION_PRESET_KEY = "standard";

// Each preset: maxTier (inclusive) plus optional plus/minus category overrides,
// dailyCap (counts NON-essential only; null = no numeric cap), quietStart/quietEnd
// (integer hours, window may wrap past midnight).
export const NOTIFICATION_PRESETS = [
  {
    key: "funkstille",
    label: "Funkstille",
    desc: "Nur was wirklich zählt: deine eigenen Reminder, Deadlines und Notfälle.",
    color: "#64748b",
    maxTier: 0, plus: [], minus: [],
    dailyCap: null, quietStart: 21, quietEnd: 9,
  },
  {
    key: "dezent",
    label: "Dezent",
    desc: "Dazu sanfte Nudges: Habits, Wochen-Rückblick und Gate-Reset.",
    color: "#22d3ee",
    maxTier: 1, plus: [], minus: [],
    dailyCap: 3, quietStart: 22, quietEnd: 8,
  },
  {
    key: "standard",
    label: "Standard",
    desc: "Ausgewogen: Nudges plus Streak-Schutz, damit keine Serie reißt.",
    color: "#34d399",
    maxTier: 1, plus: ["streak_protection"], minus: [],
    dailyCap: 5, quietStart: 22, quietEnd: 8,
  },
  {
    key: "intensiv",
    label: "Intensiv",
    desc: "Maximaler Druck: alles an, inklusive mehrfacher Tages-Pushes und Late-Night.",
    color: "#ef4444",
    maxTier: 2, plus: [], minus: [],
    dailyCap: 8, quietStart: 0, quietEnd: 7,
  },
];

// Resolve a preset from a key string OR a state object (state.settings.notificationLevel).
// Falls back to the default for unknown / missing.
export function getNotificationPreset(value) {
  const key = typeof value === "string" ? value : value?.settings?.notificationLevel;
  return NOTIFICATION_PRESETS.find(p => p.key === key)
    || NOTIFICATION_PRESETS.find(p => p.key === DEFAULT_NOTIFICATION_PRESET_KEY)
    || NOTIFICATION_PRESETS[0];
}

// Unknown category -> tier 0 (fail-open: a miswired check should fire, not vanish).
export function getCategoryTier(category) {
  const tier = NOTIFICATION_CATEGORIES[category];
  return Number.isInteger(tier) ? tier : 0;
}

export function isEssentialCategory(category) {
  return getCategoryTier(category) === 0;
}

export function isCategoryEnabled(presetOrKey, category) {
  const preset = typeof presetOrKey === "string" ? getNotificationPreset(presetOrKey) : presetOrKey;
  if (preset.minus?.includes(category)) return false;
  if (preset.plus?.includes(category)) return true;
  return getCategoryTier(category) <= preset.maxTier;
}

// Quiet-hours window may wrap midnight (e.g. 22 -> 8). hour is 0..23.
export function isWithinQuietHours(hour, preset) {
  const { quietStart: s, quietEnd: e } = preset;
  if (s === e) return false;               // empty window
  if (s < e) return hour >= s && hour < e; // same-day window
  return hour >= s || hour < e;            // wraps midnight
}

// Combined allow/deny for one candidate notification.
// firedToday = count of NON-essential notifications already fired/scheduled today.
export function canFireNotification({ presetOrKey, category, firedToday = 0, hour = 0 } = {}) {
  const preset = typeof presetOrKey === "string" ? getNotificationPreset(presetOrKey) : presetOrKey;
  if (!isCategoryEnabled(preset, category)) return false;
  if (getCategoryTier(category) === 0) return true;        // essential bypasses cap + quiet
  if (isWithinQuietHours(hour, preset)) return false;
  if (preset.dailyCap != null && firedToday >= preset.dailyCap) return false;
  return true;
}

// Short human summary for the settings UI, e.g. "max 5/Tag · Ruhe 22–8 Uhr".
export function formatNotificationPresetSummary(preset) {
  const cap = preset.dailyCap == null ? "nur Essentielles" : `max ${preset.dailyCap}/Tag`;
  return `${cap} · Ruhe ${preset.quietStart}–${preset.quietEnd} Uhr`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/test-notification-presets.mjs`
Expected: PASS — `test-notification-presets: all assertions passed.`

- [ ] **Step 5: Register the npm test script**

In `package.json`, change the last test line (currently `package.json:24`) to add a trailing comma and the new script.

Replace:
```json
    "test:ai-quest-profile": "node scripts/test-ai-quest-profile.mjs"
```
with:
```json
    "test:ai-quest-profile": "node scripts/test-ai-quest-profile.mjs",
    "test:notification-presets": "node scripts/test-notification-presets.mjs"
```

Run: `npm run test:notification-presets`
Expected: PASS (same output as Step 4).

- [ ] **Step 6: Commit**

```bash
git add data/notificationPresets.js scripts/test-notification-presets.mjs package.json
git commit -m "$(cat <<'EOF'
feat(notifications): add notificationPresets data module + tests

Pure, import-free single source of truth for the notification-intensity
dial (Funkstille/Dezent/Standard/Intensiv): category->tier map, preset
table with German label/desc, and gating helpers (isCategoryEnabled,
isWithinQuietHours, canFireNotification). Covered by a standalone Node
test mirroring test-free-limits.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Default the setting

**Files:**
- Modify: `data/defaultState.js:193-198`

- [ ] **Step 1: Add the default**

In `data/defaultState.js`, inside the `settings` object, add `notificationLevel`.

Replace:
```js
    questIntensity: "baby_gate",
    pageTransitionSpeed: 1,
```
with:
```js
    questIntensity: "baby_gate",
    notificationLevel: "standard",
    pageTransitionSpeed: 1,
```

- [ ] **Step 2: Verify it parses**

Run: `node -e "import('./data/defaultState.js').then(m => console.log(typeof m.default === 'object' || 'ok'))"`
Expected: prints `ok` or `true` with no import error. (If `defaultState.js` has a named export instead of default, any successful import with no error is the pass condition.)

- [ ] **Step 3: Commit**

```bash
git add data/defaultState.js
git commit -m "$(cat <<'EOF'
feat(notifications): default notificationLevel to standard

New + existing users resolve to the Standard preset; getNotificationPreset
also defaults defensively, so no migration is required.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Gate the foreground path

**Files:**
- Modify: `components/NotificationManager.jsx` (import; 13 check return objects; counter helpers; `runReminderChecks`)

- [ ] **Step 1: Add the import**

In `components/NotificationManager.jsx`, after the existing import on line 6
(`import { getStateLocale, translate } from "../data/i18n.js";`), add:

```js
import { getNotificationPreset, canFireNotification, isEssentialCategory } from "../data/notificationPresets.js";
```

- [ ] **Step 2: Tag all 13 checks with a `category`**

Add a `category` field to each check's returned object. Make these 13 exact edits (anchor on each unique `tag:` line):

1. `tag: `daily-activity-${bucket}`,` → add line after it: `        category: "daily_activity",`
2. `tag: `streak-protection-${hour < 18 ? "early" : "late"}`,` → after: `        category: "streak_protection",`
3. `tag: "late-night-energy",` → after: `        category: "late_night",`
4. `tag: "emergency-quest",` → after: `        category: "emergency_expiry",`
5. `tag: "emergency-morning",` → after: `        category: "emergency_morning",`
6. `tag: "habit-nudge",` → after: `        category: "habit_nudge",`
7. `tag: "dungeon-reset",` → after: `        category: "gate_reset",`
8. `tag: `reminder-${r.id}`,` → after: `                category: "custom_reminder",`
9. `tag: `due-date-${today}`,` → after: `        category: "due_warning",`
10. `tag: `due-upcoming-${tomorrowKey}`,` → after: `        category: "due_upcoming",`
11. `tag: `rune-deadline-${in3Key}`,` → after: `        category: "rune_deadline",`
12. `tag: `weekly-expiry-${getToday()}`,` → after: `        category: "weekly_expiry",`
13. `tag: "weekly-summary",` → after: `        category: "weekly_summary",`

(Indentation: match the surrounding object. Item 8 is inside a deeper block, hence more spaces.)

- [ ] **Step 3: Add the daily non-essential counter helpers**

In `components/NotificationManager.jsx`, immediately after the `wasAlertSentToday`
function (ends ~line 83), add:

```js
// ── Daily non-essential notification counter (for preset caps) ──
function getNonEssentialCountToday() {
    try {
        const raw = localStorage.getItem(`sl_notif_count_${getToday()}`);
        return Math.max(0, parseInt(raw, 10) || 0);
    } catch { return 0; }
}
function bumpNonEssentialCountToday() {
    try {
        localStorage.setItem(`sl_notif_count_${getToday()}`, String(getNonEssentialCountToday() + 1));
    } catch { }
}
```

- [ ] **Step 4: Rewrite `runReminderChecks` to gate by preset**

Replace the entire existing `runReminderChecks` function body. The check **array stays
identical**; only the loop changes. Replace:

```js
    for (const check of checks) {
        const result = check(state);
        if (result) {
            if (!result.reminderId && wasAlertSentToday(result.tag)) {
                console.log(`[SoloToDo:Notif] Skipped (already sent): ${result.tag}`);
                continue;
            }
            console.log(`[SoloToDo:Notif] Triggered: ${result.tag} → "${result.title}"`);
            sendNotification(result.title, result.body, result.tag);
            return result;
        }
    }
    console.log('[SoloToDo:Notif] No checks triggered this cycle.');
    return null;
```

with:

```js
    const preset = getNotificationPreset(state);
    const hour = new Date().getHours();
    const firedToday = getNonEssentialCountToday();

    for (const check of checks) {
        const result = check(state);
        if (!result) continue;

        // Preset gate FIRST (so a suppressed item is not marked "sent" by the dedup,
        // and an early disabled/capped item does not shadow a later essential).
        if (!canFireNotification({ presetOrKey: preset, category: result.category, firedToday, hour })) {
            console.log(`[SoloToDo:Notif] Suppressed by preset ${preset.key}: ${result.tag} (${result.category})`);
            continue;
        }

        // Per-day dedup (custom reminders carry reminderId and are exempt).
        if (!result.reminderId && wasAlertSentToday(result.tag)) {
            console.log(`[SoloToDo:Notif] Skipped (already sent): ${result.tag}`);
            continue;
        }

        console.log(`[SoloToDo:Notif] Triggered: ${result.tag} → "${result.title}"`);
        sendNotification(result.title, result.body, result.tag);
        if (!isEssentialCategory(result.category)) bumpNonEssentialCountToday();
        return result;
    }
    console.log('[SoloToDo:Notif] No checks triggered this cycle.');
    return null;
```

- [ ] **Step 5: Verify the app still builds**

Run: `npx vite build`
Expected: build succeeds, no errors referencing `NotificationManager` or `notificationPresets`.

- [ ] **Step 6: Commit**

```bash
git add components/NotificationManager.jsx
git commit -m "$(cat <<'EOF'
feat(notifications): gate foreground reminder checks by preset

Tag all 13 reminder checks with a category and gate runReminderChecks
through canFireNotification: disabled categories, quiet hours and the
daily cap (non-essential only) are honored; essentials always fire. The
preset gate runs before the dedup so suppressed items are not consumed.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Gate the background path

**Files:**
- Modify: `components/NotificationManager.jsx` (`scheduleBackgroundNotifications`)

- [ ] **Step 1: Resolve preset + counter, and extend `addNotif`**

In `scheduleBackgroundNotifications`, replace the `addNotif` helper:

```js
        // Helper to add a notification only if schedule is in the future
        const addNotif = (title, body, at) => {
            if (at > now) {
                notifications.push({
                    id: nextId++, title, body,
                    schedule: { at, allowWhileIdle: true },
                    smallIcon: "ic_notification", sound: "default",
                });
            }
        };
```

with:

```js
        const preset = getNotificationPreset(state);
        let nonEssentialScheduled = 0;

        // Helper: schedule only if in the future AND allowed by the active preset.
        const addNotif = (title, body, at, category) => {
            if (at <= now) return;
            if (!canFireNotification({ presetOrKey: preset, category, firedToday: nonEssentialScheduled, hour: at.getHours() })) return;
            notifications.push({
                id: nextId++, title, body,
                schedule: { at, allowWhileIdle: true },
                smallIcon: "ic_notification", sound: "default",
            });
            if (!isEssentialCategory(category)) nonEssentialScheduled += 1;
        };
```

- [ ] **Step 2: Pass a category at every `addNotif` call site**

Make these 9 edits (each adds a trailing category argument):

1. `addNotif(nt(state, "notifications.noActivityTitle"), nt(state, "notifications.noActivityBody"), d11);` → `..., d11, "daily_activity");`
2. `addNotif(nt(state, "notifications.noQuestTitle"), nt(state, "notifications.noQuestBody"), d14);` → `..., d14, "daily_activity");`
3. `addNotif(nt(state, "notifications.dayEndingTitle"), nt(state, "notifications.dayEndingBody"), d17);` → `..., d17, "daily_activity");`
4. `addNotif(nt(state, "notifications.streakDangerTitle"), nt(state, "notifications.streakDangerBody", { streak: state.streak, hours: 5 }), d19);` → `..., d19, "streak_protection");`
5. `addNotif(nt(state, "notifications.lateNightTitle"), nt(state, "notifications.lateNightBody", { title: deepQuests[0].title }), d21);` → `..., d21, "late_night");`
6. `addNotif(nt(state, "notifications.habitOpenTitle"), nt(state, "notifications.habitOpenBody", { count: unfinished, plural: unfinished > 1 ? "s" : "" }), d20);` → `..., d20, "habit_nudge");`
7. `addNotif(nt(state, "notifications.emergencyExpiringTitle"), nt(state, "notifications.emergencyExpiringBody", { title: state.emergencyQuest.title, minutes: 120 }), warnAt);` → `..., warnAt, "emergency_expiry");`
8. `addNotif(nt(state, "notifications.dueTodayTitle"), nt(state, "notifications.dueTodayBody", { count: 1, plural: "", title: q.title }), dueAt);` → `..., dueAt, "due_warning");`
9. `addNotif(nt(state, "notifications.gatesTitle"), nt(state, "notifications.gatesBody"), tomorrow8);` → `..., tomorrow8, "gate_reset");`

Note: essentials (`emergency_expiry`, `due_warning`) bypass the cap regardless of call
order, so they are never dropped even though they appear after the pressure notifications
in the code.

- [ ] **Step 3: Verify the app still builds**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add components/NotificationManager.jsx
git commit -m "$(cat <<'EOF'
feat(notifications): gate background scheduling by preset

scheduleBackgroundNotifications now resolves the active preset and runs
every scheduled notification through canFireNotification (category +
quiet hours + remaining cap). Essentials bypass the cap, so deadlines and
emergencies are never dropped.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Settings preset picker

**Files:**
- Modify: `components/SettingsView.jsx` (import; handler; JSX in the notif section ~line 1458)

- [ ] **Step 1: Add the import**

In `components/SettingsView.jsx`, add near the other `../data/...` imports at the top:

```js
import { NOTIFICATION_PRESETS, getNotificationPreset, formatNotificationPresetSummary } from "../data/notificationPresets.js";
```

- [ ] **Step 2: Add the resolver + select handler**

In the `SettingsView` component body, near the existing `getSetting` / `toggleSetting`
helpers (~line 1100), add:

```js
  const notifPreset = getNotificationPreset(state);
  const selectNotifPreset = (key) => persist({ ...state, settings: { ...(state.settings || {}), notificationLevel: key } });
```

- [ ] **Step 3: Insert the picker into the notifications section**

The notifications `SettingsSection` opens at `components/SettingsView.jsx:1458` and its
first row is `<SettingRow label="System-Nachrichten" ...>` at line 1459. Insert the
picker block **between** them — immediately after the `<SettingsSection ...>` opening
tag, before the `System-Nachrichten` row.

Anchor on the existing first row and prepend the block. Replace:

```jsx
        <SettingRow label="System-Nachrichten" desc="CLI-Nachrichten beim App-Start" value={getSetting("systemMessages", true)} onChange={() => toggleSetting("systemMessages", true)} theme={theme} />
```

with:

```jsx
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>Erinnerungs-Intensität</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, lineHeight: 1.4 }}>
            Wie oft und wie aufdringlich dich das System erinnert. {formatNotificationPresetSummary(notifPreset)}.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {NOTIFICATION_PRESETS.map(p => {
              const active = p.key === notifPreset.key;
              return (
                <button
                  key={p.key}
                  onClick={() => selectNotifPreset(p.key)}
                  aria-pressed={active}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${active ? p.color + "88" : "rgba(255,255,255,0.08)"}`,
                    background: active ? `${p.color}14` : "rgba(255,255,255,0.02)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}66`, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: active ? "#f8fafc" : "#cbd5e1" }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.35 }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
        <SettingRow label="System-Nachrichten" desc="CLI-Nachrichten beim App-Start" value={getSetting("systemMessages", true)} onChange={() => toggleSetting("systemMessages", true)} theme={theme} />
```

- [ ] **Step 4: Verify build + the picker renders**

Run: `npx vite build`
Expected: build succeeds.

Then manual check (the project has no component test harness): open Settings → the
"Benachrichtigungen" section shows four selectable cards (Funkstille / Dezent /
Standard / Intensiv), Standard pre-selected, and the summary line updates on selection.
Note: local Firebase login is currently dead — if you cannot log in, rely on the build
plus a code read; defer device verification.

- [ ] **Step 5: Commit**

```bash
git add components/SettingsView.jsx
git commit -m "$(cat <<'EOF'
feat(notifications): add notification preset picker to settings

A four-card picker (Funkstille/Dezent/Standard/Intensiv) in the
Benachrichtigungen section persists settings.notificationLevel. Calm,
minimal-luxe styling (color dot, no glow) per the design preference.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the new unit test**

Run: `npm run test:notification-presets`
Expected: PASS.

- [ ] **Step 2: Run the existing limits test (no regression in sibling data modules)**

Run: `npm run test:free-limits`
Expected: PASS.

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: succeeds with no errors.

- [ ] **Step 4: Confirm clean tree**

Run: `git status --short`
Expected: empty (everything committed across Tasks 1–5).

---

## Self-Review

**1. Spec coverage:**
- Separate dial, independent of questIntensity → Task 1 module is standalone; no shared state. ✓
- Presets bundle category groups + daily cap + quiet hours → Task 1 preset table + helpers. ✓
- Preset-only (no overrides) → Task 5 picker only sets `notificationLevel`. ✓
- Free for everyone → no premium gating anywhere in the plan. ✓
- Category tiering (13 → 3) → Task 1 `NOTIFICATION_CATEGORIES`; Task 3 tags all 13. ✓
- Preset table incl. Default = standard → Task 1 + Task 2. ✓
- Daily cap (non-essential, essential bypass) → `canFireNotification` + Tasks 3/4 counters. ✓
- Quiet hours (wrap midnight, tier-0 exempt) → `isWithinQuietHours` + `canFireNotification`. ✓
- Gate both delivery paths → Task 3 (foreground) + Task 4 (background). ✓
- Foreground continues past denied checks → Task 3 Step 4 (`continue`, gate before dedup). ✓
- UI preset picker in Settings → Task 5. ✓
- Tests for the pure helpers → Task 1. ✓
- i18n in locale files → **intentionally replaced** by hardcoded German in the preset
  module to match the `questIntensity.js` precedent (documented above). ✓
- Edge cases (unknown level → default; unknown category fail-open) → covered + tested. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows full code. ✓

**3. Type consistency:** `canFireNotification({ presetOrKey, category, firedToday, hour })`
and `getNotificationPreset` / `isEssentialCategory` signatures are used identically in
Tasks 3, 4, and 5. Category keys in `NOTIFICATION_CATEGORIES` (Task 1) match every
`category:` tag added in Task 3 and every `addNotif(..., category)` in Task 4. ✓
