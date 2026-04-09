---
type: architecture
tags:
  - architecture
  - docs
---
# 🏗️ Coding Guidelines & Best Practices

Diese Datei definiert die Regeln für AI-Agenten und die eigene Code/Entwicklung an SoloToDo.

## 1. 3D & WebGL (React Three Fiber)
*   **Performance First:** Niemals auf jedem Frame Render-Calls blockieren (z.B. komplexe State-Updates in `useFrame`).
*   **Responsive 3D:** Das Canvas-Element muss `dpr={[1, 2]}` nutzen, um auf Retina/Mobile gut auszusehen, aber nicht abzustürzen.
*   **Touch-Events:** Bei mobilen Geräten explizit Event-Listener drosseln (`Touch/Scroll`).

## 2. React State (Frontend)
*   **Kein Prop-Drilling:** Für weit verteilte Stati (wie Level-Up Benachrichtigungen, Player-State) eigene Hooks (wie `useGameState`) nutzen oder Zustand hochheben - idealerweise Context API oder Zustand (Zustand-Library).
*   **CSS:** Utility Classes mit Tailwind. Eigene CSS (`index.css`) nur für komplexe Animationen & Glassmorphismus verwenden.
*   **Komponenten-Aufteilung:** `solo-leveling-v5.jsx` sollte nicht noch größer werden. Wo immer möglich in kleinere, eigenständige Komponenten (`GateParticles.jsx`, `SystemCoach.jsx`) aufteilen!

## 3. Firebase (Backend)
*   **Anti-Cheat-Methodik:** Frontend UI versteckt Optionen, aber **Firestore Security Rules** verhindern den Hack aktiv.
*   Kein Dokument löschen, immer ein `isDeleted: true` oder `status: "archived"` setzen für "Weiches Löschen" (wichtig für den Activity-Graph & Analytics).
