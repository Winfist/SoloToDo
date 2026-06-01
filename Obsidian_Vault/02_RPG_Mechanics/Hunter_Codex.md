---
type: mechanic
tags:
  - mechanic
  - shop
---
# Hunter's Codex & Das Shop-System

Der Hunter's Codex ist das Kompendium aller verfügbaren Upgrades, Items und Titel, die der Spieler durch Gold oder spezielle Edelsteine (Gems) freischalten kann. 

Die Shop-Systeme sind zweigeteilt: der reguläre **Gold-Shop** (`SHOP_ITEMS`) und der exklusive **Gem-Shop** (`GEM_SHOP_ITEMS`). Beide Käufe werden über Firebase Firestore Security Rules serverseitig abgesichert (Kontostand-Prüfung).

---

## 🪙 Gold-Shop (`SHOP_ITEMS`)

Hier kauft der Hunter Gegenstände mit der im Spiel verdienten Gold-Währung.

### 1. Consumables (Verbrauchsgüter)
Kleine Hilfsmittel für den Überlebenskampf:
*   🧪 **Elixir of Recovery (`potion_heal` / 150 Gold):** Heilt einen gebrochenen Streak sofort und löscht eventuelle Strafen (wie *Shadow Regression*).
*   📋 **Extra Task Slot (`extra_slot` / 100 Gold):** Schaltet für den heutigen Tag einen zusätzlichen Aufgaben-Slot frei (+1 Tagesaufgabe).

### 2. Titel (Kosmetisch & Status)
Titel werden im Profil angezeigt:
*   👑 **Shadow Monarch (500 Gold)** - *Der König der Schatten*
*   🌑 **ARISE! (300 Gold)** - *Erwecke deine Armee*
*   ⚔️ **S-Rank Hunter (1000 Gold)** - *Die Elite unter den Jägern*
*   🛡️ **Sovereign (2000 Gold)** - *Herrscher über alles*

### 3. Themes (Farbpaletten für das Interface)
Passt die Farbvariablen (`data-theme`) der App an:
*   🔴 **Crimson Gate (400 Gold):** Rotes Portal-Theme
*   🟣 **Shadow Realm (600 Gold):** Violettes Schatten-Theme
*   🔵 **Ice Monarch (800 Gold):** Eisblaues Frost-Theme
*   🟡 **Ruler's Authority (1200 Gold):** Goldene Macht

---

## 💎 Gem-Shop (`GEM_SHOP_ITEMS`)

Exklusiver Shop für Edelstein-Transaktionen (Echtgeld/Premium-Drops).

### 1. Boosters (EXP- & Beutevorteile)
*   **XP Surge Crystal (15 Gems):** +50% EXP für 2 Stunden.
*   **Gold Rush Fragment (12 Gems):** +75% Gold für 2 Stunden.
*   **Double Drop Token (25 Gems):** Doppelte Dungeon-Drops für 24 Stunden.
*   **Streak Shield Crystal (20 Gems):** 3 Tage absoluter Streak-Schutz.
*   **Mega XP Elixir (50 Gems):** +100% EXP für 24 Stunden.

### 2. Premium-Themes (80 bis 200 Gems)
*   **Celestial Monarch (80 Gems):** Gold/Weiß
*   **Void Emperor (80 Gems):** Deep-Lila
*   **Dragon's Breath (120 Gems):** Orange/Rot
*   **Starfall (120 Gems):** Kosmischer Sternenhimmel
*   **Blood Sovereign (200 Gems):** Blutrot

### 3. Premium-Titel (40 bis 150 Gems)
Erhöhen das Ansehen des Hunters:
*   *Monarch of Shadows* (40 Gems)
*   *Celestial Hunter* (50 Gems)
*   *Dragon Slayer* (60 Gems)
*   *Void Walker* (80 Gems)
*   *The Absolute Being* (150 Gems)

### 4. Premium Page Transitions (Spezialeffekte beim Screen-Wechsel)
Bringen dynamische Shader und CSS-Animationen beim Seitenwechsel:
*   **Shadow Step (35 Gems):** Lautloser Blink mit Speed-Cuts.
*   **Red Gate Breach (60 Gems):** Ein rotes Dungeon-Tor reisst die Realität auf.
*   **Frost Monarch Seal (60 Gems):** Eisige Runen mit Glass-Shatter-Effekt.
*   **Dragon's Breath (95 Gems):** Flammenkreis und Aschefunken.
*   **Celestial Judgment (120 Gems):** Goldene Lichtlanzen und Herrscher-Geometrie.
*   **System Override (140 Gems):** Terminal-Glitches und Hex-Fragmente.
*   **Eclipse Monarch (220 Gems):** Eclipse-Animation mit Schattenkrone.

### 5. Shadow-Kosmetika & Bequemlichkeiten
*   **Shadow Auras (Crimson / Celestial / Void - je 30 Gems):** Ändert die Aurenfarbe deiner Schattenarmee.
*   **Ancient Nameplate (20 Gems):** Antike Namensschilder für deine Schatten.
*   **Quest Timer Skip (5 Gems):** Wartezeit einer Quest überspringen.
*   **Premium Quest Slot (8 Gems):** Permanenter Extra-Slot.
*   **Dungeon Refresh (10 Gems):** Sofort neue Dungeons generieren.
*   **Shadow Rename Token (15 Gems):** Benenne einen Schatten um.
*   **Stat Reset Scroll (30 Gems):** Alle Stat-Punkte zurücksetzen.
*   **Path Reset Crystal (40 Gems):** Setzt die gewählten Life Domains zurück (max. 1x/Woche).

