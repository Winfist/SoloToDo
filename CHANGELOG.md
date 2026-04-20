# Changelog

## [2.0.0] — 2026-04-20

### Added
- **Design-Token-System** (`data/tokens.js`, `styles/tokens.css`, `styles/base.css`)
  — CSS Custom Properties für alle 10 Themes, Spacing, Radius, Typo, Shadows, Motion
- **UI-Primitive-Bibliothek** (`components/ui/`)
  — Button, Card, Modal, Sheet, ProgressBar, StatBar, Chip, Tabs, Input, Toast, Tooltip
- **Layout-Komponenten** (`components/layout/`)
  — AppShell, BottomNav (v2, token-basiert, Safe-Area), Sidebar (Desktop ≥1024px)
- **Google Fonts** als `<link>` in `index.html` (statt langsamem CSS `@import`)
- **Theme-Sync** via `document.documentElement.dataset.theme` in `useGameState.jsx`
  — CSS Custom Properties reagieren live auf Theme-Wechsel
- **Code-Splitting** via `React.lazy` + `React.Suspense` für 10 heavy Komponenten:
  StoryView, MultiplayerMode, AnalyticsDashboard, InnerSanctum, SeasonView,
  SoulLinkView, DawnDuskProtocol, CharismaDungeonsView, ShadowRegressionCinematic,
  PageTransition, RewardedAdModal, DoubleDungeonTutorial
- Neue `viewport-fit=cover` Meta-Tag + Safe-Area-Inset-Support
- `prefers-reduced-motion`-Basis in `styles/base.css`
- Skeleton-Shimmer-Utility (`.skeleton`) in `styles/base.css`
- Tabular-Nums-Utility (`.tabular-nums`) für Stats/XP/Gold-Anzeigen

### Changed
- `index.html`: Title → **Arise v2.0**, `data-theme="default"` auf `<html>`
- `data/gameData.js` THEMES: additiv um `spacing`- und `radius`-Keys erweitert (abwärtskompatibel)
- `data/css.js`: duplizierter `@import url(...)` und Reset entfernt (jetzt in `styles/base.css`)
- `AuthScreen.jsx`: duplizierter `@import url(...)` entfernt
- `BottomNav` in `solo-leveling-v5.jsx`: inline IIFE durch `<BottomNav>` Komponente ersetzt
- `main.jsx`: Loading-Screen nutzt CSS Custom Properties statt Hardcoded-Werte

### Migration
Keine User-Daten-Migration nötig. `localStorage` (`sl-todo-v5`) und Firestore-Schema unverändert.
Alle bestehenden Themes, Quests, Shadows, Equipment, Jobs, Achievements, Habits und Goals bleiben erhalten.
