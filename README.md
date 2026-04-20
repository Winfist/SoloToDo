# Arise v2.0

Solo-Leveling-inspiriertes Gamification-System für Produktivität und persönliche Entwicklung.

## Stack

- **React 18** + Vite 5
- **Firebase** (Auth + Firestore)
- **Three.js** / @react-three/fiber (3D-Szenen)
- **GSAP** (Animationen)
- **CSS Custom Properties** (Token-System, 10 Themes)

## Entwicklung

```bash
npm install
npm run dev        # Vite Dev-Server (localhost:5173)
npm run build      # Produktions-Build
```

## Architektur

```
├── components/
│   ├── ui/          # Primitive: Button, Card, Modal, Sheet, etc.
│   ├── layout/      # AppShell, BottomNav, Sidebar
│   └── views/       # DashboardView, StatsAndShadowViews
├── data/
│   ├── tokens.js    # JS Design-Tokens (Spacing, Radius, Motion)
│   ├── gameData.js  # Themes, Shop, Gear
│   └── constants.jsx # Game-Logik + UI-Primitives (wird schrittweise aufgeteilt)
├── hooks/
│   └── useGameState.jsx # Zentraler App-State
├── styles/
│   ├── tokens.css   # CSS Custom Properties (alle 10 Themes)
│   └── base.css     # Reset, Typografie, Utilities
└── 3d/              # Three.js Auth-Szene, Dungeon-Gate, Shaders
```

## Datenpersistenz

- **localStorage**: `sl-todo-v5` (primär)
- **Firestore**: Multiplayer, Guild, Soul-Link, Social
- **Schema-kompatibel**: v1.x → v2.0 ohne Migration

## Themes

10 Themes via `data-theme`-Attribut auf `<html>`:
`default` · `crimson` · `shadow` · `ice` · `golden` · `celestial` · `void` · `dragon` · `starfall` · `blood_sovereign`
