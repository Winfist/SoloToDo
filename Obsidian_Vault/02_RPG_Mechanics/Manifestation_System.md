---
type: mechanic
tags:
  - mechanic
  - focus
---
# Manifestation System

Das Manifestation System ist eng mit dem "Focus Mode" verknüpft. Es ersetzt einen herkömmlichen Pomodoro-Timer durch ein gamifiziertes "Meditation & Affirmation" Minispiel, das zum Dark-Fantasy "System" Setting passt.

## Core Mechaniken (Implementiert)

1. **Manifestation Sessions (`FocusMode.jsx` & `InnerSanctum.jsx`):**
   - Der Hunter wählt eine "Life Domain" (z.B. *Health*, *Wealth*, *Development*).
   - Der Fokus-Modus startet mit wählbaren Timern (25 oder 50 Minuten).
   - Während dieser Zeit wird der Bildschirm abgedunkelt, und beruhigende Ambient-Klänge (Dungeon Ambience, Regen) spielen im Hintergrund ab.

2. **Affirmationen ("System Whisper"):**
   - In regelmäßigen Abständen erscheinen atmosphärische, vom "System" geflüsterte Affirmationen auf dem Bildschirm.
   - Diese Einblendungen nutzen CSS-basierte Text-Fade-In- und -Out-Animationen, um eine meditative Immersion zu schaffen.
   - *Beispiel:* "Dein Geist ist zu einer scharfen Klinge herangewachsen. Die Zeit arbeitet für dich."

3. **Rewards für Manifestation:**
   - Ein erfolgreicher Abschluss erhöht den Level des Heiligtums (`sanctum.level`) und gewährt wertvolle **Willpower** (Willenskraft-Ressource).
   - Zudem kann ein Zeitbuff freigeschaltet werden (z. B. "Hunter's Focus" für +20% EXP auf alle Quests für die folgenden 2 Stunden).

