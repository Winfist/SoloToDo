---
type: mechanic
tags:
  - mechanic
  - shop
---
# Hunter's Codex & Das Shop-System

Der Hunter's Codex ist das Kompendium aller verfügbaren Upgrades, Items und Titel, die der Spieler durch Gold oder spezielle Boss-Drops (S-Rank Quests) freischalten kann.

## Item-Kategorien im Shop

### 1. Consumables (Verbrauchsgüter)
Kleine Hilfsmittel für den Alltag.
*   **Healing Potion (50 Gold):** "Heilt" einen verpassten Daily Streak.
*   **Mana Elixir (100 Gold):** Gibt für 3 Stunden einen EXP-Boost (+50%).

### 2. Equipment (Kosmetisch & Stats)
*   **Shadow Dagger (500 Gold):** Ändert das Mauszeiger-Design und gibt kleine kritische Treffer bei D-Rang Quests.
*   **Monarch's Cloak (2000 Gold):** Schaltet einen Dark-Mode Shader für das gesamte UI frei.

### 3. Titles (Titel)
Titel erscheinen im Profil und geben passive Buffs.
*   *The Shadow Monarch (Legendär)* - "Alle EXP-Gains sind permanent um 15% erhöht."

## Integration in React (`Codex.jsx` / `Shop.jsx`)
- Shop-Daten sollten idealerweise in Firebase gespeichert sein oder als Konstantenbank im Code liegen.
- **Anti-Exploit:** Käufe müssen serverseitig in den Firestore Rules validiert werden (Hat der User genug Gold?).
