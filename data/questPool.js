export const QUEST_POOL = [
  // ─── STR: STRENGTH & FITNESS ───
  { 
    id: "qp_str_01", title: "Physical Awakening", category: "str", difficulty: "easy", minLevel: 1,
    desc: "Initialisiere physische Aktivität, um neuronale Pfade zu stimulieren und den Grundumsatz zu steigern.",
    tags: ["fitness", "bodyweight", "basics"],
    subQuests: [{ id: "1", title: "10 Liegestütze (Push-ups)", completed: false }, { id: "2", title: "20 Kniebeugen (Squats)", completed: false }]
  },
  {
    id: "qp_str_01b", title: "Mobility Protocol", category: "str", difficulty: "easy", minLevel: 1,
    desc: "Löse Gelenkblockaden und erhöhe die muskuläre Elastizität zur Prävention physischer Degradation.",
    tags: ["stretching", "mobility", "recovery"],
    subQuests: [{ id: "1", title: "10 Minuten aktiver Mobility-Flow oder Yoga", completed: false }]
  },
  {
    id: "qp_str_01c", title: "Core Stabilization", category: "str", difficulty: "easy", minLevel: 2,
    desc: "Stärke das fundamentale Zentrum deines Körpers für maximale kinetische Übertragung.",
    tags: ["core", "abs", "balance"],
    subQuests: [{ id: "1", title: "3 x 30 Sekunden Plank-Hold", completed: false }, { id: "2", title: "20 Crunches", completed: false }]
  },
  {
    id: "qp_str_01d", title: "Posture Correction", category: "str", difficulty: "easy", minLevel: 2,
    desc: "Rekalibriere deine Wirbelsäule. Ein gekrümmter Rücken signalisiert Schwäche und verringert die Lungenkapazität.",
    tags: ["posture", "health", "back"],
    subQuests: [{ id: "1", title: "3 Sätze à 15 Wall-Angels (Wand-Engel)", completed: false }, { id: "2", title: "5 Minuten aktives Aushängen an einer Stange oder Strecken", completed: false }]
  },
  { 
    id: "qp_str_02", title: "Combat Readiness", category: "str", difficulty: "normal", minLevel: 3,
    desc: "Kardiovaskuläre und muskuläre Stimulation zur Vorbereitung auf hochintensive Belastungen.",
    tags: ["core", "endurance", "training"],
    subQuests: [{ id: "1", title: "30 Liegestütze", completed: false }, { id: "2", title: "60 Sekunden Unterarmstütz (Plank)", completed: false }, { id: "3", title: "15 Burpees", completed: false }]
  },
  {
    id: "qp_str_02b", title: "Endurance Milestone", category: "str", difficulty: "normal", minLevel: 4,
    desc: "Erhöhe die maximale Sauerstoffaufnahme (VO2 max) durch konstante aerobe Belastung.",
    tags: ["cardio", "running", "stamina"],
    subQuests: [{ id: "1", title: "30 Minuten durchgehende aerobe Belastung (Laufen/Schwimmen/Rad)", completed: false }]
  },
  {
    id: "qp_str_02c", title: "Kinetic Burst (HIIT)", category: "str", difficulty: "normal", minLevel: 5,
    desc: "Reize das zentrale Nervensystem durch maximale anaerobe Intervalle.",
    tags: ["hiit", "sprint", "power"],
    subQuests: [{ id: "1", title: "15 Minuten HIIT Protokoll", completed: false }, { id: "2", title: "5 maximale Sprints (je 15 Sekunden)", completed: false }]
  },
  {
    id: "qp_str_02d", title: "Gravity Resistance", category: "str", difficulty: "normal", minLevel: 6,
    desc: "Kämpfe gegen die Schwerkraft. Nutze dein eigenes Körpergewicht für vertikale Zugkraft.",
    tags: ["calisthenics", "pull", "back"],
    subQuests: [{ id: "1", title: "10 Klimmzüge (Pull-ups) oder 30 Bodyweight-Rows", completed: false }]
  },
  {
    id: "qp_str_02e", title: "Grip Fortification", category: "str", difficulty: "normal", minLevel: 6,
    desc: "Die Stärke eines Hunters beginnt bei seinem Griff. Ein schwacher Griff limitiert das gesamte System.",
    tags: ["grip", "forearms", "strength"],
    subQuests: [{ id: "1", title: "Kumuliert 3 Minuten Dead-Hang an der Klimmzugstange", completed: false }, { id: "2", title: "Farmers Walk mit schweren Gewichten (3 x 30 Sekunden)", completed: false }]
  },
  { 
    id: "qp_str_03", title: "Hypertrophy Protocol", category: "str", difficulty: "hard", minLevel: 10,
    desc: "Gezielte Zerstörung von Muskelfasern zur Einleitung massiver struktureller Anpassung (Muskelaufbau).",
    tags: ["gym", "hypertrophy", "strength"],
    subQuests: [{ id: "1", title: "45 Minuten isoliertes Krafttraining", completed: false }, { id: "2", title: "Erreiche absolutes Muskelversagen in mindestens 2 Arbeitssätzen", completed: false }]
  },
  {
    id: "qp_str_03b", title: "Volume Overload", category: "str", difficulty: "hard", minLevel: 12,
    desc: "Zwinge den Körper durch akkumuliertes Volumen zur Anpassung der muskulären Ausdauer.",
    tags: ["calisthenics", "volume", "burnout"],
    subQuests: [{ id: "1", title: "100 Liegestütze", completed: false }, { id: "2", title: "200 Kniebeugen", completed: false }]
  },
  {
    id: "qp_str_03c", title: "Explosive Output", category: "str", difficulty: "hard", minLevel: 14,
    desc: "Maximiere die Rekrutierung von schnellen Muskelfasern durch plyometrisches Training.",
    tags: ["plyometrics", "explosive", "power"],
    subQuests: [{ id: "1", title: "50 Jump Squats", completed: false }, { id: "2", title: "30 Explosive Push-ups (Clapping)", completed: false }]
  },
  { 
    id: "qp_str_04", title: "Titan's Trial", category: "str", difficulty: "boss", minLevel: 20,
    desc: "Ein physischer Härtetest der Klasse S. Nur für Hunter, deren Körper bereits geschmiedet wurde.",
    tags: ["boss-trial", "extreme", "limit-break"],
    subQuests: [{ id: "1", title: "100 Liegestütze (unterbrochen max. 1 Mal)", completed: false }, { id: "2", title: "100 Sit-Ups", completed: false }, { id: "3", title: "10 Kilometer Lauf", completed: false }]
  },

  // ─── INT: INTELLIGENCE & LERNEN ───
  { 
    id: "qp_int_01", title: "Cognitive Expansion", category: "int", difficulty: "easy", minLevel: 1,
    desc: "Erweitere deine Datenbasis. Konsumiere hochwertige Informationen und extrahiere den Kern.",
    tags: ["reading", "learning", "focus"],
    subQuests: [{ id: "1", title: "15 Seiten in nicht-fiktionaler Literatur lesen", completed: false }, { id: "2", title: "Kernaussage in 3 Sätzen schriftlich festhalten", completed: false }]
  },
  {
    id: "qp_int_01b", title: "Synaptic Boot", category: "int", difficulty: "easy", minLevel: 1,
    desc: "Aktiviere präfrontale Kortex-Aktivität durch gezielte logische Stimulation.",
    tags: ["logic", "puzzle", "warmup"],
    subQuests: [{ id: "1", title: "Löse ein logisches Problem (Sudoku, Schach-Taktik, Code-Kata)", completed: false }]
  },
  {
    id: "qp_int_01c", title: "Information Triage", category: "int", difficulty: "easy", minLevel: 2,
    desc: "Beseitige irrelevante Datenströme. Strukturiere eingehende Informationen.",
    tags: ["organization", "triage", "focus"],
    subQuests: [{ id: "1", title: "Leere den 'Read Later' / 'Watch Later' Ordner (min. 3 Items konsumieren oder löschen)", completed: false }]
  },
  {
    id: "qp_int_01d", title: "Foreign Data Ingestion", category: "int", difficulty: "easy", minLevel: 3,
    desc: "Erweitere deinen Horizont außerhalb deiner gewohnten Domäne. Neues Wissen schafft neue Synapsen-Brücken.",
    tags: ["documentary", "knowledge", "broadening"],
    subQuests: [{ id: "1", title: "Konsumiere eine 20-minütige Dokumentation oder einen Podcast zu einem dir unbekannten Fachthema", completed: false }]
  },
  { 
    id: "qp_int_02", title: "Deep Work Protocol", category: "int", difficulty: "normal", minLevel: 4,
    desc: "Initiiere den Deep-Work-State. Eliminierung aller Störsignale für maximale kognitive Leistung.",
    tags: ["study", "deep-work", "concentration"],
    subQuests: [{ id: "1", title: "45 Minuten absoluter Fokus ohne externe Störsignale (Handy weg)", completed: false }, { id: "2", title: "Das Erarbeitete mündlich oder schriftlich rekapitulieren", completed: false }]
  },
  {
    id: "qp_int_02b", title: "Linguistic Installation", category: "int", difficulty: "normal", minLevel: 5,
    desc: "Installiere ein neues linguistisches Framework in dein neuronales Netz.",
    tags: ["language", "vocabulary", "learning"],
    subQuests: [{ id: "1", title: "30 Minuten aktiver Spracherwerb", completed: false }, { id: "2", title: "20 neue Vokabeln / Konzepte verifizieren", completed: false }]
  },
  {
    id: "qp_int_02c", title: "Financial Literacy", category: "int", difficulty: "normal", minLevel: 6,
    desc: "Analysiere Ressourcenströme. Wissen über Kapital-Allokation ist überlebenswichtig.",
    tags: ["finance", "analysis", "wealth"],
    subQuests: [{ id: "1", title: "Überprüfe und tracke alle Ausgaben der letzten 7 Tage", completed: false }, { id: "2", title: "Lies einen Artikel oder ein Kapitel über Investment/Finanzen", completed: false }]
  },
  {
    id: "qp_int_02d", title: "Creative Synthesis", category: "int", difficulty: "normal", minLevel: 7,
    desc: "Kreativität ist kein Zufall, sondern die Kombination bestehender Daten. Forciere den Prozess.",
    tags: ["writing", "creation", "brainstorming"],
    subQuests: [{ id: "1", title: "20 Minuten ununterbrochenes 'Free Writing' oder Ideen-Brainstorming zu einem aktuellen Projekt", completed: false }]
  },
  {
    id: "qp_int_02e", title: "Memory Encoding", category: "int", difficulty: "normal", minLevel: 8,
    desc: "Stärke dein Kurz- und Langzeitgedächtnis durch bewusste Speicher-Prozesse.",
    tags: ["memory", "brain", "training"],
    subQuests: [{ id: "1", title: "Präge dir eine Liste von 15 Items, ein Gedicht oder eine fremde Formel aktiv ein", completed: false }, { id: "2", title: "Verifiziere das Wissen nach 4 Stunden blind aus dem Kopf", completed: false }]
  },
  { 
    id: "qp_int_03", title: "Neural Override", category: "int", difficulty: "hard", minLevel: 10,
    desc: "Überwinde mentale Erschöpfung durch eine verlängerte Phase ununterbrochener Konzentration.",
    tags: ["deep-work", "productivity", "flow"],
    subQuests: [{ id: "1", title: "120 Minuten ununterbrochene Deep Work Session", completed: false }, { id: "2", title: "Physische Isolation des Smartphones während der gesamten Zeit", completed: false }]
  },
  {
    id: "qp_int_03b", title: "Algorithm Synthesis", category: "int", difficulty: "hard", minLevel: 12,
    desc: "Knacke ein komplexes System. Wende fortgeschrittene Logik auf ein hartes Problem an.",
    tags: ["coding", "logic", "theory"],
    subQuests: [{ id: "1", title: "Löse ein anspruchsvolles Problem (Programmierung, Mathematik, Fachspezifisch)", completed: false }, { id: "2", title: "Dokumentiere den Lösungsweg sauber für zukünftige Referenz", completed: false }]
  },
  {
    id: "qp_int_03c", title: "Data Abstraction", category: "int", difficulty: "hard", minLevel: 14,
    desc: "Extrahieren von Komplexität. Reduziere ein gigantisches Thema auf seine fundamentalen Wahrheiten.",
    tags: ["analysis", "essay", "synthesis"],
    subQuests: [{ id: "1", title: "Recherchiere ein hochkomplexes Thema für 60 Minuten", completed: false }, { id: "2", title: "Schreibe eine einseitige Zusammenfassung, die ein Laie versteht (Feynman-Methode)", completed: false }]
  },
  { 
    id: "qp_int_04", title: "Omniscience Trial", category: "int", difficulty: "boss", minLevel: 20,
    desc: "Vom Schüler zum Meister. Finalisiere ein kognitives Großprojekt und teile die Daten.",
    tags: ["boss-trial", "mastery", "learning"],
    subQuests: [{ id: "1", title: "Einen langen Fachkurs oder ein anspruchsvolles Buch komplett abschließen", completed: false }, { id: "2", title: "Ein Projekt erstellen, das die neuen Konzepte anwendet", completed: false }, { id: "3", title: "Das Konzept einer anderen Person detailliert beibringen", completed: false }]
  },

  // ─── VIT: VITALITY & REGENERATION ───
  { 
    id: "qp_vit_01", title: "Cellular Hydration", category: "vit", difficulty: "easy", minLevel: 1,
    desc: "Optimiere den Flüssigkeitshaushalt für zelluläre Effizienz.",
    tags: ["health", "water", "basics"],
    subQuests: [{ id: "1", title: "Mindestens 2.5 Liter ungesüßte Flüssigkeit konsumieren", completed: false }]
  },
  {
    id: "qp_vit_01b", title: "Solar Calibration", category: "vit", difficulty: "easy", minLevel: 1,
    desc: "Kalibriere den zirkadianen Rhythmus durch direkte Photonen-Exposition (Tageslicht).",
    tags: ["nature", "sunlight", "morning"],
    subQuests: [{ id: "1", title: "15 Minuten direktes Tageslicht innerhalb von 30 Min nach dem Aufwachen", completed: false }]
  },
  {
    id: "qp_vit_01c", title: "Sleep Protocol", category: "vit", difficulty: "easy", minLevel: 2,
    desc: "Initiiere die wichtigste Erholungsphase des Systems.",
    tags: ["sleep", "recovery", "health"],
    subQuests: [{ id: "1", title: "Mindestens 7.5 Stunden Schlaf in der kommenden Nacht sicherstellen", completed: false }]
  },
  {
    id: "qp_vit_01d", title: "Joint Lubrication", category: "vit", difficulty: "easy", minLevel: 2,
    desc: "Verhindere das Einrosten deines Fahrgestells. Leichte Bewegung fördert die Durchblutung und Gelenkflüssigkeit.",
    tags: ["walking", "health", "digestion"],
    subQuests: [{ id: "1", title: "Ein leichter, 15-minütiger Verdauungsspaziergang direkt nach einer Hauptmahlzeit", completed: false }]
  },
  {
    id: "qp_vit_01e", title: "Ocular Rest Protocol", category: "vit", difficulty: "easy", minLevel: 3,
    desc: "Die optischen Sensoren sind überlastet. Minimiere die Screen-Strahlung zur Prävention von Ermüdung.",
    tags: ["eyes", "rest", "screen-free"],
    subQuests: [{ id: "1", title: "Wende 3x heute die 20-20-20 Regel an (20 Fuß, 20 Sekunden alle 20 Minuten)", completed: false }, { id: "2", title: "10 Minuten Augen komplett schließen ohne einzuschlafen", completed: false }]
  },
  { 
    id: "qp_vit_02", title: "Toxin Purge", category: "vit", difficulty: "normal", minLevel: 4,
    desc: "Stoppe die Zufuhr leistungsmindernder Substanzen. Stabilisiere den Blutzucker.",
    tags: ["diet", "detox", "health"],
    subQuests: [{ id: "1", title: "0% industrieller Zucker für 24 Stunden", completed: false }, { id: "2", title: "Eine Mahlzeit aus ausschließlich unverarbeiteten Zutaten konsumieren", completed: false }]
  },
  {
    id: "qp_vit_02b", title: "Mental Defragmentation", category: "vit", difficulty: "normal", minLevel: 5,
    desc: "Reduziere kortikale Störgeräusche durch bewusste Isolation.",
    tags: ["meditation", "mindfulness", "stress"],
    subQuests: [{ id: "1", title: "15 Minuten absolute Stille und Atemkontrolle (Meditation)", completed: false }, { id: "2", title: "Kein Dopamin-Spike (Social Media/Shorts) für 4 Stunden", completed: false }]
  },
  {
    id: "qp_vit_02c", title: "Protein Saturation", category: "vit", difficulty: "normal", minLevel: 6,
    desc: "Liefere Bausteine für muskuläre Reparatur und Enzymproduktion.",
    tags: ["diet", "protein", "recovery"],
    subQuests: [{ id: "1", title: "Erreiche heute strikt dein Protein-Ziel (z.B. 1.5g+ pro kg Körpergewicht)", completed: false }]
  },
  {
    id: "qp_vit_02d", title: "Nutritional Upgrade", category: "vit", difficulty: "normal", minLevel: 7,
    desc: "Führe dem System hochkonzentrierte Mikronährstoffe zu. Beende den Mangel.",
    tags: ["diet", "greens", "health"],
    subQuests: [{ id: "1", title: "Konsumiere heute mindestens 500g frisches, rohes oder leicht gedünstetes Gemüse", completed: false }]
  },
  {
    id: "qp_vit_02e", title: "Thermal Therapy", category: "vit", difficulty: "normal", minLevel: 8,
    desc: "Erhöhte Kerntemperatur beschleunigt die muskuläre Entspannung und Toxin-Ausleitung.",
    tags: ["recovery", "heat", "sauna"],
    subQuests: [{ id: "1", title: "Absolviere einen Sauna-Gang oder nimm ein 20-minütiges heißes Entspannungsbad", completed: false }, { id: "2", title: "Im Anschluss direkt mobilisieren und ausdehnen", completed: false }]
  },
  { 
    id: "qp_vit_03", title: "Cold Exposure Trial", category: "vit", difficulty: "hard", minLevel: 10,
    desc: "Forciere die Anpassung des sympathischen Nervensystems durch thermischen Schock.",
    tags: ["discipline", "cold", "resilience"],
    subQuests: [{ id: "1", title: "Kalt duschen (min. 90 Sekunden unter kältestmöglicher Stufe)", completed: false }, { id: "2", title: "Atmung unter Schock kontrollieren", completed: false }]
  },
  {
    id: "qp_vit_03b", title: "Circadian Optimization", category: "vit", difficulty: "hard", minLevel: 12,
    desc: "Minimiere blaues Licht zur Melatonin-Maximierung.",
    tags: ["sleep", "digital-detox", "health"],
    subQuests: [{ id: "1", title: "Strikte Bildschirmsperre ab 20:00 Uhr (oder 2h vor dem Schlafen)", completed: false }, { id: "2", title: "Vor dem Schlafen nur Lesen oder Journaling", completed: false }]
  },
  { 
    id: "qp_vit_04", title: "System Reset", category: "vit", difficulty: "boss", minLevel: 20,
    desc: "Ein vollkommener Entlastungstag für Magen, Sinne und Nervensystem. Rebooting...",
    tags: ["boss-trial", "fasting", "mindfulness"],
    subQuests: [{ id: "1", title: "16+ Stunden striktes Intervallfasten (nur Wasser/Tee/Kaffee)", completed: false }, { id: "2", title: "30 Minuten vollkommene Isolation und Stille", completed: false }, { id: "3", title: "Mindestens 1 Stunde Natur-Exposition ohne elektronische Geräte", completed: false }]
  },

  // ─── AGI: AGILITY & PRODUKTIVITÄT ───
  { 
    id: "qp_agi_01", title: "Environmental Optimization", category: "agi", difficulty: "easy", minLevel: 1,
    desc: "Beseitige visuelle Störfaktoren in deinem Operationsgebiet.",
    tags: ["cleaning", "environment", "momentum"],
    subQuests: [{ id: "1", title: "Mache dein Bett unmittelbar nach dem Aufstehen", completed: false }, { id: "2", title: "Bereinige deinen Arbeitsplatz (Desk Clear)", completed: false }]
  },
  {
    id: "qp_agi_01b", title: "Strategic Blueprint", category: "agi", difficulty: "easy", minLevel: 2,
    desc: "Definiere Vektoren, bevor Energie investiert wird. Verhindert Aktionismus.",
    tags: ["planning", "todo", "strategy"],
    subQuests: [{ id: "1", title: "Schreibe alle anstehenden Aufgaben nieder (Brain Dump)", completed: false }, { id: "2", title: "Markiere die Top 3 Missionsziele des Tages", completed: false }]
  },
  {
    id: "qp_agi_01c", title: "Digital Declutter", category: "agi", difficulty: "easy", minLevel: 3,
    desc: "Räume dein digitales Operationszentrum auf, um Suchzeiten zu minimieren.",
    tags: ["digital", "organization", "cleaning"],
    subQuests: [{ id: "1", title: "Leere den 'Downloads' Ordner / Desktop aufräumen", completed: false }]
  },
  {
    id: "qp_agi_01d", title: "Friction Removal", category: "agi", difficulty: "easy", minLevel: 3,
    desc: "Beseitige Hindernisse für zukünftige Aktionen. Der morgige Erfolg wird heute Nacht geplant.",
    tags: ["preparation", "evening", "efficiency"],
    subQuests: [{ id: "1", title: "Lege deine Kleidung für morgen sichtbar bereit", completed: false }, { id: "2", title: "Packe deine Tasche/Rucksack für den nächsten Tag", completed: false }]
  },
  { 
    id: "qp_agi_02", title: "Execution Speed", category: "agi", difficulty: "normal", minLevel: 4,
    desc: "Zögern ist tödlich. Greife die unangenehmste Aufgabe frontal an.",
    tags: ["focus", "anti-procrastination", "speed"],
    subQuests: [{ id: "1", title: "Schließe die Aufgabe ab, die du am längsten vor dir herschiebst (Eat the Frog)", completed: false }]
  },
  {
    id: "qp_agi_02b", title: "Inbox Zero Protocol", category: "agi", difficulty: "normal", minLevel: 5,
    desc: "Beseitige alle offenen Kommunikations-Puffer. Stelle auf Zero State.",
    tags: ["email", "organization", "efficiency"],
    subQuests: [{ id: "1", title: "Verarbeite alle E-Mails/Nachrichten (Antworten, Archivieren oder Terminieren)", completed: false }]
  },
  {
    id: "qp_agi_02c", title: "Time Division (Pomodoro)", category: "agi", difficulty: "normal", minLevel: 6,
    desc: "Optimiere die mentale Ausdauer durch strikte Arbeits- und Pausen-Intervalle.",
    tags: ["pomodoro", "focus", "work"],
    subQuests: [{ id: "1", title: "Absolviere 4 strikte 25-Minuten Pomodoro-Blöcke", completed: false }, { id: "2", title: "Nutze die 5-Minuten-Pausen physisch (aufstehen, dehnen)", completed: false }]
  },
  {
    id: "qp_agi_02d", title: "Rapid Execution", category: "agi", difficulty: "normal", minLevel: 7,
    desc: "Die 2-Minuten-Regel. Was schnell geht, wird sofort erledigt, um den Backlog sauber zu halten.",
    tags: ["speed", "gtd", "action"],
    subQuests: [{ id: "1", title: "Finde 5 Aufgaben, die weniger als 2 Minuten dauern, und erledige sie sofort", completed: false }]
  },
  {
    id: "qp_agi_02e", title: "Financial Triage", category: "agi", difficulty: "normal", minLevel: 8,
    desc: "Optimiere den Cashflow des Systems durch Beseitigung von Lecks.",
    tags: ["finance", "audit", "optimization"],
    subQuests: [{ id: "1", title: "Überprüfe alle laufenden Abonnements", completed: false }, { id: "2", title: "Kündige mindestens ein nicht genutztes oder unnötiges Abonnement", completed: false }]
  },
  { 
    id: "qp_agi_03", title: "Temporal Mastery", category: "agi", difficulty: "hard", minLevel: 10,
    desc: "Lasse dem Chaos keinen Raum. Jeder Zeitblock muss einem Zweck zugewiesen sein.",
    tags: ["time-boxing", "planning", "system"],
    subQuests: [{ id: "1", title: "Time-Boxing: Plane den gesamten Tag in Kalenderblöcken", completed: false }, { id: "2", title: "Führe die Tagespriorität Nr. 1 exakt im definierten Block aus", completed: false }]
  },
  {
    id: "qp_agi_03b", title: "The 5AM Protocol", category: "agi", difficulty: "hard", minLevel: 12,
    desc: "Sichere dir einen taktischen Vorsprung, bevor der Rest der Welt erwacht.",
    tags: ["morning", "productivity", "discipline"],
    subQuests: [{ id: "1", title: "Wache vor 06:00 Uhr auf", completed: false }, { id: "2", title: "Kein Smartphone/Internet in der ersten Stunde", completed: false }, { id: "3", title: "Absolviere 60 Minuten hochkonzentrierte Arbeit vor 08:30 Uhr", completed: false }]
  },
  {
    id: "qp_agi_03c", title: "Deep Cleaning Operation", category: "agi", difficulty: "hard", minLevel: 14,
    desc: "Äußere Ordnung schafft innere Ordnung. Bereinige die physische Basis komplett.",
    tags: ["cleaning", "home", "reset"],
    subQuests: [{ id: "1", title: "Reinige das gesamte Schlaf- und Arbeitszimmer intensiv (Saugen, Staub wischen, Müll entsorgen)", completed: false }, { id: "2", title: "Sortiere 5 Dinge aus, die du nicht mehr brauchst (Spenden/Wegwerfen)", completed: false }]
  },
  { 
    id: "qp_agi_04", title: "Absolute Efficiency", category: "agi", difficulty: "boss", minLevel: 20,
    desc: "Komprimiere den Output einer Woche in einen Tag.",
    tags: ["boss-trial", "hustle", "completion"],
    subQuests: [{ id: "1", title: "Starte die Arbeit vor Sonnenaufgang", completed: false }, { id: "2", title: "Bereinige das gesamte Arbeits- und Wohnumfeld", completed: false }, { id: "3", title: "Schließe ein Projekt ab, das seit Wochen ansteht", completed: false }]
  },

  // ─── CHA: CHARISMA & SOZIALES ───
  { 
    id: "qp_cha_01", title: "Social Resonance", category: "cha", difficulty: "easy", minLevel: 1,
    desc: "Sende proaktiv positive Signale in dein Netzwerk, um Allianzen zu stärken.",
    tags: ["social", "connection", "basics"],
    subQuests: [{ id: "1", title: "Melde dich unaufgefordert bei einem alten Kontakt", completed: false }, { id: "2", title: "Achte heute bewusst auf eine aufrechte Haltung und Augenkontakt", completed: false }]
  },
  {
    id: "qp_cha_01b", title: "Validation Protocol", category: "cha", difficulty: "easy", minLevel: 2,
    desc: "Verstärke das Selbstwertgefühl von Verbündeten durch authentische Anerkennung.",
    tags: ["compliment", "social", "friends"],
    subQuests: [{ id: "1", title: "Mache jemandem ein spezifisches, aufrichtiges Kompliment", completed: false }]
  },
  {
    id: "qp_cha_01c", title: "Vocal Projection", category: "cha", difficulty: "easy", minLevel: 3,
    desc: "Trainiere den stimmlichen Output für maximale Überzeugungskraft.",
    tags: ["voice", "speaking", "confidence"],
    subQuests: [{ id: "1", title: "Lies 5 Minuten lang einen Text mit starker, lauter Stimme vor", completed: false }]
  },
  {
    id: "qp_cha_01d", title: "Active Observation", category: "cha", difficulty: "easy", minLevel: 3,
    desc: "Ein wahrer Anführer kennt seine Truppen. Achte auf Details, die anderen entgehen.",
    tags: ["listening", "observation", "empathy"],
    subQuests: [{ id: "1", title: "Beobachte ein spezifisches Detail an einer Person (z.B. neues Kleidungsstück, Stimmung)", completed: false }, { id: "2", title: "Spreche die Person subtil positiv darauf an", completed: false }]
  },
  { 
    id: "qp_cha_02", title: "Aura of Command", category: "cha", difficulty: "normal", minLevel: 4,
    desc: "Optimiere deine physische Erscheinung. Präsentiere dich als Autorität.",
    tags: ["style", "posture", "presence"],
    subQuests: [{ id: "1", title: "Wähle heute ein überdurchschnittlich gepflegtes Outfit (Dress up)", completed: false }, { id: "2", title: "Korrigiere deine Haltung (Brust raus, Schultern zurück) jedes Mal, wenn du durch eine Tür gehst", completed: false }]
  },
  {
    id: "qp_cha_02b", title: "Network Expansion", category: "cha", difficulty: "normal", minLevel: 6,
    desc: "Digitale Verbindungen sind schwach. Forciere physische Synchronisation.",
    tags: ["meeting", "networking", "real-life"],
    subQuests: [{ id: "1", title: "Lade jemanden zu einem Kaffee oder Mittagessen ein", completed: false }, { id: "2", title: "Smartphone während des gesamten Treffens unsichtbar halten", completed: false }]
  },
  {
    id: "qp_cha_02c", title: "The Empathy Trial", category: "cha", difficulty: "normal", minLevel: 7,
    desc: "Setze den Fokus zu 100% auf den Transmitter. Höre zu, um zu verstehen, nicht um zu antworten.",
    tags: ["listening", "empathy", "conversation"],
    subQuests: [{ id: "1", title: "Führe ein Gespräch, in dem du 80% der Zeit nur zuhörst und Fragen stellst", completed: false }]
  },
  {
    id: "qp_cha_02d", title: "Generosity Directive", category: "cha", difficulty: "normal", minLevel: 8,
    desc: "Echter Einfluss basiert auf Wertschöpfung für andere. Gib, bevor du nimmst.",
    tags: ["karma", "giving", "help"],
    subQuests: [{ id: "1", title: "Biete einer Person proaktiv deine Hilfe bei einem Problem an", completed: false }, { id: "2", title: "Erwarte und verlange absolut keine Gegenleistung", completed: false }]
  },
  {
    id: "qp_cha_02e", title: "Public Projection", category: "cha", difficulty: "normal", minLevel: 9,
    desc: "Baue digitale Autorität auf. Teile Wissen mit dem Kollektiv.",
    tags: ["social", "branding", "sharing"],
    subQuests: [{ id: "1", title: "Verfasse einen hochwertigen, wertstiftenden Beitrag (LinkedIn, Blog, etc.) und veröffentliche ihn", completed: false }]
  },
  { 
    id: "qp_cha_03", title: "Social Dominance", category: "cha", difficulty: "hard", minLevel: 10,
    desc: "Verlasse die Komfortzone und agiere souverän in asymmetrischen Interaktionen.",
    tags: ["leadership", "courage", "interaction"],
    subQuests: [{ id: "1", title: "Starte ein Gespräch mit einer völlig fremden Person", completed: false }, { id: "2", title: "Gib einer Person kritisches, aber konstruktives Feedback direkt ins Gesicht", completed: false }]
  },
  {
    id: "qp_cha_03b", title: "Digital Disconnect", category: "cha", difficulty: "hard", minLevel: 12,
    desc: "Entziehe dich der künstlichen Validation. Baue echte Präsenz auf.",
    tags: ["socialmedia", "detox", "presence"],
    subQuests: [{ id: "1", title: "Lösche/Deaktiviere Social Media Apps für 24 Stunden", completed: false }, { id: "2", title: "Führe als Ersatz ein tiefgehendes, langes Telefonat", completed: false }]
  },
  {
    id: "qp_cha_03c", title: "Conflict Resolution", category: "cha", difficulty: "hard", minLevel: 14,
    desc: "Ungelöste Konflikte sind blinde Flecken. Konfrontiere das Unbequeme.",
    tags: ["conflict", "communication", "bravery"],
    subQuests: [{ id: "1", title: "Sprich ein unangenehmes Thema an, das du bisher vermieden hast", completed: false }, { id: "2", title: "Bleibe ruhig und fokussiere dich auf die Lösungsfindung, nicht auf Schuldzuweisungen", completed: false }]
  },
  { 
    id: "qp_cha_04", title: "Leader's Initiative", category: "cha", difficulty: "boss", minLevel: 20,
    desc: "Übernimm das Kommando. Forme deine Umgebung nach deinem Willen.",
    tags: ["boss-trial", "public-speaking", "hosting"],
    subQuests: [{ id: "1", title: "Organisiere und leite ein soziales Event oder Meeting", completed: false }, { id: "2", title: "Halte eine Präsentation oder halte eine Rede vor einer Gruppe", completed: false }]
  }
];
