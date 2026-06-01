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

## 4. WebGL & Shader-Sicherheit
*   **Fehler-Toleranz:** Alle 3D/WebGL Shader (z. B. `portalGlow.js`) müssen Fehler abfangen. Wenn ein Shader auf manchen Mobile-Browsern (z. B. alten iOS-WebViews) fehlschlägt, muss dies im `onError`-Ereignis des Canvas- oder Video-Elements abgefangen und der Player oder Effekt sauber ausgeblendet werden, anstatt die App abstürzen zu lassen.
*   **Kein State-Update in useFrame:** Updates im Render-Loop zwingend über direkte `ref`-Mutationen vollziehen. React-Zustände (`useState`) dürfen nicht zyklisch in `useFrame` aktualisiert werden.

## 5. i18n & Lokalisierung (DE/EN)
*   **Paritäts-Regel:** SoloToDo ist vollständig zweisprachig. Jeder neu angelegte Text-Key in `data/locales/de.js` muss zwingend ein Pendant mit identischer Struktur in `data/locales/en.js` besitzen.
*   **Umlaute:** Strings in den Sprachdateien müssen saubere UTF-8-Umlaute verwenden (z. B. `Ä`, `Ö`, `Ü`, `ä`, `ö`, `ü`, `ß`). Keine Escapes oder Unicode-Hex-Einträge mischen.

## 6. Quest-Pool & Validierung
*   **Konsistente IDs:** Bestehende Quest-IDs in `data/questPool.js` (z. B. `qp_str_01`) dürfen nicht geändert werden (Rückwärtskompatibilität).
*   **Validierungsskripte ausführen:** Vor jedem Commit, der Quests oder Übersetzungen anfasst, muss das Validierungsskript ausgeführt werden:
    ```bash
    npm run validate:quests
    ```
    Das Skript prüft die Struktur der Quests, fehlende EN-Übersetzungen und ID-Kollisionen.

