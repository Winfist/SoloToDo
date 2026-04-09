---
type: mechanic
tags:
  - mechanic
  - progression
---
# Leveling-System & EXP-Kurve

Hier dokumentieren wir die Progression. Die Balance ist entscheidend, damit der Nutzer langfristig motiviert bleibt.

## Formel für Level-Ups
> **Benötigte EXP für nächstes Level:** `(Level ^ 1.5) * 100` 
> *(Beispiel, bitte an den echten Code anpassen)*

### Aufgaben-Wertigkeiten
| Rang | Durschn. Dauer | EXP-Yield | Gold-Yield | Drop-Chance |
| :--- | :--- | :--- | :--- | :--- |
| **E-Rang** | 5 Min | 10 EXP | 5 Gold | 1% |
| **D-Rang** | 30 Min | 50 EXP | 20 Gold | 5% |
| **C-Rang** | 1-2 Std | 150 EXP | 50 Gold | 15% |
| **B-Rang** | 1 Tag | 400 EXP | 120 Gold | 30% |
| **A-Rang** | 1 Woche | 1200 EXP | 400 Gold | 60% |
| **S-Rang** | Monat+ | 5000 EXP | 2000 Gold | 100% (Epic) |

## Stat-Points
Bei jedem Level-Up erhält der Spieler **3 Stat-Punkte**, die er in Strength, Agility, Intelligence etc. investieren kann.
- **STR:** Beeinflusst X
- **AGI:** Beeinflusst Y
- **INT:** Beeinflusst Z
