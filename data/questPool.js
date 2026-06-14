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
  {
    id: "qp_str_05", title: "Aquatic Conditioning", category: "str", difficulty: "easy", minLevel: 2,
    desc: "Wasser ist das ursprünglichste Trainingsmedium. Nutze den hydrostatischen Druck zur Ganzkörperaktivierung.",
    tags: ["swimming", "cardio", "basics"],
    subQuests: [{ id: "1", title: "20 Minuten kontinuierliches Schwimmen (beliebiger Stil)", completed: false }, { id: "2", title: "3 x Unterwasser-Ausatmung mit kontrollierter Atemtechnik", completed: false }]
  },
  {
    id: "qp_str_05b", title: "Ground Movement", category: "str", difficulty: "easy", minLevel: 3,
    desc: "Das System erkennt Bewegungsdefizite. Reaktiviere primitive Bewegungsmuster am Boden.",
    tags: ["mobility", "animal-flow", "flexibility"],
    subQuests: [{ id: "1", title: "15 Minuten Animal Flow oder Bodenturnen (Bärengang, Krabbengang, Rollen)", completed: false }]
  },
  {
    id: "qp_str_06", title: "Vertical Ascent", category: "str", difficulty: "normal", minLevel: 4,
    desc: "Überwinde die Vertikale. Klettern aktiviert 80% aller Muskelketten simultan.",
    tags: ["climbing", "grip", "full-body"],
    subQuests: [{ id: "1", title: "30 Minuten Bouldern oder Klettern (Halle oder outdoor)", completed: false }, { id: "2", title: "Mindestens 3 verschiedene Routen absolvieren", completed: false }]
  },
  {
    id: "qp_str_06b", title: "Strike Protocol", category: "str", difficulty: "normal", minLevel: 5,
    desc: "Initiiere Kampf-Simulationen. Schlagtechnik und Reaktionszeit definieren den Hunter.",
    tags: ["martial-arts", "boxing", "combat"],
    subQuests: [{ id: "1", title: "30 Minuten Kampfsport-Training (Boxen, Kickboxen, MMA oder Karate)", completed: false }, { id: "2", title: "100 saubere Schlagkombinationen am Sandsack oder Schattenboxen", completed: false }]
  },
  {
    id: "qp_str_06c", title: "Trail Recon", category: "str", difficulty: "normal", minLevel: 7,
    desc: "Verlasse die kontrollierte Umgebung. Unebenes Terrain rekrutiert stabilisierende Muskelfasern, die das Gym nicht anspricht.",
    tags: ["trail", "hiking", "outdoor"],
    subQuests: [{ id: "1", title: "60 Minuten Wandern oder Trail-Running auf unebenem Gelände", completed: false }, { id: "2", title: "Mindestens 300 Höhenmeter überwinden", completed: false }]
  },
  {
    id: "qp_str_06d", title: "Progressive Overload Cycle", category: "str", difficulty: "normal", minLevel: 8,
    desc: "Stagnation ist Regression. Forciere eine messbare Steigerung gegenüber der letzten Session.",
    tags: ["progressive-overload", "tracking", "strength"],
    subQuests: [{ id: "1", title: "Steigere das Gewicht ODER die Wiederholungen in 3 Übungen gegenüber der Vorwoche", completed: false }, { id: "2", title: "Dokumentiere die Steigerung schriftlich in einem Trainingslog", completed: false }]
  },
  {
    id: "qp_str_07", title: "Hybrid Warfare", category: "str", difficulty: "hard", minLevel: 10,
    desc: "Kombiniere Kraft, Ausdauer und Technik in einer einzigen Session. Das System testet Vielseitigkeit.",
    tags: ["crossfit", "hybrid", "endurance"],
    subQuests: [{ id: "1", title: "Absolviere ein 30-minütiges Zirkeltraining: 5 Übungen, 4 Runden, keine Pause zwischen Übungen", completed: false }, { id: "2", title: "Beende die Session mit 1 km Lauf unter 5:30 Minuten", completed: false }]
  },
  {
    id: "qp_str_07b", title: "Weighted Calisthenics", category: "str", difficulty: "hard", minLevel: 13,
    desc: "Das eigene Körpergewicht genügt nicht mehr. Addiere externen Widerstand zu Eigengewichtsübungen.",
    tags: ["weighted", "calisthenics", "advanced"],
    subQuests: [{ id: "1", title: "5 gewichtete Klimmzüge (Dip-Gürtel oder Rucksack)", completed: false }, { id: "2", title: "10 gewichtete Dips", completed: false }, { id: "3", title: "20 gewichtete Kniebeugen", completed: false }]
  },
  {
    id: "qp_str_07c", title: "Endurance Raid", category: "str", difficulty: "hard", minLevel: 16,
    desc: "Ausdauer jenseits der Komfortzone. Das System prüft die kardiopulmonale Belastbarkeit auf Wettkampfniveau.",
    tags: ["long-distance", "running", "cycling"],
    subQuests: [{ id: "1", title: "60 Minuten durchgehende aerobe Belastung ohne Pause (Laufen, Rad oder Rudern)", completed: false }, { id: "2", title: "Die letzten 10 Minuten im Tempo steigern (Negative Split)", completed: false }]
  },
  {
    id: "qp_str_07d", title: "Combat Sparring", category: "str", difficulty: "hard", minLevel: 18,
    desc: "Theorie ohne Praxis ist wertlos. Tritt gegen einen Gegner an und teste deine Kampffähigkeit unter Druck.",
    tags: ["sparring", "martial-arts", "pressure"],
    subQuests: [{ id: "1", title: "Absolviere 3 Runden kontrolliertes Sparring (à 3 Minuten) mit einem Partner", completed: false }, { id: "2", title: "Analysiere danach 2 Schwachstellen in deiner Technik und notiere Korrekturmaßnahmen", completed: false }]
  },
  {
    id: "qp_str_08", title: "Iron Marathon", category: "str", difficulty: "boss", minLevel: 20,
    desc: "Rang-S-Belastungstest: Absolviere einen Multi-Disziplin-Härtetest, der Kraft, Ausdauer und Willenskraft vereint.",
    tags: ["boss-trial", "multi-discipline", "extreme"],
    subQuests: [{ id: "1", title: "1 km Schwimmen ODER 5 km Lauf", completed: false }, { id: "2", title: "200 Liegestütze und 200 Kniebeugen (aufgeteilt in Sets, max. 60 Sek Pause)", completed: false }, { id: "3", title: "5 Minuten Cold Exposure (Eisbad oder kälteste Dusche) als Abschluss", completed: false }]
  },
  {
    id: "qp_str_08a", title: "Mountain Siege", category: "str", difficulty: "boss", minLevel: 25,
    desc: "Erobere die Vertikale. Nur ein Hunter mit maximaler Kondition überwindet die Schwerkraft über Stunden.",
    tags: ["endgame", "mountaineering", "summit"],
    subQuests: [{ id: "1", title: "Absolviere eine Bergwanderung oder Klettertour mit mindestens 1000 Höhenmetern", completed: false }, { id: "2", title: "Trage einen Rucksack mit mindestens 10 kg Zusatzgewicht", completed: false }]
  },
  {
    id: "qp_str_08b", title: "Warrior's Decathlon", category: "str", difficulty: "boss", minLevel: 30,
    desc: "Die ultimative physische Prüfung. Zehn Disziplinen. Kein Ausweichen. Kein Aufgeben. Das System akzeptiert nur Perfektion.",
    tags: ["endgame", "decathlon", "ultimate"],
    subQuests: [{ id: "1", title: "Absolviere 10 verschiedene Übungen à 100 Wiederholungen (Push-ups, Squats, Sit-ups, Lunges, Burpees, Dips, Pull-ups, Plank 3 Min, Box Jumps, Mountain Climbers)", completed: false }, { id: "2", title: "Beende alles innerhalb von 90 Minuten", completed: false }, { id: "3", title: "Dokumentiere Zeiten und Pausen für zukünftige Vergleichbarkeit", completed: false }]
  },
  {
    id: "qp_str_09", title: "Isometrische Kalibrierung", category: "str", difficulty: "easy", minLevel: 2,
    desc: "Muskelspannung ohne Bewegung generiert maximale neuronale Aktivierung. Halte die Position.",
    tags: ["isometric", "control", "basics"],
    subQuests: [{ id: "1", title: "3 x 45 Sekunden Wandsitz (Wall Sit)", completed: false }, { id: "2", title: "3 x 30 Sekunden Glute Bridge Hold", completed: false }]
  },
  {
    id: "qp_str_09b", title: "Faszien-Matrix", category: "str", difficulty: "easy", minLevel: 2,
    desc: "Restrukturiere verklebtes Gewebe. Foam Rolling erhöht die Durchblutung und Flexibilität massiv.",
    tags: ["recovery", "foam-rolling", "tissue"],
    subQuests: [{ id: "1", title: "15 Minuten intensives Foam Rolling (Fokus auf Beine und Rücken)", completed: false }, { id: "2", title: "Trinke anschließend 500ml Wasser zur Ausleitung", completed: false }]
  },
  {
    id: "qp_str_10", title: "Kinetische Asymmetrie", category: "str", difficulty: "normal", minLevel: 5,
    desc: "Isoliere Schwachstellen. Unilaterales Training zwingt die schwächere Körperseite zur Anpassung.",
    tags: ["unilateral", "balance", "strength"],
    subQuests: [{ id: "1", title: "3 Sätze à 10 Pistol Squats (oder assistiert) pro Bein", completed: false }, { id: "2", title: "3 Sätze à 12 einarmige Ruderzüge (Dumbbell Rows) pro Arm", completed: false }]
  },
  {
    id: "qp_str_10b", title: "Metabolische Zündung", category: "str", difficulty: "normal", minLevel: 6,
    desc: "Verbrenne den Treibstoff der Mitochondrien. Ein konstanter Puls an der anaeroben Schwelle.",
    tags: ["metabolic", "kettlebell", "conditioning"],
    subQuests: [{ id: "1", title: "100 Kettlebell Swings (oder Dumbbell Swings)", completed: false }, { id: "2", title: "50 Burpees so schnell wie möglich", completed: false }]
  },
  {
    id: "qp_str_10c", title: "Zeit unter Spannung (TUT)", category: "str", difficulty: "normal", minLevel: 7,
    desc: "Eliminiere Schwung. Langsame, kontrollierte Ausführung reizt die Muskelfasern tiefer.",
    tags: ["tut", "control", "hypertrophy"],
    subQuests: [{ id: "1", title: "3 Sätze Liegestütze (4 Sekunden ablassen, 1 Sekunde halten, explosiv hoch)", completed: false }, { id: "2", title: "3 Sätze Kniebeugen im gleichen 4-1-1 Tempo", completed: false }]
  },
  {
    id: "qp_str_10d", title: "Neuronale Agilität", category: "str", difficulty: "normal", minLevel: 8,
    desc: "Reaktionszeit ist Überleben. Trainiere multidirektionale Richtungswechsel und Beinarbeit.",
    tags: ["agility", "speed", "reflex"],
    subQuests: [{ id: "1", title: "15 Minuten Agility-Leiter-Drills oder Seilspringen", completed: false }, { id: "2", title: "10 x 10 Meter Shuttle-Sprints", completed: false }]
  },
  {
    id: "qp_str_11", title: "Spartanische Phalanx", category: "str", difficulty: "hard", minLevel: 12,
    desc: "Ein Zirkel absoluter physischer Zerstörung und Wiedergeburt. Das System toleriert keine Pausen.",
    tags: ["circuit", "endurance", "spartan"],
    subQuests: [{ id: "1", title: "Runde 1: 50 Klimmzüge, 50 Liegestütze, 50 Kniebeugen", completed: false }, { id: "2", title: "Runde 2: 30 Klimmzüge, 30 Liegestütze, 30 Kniebeugen", completed: false }, { id: "3", title: "Alle Übungen hintereinander mit maximal 30 Sekunden Pause zwischen Runden", completed: false }]
  },
  {
    id: "qp_str_11b", title: "Gravitations-Anomalie", category: "str", difficulty: "hard", minLevel: 14,
    desc: "Hebe Gewichte, die deine Struktur testen. Deadlifts fordern den gesamten posterioren Ketten-Apparat.",
    tags: ["deadlift", "heavy", "powerlifting"],
    subQuests: [{ id: "1", title: "Führe schweres Kreuzheben aus (5 Sätze, 3-5 Wiederholungen bei 80-85% 1RM)", completed: false }, { id: "2", title: "Absolviere danach 3 Minuten Dead-Hang am Stück (aufteilbar)", completed: false }]
  },
  {
    id: "qp_str_11c", title: "Hypoxischer Antrieb", category: "str", difficulty: "hard", minLevel: 15,
    desc: "Sauerstoffdefizit-Training. Gewöhne deine Muskulatur an die Arbeit unter suboptimalen Bedingungen.",
    tags: ["cardio", "hypoxic", "sprint"],
    subQuests: [{ id: "1", title: "400m Lauf-Intervalle: 6 Wiederholungen mit Nasenatmung", completed: false }, { id: "2", title: "Aktive Erholung dazwischen durch langsames Gehen", completed: false }]
  },
  {
    id: "qp_str_12", title: "Titan's Erbe", category: "str", difficulty: "boss", minLevel: 25,
    desc: "Eine legendäre Kraftprüfung. Nur die Elite kann diesen massiven Volumenschock bewältigen.",
    tags: ["boss-trial", "legendary", "volume"],
    subQuests: [{ id: "1", title: "Bewege kumuliert 10.000 kg Gewicht in einer einzigen Trainingssession (beliebige Übungen)", completed: false }, { id: "2", title: "Tracke und berechne jede Bewegung exakt", completed: false }, { id: "3", title: "Schließe die Session mit einem 2km Lauf im moderaten Tempo ab", completed: false }]
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
  {
    id: "qp_int_05", title: "Melodic Encoding", category: "int", difficulty: "easy", minLevel: 2,
    desc: "Musik aktiviert neuronale Netzwerke, die kein Lehrbuch erreicht. Lerne ein Instrument oder trainiere dein Gehör.",
    tags: ["music", "creativity", "learning"],
    subQuests: [{ id: "1", title: "20 Minuten ein Instrument üben oder ein Musik-Tutorial durcharbeiten", completed: false }, { id: "2", title: "Spiele eine einfache Melodie fehlerfrei von Anfang bis Ende", completed: false }]
  },
  {
    id: "qp_int_05b", title: "Sketch Protocol", category: "int", difficulty: "easy", minLevel: 3,
    desc: "Zeichnen ist visuelles Denken. Trainiere die Hand-Auge-Koordination und die räumliche Vorstellungskraft.",
    tags: ["drawing", "creativity", "visual"],
    subQuests: [{ id: "1", title: "Zeichne 15 Minuten lang nach Referenz (Gegenstand, Gesicht oder Landschaft)", completed: false }]
  },
  {
    id: "qp_int_06", title: "Budget Architect", category: "int", difficulty: "normal", minLevel: 4,
    desc: "Erstelle eine vollständige Finanz-Übersicht. Ohne Kontrolle über Ressourcen ist jede Strategie wertlos.",
    tags: ["finance", "budget", "planning"],
    subQuests: [{ id: "1", title: "Erstelle ein detailliertes Monatsbudget mit allen Einnahmen und Fixkosten", completed: false }, { id: "2", title: "Identifiziere 3 Posten mit Einsparpotenzial", completed: false }]
  },
  {
    id: "qp_int_06b", title: "Narrative Construction", category: "int", difficulty: "normal", minLevel: 6,
    desc: "Schreiben ist die höchste Form der Gedankenordnung. Konstruiere eine kohärente Erzählung.",
    tags: ["writing", "storytelling", "expression"],
    subQuests: [{ id: "1", title: "Schreibe eine Kurzgeschichte, einen Essay oder einen Blog-Post (min. 500 Wörter)", completed: false }, { id: "2", title: "Überarbeite den Text einmal vollständig auf Klarheit und Struktur", completed: false }]
  },
  {
    id: "qp_int_06c", title: "Investment Simulation", category: "int", difficulty: "normal", minLevel: 7,
    desc: "Analysiere Märkte wie ein Stratege. Verstehe Risiko, Rendite und Diversifikation auf fundamentaler Ebene.",
    tags: ["investment", "finance", "analysis"],
    subQuests: [{ id: "1", title: "Recherchiere 3 verschiedene Anlageformen (ETF, Aktien, Anleihen, Krypto, Immobilien)", completed: false }, { id: "2", title: "Erstelle ein hypothetisches Portfolio mit Begründung der Allokation", completed: false }]
  },
  {
    id: "qp_int_06d", title: "Side Project Ignition", category: "int", difficulty: "normal", minLevel: 9,
    desc: "Theorie ohne Anwendung verfällt. Starte ein konkretes Nebenprojekt, das dein Wissen materialisiert.",
    tags: ["project", "building", "application"],
    subQuests: [{ id: "1", title: "Definiere ein Side-Project mit klarem Scope (max. 1 Satz Problembeschreibung)", completed: false }, { id: "2", title: "Erstelle den ersten funktionalen Prototyp oder das erste Kapitel/den ersten Entwurf", completed: false }]
  },
  {
    id: "qp_int_07", title: "Systems Cartography", category: "int", difficulty: "hard", minLevel: 11,
    desc: "Erkenne die unsichtbaren Strukturen. Zerlege ein komplexes System in seine Feedback-Schleifen und Hebelpunkte.",
    tags: ["systems-thinking", "analysis", "mapping"],
    subQuests: [{ id: "1", title: "Wähle ein System (Unternehmen, Ökosystem, Software-Architektur) und erstelle eine visuelle Systemkarte", completed: false }, { id: "2", title: "Identifiziere 2 Feedback-Schleifen und 1 Hebelpunkt für maximale Wirkung", completed: false }]
  },
  {
    id: "qp_int_07b", title: "Deep Research Dive", category: "int", difficulty: "hard", minLevel: 14,
    desc: "Oberflächliches Wissen ist eine Illusion von Kompetenz. Tauche in die Primärquellen ein.",
    tags: ["research", "academic", "depth"],
    subQuests: [{ id: "1", title: "Lies 2 wissenschaftliche Paper oder Fachbuch-Kapitel zu einem Thema deiner Wahl", completed: false }, { id: "2", title: "Erstelle eine Zusammenfassung mit eigener kritischer Bewertung", completed: false }]
  },
  {
    id: "qp_int_07c", title: "Creative Fusion", category: "int", difficulty: "hard", minLevel: 16,
    desc: "Innovation entsteht an der Schnittstelle von Disziplinen. Kombiniere zwei unverbundene Wissensgebiete.",
    tags: ["interdisciplinary", "innovation", "creativity"],
    subQuests: [{ id: "1", title: "Wähle 2 unverbundene Fachgebiete und recherchiere jeweils 30 Minuten", completed: false }, { id: "2", title: "Schreibe einen 1-seitigen Aufsatz, der eine neuartige Verbindung zwischen beiden herstellt", completed: false }]
  },
  {
    id: "qp_int_07d", title: "Architectural Blueprint", category: "int", difficulty: "hard", minLevel: 18,
    desc: "Entwirf ein vollständiges System von Grund auf. Architektur-Design ist der ultimative Test für strukturiertes Denken.",
    tags: ["architecture", "design", "systems"],
    subQuests: [{ id: "1", title: "Entwirf die Architektur eines Systems (App, Geschäftsmodell, Lernplan, Organisation)", completed: false }, { id: "2", title: "Dokumentiere Komponenten, Schnittstellen und Abhängigkeiten in einem Diagramm", completed: false }, { id: "3", title: "Lasse das Design von einer anderen Person reviewen und integriere Feedback", completed: false }]
  },
  {
    id: "qp_int_08", title: "Polymath Trial", category: "int", difficulty: "boss", minLevel: 20,
    desc: "Der Hunter-Intellekt kennt keine Fachgrenzen. Beweise Kompetenz in drei verschiedenen Domänen an einem Tag.",
    tags: ["boss-trial", "polymath", "mastery"],
    subQuests: [{ id: "1", title: "Absolviere je 60 Minuten fokussierte Arbeit in 3 verschiedenen Wissensgebieten", completed: false }, { id: "2", title: "Erstelle für jedes Gebiet ein Output-Artefakt (Text, Code, Skizze, Analyse)", completed: false }]
  },
  {
    id: "qp_int_08a", title: "Knowledge Transmission", category: "int", difficulty: "boss", minLevel: 25,
    desc: "Wahre Meisterschaft zeigt sich in der Fähigkeit, Wissen weiterzugeben. Erstelle ein Lehrwerk.",
    tags: ["endgame", "teaching", "mastery"],
    subQuests: [{ id: "1", title: "Erstelle einen vollständigen Leitfaden, Tutorial oder Kurs zu deinem Spezialgebiet (min. 2000 Wörter oder 30 Min Video)", completed: false }, { id: "2", title: "Veröffentliche das Material und sammle Feedback von mindestens 3 Personen", completed: false }]
  },
  {
    id: "qp_int_08b", title: "Opus Magnum", category: "int", difficulty: "boss", minLevel: 30,
    desc: "Das Meisterwerk. Bringe ein Großprojekt zur Vollendung, das monatelange intellektuelle Arbeit manifestiert.",
    tags: ["endgame", "magnum-opus", "ultimate"],
    subQuests: [{ id: "1", title: "Schließe ein lang laufendes intellektuelles Projekt vollständig ab (Buch, App, Forschung, Kurs-Zertifizierung)", completed: false }, { id: "2", title: "Präsentiere das Ergebnis öffentlich (Vortrag, Post, Portfolio)", completed: false }, { id: "3", title: "Reflektiere schriftlich: Was hast du über dich selbst gelernt?", completed: false }]
  },
  {
    id: "qp_int_09", title: "Audio-Triage", category: "int", difficulty: "easy", minLevel: 2,
    desc: "Optimiere den auditiven Input. Verarbeite hochwertige Podcasts wie Datenpakete.",
    tags: ["podcast", "listening", "synthesis"],
    subQuests: [{ id: "1", title: "Höre eine 45-minütige Episode eines informativen Podcasts", completed: false }, { id: "2", title: "Notiere dir die drei wichtigsten Takeaways", completed: false }]
  },
  {
    id: "qp_int_09b", title: "Raum-Mapping", category: "int", difficulty: "easy", minLevel: 3,
    desc: "Aktiviere das räumliche Gedächtnis. Visualisiere und kartographiere deine Umgebung mental.",
    tags: ["spatial", "memory", "visualization"],
    subQuests: [{ id: "1", title: "Zeichne einen detaillierten Grundriss deines Hauses/Wohnung rein aus dem Kopf", completed: false }, { id: "2", title: "Füge mindestens 15 spezifische Objekte mit korrekter Positionierung hinzu", completed: false }]
  },
  {
    id: "qp_int_10", title: "Optische Beschleunigung", category: "int", difficulty: "normal", minLevel: 5,
    desc: "Erhöhe die Taktfrequenz deines visuellen Inputs. Trainiere Schnelllese-Techniken.",
    tags: ["speed-reading", "focus", "efficiency"],
    subQuests: [{ id: "1", title: "Lese 20 Minuten lang mit einem visuellen Pacer (z.B. dem Finger) und doppelter Normalgeschwindigkeit", completed: false }, { id: "2", title: "Fasse das Gelesene in einem 5-minütigen Brain-Dump schriftlich zusammen", completed: false }]
  },
  {
    id: "qp_int_10b", title: "Argumentative Dekonstruktion", category: "int", difficulty: "normal", minLevel: 6,
    desc: "Zerlege ein Argument in seine Prämissen und Konklusionen. Erkenne logische Fehlschlüsse.",
    tags: ["logic", "debate", "critical-thinking"],
    subQuests: [{ id: "1", title: "Analysiere einen Meinungsartikel oder ein Debatten-Video", completed: false }, { id: "2", title: "Identifiziere mindestens 2 logische Fehler (Fallacies) oder schwache Prämissen", completed: false }]
  },
  {
    id: "qp_int_10c", title: "Stahl-Konstrukt (Steel-Manning)", category: "int", difficulty: "normal", minLevel: 7,
    desc: "Baue das stärkste Argument für die gegnerische Seite. Erweitere deine Empathie-Logik.",
    tags: ["steel-man", "philosophy", "empathy"],
    subQuests: [{ id: "1", title: "Wähle eine Ansicht, der du fundamental widersprichst", completed: false }, { id: "2", title: "Schreibe 300 Wörter lang das überzeugendste Argument FÜR diese Ansicht auf", completed: false }]
  },
  {
    id: "qp_int_10d", title: "Neuronale Verästelung", category: "int", difficulty: "normal", minLevel: 8,
    desc: "Verbinde isolierte Datenpunkte. Mind-Mapping aktiviert simultan beide Gehirnhälften.",
    tags: ["mind-map", "creativity", "synthesis"],
    subQuests: [{ id: "1", title: "Erstelle eine gigantische, handgezeichnete Mind-Map zu einem Projekt oder Problem", completed: false }, { id: "2", title: "Nutze mindestens 3 verschiedene Farben und zeichne visuelle Symbole", completed: false }]
  },
  {
    id: "qp_int_11", title: "Kryptographischer Geist", category: "int", difficulty: "hard", minLevel: 12,
    desc: "Mustererkennung auf höchstem Niveau. Trainiere den Umgang mit komplexen Codes und Verschlüsselungen.",
    tags: ["crypto", "puzzle", "pattern"],
    subQuests: [{ id: "1", title: "Löse 3 komplexe Kryptogramme oder lerne die Grundlagen von Python/Regex für 60 Minuten", completed: false }, { id: "2", title: "Verstecke eine Nachricht in einem eigenen Code", completed: false }]
  },
  {
    id: "qp_int_11b", title: "Philosophische Extraktion", category: "int", difficulty: "hard", minLevel: 14,
    desc: "Dekodiere dichte, historische Texte. Die Weisheit von Jahrhunderten liegt verborgen im Vokabular.",
    tags: ["philosophy", "deep-reading", "history"],
    subQuests: [{ id: "1", title: "Lese 30 Minuten lang einen primären philosophischen Text (z.B. Seneca, Kant, Aurelius)", completed: false }, { id: "2", title: "Übersetze einen Absatz in moderne, eigene Sprache ohne Sinnverlust", completed: false }]
  },
  {
    id: "qp_int_11c", title: "KI-Synergie", category: "int", difficulty: "hard", minLevel: 16,
    desc: "Verschmilz mit der Maschine. Nutze fortgeschrittene KI-Tools, um ein Problem in Rekordzeit zu lösen.",
    tags: ["ai", "tools", "leverage"],
    subQuests: [{ id: "1", title: "Nutze LLMs oder andere KI, um einen komplexen Arbeitsfluss zu automatisieren oder zu durchdringen", completed: false }, { id: "2", title: "Optimiere den Prompt mindestens 5 Mal, um das absolute Maximum herauszuholen", completed: false }, { id: "3", title: "Dokumentiere den finalen Workflow", completed: false }]
  },
  {
    id: "qp_int_12", title: "Die Omnipräsenz-Prüfung", category: "int", difficulty: "boss", minLevel: 25,
    desc: "Beherrsche die Synthese. Das System testet deine Fähigkeit, massives Wissen sofort abzurufen.",
    tags: ["boss-trial", "presentation", "mastery"],
    subQuests: [{ id: "1", title: "Bereite eine 15-minütige Präsentation über ein neues Fachgebiet vor (ohne Slides)", completed: false }, { id: "2", title: "Halte die Präsentation vor einer Kamera oder echten Personen fließend", completed: false }, { id: "3", title: "Beantworte danach 5 tiefgehende Fragen zur Thematik (oder simuliere sie)", completed: false }]
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
    subQuests: [{ id: "1", title: "Wende 3x heute die 20-20-20 Regel an (6 Meter, 20 Sekunden alle 20 Minuten)", completed: false }, { id: "2", title: "10 Minuten Augen komplett schließen ohne einzuschlafen", completed: false }]
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
  {
    id: "qp_vit_05", title: "Gratitude Log", category: "vit", difficulty: "easy", minLevel: 2,
    desc: "Das System registriert chronischen Negativitäts-Bias. Rekalibriere die Wahrnehmung durch bewusste Dankbarkeit.",
    tags: ["gratitude", "journaling", "mental-health"],
    subQuests: [{ id: "1", title: "Schreibe 5 spezifische Dinge auf, für die du heute dankbar bist (nicht generisch)", completed: false }, { id: "2", title: "Teile eine davon mit einer Person, die daran beteiligt war", completed: false }]
  },
  {
    id: "qp_vit_05b", title: "Breath Calibration", category: "vit", difficulty: "easy", minLevel: 3,
    desc: "Atemmuster steuern das autonome Nervensystem. Übernimm die manuelle Kontrolle.",
    tags: ["breathwork", "relaxation", "basics"],
    subQuests: [{ id: "1", title: "Absolviere 10 Minuten strukturierte Atemübung (Box Breathing: 4-4-4-4 oder Wim Hof)", completed: false }]
  },
  {
    id: "qp_vit_06", title: "Micro-Nutrient Audit", category: "vit", difficulty: "normal", minLevel: 4,
    desc: "Makros allein reichen nicht. Analysiere deine Mikronährstoff-Versorgung auf molekularer Ebene.",
    tags: ["nutrition", "vitamins", "tracking"],
    subQuests: [{ id: "1", title: "Tracke alle Mahlzeiten eines Tages in einer Ernährungs-App (Cronometer, MyFitnessPal)", completed: false }, { id: "2", title: "Identifiziere 2 defizitäre Mikronährstoffe und plane gezielte Lebensmittel dagegen", completed: false }]
  },
  {
    id: "qp_vit_06b", title: "Journal Protocol", category: "vit", difficulty: "normal", minLevel: 5,
    desc: "Gedanken im Kopf sind Chaos. Auf Papier werden sie zu Daten. Initiiere tägliches Journaling.",
    tags: ["journaling", "reflection", "mental-health"],
    subQuests: [{ id: "1", title: "Schreibe 15 Minuten ungefiltert in ein Journal (Morning Pages oder Abendreflexion)", completed: false }, { id: "2", title: "Beantworte: Was war heute die größte Herausforderung und was habe ich daraus gelernt?", completed: false }]
  },
  {
    id: "qp_vit_06c", title: "Forest Immersion", category: "vit", difficulty: "normal", minLevel: 7,
    desc: "Shinrin-yoku — Waldbaden. Wissenschaftlich nachgewiesen zur Senkung von Cortisol und Blutdruck.",
    tags: ["nature", "forest", "recovery"],
    subQuests: [{ id: "1", title: "Verbringe 45 Minuten bewusst im Wald oder Park (kein Smartphone, keine Kopfhörer)", completed: false }, { id: "2", title: "Nutze alle 5 Sinne aktiv: Was hörst, riechst, siehst, fühlst, schmeckst du?", completed: false }]
  },
  {
    id: "qp_vit_06d", title: "Sleep Architecture", category: "vit", difficulty: "normal", minLevel: 8,
    desc: "Schlafqualität > Schlafquantität. Optimiere die Schlaf-Architektur für maximale REM- und Tiefschlaf-Phasen.",
    tags: ["sleep", "optimization", "routine"],
    subQuests: [{ id: "1", title: "Etabliere ein 30-minütiges Schlaf-Ritual (gleiche Uhrzeit, gleiche Abfolge: Dimmen, Lesen, Atemübung)", completed: false }, { id: "2", title: "Kein Koffein nach 14:00 Uhr und Schlafzimmer auf unter 19°C kühlen", completed: false }]
  },
  {
    id: "qp_vit_07", title: "Digital Detox Protocol", category: "vit", difficulty: "hard", minLevel: 11,
    desc: "Totale Entkopplung vom digitalen Rauschen. Das System fordert einen vollständigen Neustart der sensorischen Eingänge.",
    tags: ["digital-detox", "offline", "reset"],
    subQuests: [{ id: "1", title: "12 Stunden komplett ohne Smartphone, Laptop und Bildschirme", completed: false }, { id: "2", title: "Fülle die gewonnene Zeit mit analogen Aktivitäten (Lesen, Kochen, Spazieren, Handwerk)", completed: false }]
  },
  {
    id: "qp_vit_07b", title: "Meal Prep Engineering", category: "vit", difficulty: "hard", minLevel: 13,
    desc: "Ernährung ist kein Zufall. Plane und bereite Mahlzeiten vor, um Impulskonsum zu eliminieren.",
    tags: ["meal-prep", "nutrition", "discipline"],
    subQuests: [{ id: "1", title: "Plane alle Mahlzeiten für 3 Tage im Voraus (Makros + Mikros berücksichtigen)", completed: false }, { id: "2", title: "Bereite mindestens 4 Mahlzeiten vor und lagere sie portioniert ein", completed: false }]
  },
  {
    id: "qp_vit_07c", title: "Emotional Debrief", category: "vit", difficulty: "hard", minLevel: 16,
    desc: "Unterdrückte Emotionen akkumulieren als systemischer Stress. Forciere eine kontrollierte Entladung.",
    tags: ["mental-health", "emotions", "processing"],
    subQuests: [{ id: "1", title: "Schreibe 20 Minuten ungefiltert über ein Thema, das dich emotional belastet (Expressive Writing)", completed: false }, { id: "2", title: "Identifiziere das zugrundeliegende Bedürfnis hinter der Emotion und formuliere eine konkrete Maßnahme", completed: false }]
  },
  {
    id: "qp_vit_07d", title: "Recovery Week Protocol", category: "vit", difficulty: "hard", minLevel: 18,
    desc: "Chronische Überbelastung ohne Deload führt zum Systemkollaps. Plane eine aktive Erholungswoche.",
    tags: ["recovery", "deload", "planning"],
    subQuests: [{ id: "1", title: "Plane eine Woche mit reduzierter Trainingsintensität (50% Volumen/Gewicht)", completed: false }, { id: "2", title: "Ersetze intensive Sessions durch Yoga, Schwimmen oder ausgedehnte Spaziergänge", completed: false }, { id: "3", title: "Schlafe jeden Tag dieser Woche mindestens 8 Stunden", completed: false }]
  },
  {
    id: "qp_vit_08", title: "Sanctuary Day", category: "vit", difficulty: "boss", minLevel: 20,
    desc: "Ein ganzer Tag nur für Regeneration. Kein Output. Kein Hustle. Das System erzwingt vollständige Wiederherstellung.",
    tags: ["boss-trial", "full-rest", "sanctuary"],
    subQuests: [{ id: "1", title: "Verbringe den gesamten Tag offline (kein Internet, keine Nachrichten)", completed: false }, { id: "2", title: "Absolviere 3 verschiedene Erholungsaktivitäten (Natur, Bad/Sauna, kreatives Hobby)", completed: false }, { id: "3", title: "Schreibe am Abend eine Reflexion: Wie fühlt sich dein Körper und Geist nach einem Tag ohne Leistungsdruck?", completed: false }]
  },
  {
    id: "qp_vit_08a", title: "Biohacking Mastery", category: "vit", difficulty: "boss", minLevel: 25,
    desc: "Optimiere jeden Parameter deiner Biologie. Schlaf, Ernährung, Licht, Temperatur — alles wird kalibriert.",
    tags: ["endgame", "biohacking", "optimization"],
    subQuests: [{ id: "1", title: "Implementiere 5 wissenschaftlich fundierte Biohacks für eine Woche (z.B. Blue-Light-Filter, Magnesium vor dem Schlaf, Morgensonne, Kältetherapie, Nasenband)", completed: false }, { id: "2", title: "Tracke die Auswirkungen auf Schlafqualität, Energie und Stimmung täglich", completed: false }]
  },
  {
    id: "qp_vit_08b", title: "Vitality Gauntlet", category: "vit", difficulty: "boss", minLevel: 30,
    desc: "Die ultimative Vitalitätsprüfung. 7 Tage perfekte Disziplin in Schlaf, Ernährung, Bewegung und Achtsamkeit.",
    tags: ["endgame", "perfect-week", "ultimate"],
    subQuests: [{ id: "1", title: "7 Tage in Folge: 8h Schlaf, 0% Zucker, 30 Min Bewegung, 10 Min Meditation — ohne eine einzige Ausnahme", completed: false }, { id: "2", title: "Dokumentiere jeden Tag mit einem kurzen Vitalitäts-Score (1-10) und Notizen", completed: false }, { id: "3", title: "Vergleiche Tag 1 mit Tag 7: Wie hat sich dein Baseline-Level verändert?", completed: false }]
  },
  {
    id: "qp_vit_09", title: "Solar-Rezeptoren", category: "vit", difficulty: "easy", minLevel: 3,
    desc: "Licht steuert die Biologie. Aktiviere die Rezeptoren.",
    tags: ["sunlight", "morning", "health"],
    subQuests: [{ id: "1", title: "Verbringe morgens 10 Minuten in direktem Sonnenlicht", completed: false }]
  },
  {
    id: "qp_vit_09b", title: "Basis-Hydration", category: "vit", difficulty: "easy", minLevel: 3,
    desc: "Das System benötigt Wasser nach der Offline-Phase.",
    tags: ["water", "morning", "health"],
    subQuests: [{ id: "1", title: "Trinke 500ml Wasser direkt nach dem Aufstehen", completed: false }]
  },
  {
    id: "qp_vit_10", title: "Ernährungs-Audit", category: "vit", difficulty: "normal", minLevel: 4,
    desc: "Eliminiere leere Kalorien aus dem System.",
    tags: ["nutrition", "diet", "health"],
    subQuests: [{ id: "1", title: "Ersetze eine ungesunde Mahlzeit durch eine vollständig vollwertige", completed: false }]
  },
  {
    id: "qp_vit_10b", title: "Kortisol-Senkung", category: "vit", difficulty: "normal", minLevel: 5,
    desc: "Stresshormone blockieren die Regeneration. Initiiere Gegenmaßnahmen.",
    tags: ["stress", "relaxation", "health"],
    subQuests: [{ id: "1", title: "Absolviere 20 Minuten aktive Entspannung (Yoga, Meditation, leichtes Dehnen)", completed: false }]
  },
  {
    id: "qp_vit_10c", title: "Schlaf-Parameter", category: "vit", difficulty: "normal", minLevel: 6,
    desc: "Optimiere die Umgebungsbedingungen für den Shutdown.",
    tags: ["sleep", "environment", "recovery"],
    subQuests: [{ id: "1", title: "Lüfte das Schlafzimmer für 15 Minuten und eliminiere alle Lichtquellen", completed: false }]
  },
  {
    id: "qp_vit_10d", title: "Sauerstoff-Sättigung", category: "vit", difficulty: "normal", minLevel: 8,
    desc: "Erhöhe die Sauerstoffaufnahme durch bewusste Zwerchfellatmung.",
    tags: ["breathing", "oxygen", "health"],
    subQuests: [{ id: "1", title: "Führe 3 Runden tiefes Wim-Hof-Atmen durch", completed: false }]
  },
  {
    id: "qp_vit_11", title: "Fasten-Protokoll", category: "vit", difficulty: "hard", minLevel: 10,
    desc: "Gib dem Verdauungssystem Zeit für Reparaturprozesse.",
    tags: ["fasting", "health", "discipline"],
    subQuests: [{ id: "1", title: "Absolviere ein 18-stündiges Intervallfasten", completed: false }]
  },
  {
    id: "qp_vit_11b", title: "Endurance-Test", category: "vit", difficulty: "hard", minLevel: 12,
    desc: "Kardiovaskuläre Spitzenleistung ist nicht verhandelbar.",
    tags: ["cardio", "endurance", "health"],
    subQuests: [{ id: "1", title: "Laufe oder fahre Rad für 45 Minuten im moderaten bis hohen Pulsbereich", completed: false }]
  },
  {
    id: "qp_vit_11c", title: "Bio-Reset", category: "vit", difficulty: "hard", minLevel: 14,
    desc: "Entferne alle Stimulanzien, um Sensoren zu rekalibrieren.",
    tags: ["detox", "discipline", "health"],
    subQuests: [{ id: "1", title: "Ein ganzer Tag ohne Koffein und ohne Zucker", completed: false }]
  },
  {
    id: "qp_vit_12", title: "Perfekte Synchronisation", category: "vit", difficulty: "boss", minLevel: 20,
    desc: "Bringe alle Vitalitäts-Parameter in absolute Harmonie.",
    tags: ["boss-trial", "ultimate", "health"],
    subQuests: [{ id: "1", title: "7 Tage in Folge: Perfekte Makronährstoffe, 8 Stunden Schlaf und 3L Wasser täglich", completed: false }]
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
  {
    id: "qp_agi_05", title: "Workspace Cleanse", category: "agi", difficulty: "easy", minLevel: 2,
    desc: "Ein chaotisches Arbeitsumfeld verlangsamt die kognitive Verarbeitungsgeschwindigkeit. Optimiere deine Basis.",
    tags: ["productivity", "organization", "workspace"],
    subQuests: [{ id: "1", title: "Räume deinen Schreibtisch komplett auf und wische ihn ab", completed: false }, { id: "2", title: "Säubere deinen digitalen Desktop von unnötigen Verknüpfungen", completed: false }]
  },
  {
    id: "qp_agi_05b", title: "Focus Block Setup", category: "agi", difficulty: "easy", minLevel: 3,
    desc: "Das System verlangt ununterbrochene Konzentration. Schütze deine Zeit proaktiv.",
    tags: ["time-management", "focus", "planning"],
    subQuests: [{ id: "1", title: "Blocke mindestens zwei 90-Minuten-Fokuszeiten für die kommende Woche im Kalender", completed: false }]
  },
  {
    id: "qp_agi_06", title: "Inbox Zero Protocol", category: "agi", difficulty: "normal", minLevel: 4,
    desc: "Ungelesene Nachrichten sind offene Schleifen im Arbeitsspeicher. Defragmentiere deine Posteingänge.",
    tags: ["efficiency", "inbox-zero", "digital"],
    subQuests: [{ id: "1", title: "Archiviere, lösche oder beantworte alle E-Mails, bis Posteingang Null erreicht ist", completed: false }, { id: "2", title: "Bestelle mindestens 3 ungenutzte Newsletter ab", completed: false }]
  },
  {
    id: "qp_agi_06b", title: "Routine Automation", category: "agi", difficulty: "normal", minLevel: 5,
    desc: "Manuelle Wiederholungen mindern die Agilität. Delegiere repetitive Aufgaben an das System.",
    tags: ["automation", "tech", "efficiency"],
    subQuests: [{ id: "1", title: "Erstelle ein Makro, einen Apple Shortcut oder ein kleines Script für eine tägliche Aufgabe", completed: false }, { id: "2", title: "Testen und optimieren des Ablaufs auf minimale Nutzerinteraktion", completed: false }]
  },
  {
    id: "qp_agi_06c", title: "Digital Filing System", category: "agi", difficulty: "normal", minLevel: 7,
    desc: "Suchzeit ist verschwendete Lebensenergie. Strukturiere dein digitales Archiv.",
    tags: ["organization", "digital", "system"],
    subQuests: [{ id: "1", title: "Bereinige den Download-Ordner und sortiere alle Dateien in eine logische Ordnerstruktur", completed: false }]
  },
  {
    id: "qp_agi_06d", title: "Professional Sync", category: "agi", difficulty: "normal", minLevel: 8,
    desc: "Führe eine Lagebeurteilung durch. Stimmen deine aktuellen Aktivitäten mit deinen Karrierezielen überein?",
    tags: ["career", "alignment", "reflection"],
    subQuests: [{ id: "1", title: "Liste deine 3 wichtigsten beruflichen Projekte auf", completed: false }, { id: "2", title: "Definiere für jedes Projekt den nächsten, sofort ausführbaren Schritt", completed: false }]
  },
  {
    id: "qp_agi_07", title: "Time Tracking Audit", category: "agi", difficulty: "hard", minLevel: 11,
    desc: "Du kannst nicht optimieren, was du nicht misst. Führe ein genaues Protokoll deiner investierten Zeit.",
    tags: ["tracking", "audit", "time"],
    subQuests: [{ id: "1", title: "Tracke jede Minute deiner Arbeitszeit für einen vollen Arbeitstag (z.B. mit Toggle oder Excel)", completed: false }, { id: "2", title: "Analysiere am Abend: Wo ist unproduktive Zeit versickert?", completed: false }]
  },
  {
    id: "qp_agi_07b", title: "Habit Stacking Engine", category: "agi", difficulty: "hard", minLevel: 13,
    desc: "Verknüpfe neue Gewohnheiten mit bestehenden Auslösern, um neuronale Pfade schneller zu festigen.",
    tags: ["habits", "psychology", "discipline"],
    subQuests: [{ id: "1", title: "Etabliere eine neue Habit-Schleife: Nach [bestehender Routine] werde ich sofort [neue Gewohnheit] ausführen", completed: false }, { id: "2", title: "Wiederhole dies erfolgreich an 3 Tagen hintereinander", completed: false }]
  },
  {
    id: "qp_agi_07c", title: "Career Trajectory Map", category: "agi", difficulty: "hard", minLevel: 16,
    desc: "Ein Hunter ohne Ziel driftet ziellos umher. Zeichne die Route zu deiner ultimativen beruflichen Form.",
    tags: ["career", "vision", "planning"],
    subQuests: [{ id: "1", title: "Erstelle einen detaillierten 5-Jahres-Karriereplan mit Meilensteinen und benötigten Skills", completed: false }, { id: "2", title: "Identifiziere 3 konkrete Fähigkeiten, die du als nächstes erlernen musst", completed: false }]
  },
  {
    id: "qp_agi_07d", title: "Network Refresh", category: "agi", difficulty: "hard", minLevel: 18,
    desc: "Inaktive Verbindungen verkümmern. Reaktivierung deines professionellen Netzwerks.",
    tags: ["networking", "career", "social"],
    subQuests: [{ id: "1", title: "Kontaktiere 3 ehemalige Kollegen oder Geschäftspartner ohne geschäftliches Hintergedanken", completed: false }, { id: "2", title: "Schlage einen kurzen virtuellen Kaffee oder Telefonat vor, um sich auszutauschen", completed: false }, { id: "3", title: "Führe mindestens eines dieser Gespräche erfolgreich", completed: false }]
  },
  {
    id: "qp_agi_08", title: "System Integration", category: "agi", difficulty: "boss", minLevel: 20,
    desc: "Beseitige manuelle Reibungspunkte in deinem Leben. Baue eine integrierte Workflow-Pipeline.",
    tags: ["boss-trial", "automation", "efficiency"],
    subQuests: [{ id: "1", title: "Automatisiere einen komplexen, mehrschrittigen Workflow mit Zapier, Make oder Skripten", completed: false }, { id: "2", title: "Dokumentiere das System, damit du es bei Fehlern schnell reparieren kannst", completed: false }]
  },
  {
    id: "qp_agi_08a", title: "Workflow Re-Engineering", category: "agi", difficulty: "boss", minLevel: 25,
    desc: "Analysiere deine wöchentlichen Routinen und eliminiere Flaschenhälse. Maximiere deinen Hebel.",
    tags: ["endgame", "optimization", "productivity"],
    subQuests: [{ id: "1", title: "Führe eine vollständige Analyse deiner wöchentlichen Verpflichtungen durch", completed: false }, { id: "2", title: "Eliminiere, delegiere oder automatisiere mindestens 2 zeitintensive Aufgaben dauerhaft", completed: false }]
  },
  {
    id: "qp_agi_08b", title: "Monarch's Chronometry", category: "agi", difficulty: "boss", minLevel: 30,
    desc: "Die ultimative Effizienzprüfung. Bringe die Zeiteinteilung zur absoluten Perfektion an einem Tag.",
    tags: ["endgame", "deep-work", "ultimate"],
    subQuests: [{ id: "1", title: "Absolviere 10 Stunden hochkonzentrierte Deep-Work-Fokuszeiten innerhalb von 15 Stunden", completed: false }, { id: "2", title: "0 Minuten private Ablenkung während der Arbeitsblöcke", completed: false }, { id: "3", title: "Erreiche alle für diesen Tag gesetzten Projektziele ohne Verzug", completed: false }]
  },
  {
    id: "qp_agi_09", title: "Mikro-Aktionen", category: "agi", difficulty: "easy", minLevel: 3,
    desc: "Erledige kleine Aufgaben sofort, um Momentum zu generieren.",
    tags: ["action", "momentum", "efficiency"],
    subQuests: [{ id: "1", title: "Erledige 3 Aufgaben, die jeweils weniger als 2 Minuten dauern", completed: false }]
  },
  {
    id: "qp_agi_09b", title: "Workspace-Fokus", category: "agi", difficulty: "easy", minLevel: 3,
    desc: "Ein klarer Raum führt zu klaren Gedanken.",
    tags: ["workspace", "cleaning", "focus"],
    subQuests: [{ id: "1", title: "Entferne 5 unnötige Objekte von deinem Schreibtisch", completed: false }]
  },
  {
    id: "qp_agi_10", title: "Prioritäten-Matrix", category: "agi", difficulty: "normal", minLevel: 4,
    desc: "Trenne das Wichtige vom Dringenden.",
    tags: ["planning", "priority", "strategy"],
    subQuests: [{ id: "1", title: "Ordne deine To-Do-Liste nach der Eisenhower-Matrix", completed: false }]
  },
  {
    id: "qp_agi_10b", title: "Ablenkungs-Blocker", category: "agi", difficulty: "normal", minLevel: 5,
    desc: "Schütze deine kognitive Kapazität.",
    tags: ["focus", "digital-detox", "efficiency"],
    subQuests: [{ id: "1", title: "Aktiviere den 'Bitte nicht stören'-Modus auf allen Geräten für 2 Stunden", completed: false }]
  },
  {
    id: "qp_agi_10c", title: "Batch-Processing", category: "agi", difficulty: "normal", minLevel: 6,
    desc: "Bündle ähnliche Aufgaben zur Minimierung von Kontextwechseln.",
    tags: ["efficiency", "workflow", "focus"],
    subQuests: [{ id: "1", title: "Bearbeite alle E-Mails und Nachrichten gesammelt in einem einzigen 30-Minuten-Block", completed: false }]
  },
  {
    id: "qp_agi_10d", title: "Wochen-Review", category: "agi", difficulty: "normal", minLevel: 8,
    desc: "Evaluiere den Fortschritt, um Kurskorrekturen vorzunehmen.",
    tags: ["review", "planning", "strategy"],
    subQuests: [{ id: "1", title: "Führe ein 20-minütiges Review deiner Wochenziele durch", completed: false }]
  },
  {
    id: "qp_agi_11", title: "Tiefen-Fokus", category: "agi", difficulty: "hard", minLevel: 10,
    desc: "Tauche ab in den Deep-Work-Modus.",
    tags: ["deep-work", "focus", "efficiency"],
    subQuests: [{ id: "1", title: "Absolviere einen ununterbrochenen 90-Minuten Deep-Work-Block", completed: false }]
  },
  {
    id: "qp_agi_11b", title: "System-Automatisierung", category: "agi", difficulty: "hard", minLevel: 12,
    desc: "Lass Maschinen die Routinearbeit übernehmen.",
    tags: ["automation", "system", "efficiency"],
    subQuests: [{ id: "1", title: "Automatisiere oder delegiere eine wiederkehrende wöchentliche Aufgabe komplett", completed: false }]
  },
  {
    id: "qp_agi_11c", title: "Energie-Management", category: "agi", difficulty: "hard", minLevel: 14,
    desc: "Passe deine Arbeit an deine biologische Uhr an.",
    tags: ["energy", "planning", "efficiency"],
    subQuests: [{ id: "1", title: "Erledige deine wichtigste und schwerste Aufgabe während deines biologischen Leistungshochs", completed: false }]
  },
  {
    id: "qp_agi_12", title: "Architekt der Zeit", category: "agi", difficulty: "boss", minLevel: 20,
    desc: "Meistere die Dimension der Zeit.",
    tags: ["boss-trial", "time-management", "ultimate"],
    subQuests: [{ id: "1", title: "Plane und exekutiere eine gesamte Woche im Time-Boxing-Format ohne nennenswerte Abweichungen", completed: false }]
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
  },
  {
    id: "qp_cha_05", title: "Appreciation Broadcast", category: "cha", difficulty: "easy", minLevel: 2,
    desc: "Authentische Wertschätzung stärkt soziale Bindungen. Sende positive Impulse in dein Netzwerk.",
    tags: ["gratitude", "social", "communication"],
    subQuests: [{ id: "1", title: "Sende zwei Menschen aus deinem Umfeld eine unerwartete Nachricht, in der du dich für etwas Bestimmtes bedankst", completed: false }]
  },
  {
    id: "qp_cha_05b", title: "Family Line", category: "cha", difficulty: "easy", minLevel: 3,
    desc: "Die stärksten Fundamente liegen in der Familie. Reaktivierung vernachlässigter familiärer Kanäle.",
    tags: ["family", "relationship", "communication"],
    subQuests: [{ id: "1", title: "Führe ein Telefonat oder triff dich mit einem Familienmitglied, das du länger nicht gesprochen hast (min. 15 Minuten)", completed: false }]
  },
  {
    id: "qp_cha_06", title: "Active Listening Protocol", category: "cha", difficulty: "normal", minLevel: 4,
    desc: "Ein guter Gesprächspartner glänzt nicht durch Reden, sondern durch tiefes Verstehen.",
    tags: ["communication", "listening", "empathy"],
    subQuests: [{ id: "1", title: "Führe ein Gespräch, in dem du absolut keine Ratschläge gibst, sondern nur aktiv zuhörst und das Gesagte spiegelst", completed: false }, { id: "2", title: "Lass den anderen ausreden, ohne ihn zu unterbrechen (min. 10 Minuten)", completed: false }]
  },
  {
    id: "qp_cha_06b", title: "Mentorship Catalyst", category: "cha", difficulty: "normal", minLevel: 5,
    desc: "Wissen wird wertvoller, wenn man es teilt. Hilf einem Verbündeten bei seiner Entwicklung.",
    tags: ["mentoring", "knowledge", "help"],
    subQuests: [{ id: "1", title: "Erkläre jemandem eine komplexe Fähigkeit oder Methode, die du gut beherrschst", completed: false }, { id: "2", title: "Beantworte alle Verständnisfragen geduldig und verständlich", completed: false }]
  },
  {
    id: "qp_cha_06c", title: "Community Interface", category: "cha", difficulty: "normal", minLevel: 7,
    desc: "Ein Hunter agiert nicht im Vakuum. Klinke dich in die lokale oder globale Gemeinschaft ein.",
    tags: ["community", "networking", "social"],
    subQuests: [{ id: "1", title: "Nimm an einem lokalen Treffen, Vereinsabend oder Community-Event teil", completed: false }]
  },
  {
    id: "qp_cha_06d", title: "Gratitude Node", category: "cha", difficulty: "normal", minLevel: 8,
    desc: "Analoge Wertschätzung besitzt ungleich höhere Bindungskraft. Hinterlasse ein bleibendes Signal.",
    tags: ["gratitude", "writing", "friends"],
    subQuests: [{ id: "1", title: "Schreibe einen handschriftlichen Dankesbrief an eine Person, die dich unterstützt hat", completed: false }, { id: "2", title: "Übergib oder verschicke den Brief physisch", completed: false }]
  },
  {
    id: "qp_cha_07", title: "Conflict Calibration", category: "cha", difficulty: "hard", minLevel: 11,
    desc: "Ungesagte Worte vergiften Beziehungen. Konfrontiere Spannungen sachlich und konstruktiv.",
    tags: ["conflict", "resolution", "communication"],
    subQuests: [{ id: "1", title: "Sprich ein schwelendes Missverständnis oder einen Konflikt offen, aber ruhig an", completed: false }, { id: "2", title: "Finde gemeinsam eine Vereinbarung oder Lösung, mit der beide Seiten leben können", completed: false }]
  },
  {
    id: "qp_cha_07b", title: "Quality Time Engine", category: "cha", difficulty: "hard", minLevel: 13,
    desc: "Beziehungen benötigen ungeteilte Aufmerksamkeit. Eliminiere Ablenkungen für echte Nähe.",
    tags: ["relationship", "friends", "quality-time"],
    subQuests: [{ id: "1", title: "Plane einen gemeinsamen Abend mit einem Partner oder engen Freund", completed: false }, { id: "2", title: "Verbanne alle Smartphones während der gesamten Zeit (min. 3 Stunden offline)", completed: false }]
  },
  {
    id: "qp_cha_07c", title: "Leadership Alignment", category: "cha", difficulty: "hard", minLevel: 16,
    desc: "Koordiniere ein Team oder eine Gruppe, um ein gemeinsames Ziel zu erreichen. Übe Führungsstärke.",
    tags: ["leadership", "teamwork", "management"],
    subQuests: [{ id: "1", title: "Übernimm die Initiative bei einer Gruppenentscheidung oder einem Projekt", completed: false }, { id: "2", title: "Führe die Diskussion zielgerichtet und sorge dafür, dass jeder gehört wird", completed: false }]
  },
  {
    id: "qp_cha_07d", title: "Social Support Net", category: "cha", difficulty: "hard", minLevel: 18,
    desc: "In schweren Zeiten zeigt sich der Wert einer Allianz. Sei ein Fels in der Brandung für jemanden in Not.",
    tags: ["support", "empathy", "crisis"],
    subQuests: [{ id: "1", title: "Biete einem Freund in einer schwierigen Phase aktiv deine Hilfe oder ein offenes Ohr an", completed: false }, { id: "2", title: "Nimm dir mindestens 1 Stunde Zeit, um ganz für diese Person da zu sein", completed: false }]
  },
  {
    id: "qp_cha_08", title: "Vanguard Summit", category: "cha", difficulty: "boss", minLevel: 20,
    desc: "Werde zum Mittelpunkt deines Netzwerks. Hoste ein Event, das Wissen und Menschen verbindet.",
    tags: ["boss-trial", "hosting", "leadership"],
    subQuests: [{ id: "1", title: "Organisiere ein Netzwerktreffen, einen Vortrag oder einen Workshop für mindestens 4 Personen", completed: false }, { id: "2", title: "Bereite das Thema professionell vor und leite die Veranstaltung eigenständig", completed: false }]
  },
  {
    id: "qp_cha_08a", title: "Tribal Accord", category: "cha", difficulty: "boss", minLevel: 25,
    desc: "Führe Menschen über Grenzen hinweg zusammen. Schlichte einen tiefen Konflikt oder leite ein großes Gemeinschaftsprojekt.",
    tags: ["endgame", "conflict-resolution", "community"],
    subQuests: [{ id: "1", title: "Schlichte erfolgreich einen langanhaltenden Konflikt im Team/Familie ODER Leite ein gemeinnütziges Projekt", completed: false }, { id: "2", title: "Erreiche ein schriftlich oder mündlich fixiertes gemeinsames Abkommen aller Parteien", completed: false }]
  },
  {
    id: "qp_cha_08b", title: "Legacy of Charisma", category: "cha", difficulty: "boss", minLevel: 30,
    desc: "Hinterlasse ein soziales Erbe. Das System fordert die langfristige Förderung des Nachwuchses.",
    tags: ["endgame", "mentorship", "legacy"],
    subQuests: [{ id: "1", title: "Nimm eine Person für mindestens 3 Monate als Mentor unter deine Fittiche ODER starte eine langfristige Wohltätigkeitsinitiative", completed: false }, { id: "2", title: "Dokumentiere den Fortschritt und die Entwicklungsziele monatlich", completed: false }, { id: "3", title: "Erstelle eine Abschlussreflexion über die erbrachten Resultate", completed: false }]
  },
  {
    id: "qp_cha_09", title: "Präsenz-Check", category: "cha", difficulty: "easy", minLevel: 3,
    desc: "Präsenz ist der erste Schritt zum Einfluss.",
    tags: ["presence", "body-language", "social"],
    subQuests: [{ id: "1", title: "Achte in 3 Gesprächen bewusst auf Augenkontakt und offene Körpersprache", completed: false }]
  },
  {
    id: "qp_cha_09b", title: "Aktives Zuhören", category: "cha", difficulty: "easy", minLevel: 3,
    desc: "Zuhören ist mächtiger als sprechen.",
    tags: ["listening", "communication", "social"],
    subQuests: [{ id: "1", title: "Lasse in einem Gespräch den anderen zu 80% sprechen, ohne zu unterbrechen", completed: false }]
  },
  {
    id: "qp_cha_10", title: "Wertschätzungs-Signal", category: "cha", difficulty: "normal", minLevel: 4,
    desc: "Verteile verbale Belohnungen im Netzwerk.",
    tags: ["appreciation", "social", "connection"],
    subQuests: [{ id: "1", title: "Mache drei ernstgemeinte Komplimente an verschiedene Personen", completed: false }]
  },
  {
    id: "qp_cha_10b", title: "Netzwerk-Pflege", category: "cha", difficulty: "normal", minLevel: 5,
    desc: "Investiere in bestehende Allianzen.",
    tags: ["networking", "social", "connection"],
    subQuests: [{ id: "1", title: "Schreibe einer wichtigen Person, mit der du länger nicht gesprochen hast, eine Nachricht", completed: false }]
  },
  {
    id: "qp_cha_10c", title: "Konflikt-Prävention", category: "cha", difficulty: "normal", minLevel: 6,
    desc: "Deeskaliere Situationen, bevor sie entstehen.",
    tags: ["conflict", "communication", "social"],
    subQuests: [{ id: "1", title: "Sprich eine kleine Unstimmigkeit sofort ruhig und sachlich an, anstatt sie zu ignorieren", completed: false }]
  },
  {
    id: "qp_cha_10d", title: "Stimme & Tonfall", category: "cha", difficulty: "normal", minLevel: 8,
    desc: "Die Tonalität steuert die emotionale Reaktion.",
    tags: ["voice", "communication", "presence"],
    subQuests: [{ id: "1", title: "Nimm eine Sprachnachricht auf, höre sie an und optimiere deine Betonung und Ruhe", completed: false }]
  },
  {
    id: "qp_cha_11", title: "Öffentliches Sprechen", category: "cha", difficulty: "hard", minLevel: 10,
    desc: "Die Fähigkeit, Gruppen zu bewegen, ist essentiell.",
    tags: ["public-speaking", "communication", "leadership"],
    subQuests: [{ id: "1", title: "Halte eine kurze Präsentation oder erzähle eine Geschichte souverän vor mindestens 3 Personen", completed: false }]
  },
  {
    id: "qp_cha_11b", title: "Einflussnahme", category: "cha", difficulty: "hard", minLevel: 12,
    desc: "Überzeuge andere von deiner Vision.",
    tags: ["influence", "leadership", "social"],
    subQuests: [{ id: "1", title: "Überzeuge eine Person erfolgreich von einem Vorschlag, der beiden nützt", completed: false }]
  },
  {
    id: "qp_cha_11c", title: "Empathische Brücke", category: "cha", difficulty: "hard", minLevel: 14,
    desc: "Verstehe die wahren Motive deines Gegenübers.",
    tags: ["empathy", "connection", "social"],
    subQuests: [{ id: "1", title: "Führe ein tiefes Gespräch über die Ziele und Ängste einer anderen Person, ohne selbst Ratschläge zu geben", completed: false }]
  },
  {
    id: "qp_cha_12", title: "Aura des Anführers", category: "cha", difficulty: "boss", minLevel: 20,
    desc: "Werde zum gravitativen Zentrum deines Netzwerks.",
    tags: ["boss-trial", "leadership", "ultimate"],
    subQuests: [{ id: "1", title: "Organisiere und leite ein erfolgreiches Event oder Treffen mit mindestens 5 Teilnehmern", completed: false }]
  }
];

export const OPERATIONS = [
  {
    id: "op_dawn_disciplin",
    title: "Operation Morgenröte",
    category: "agi",
    desc: "Etabliere eine unerschütterliche Morgenroutine für maximale Effizienz.",
    steps: [
      { difficulty: "easy", title: "Morgenroutine Stufe 1: Aufstehen vor 6:30 Uhr und 5 Min Stretching" },
      { difficulty: "normal", title: "Morgenroutine Stufe 2: Kein Smartphone in den ersten 60 Minuten" },
      { difficulty: "hard", title: "Morgenroutine Stufe 3: 45 Min Deep Work vor dem Frühstück" }
    ]
  },
  {
    id: "op_iron_forge",
    title: "Operation Eiserne Schmiede",
    category: "str",
    desc: "Durchbrich physische Plateaus durch progressive Kraftsteigerung.",
    steps: [
      { difficulty: "easy", title: "Schmiede Stufe 1: Absolviere 30 Min intensives Krafttraining" },
      { difficulty: "normal", title: "Schmiede Stufe 2: Führe einen neuen persönlichen Rekord in einer Grundübung aus" },
      { difficulty: "hard", title: "Schmiede Stufe 3: Absolviere ein hochintensives Ganzkörpertraining bis zum Muskelversagen" }
    ]
  },
  {
    id: "op_mind_fortress",
    title: "Operation Gedankenfestung",
    category: "int",
    desc: "Maximiere deine kognitive Belastbarkeit und Deep-Work-Fähigkeit.",
    steps: [
      { difficulty: "easy", title: "Festung Stufe 1: 45 Min ununterbrochenes Lernen ohne Ablenkung" },
      { difficulty: "normal", title: "Festung Stufe 2: Erstelle eine visuelle Mindmap oder Zusammenfassung des gelernten Stoffes" },
      { difficulty: "hard", title: "Festung Stufe 3: Schreibe einen Fachaufsatz oder ein Skript über die neue Fähigkeit" },
      { difficulty: "boss", title: "Festung Stufe 4: Löse ein komplexes logisches Problem oder absolviere eine schwere Prüfung" }
    ]
  },
  {
    id: "op_vitality_reset",
    title: "Operation Vitalitäts-Reset",
    category: "vit",
    desc: "Entgifte deinen Körper und lade deine biologischen Reserven vollständig auf.",
    steps: [
      { difficulty: "easy", title: "Reset Stufe 1: Konsumiere heute 3 Liter reines Wasser und 0% Zucker" },
      { difficulty: "normal", title: "Reset Stufe 2: 12 Stunden komplettes Digital-Detox (alle Geräte aus)" },
      { difficulty: "hard", title: "Reset Stufe 3: 16 Stunden Intervallfasten kombiniert mit 1h Spaziergang in der Natur" }
    ]
  },
  {
    id: "op_social_expedition",
    title: "Operation Soziale Expedition",
    category: "cha",
    desc: "Verlasse die soziale Komfortzone und kalibriere dein Charisma.",
    steps: [
      { difficulty: "easy", title: "Expedition Stufe 1: Sende 3 unerwartete Dankesnachrichten an Freunde oder Familie" },
      { difficulty: "normal", title: "Expedition Stufe 2: Starte ein anspruchsvolles Gespräch mit einer fremden Person" },
      { difficulty: "hard", title: "Expedition Stufe 3: Halte eine Rede vor einer Gruppe oder vermittle in einem bestehenden Konflikt" }
    ]
  },
  {
    id: "op_shadow_protocol",
    title: "Operation Schatten-Protokoll",
    category: "str",
    desc: "Der ultimative Belastungstest für den wahren Monarchen.",
    steps: [
      { difficulty: "easy", title: "Protokoll Stufe 1: 50 Liegestütze und 15 Min Dehnen direkt nach dem Aufwachen" },
      { difficulty: "normal", title: "Protokoll Stufe 2: Absolviere einen 10 km Lauf oder 1 Stunde intensives Cardio-Training" },
      { difficulty: "hard", title: "Protokoll Stufe 3: 5 Minuten Kälteexposition (Eisbad oder kalte Dusche)" },
      { difficulty: "boss", title: "Protokoll Stufe 4: Absolviere 200 Burpees und 200 Squats innerhalb von 30 Minuten" }
    ]
  },
  {
    id: "op_digital_detox",
    title: "Operation Digital Detox",
    category: "int",
    desc: "Befreie deinen Geist von digitalem Rauschen.",
    steps: [
      { difficulty: "easy", title: "Detox Stufe 1: 4 Stunden ohne Social Media" },
      { difficulty: "normal", title: "Detox Stufe 2: Einen ganzen Tag ohne Entertainment-Medien" },
      { difficulty: "hard", title: "Detox Stufe 3: 48 Stunden komplettes Smartphone-Detox" }
    ]
  },
  {
    id: "op_midnight_grind",
    title: "Operation Midnight Grind",
    category: "agi",
    desc: "Nutze die Stille der Nacht für extremen Fortschritt.",
    steps: [
      { difficulty: "easy", title: "Grind Stufe 1: Arbeite 1 Stunde nach 22:00 Uhr an einem Projekt" },
      { difficulty: "normal", title: "Grind Stufe 2: Schließe 3 Quests zwischen 00:00 und 03:00 Uhr ab" },
      { difficulty: "hard", title: "Grind Stufe 3: Erreiche einen Meilenstein in vollkommener nächtlicher Isolation" },
      { difficulty: "boss", title: "Grind Stufe 4: Arbeite durchgehend von 00:00 bis 05:00 Uhr an deinem Hauptziel" }
    ]
  },
  {
    id: "op_wealth_builder",
    title: "Operation Wealth Builder",
    category: "int",
    desc: "Übernimm die absolute Kontrolle über deine Ressourcen.",
    steps: [
      { difficulty: "easy", title: "Wealth Stufe 1: Tracke jeden Cent deiner Ausgaben für 3 Tage" },
      { difficulty: "normal", title: "Wealth Stufe 2: Eliminiere 2 unnötige Ausgaben oder Abonnements" },
      { difficulty: "hard", title: "Wealth Stufe 3: Erstelle einen Investitions- oder Sparplan für die nächsten 12 Monate" }
    ]
  },
  {
    id: "op_community_pillar",
    title: "Operation Community Pillar",
    category: "cha",
    desc: "Werde zu einem tragenden Pfeiler deines sozialen Netzwerks.",
    steps: [
      { difficulty: "easy", title: "Community Stufe 1: Biete einer Person proaktiv und bedingungslos Hilfe an" },
      { difficulty: "normal", title: "Community Stufe 2: Organisiere ein Treffen für mindestens 3 Personen" },
      { difficulty: "hard", title: "Community Stufe 3: Übernimm eine Führungsrolle in einem Gemeinschaftsprojekt" }
    ]
  }
];
