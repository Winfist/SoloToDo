---
name: run-solo-todo
description: Build, run, preview, screenshot, and drive the SoloToDo / "Arise" main app (Vite + React + Capacitor). Use when asked to start the dev server, see/screenshot the UI, render a component past the Firebase login wall, or run the test scripts. Covers the MAIN app only — admin-dashboard, arise-ad, and functions are separate units.
---

SoloToDo ("Arise") is a Vite 5 + React 18 web app (also wrapped for iOS/Android via Capacitor). You drive it with the **Claude Preview MCP** (`preview_*` tools) against the Vite dev server on port **5173** (config `dev` in `.claude/launch.json`).

**The catch that defines this skill:** the root route `/` is gated behind a Firebase login wall and there is **no usable local session** — so `npm run dev` alone shows you nothing but a login screen. The reliable way to see real inner UI is an **isolated harness**: a root-level `*.html` + `*.jsx` that mounts a *real* component with mock props, bypassing auth. The repo ships a working one — [`island-preview.html`](../../../island-preview.html).

All paths below are relative to the repo root (this skill's unit).

## Prerequisites

- **Node + npm.** Verified this session on Node `v22.14.0`, npm `10.9.2` (Windows 11). Node 18+ should be fine (ESM project, `"type": "module"`).
- The **Claude Preview MCP** (`preview_start`, `preview_eval`, `preview_screenshot`, `preview_snapshot`, …). This is the browser driver — there is no custom driver script; the `preview_*` recipe below *is* the harness.

## Setup

```bash
npm install
```

Runs a `postinstall` patch (`patch-health-plugin.js`) that patches the Capacitor health plugin's Swift source. It is **idempotent** — on a repo that's already patched it prints `Fix already applied … Skipping` and exits clean (`up to date, audited 1268 packages`). `npm audit` reports ~25 known advisories; ignore for local run.

## Run (agent path) — preview + drive

This is the section to actually use. The flow is: **start the server → confirm `/` is the auth wall → drive an isolated harness → screenshot.**

**1. Start the dev server** with the Preview MCP (never `Bash`):

> `preview_start` with `name: "dev"` → returns a `serverId`; Vite serves on `http://localhost:5173` (`ready in ~1.2s`).

**2. `/` is the login wall — expected, not a bug.** A `preview_snapshot` of `/` shows `VANGUARD AUTHENTICATION REQUIRED` with `EINLOGGEN` / `REGISTRIEREN` / `Google` / `Apple` buttons. **Do not try to log in** — there is no session and no emulator (see Gotchas). Move to step 3.

**3. Drive an isolated harness to see real UI.** Navigate the preview to the shipped example with `preview_eval`:

```js
(() => { window.location.href = '/island-preview.html'; return 'navigating'; })()
```

**4. The harness entry compiles on first load — confirm it rendered before screenshotting.** Re-run `preview_eval` until `#root` has children (a fresh Vite MPA entry can take a beat, and a too-early snapshot is blank):

```js
(() => {
  const root = document.getElementById('root');
  return JSON.stringify({
    url: location.href,
    rootChildren: root ? root.children.length : 'no root',
    rootFirstClass: root?.firstElementChild?.className ?? null,
    viteError: document.querySelector('vite-error-overlay') ? 'ERROR overlay present' : null,
  });
})()
```

Expect `rootChildren: 1`, `rootFirstClass: "hunter-island hunter-island--apps"`, `viteError: null`.

**5. Screenshot** with `preview_screenshot` (pass the `serverId`). For `island-preview.html` this session it produced the full "HUNTER-INSEL" hub — ARSENAL / PORTAL-DOCK / HUNTER INTEL cards, with the `SHADOW ARMY` level-lock and `PRO` badges that the harness props deliberately demo. **Look at the screenshot** — if it's the login wall or blank, you skipped step 4.

### Isolated harness recipe (to preview a *different* component)

Copy the [`island-preview.jsx`](../../../island-preview.jsx) pattern — it's the source of truth. The shape:

```jsx
import { createRoot } from "react-dom/client";
import SomeRealComponent from "./components/.../SomeRealComponent.jsx";
import { translate } from "./data/i18n.js";

const tr = (key, params) => translate("de", key, params);
// Feed mock props — fake the `state`, `can(feature)`, `theme`, handlers, etc.
function Harness() {
  return <SomeRealComponent state={/* mock */{}} can={() => true} tr={tr} /* … */ />;
}
createRoot(document.getElementById("root")).render(<Harness />);
```

Its HTML wrapper ([`island-preview.html`](../../../island-preview.html)) must import the design system or the component renders unstyled:

```html
<html lang="de" data-theme="default">
  <link rel="stylesheet" href="/styles/tokens.css" />
  <link rel="stylesheet" href="/styles/base.css" />
  <div id="root"></div>
  <script type="module" src="/your-harness.jsx"></script>
```

Vite serves any root-level `your-harness.html` at `/your-harness.html`. **Keep throwaway harness files untracked** so a `git commit -am` can't accidentally grab them (delete them when done). `island-preview.*` is the exception — it's committed on purpose as the reference.

## Run (human path)

```bash
npm run dev      # → Vite on http://localhost:5173, but you land on the login wall.
```

Useless for seeing the inner app without real credentials / a device build. Agents should use the harness path above. Stop the Preview MCP server with `preview_stop` (pass the `serverId`).

## Test

```bash
npm run validate:quests
```

Verified this session → `Total quests: 180` … `✓ Quest validation passed`. There's a family of standalone Node test scripts in `package.json` (`scripts/test-*.mjs`), run the same way: `npm run test:free-limits`, `test:notification-presets`, `test:quest-verification`, `test:hidden`, `test:redemption`, etc. They're plain `node` scripts (no test runner) and exit non-zero on failure.

## Gotchas

- **`/` only ever shows the login wall — there is no session to hydrate.** Checked the preview's IndexedDB this session: `firebaseLocalStorageDb` exists but its `firebaseLocalStorage` store is **empty**, and `localStorage` has zero keys. The app talks to the **live** Firebase backend (no local auth emulator), so there's no headless login path. An older note claimed "reload and the real app hydrates from a persisted session" — that session is **gone**; don't rely on it. → Always use an isolated harness for inner UI.
- **Fresh harness entry → blank `#root` on the first snapshot.** Vite compiles each MPA entry (`*.html`) on first navigation. Poll the readiness check (step 4) before `preview_screenshot`; don't `sleep`.
- **Harness HTML must import `/styles/tokens.css` + `/styles/base.css` and set `data-theme` on `<html>`**, or real components render unstyled (no theme tokens).
- **`preview_click` has been unreliable for React handlers here in past UI-driving sessions** — a programmatic `el.click()` via `preview_eval` is the fallback, and React state reads are stale if read in the *same* eval as the action (use a second round-trip). This session only needed `preview_eval` navigation, which worked first try.
- **Multi-app repo.** This skill is the **main app** only. `admin-dashboard/` has its own build (`cd admin-dashboard && npm run build`), `arise-ad/` is a separate static-teaser pipeline, `functions/` is Firebase Cloud Functions. Don't conflate them.

## Troubleshooting

- **Snapshot of `/` shows `VANGUARD AUTHENTICATION` and you wanted the app**: expected — that's the auth wall. Navigate to an isolated harness (step 3); don't try to authenticate.
- **`#root` empty / `rootChildren: 0` right after navigating to a harness**: Vite is still compiling that entry. Re-run the step-4 readiness eval until `rootChildren` ≥ 1, then screenshot.
- **`viteError: "ERROR overlay present"`**: your harness `.jsx` threw (bad import path or a prop the component dereferences). Read `preview_logs` / `preview_console_logs` (with the `serverId`) for the stack, fix the harness, it HMR-reloads.
- **Port 5173 already serving / `reused: true`**: a dev server is already up; reuse its `serverId` (`preview_list`) instead of starting a second one.
