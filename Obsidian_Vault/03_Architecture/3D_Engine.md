---
type: architecture
tags:
  - architecture
  - 3d
  - shader
---
# 🌌 3D Engine & WebGL Integration

SoloToDo nutzt eine immersive 3D-Kulisse auf dem Login/Registrierungs-Screen. Die 3D-Szene wird mit **Three.js** über **React Three Fiber (R3F)** gerendert und läuft voll responsiv auf Desktop und Mobile.

---

## 🏗️ 3D-Komponenten (`3d/components/`)

- **`CorridorWalls.jsx`**: Generiert die Dungeon-Wände, Decken und Bodenelemente unter Verwendung strukturierter Shader und Texturen für eine düstere Atmosphäre.
- **`DungeonGate3D.jsx`**: Das zentrale 3D-Portal, das das Tor zum Dungeon darstellt.
- **`GateParticles.jsx`**: Partikeleffekte, die um das Tor herum wirbeln (Rauch/Funken).
- **`RuneParticles.jsx`**: Magische Runen-Partikel, die aus dem Portal aufsteigen.
- **`PostProcessing.jsx`**: Bloom/Glow-Effekte zur Verstärkung des WebGL-Leuchtens.

---

## 🧪 Custom GLSL Shader (`3d/shaders/`)

Unsere Shader steuern die magischen Portal-Effekte und den atmosphärischen Nebel:
- **`portalGlow.js`**: Ein Shader für das Leuchten und die pulsierende Energie des Tors. Wurde optimiert, um WebGL-Fehler auf iOS/Android-WebViews zu verhindern.
- **`islandPortalVoid.js`**: Berechnet den Portal-Strudel und die Dunkelheit im Zentrum des Tors.
- **`volumetricFog.js`**: Erzeugt volumetrischen, dynamischen Bodennebel im Dungeon-Korridor.

---

## 🎥 Kamera-Steuerung & Scroll-Animation (`3d/hooks/`)

Die Kamera bewegt sich dynamisch basierend auf der Scroll-Tiefe des Nutzers auf dem Anmeldebildschirm:
- **`useScrollCamera.jsx` & `useAuthScrollCamera.jsx`**: Diese Hooks fangen Scroll-Events ab und interpolieren die Kameraposition und -rotation (Kombination aus GSAP/R3F `useFrame`), um eine kinoreife Fahrt durch den Dungeon-Korridor bis direkt vor das Portal zu simulieren.

---

## ⚡ Performance- & Mobil-Optimierung

- **DPR-Drosselung (Device Pixel Ratio)**: Das Canvas-Element nutzt `dpr={[1, 2]}`, um die Render-Auflösung auf hochauflösenden Retina-Displays zu begrenzen und so Überhitzung auf mobilen Endgeräten zu verhindern.
- **Touch/Scroll Event-Throttling**: Mobile Touch- und Scroll-Events werden gedrosselt, um die UI-Thread-Belastung minimal zu halten und Ruckler zu vermeiden.
- **State-Updates im Loop**: Keine zustandsändernden Hooks (wie `setState`) innerhalb des `useFrame`-Renderloops aufrufen. Animationen und Transformationen werden direkt über direkte `ref`-Mutationen an den 3D-Objekten vollzogen.
