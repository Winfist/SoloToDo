---
type: mechanic
tags:
  - mechanic
  - focus
---
# Manifestation System

Das Manifestation System ist eng mit dem "Focus Mode" verknüpft. Es ersetzt einen herkömmlichen Pomodoro-Timer durch ein gamifiziertes "Meditation & Affirmation" Minispiel, das zum Dark-Fantasy "System" Setting passt.

## Core Mechaniken (Entwurf)

1. **Manifestation Sessions:**
   - Der Hunter wählt einen "Life Domain" (z.B. *Health*, *Wealth*, *Development*).
   - Der Fokus-Modus startet (25/50 Minuten).
   - Während dieser Zeit wird der Bildschirm abgedunkelt, beruhigende Ambient-Klänge (Dungeon Ambience, Regen) spielen.

2. **Affirmationen ("System Whisper"):**
   - In regelmäßigen Abständen erscheinen vom System generierte Affirmationen (per Claude/LLM generiert oder aus einer Liste).
   - *Beispiel:* "Dein Geist ist zu einer scharfen Klinge herangewachsen. Die Zeit arbeitet für dich."

3. **Rewards für Manifestation:**
   - Erfolgreicher Abschluss gewährt statt normaler EXP "Willpower" oder einen Buff ("Hunter's Focus" -> +20% EXP für die nächsten 2 Stunden).

## Offene TODOS für den Code
- [ ] UI-Integration im `FocusMode.jsx` abschließen.
- [ ] "System Whisper" Animationen (Text-Fade-In und -Out) in CSS/Tailwind implementieren.
