# Notification Settings (Penetrance Presets) - Design

- **Date:** 2026-06-02
- **Status:** Approved for implementation
- **Scope:** User-facing notification intensity presets only

## Goal

Give the user control over how penetrant / frequent the app's reminder notifications
are, through a small set of presets. Today all 13 reminder types fire on hardcoded
time windows and conditions with no user control. This feature adds one free,
preset-only dial that gates which reminder categories fire, caps the daily count, and
applies quiet hours — across both notification delivery paths.

## Locked Decisions

These were settled during brainstorming and are not open for re-litigation in the plan:

1. **Separate dial.** The notification dial is independent of the existing
   `QUEST_INTENSITY_PRESETS` (Baby Gate → Monarch Call), which only controls system
   quest *generation* and is Pro-gated. The two systems share neither state nor logic.
2. **Presets bundle category groups + daily cap + quiet hours.** Sound and haptics stay
   the existing independent toggles in Settings.
3. **Preset-only.** No per-category manual overrides and no user-editable quiet-hours
   window in this iteration (see Deferred).
4. **Completely free.** All presets are available to every user. Reducing notifications
   must never sit behind a paywall.

## Architecture

Data-driven, mirroring `data/questIntensity.js` and `data/freeLimits.js`.

- **`data/notificationPresets.js`** — single source of truth, zero imports so it stays
  trivially unit-testable:
  - `NOTIFICATION_CATEGORIES` — map of category key → tier (0/1/2).
  - `NOTIFICATION_PRESETS` — array of preset objects (see Preset Table).
  - `DEFAULT_NOTIFICATION_PRESET_KEY = "standard"`.
  - Pure helpers:
    - `getNotificationPreset(value)` — resolves a preset from a key string or from
      `state.settings.notificationLevel`; falls back to the default for unknown/missing.
    - `isCategoryEnabled(presetKey, category)` — tier rule plus per-preset `plus`/`minus`
      overrides (see below).
    - `isWithinQuietHours(now, preset)` — handles windows that wrap past midnight.
    - `canFireNotification({ presetKey, category, firedToday, now })` — combines
      category-enabled + quiet-hours + daily-cap into one allow/deny, with the essential
      bypass applied.
- **`components/NotificationManager.jsx`** — gated on *both* delivery paths:
  - `runReminderChecks(state)` (foreground, every 5 min).
  - `scheduleBackgroundNotifications(state)` (background, pre-scheduled).
- **Setting storage:** `state.settings.notificationLevel` (string key). No migration
  script — the getter defaults to `"standard"` when the field is absent.

*(Rejected alternative: inline conditionals in NotificationManager — not unit-testable,
breaks the established data-module pattern.)*

## Category Tiering

Each of the 13 reminder checks is tagged with a stable `category`. The `tag` field today
is already category-like; we add an explicit `category` field to each check's return
object and to each background `addNotif` call.

| Tier | Categories (check → key) |
|---|---|
| **0 · Essential** | custom reminders (`custom_reminder`) · due today/overdue (`due_warning`) · emergency expiring (`emergency_expiry`) · Kalender-Rune deadline (`rune_deadline`, only with artifact) |
| **1 · Nudges** | due tomorrow (`due_upcoming`) · habit open (`habit_nudge`) · weekly summary (`weekly_summary`) · gate reset (`gate_reset`) · weekly quest expiry (`weekly_expiry`) · emergency morning heads-up (`emergency_morning`) |
| **2 · Pressure** | daily activity, up to 3×/day (`daily_activity`) · streak protection (`streak_protection`) · late-night energy (`late_night`) |

`isCategoryEnabled(presetKey, category)`:
1. If `category ∈ preset.minus` → `false`.
2. If `category ∈ preset.plus` → `true`.
3. Else → `tier(category) <= preset.maxTier`.

## Preset Table

| key | label (de) | maxTier | plus | cap/day | quiet hours |
|---|---|---|---|---|---|
| `funkstille` | Funkstille | 0 | — | — ¹ | 21–9 |
| `dezent` | Dezent | 1 | — | 3 | 22–8 |
| `standard` ⭐ | Standard | 1 | `["streak_protection"]` | 5 | 22–8 |
| `intensiv` | Intensiv | 2 | — | 8 | 0–7 |

- ¹ Funkstille fires only tier-0, which bypasses the cap, so a numeric cap would never
  bite. Tier-0 volume is naturally low (one per type per day), so this is intentional.
- **Default = `standard`** (applied via the getter; covers existing and new users). For
  existing users this is a slight *reduction* vs. today (the 3×/day `daily_activity` nag
  drops out) — an intentional, pro-user behavior change. If zero behavior change for
  existing users is preferred instead, change `DEFAULT_NOTIFICATION_PRESET_KEY` to
  `"intensiv"` (closest to today's behavior). Recommended: `standard`.
- **Names are swappable.** Alternatives discussed: thematic (`Tarnung · Späher ·
  Patrouille · Jagdmodus`) or plain (`Minimal · Wenig · Standard · Viel`). Final German
  strings live in i18n and must use correct umlauts.

## Daily Cap Mechanic

- The cap counts **non-essential** notifications (tier ≥ 1) fired today. Tier 0 always
  fires and bypasses the cap (a real deadline must never be dropped because "5 pings
  reached").
- **Foreground:** a per-day counter in localStorage, e.g. `sl_notif_count_<YYYY-MM-DD>`
  (date key via `getToday()`), checked before firing a non-essential and incremented on
  fire. Reuses the existing per-tag dedup (`wasAlertSentToday`) unchanged.
- **Background:** the cap is enforced at schedule time — schedule essentials first, then
  up to `cap` non-essentials in priority order; drop the rest.
- The cap is applied independently within each delivery path. Precise global accounting
  across foreground + background is out of scope (see Deferred).

## Quiet Hours Mechanic

- `quietStart` / `quietEnd` are integer hours; the window may wrap midnight (e.g. 22→8).
  `isWithinQuietHours` handles the wrap.
- Quiet hours suppress **tier ≥ 1 only**. Tier 0 (`custom_reminder`, `due_warning`,
  `emergency_expiry`, `rune_deadline`) still fires — user-set reminders and time-critical
  alerts must respect their own time, not a global mute.
- Quiet hours stack on top of each check's existing per-check hour windows (it is an
  outer gate, never a widener).
- **Foreground:** skip non-essential firing while within quiet hours.
- **Background:** do not schedule a non-essential notification whose `at` falls within
  quiet hours.

## Integration Points

- `runReminderChecks(state)`: resolve the preset once; for each check result, read its
  `category` and apply `canFireNotification(...)`. On deny, **`continue` to the next
  check** rather than returning — otherwise a capped/disabled non-essential early in the
  list would shadow an essential later in the list (e.g. `emergency_expiry`). On an
  allowed non-essential fire, increment the daily counter.
- `scheduleBackgroundNotifications(state)`: extend `addNotif(title, body, at, category)`;
  apply the same gating (category-enabled + quiet-hours + remaining cap) inside it.
  Schedule essentials first, then non-essentials in the existing schedule order until the
  cap is reached.
- No change to the FCM push-token flow or the permission request flow.

## UI

In `SettingsView.jsx`, the existing "Benachrichtigungen" section (`openSection ===
"notif"`):

- Add a **preset picker**: four cards mirroring the quest-intensity card pattern
  (label, icon, short description, selected state). Selecting one persists
  `settings.notificationLevel` via the existing `persist` path.
- Show the active preset's effective summary (e.g. "max 5/Tag · Ruhe 22–8 Uhr").
- Keep the existing `systemMessages` / `haptics` toggles and the test-notification
  button.
- Reuse `SettingsSection`; follow the `SettingRow` visual language. Respect the user's
  premium / minimal-luxe preference (no neon/glow gimmickry).
- If OS notification permission is not granted, surface the existing permission CTA so a
  preset choice is not silently inert.

## i18n

- Add preset labels, descriptions, and the section summary copy to `data/locales/de.js`
  and `data/locales/en.js`. German strings must use correct umlauts (this feature ships
  right after a stripped-umlaut cleanup — do not regress).

## Testing

- Unit tests for the pure helpers in `data/notificationPresets.js`, in the project's
  existing test style (cf. the Free/Pro rebalance test scripts):
  - `isCategoryEnabled` across every preset × category combination, including the
    `standard` + `streak_protection` `plus` exception.
  - `isWithinQuietHours` including a midnight-wrapping window and boundary hours.
  - `canFireNotification` cap behavior, including the tier-0 bypass.
  - `getNotificationPreset` fallback for unknown / missing keys.

## Edge Cases

- Missing or unknown `notificationLevel` → default `standard`.
- Quiet-hours window wrapping midnight.
- Essential (tier 0) bypasses both the cap and quiet hours.
- OS permission denied → presets are moot; the UI shows the permission CTA.
- Cap accounting is per-delivery-path (foreground/background), not globally exact.

## Deferred

- Per-category manual overrides / a user-defined custom preset.
- User-editable quiet-hours window.
- Per-preset urgency (sound / vibration / priority / lockscreen visibility).
- Precise global cap accounting across foreground and background delivery.
- Any Pro-gated "extra intense" tier or premium notification styling.
