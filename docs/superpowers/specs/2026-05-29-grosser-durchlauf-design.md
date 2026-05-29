# Großer Durchlauf — Design (2026-05-29)

Ein zusammenhängender Verbesserungs-Durchlauf über sechs Bereiche. Reihenfolge der
Umsetzung: 1 → 5(Bugfix) → 3 → 2 → 4 → 6(Ausbau) → 7(Widgets).

## 1. Text / UTF-8 & „abgeschloppt" + senkrechtes S

**Ursache:** Kein echtes Mojibake, sondern Ligatur-Schrift. `--font-mono`
(JetBrains Mono / Fira Code) bildet bei Versalien wie „ABGESCHLOSSEN" das Doppel-S
als Ligatur (langes ſ) → wirkt „senkrecht / abgeschloppt".

**Fix:**
- Ligaturen auf Display-/Mono-Text abschalten:
  `font-variant-ligatures: none; font-feature-settings: "liga" 0,"clig" 0,"dlig" 0,"hlig" 0,"calt" 0;`
  als Utility bzw. an den `--font-mono`/`--font-display`-Stellen (tokens.css).
- Echter Mojibake-Audit über `data/locales/de.js` + Komponenten; gemischte
  Escapes (`NÄCHTE` vs. rohes `EINGESCHRÄNKTER` in NativeStatsDashboard)
  auf korrekte UTF-8-Umlaute vereinheitlichen.

## 2. Completion-Popups schöner (Quest + Tappe/Habit + Sport)

- `rewardFlowBuilders.js`: Reward-Icons (⚔ ◈ ↑ 🔗 ★ ⚡ ✗) auf eigene
  `/icons/*.webp` umstellen. `UnifiedResultModal` rendert `<img>` statt Glyph.
- Task-Complete-Popup („sehr langweilig"): reicheres Layout — eigenes Icon,
  klarere Belohnungszeilen, dezente Premium-Animation.
- Sport/Exercise-View aufhübschen (eigenes Icon-Set, sauberere Karten).

## 3. Emojis → eigene Icons app-weit

Überall ersetzen, wo ein passendes Icon in `data/icons.js` existiert:
Reward-Flows, SystemCoach (auf vorhandenes `iconSrc` umschalten), Toast (✓✕⚠ℹ),
Widget-Module. Wo kein passendes Icon existiert, bleibt der bestehende Glyph.

## 4. System-Nachricht: schönere Animation

Aktuell hartes „Reinploppen". Stattdessen sanftes Eintreten
(slide-down + fade + leichter scale/blur-in), dezenter Premium-Look —
kein Neon/Glow-Gimmick (gemäß Design-Linie).

## 5. HealthSync — erst Bugfix, dann Ausbau

**Bug:** `NativeStatsDashboard.loadNativeData()` schreibt unbedingt `0` in die UI
bei fehlgeschlagenem/leerem Fetch, während `useGlobalHealthSync` die gecachten
Werte im Hintergrund am Leben hält (deshalb sieht man beim Rein-/Rausgehen die
Schritte wieder). `healthService` ruft bewusst nie automatisch
`requestAuthorization` auf (friert iOS-WebView ein); „Health verbinden" ruft
`authorize()` mit stillem Catch.

**Bugfix:**
- Keine `0` mehr bei fehlgeschlagenem/leerem Fetch — gecachte Werte bleiben.
  Nur bei echtem Erfolg überschreiben.
- „Keine Daten erkannt" nur, wenn wirklich nie Daten kamen.
- „Health verbinden" gibt echtes Feedback (Erfolg/Fehler-Toast).

**Ausbau danach:** Letzter-Sync-Zeitpunkt, Stundenverlauf der Schritte,
klarere Status-Anzeige, mehr Detail.

## 6. Widgets — Schritte integrieren + Lock-Screen

- Datenbrücke existiert bereits (`widgetData.health = { steps, sleep }`, decodiert
  in `WidgetHealth`). Home-Screen-Views (`Medium`/`Large`, ggf. `Small`) bekommen
  eine Schritte-Zeile/-Kachel (Icon + Schritte + Tagesziel-Fortschritt).
- Lock-Screen: Schritte in die bestehenden Accessory-Widgets aufnehmen
  (Rectangular-Zeile bzw. Circular-Schritte-Ring-Variante).
