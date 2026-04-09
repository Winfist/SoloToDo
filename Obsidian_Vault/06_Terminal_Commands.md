# Terminal Commands – SoloToDo Cheatsheet

Alle wichtigen Befehle für das Projekt auf einen Blick.

---

## Ordner öffnen

Immer zuerst in den Projektordner wechseln (falls nicht schon dort):

```bash
cd "C:\Users\jwuck\OneDrive\Dokumente\SoloToDo"
```

---

## Git – Code sichern & hochladen

Git speichert Snapshots deines Codes. GitHub ist der Server wo der Code online liegt.

### Normaler Workflow (Änderungen hochladen)

```bash
# 1. Zeigt was geändert wurde
git status

# 2. Alle geänderten Dateien zum "Paket" hinzufügen
git add .

# 3. Paket mit Nachricht versiegeln (Commit = Snapshot)
git commit -m "Beschreibung was du geändert hast"

# 4. Paket zu GitHub hochladen (Push)
git push
```

### Kurzversion (add + commit + push in einem Rutsch)

```bash
git add . && git commit -m "deine Nachricht" && git push
```

### Nützliche Git-Befehle

```bash
# Zeigt die letzten Commits (wer, wann, was)
git log --oneline

# Zeigt genau was sich in einer Datei geändert hat
git diff

# Änderungen vom Server holen (z.B. wenn du auf einem anderen PC gearbeitet hast)
git pull

# Eine Datei auf den Stand des letzten Commits zurücksetzen (VORSICHT: unwiderruflich)
git restore dateiname.jsx

# Aktuellen Branch anzeigen
git branch
```

---

## npm – Pakete & lokaler Server

npm verwaltet die Bibliotheken (React, Firebase, Three.js, etc.) die das Projekt braucht.

### Lokalen Entwicklungsserver starten

```bash
npm run dev
```

> Öffnet die App unter `http://localhost:5173` – Änderungen sieht man sofort ohne neu zu laden.
> Beenden mit `Ctrl + C`.

### App für Produktion bauen

```bash
npm run build
```

> Erstellt den `dist/` Ordner mit der fertigen, optimierten App.
> **Muss vor jedem Firebase-Deploy gemacht werden** (passiert aber automatisch bei `npm run deploy`).

### Gebaute App lokal testen (wie Produktion)

```bash
npm run preview
```

> Testet die gebaute `dist/` Version lokal – so sieht man wie sie auf Firebase aussehen würde.

### Pakete installieren (nach git clone oder wenn node_modules fehlt)

```bash
npm install
```

### Neues Paket installieren

```bash
npm install paketname

# Beispiel:
npm install framer-motion
```

### Paket entfernen

```bash
npm uninstall paketname
```

---

## Firebase – App deployen (live schalten)

Firebase Hosting macht die App öffentlich erreichbar unter `https://solo-todo.web.app`.

### App deployen (build + upload)

```bash
firebase deploy
```

> Baut automatisch und lädt alles hoch. Dauert ~20-30 Sekunden.

### Nur Hosting deployen (ohne Firestore Rules)

```bash
firebase deploy --only hosting
```

### Nur Firestore Rules deployen

```bash
firebase deploy --only firestore:rules
```

### Firebase Login (einmalig nötig)

```bash
firebase login
```

### Welches Firebase-Projekt ist aktiv?

```bash
firebase projects:list
```

---

## Vollständiger Deploy-Workflow

Das ist der komplette Ablauf wenn du etwas fertig hast:

```bash
# 1. Änderungen zu GitHub pushen
git add .
git commit -m "feat: was du gemacht hast"
git push

# 2. App live schalten
firebase deploy
```

---

## Commit-Nachrichten Konvention

Gute Commit-Nachrichten fangen mit einem Präfix an:

| Präfix | Bedeutung |
|--------|-----------|
| `feat:` | Neue Funktion |
| `fix:` | Bug behoben |
| `style:` | Nur Design/CSS geändert |
| `refactor:` | Code umgebaut (kein neues Feature, kein Bugfix) |
| `docs:` | Dokumentation geändert |
| `chore:` | Kleinigkeiten (z.B. Pakete updaten) |

**Beispiele:**
```bash
git commit -m "feat: Dungeon-Belohnungen hinzugefügt"
git commit -m "fix: Stat-Punkte werden nach Reload nicht mehr doppelt vergeben"
git commit -m "style: Stats-Seite Layout angepasst"
```

---

## Admin Dashboard (separates Projekt)

Das Admin-Dashboard ist ein eigenes React-Projekt im `admin-dashboard/` Ordner.

```bash
# In den Admin-Ordner wechseln
cd admin-dashboard

# Lokalen Dev-Server starten
npm run dev

# Für Produktion bauen
npm run build

# Zurück zum Hauptprojekt
cd ..
```

---

## Häufige Fehler & Lösungen

### "command not found: firebase"
```bash
npm install -g firebase-tools
```

### "node_modules not found" / Pakete fehlen
```bash
npm install
```

### Port 5173 bereits belegt
```bash
# Anderen Port benutzen
npm run dev -- --port 3000
```

### Git Push schlägt fehl (diverged branches)
```bash
git pull --rebase
git push
```

### Änderungen verwerfen (VORSICHT – unwiderruflich!)
```bash
# Einzelne Datei zurücksetzen
git restore src/component.jsx

# Alle Änderungen verwerfen
git restore .
```
