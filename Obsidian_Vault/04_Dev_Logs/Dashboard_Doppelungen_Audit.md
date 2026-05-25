---
type: audit
tags:
  - dashboard
  - ui-polishing
  - redundancy
date: 2026-05-25
---
# Dashboard-Doppelungen Audit

Ziel: Wiederholungen auf dem Dashboard und angrenzenden Flows sammeln, bevor wir entscheiden, was Header, Dashboard, Detailseiten und Module jeweils wirklich zeigen sollen.

## Dashboard: klare Doppelungen

- Level / Rank-Status
  - TopBar zeigt den Rang mit Level-Badge.
  - Dashboard-Widget `hunter_status` zeigt nochmal `LVL {state.level}`.
  - Aufgeklapptes `hunter_status` zeigt `POWER LEVEL`, verwendet aber ebenfalls `state.level`.
  - Risiko: Level wirkt dreifach betont; `POWER LEVEL` ist zudem inhaltlich falsch benannt, weil es nicht `powerLevel` nutzt.

- Hunter-Name / Identitaet
  - TopBar zeigt `hunterName`.
  - `hunter_status` zeigt denselben Namen direkt darunter nochmal.
  - Risiko: Die zweite Nennung bringt kaum neue Information, wenn Header und Dashboard gleichzeitig sichtbar sind.

- Tagesfortschritt
  - `today_command` zeigt Fortschritt als Prozent-Ring plus erledigt/offen.
  - `daily_progress` zeigt denselben Tagesfortschritt nochmal als Prozentkarte.
  - `quests` zeigt dazu nochmal `ERLEDIGT`, `HEUTE`, `OFFEN` bzw. Quest-Stats.
  - Risiko: Drei Karten beantworten dieselbe Frage: "Wie weit bin ich heute?"

- Streak / Serie
  - TopBar-Menue zeigt `Serie`.
  - `today_command` zeigt `SERIE`.
  - `streak_display` zeigt die Serie gross mit Bestwert und Meilensteinen.
  - Stats-View zeigt Streak spaeter nochmal als Profilmetrik.
  - Risiko: Streak ist wichtig, aber auf dem Dashboard momentan gleichzeitig Status, Warnsignal und eigenes Widget.

- Quest-Zahlen
  - `today_command` zeigt offene Quests und ueberfaellige Quests.
  - `quests` zeigt offene Quests als grosse Zahl.
  - `quests` zeigt zusaetzlich Heute / Erledigt / Quick / Ueberfaellig.
  - Hunter-Insel-Briefing zeigt ebenfalls `{openQuests} Quests`.
  - Analytics-Meta nutzt ebenfalls offene Quests als Scan-Kontext.
  - Risiko: Viele Zahlen beschreiben dieselbe Arbeitslast mit leicht anderen Begriffen.

- Fokus-Start / Shortcuts
  - TopBar-Menue kann Fokus starten.
  - `today_command` kann Fokus starten.
  - `quick_access` kann Fokus starten.
  - Bottom/Nav bzw. Hunter-Insel koennen dieselben Module erreichen.
  - Risiko: Aktionen wirken beliebig verteilt statt klar priorisiert.

- Quest-Erstellung / Scan
  - `today_command` bietet im Empty-State neue Quest / Scan.
  - `quests` bietet Create, Quick+ und Scan.
  - Risiko: Sobald der Empty-State sichtbar ist, gibt es mehrere Einstiegspunkte fuer dieselbe Aufgabe.

- Stats-Radar / Attribute
  - Dashboard-Aufklappbereich zeigt `StatRadar` und alle Attribute.
  - Stats-View zeigt dasselbe Radar plus detaillierte Attributliste.
  - Risiko: Dashboard wird zur Mini-Stats-Seite, statt nur einen kompakten Status zu geben.

- Naechstes Unlock / Level-Locks
  - Dashboard `next_unlock` zeigt `LVL {nextLevel}` plus Unlock-Liste.
  - System-Update-Preview zeigt Jetzt/Ziel-Level nochmal.
  - Hunter-Insel zeigt gesperrte Module ebenfalls mit Unlock-Level.
  - Risiko: Unlock-Info ist nuetzlich, aber auf mehreren Oberflaechen redundant.

## Weitere Doppelungen ausserhalb des Dashboards

- Header / Analytics-Profilkarte
  - Analytics zeigt Name, Level, Rang, XP-Bar und Streak nochmal als eigenes Profil-Header-Element.
  - TopBar zeigt parallel Name, Rang/Level und Waehrungen.
  - Risiko: Analytics startet mit einer zweiten Profilkarte statt direkt mit Analysewert.

- Hunter-Insel / BottomNav
  - BottomNav und Hunter-Insel-App-Grid fuehren zu denselben Hauptmodulen.
  - Einige Module tauchen zusaetzlich als Portal, App-Tile und TopBar-Menue-Aktion auf.
  - Risiko: Navigation, Hub und Shortcuts konkurrieren miteinander.

- Gold / Shop-Kontext
  - TopBar zeigt Gold dauerhaft.
  - Hunter-Insel-Shop-Tile zeigt ebenfalls `{gold} Gold`.
  - Shop- und Shadow-Detail-Kontexte zeigen Gold erneut.
  - Risiko: Gold sollte dauerhaft im Header oder kontextuell im Kaufmoment stehen, nicht beides als gleichwertige Statusinfo.

- Health / Screen Time
  - Dashboard-Summary zeigt Tageswert, Ziel/Fortschritt und 7-Tage-Werte.
  - Detailmodal zeigt dieselben Kennzahlen ausfuehrlicher.
  - Risiko: Summary ist ok, aber sie sollte nur Teaser sein; Details sollten nicht schon komplett im Widget stehen.

## Offene Leitfragen fuer spaeter

- Welche Metrik gehoert global in die TopBar, und welche darf nur im Dashboard stehen?
- Welche Dashboard-Karte ist die "Quelle der Wahrheit" fuer heutigen Fortschritt?
- Welche Werte sind Status, welche sind Warnung, welche sind CTA?
- Soll Quick Access auf dem Dashboard bleiben, wenn BottomNav und Hunter-Insel schon Navigation sind?
- Sollte `hunter_status` eher kompakt bleiben und die volle Stats-Darstellung komplett an die Stats-View abgeben?
- Soll `POWER LEVEL` im Dashboard entfernt oder korrekt mit `powerLevel` statt `state.level` gefuellt werden?

## Erste Sortieridee, noch keine Entscheidung

- TopBar: Identitaet, Level/Rank, Gold/Gems.
- Dashboard: heutige Arbeit, naechste Aktion, wichtigste Warnung.
- Stats-View: Attribute, Radar, Power Level, Stat-Punkte.
- Hunter-Insel: Modul-Hub und Unlocks.
- Analytics: Auswertung, Trends, Muster; kein zweiter Profil-Header noetig.
