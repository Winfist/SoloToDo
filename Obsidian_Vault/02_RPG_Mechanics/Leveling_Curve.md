---
type: mechanic
tags:
  - mechanic
  - progression
---
# Leveling-System & EXP-Kurve

Die progressionstechnische Balance sorgt für die langfristige Motivation des Hunters. Jede erledigte Quest bringt Erfahrungspunkte (EXP) und Gold, was zu Level-Ups führt.

## 📈 Benötigte EXP pro Level-Aufstieg

Die benötigte EXP hängt direkt vom aktuellen Hunter-Rang ab (definiert in `data/gameData.js`):
- **E-Rang** (Level 1–10): **100 XP** pro Level
- **D-Rang** (Level 11–20): **250 XP** pro Level
- **C-Rang** (Level 21–35): **500 XP** pro Level
- **B-Rang** (Level 36–50): **900 XP** pro Level
- **A-Rang** (Level 51–70): **1.500 XP** pro Level
- **S-Rang** (Level 71–90): **3.000 XP** pro Level
- **National Level** (Level 91–100): **6.000 XP** pro Level

---

## ⚔️ Quest-Wertigkeiten (Basis-Belohnungen)

| Rang | Ø Dauer | EXP-Yield | Gold-Yield | Drop-Chance |
| :--- | :--- | :--- | :--- | :--- |
| **E-Rang** | 5 Min | 10 EXP | 5 Gold | 1% |
| **D-Rang** | 30 Min | 50 EXP | 20 Gold | 5% |
| **C-Rang** | 1-2 Std | 150 EXP | 50 Gold | 15% |
| **B-Rang** | 1 Tag | 400 EXP | 120 Gold | 30% |
| **A-Rang** | 1 Woche | 1200 EXP | 400 Gold | 60% |
| **S-Rang** | Monat+ | 5000 EXP | 2000 Gold | 100% (Epic) |

---

## 🧬 Stat-Points & Attribute

Bei jedem Level-Up erhält der Spieler **1 Stat-Punkt** (berechnet in `helpers.js:calculateLevelUp`), den er frei verteilen kann.

### ⚔️ Strength (STR)
*   **Dungeon-Voraussetzungen:** Bestimmte Gates erfordern STR (z. B. Goblin Lair: 5 STR, Iron Fortress: 12 STR, Monarch's Domain: 90 STR).
*   **Kampf-Erfolg:** Erhöht die Siegeschance im Dungeon, wenn die "Aggressive" Kampfstrategie gewählt wird.
*   **Ausrüstung:** Ermöglicht das Tragen mächtiger Waffen (z. B. *Demon King's Blade*).

### 🧠 Intelligence (INT)
*   **Dungeon-Voraussetzungen:** Erforderlich für magische Gates (z. B. Cursed Forest: 5 INT, Void Rift: 40 INT).
*   **Taktik-Erfolg:** Erhöht die Siegeschance mit "Tactical" Kampfstrategie.
*   **Spezial-Interaktion:** Ein INT-Wert von $\ge 15$ löst Puzzle-Räume im Dungeon automatisch ohne Ausdauerverlust auf ("Mana-Rätsel entschlüsselt").

### 🛡️ Vitality (VIT)
*   **Dungeon-Voraussetzungen:** Erforderlich für defensive Überlebens-Dungeons (z. B. Dark Cave: 5 VIT, Ice Palace: 25 VIT).
*   **Defensiv-Erfolg:** Erhöht den Erfolg bei defensiven Strategien und verringert erlittenen Schaden.

### ⚡ Agility (AGI)
*   **Dungeon-Voraussetzungen:** Erforderlich für Tempogates (z. B. Rat King's Den: 5 AGI, Thunder Gate: 25 AGI).
*   **Geschwindigkeits-Erfolg:** Boostet die "Swift" Kampfstrategie.
*   **Fallen ausweichen:** Ein AGI-Wert von $\ge 15$ weicht Dungeon-Fallen komplett aus ("Fallen blitzschnell umgangen").

### 👥 Charisma (CHA)
*   **Dungeon-Voraussetzungen:** Erforderlich für Endgame-Bündnisse (z. B. Blood Altar: 15 CHA, Monarch's Domain: 70 CHA).
*   **Gilden- & Social-Synergie:** Verstärkt Gildenboni und passive Multiplikatoren.
*   **Charisma Dungeons:** Bestimmte CHA-Werte schalten dauerhaft storybasierte Charisma-Dungeon-Ketten frei.

---

## 🔮 Stat-Skill-Meilensteine (`data/gameData.js`)

Beim Erreichen bestimmter Attributwerte (10 und 25) werden mächtige passive Fähigkeiten freigeschaltet:

| Stat | Wert 10 (Skill) | Effekt | Wert 25 (Skill) | Effekt |
| :--- | :--- | :--- | :--- | :--- |
| **STR** | *Power Strike* | +5% XP aus STR-Quests | *Berserker Instinct* | +15% XP aus Hard & Boss Quests |
| **INT** | *Quick Learner* | +5% XP aus INT-Quests | *Tactical Mind* | +10% Dungeon-Erfolgschance |
| **VIT** | *Resilience* | +1 Tag Streak-Schutz | *Iron Will* | +2 Tage Streak-Schutz |
| **AGI** | *Swift Fingers* | +5% Gold aus allen Quests | *Shadow Step* | +10% Erfolg bei AGI-Strategie |
| **CHA** | *Sovereign Presence* | +3% XP global | *Commanding Aura* | Schatten-Bossquests +30% XP |

