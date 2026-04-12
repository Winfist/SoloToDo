export const QUEST_POOL = [
  // ─── STR: STRENGTH & FITNESS ───
  { 
    id: "qp_str_01", title: "Basis-Physische Konditionierung", category: "str", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Ein Körper ohne Ausdauer bricht unter Druck. Baue ein Fundament auf.",
    tags: ["fitness", "bodyweight", "basics"],
    subQuests: [{ id: "1", title: "10 Liegestütze", completed: false }, { id: "2", title: "20 Kniebeugen", completed: false }]
  },
  {
    id: "qp_str_01b", title: "Rostige Knochen ölen", category: "str", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Deine Gelenke rosten ein. Mobilität ist das halbe Leben eines Hunters.",
    tags: ["stretching", "mobility", "morgen"],
    subQuests: [{ id: "1", title: "10 Minuten aktives Stretching", completed: false }]
  },
  { 
    id: "qp_str_02", title: "Das Erwachen des Tigers", category: "str", difficulty: "normal", minLevel: 3,
    desc: "[SYSTEM] Die Muskeln müssen an Erschöpfung gewöhnt werden, um zu wachsen.",
    tags: ["core", "ausdauer", "training"],
    subQuests: [{ id: "1", title: "30 Liegestütze", completed: false }, { id: "2", title: "60 Sekunden Plank", completed: false }, { id: "3", title: "10 Burpees", completed: false }]
  },
  {
    id: "qp_str_02b", title: "Ausdauer-Test: Schattenlauf", category: "str", difficulty: "normal", minLevel: 5,
    desc: "[SYSTEM] Laufen ist die Basis der Flucht und der Jagd. Baue Lungenkapazität auf.",
    tags: ["cardio", "laufen", "stamina"],
    subQuests: [{ id: "1", title: "30 Minuten durchgehendes Joggen", completed: false }]
  },
  {
    id: "qp_str_02c", title: "Explosive Kraft", category: "str", difficulty: "normal", minLevel: 5,
    desc: "[SYSTEM] Ein Schwertstreich braucht Explosivität. Trainiere deine Schnellkraft.",
    tags: ["hiit", "sprint", "power"],
    subQuests: [{ id: "1", title: "15 Minuten HIIT Workout", completed: false }, { id: "2", title: "5 Sprints à 30 Sekunden", completed: false }]
  },
  { 
    id: "qp_str_03", title: "Limit-Break: Eisen und Schweiß", category: "str", difficulty: "hard", minLevel: 10,
    desc: "[SYSTEM] Warnung: Gewöhnliche Routinen erzielen keine außergewöhnlichen Resultate. Überschreite heute dein Limit.",
    tags: ["gym", "hypertrophie", "limit-break"],
    subQuests: [{ id: "1", title: "Intensives Krafttraining (45 Min)", completed: false }, { id: "2", title: "Bis zum absoluten Muskelversagen trainieren", completed: false }]
  },
  {
    id: "qp_str_03b", title: "Der Weg der 10.000 Schläge", category: "str", difficulty: "hard", minLevel: 15,
    desc: "[SYSTEM] Konsequenz formt die Waffe. Eine absurde Wiederholungszahl zwingt Muskeln zur Adaption.",
    tags: ["calisthenics", "volumen", "burnout"],
    subQuests: [{ id: "1", title: "200 Liegestütze (über den Tag verteilt)", completed: false }, { id: "2", title: "300 Kniebeugen", completed: false }]
  },
  { 
    id: "qp_str_04", title: "Die Prüfung des National-Hunters", category: "str", difficulty: "boss", minLevel: 25,
    desc: "[SYSTEM] Ein S-Rang ruht sich nie aus. Die pure Physis entscheidet über Überleben und Tod in roten Dungeons.",
    tags: ["boss-trial", "marathon", "extreme"],
    subQuests: [{ id: "1", title: "100 Liegestütze in Folge", completed: false }, { id: "2", title: "100 Sit-Ups", completed: false }, { id: "3", title: "10 Kilometer Laufen", completed: false }]
  },

  // ─── INT: INTELLIGENCE & LERNEN ───
  { 
    id: "qp_int_01", title: "Daten-Assimilation", category: "int", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Wissen ist eine Waffe. Erweitere heute dein Arsenal minimal.",
    tags: ["leser", "lernen", "fokus"],
    subQuests: [{ id: "1", title: "15 Seiten eines Buches lesen", completed: false }, { id: "2", title: "Notizen zur Kernaussage machen", completed: false }]
  },
  {
    id: "qp_int_01b", title: "Neurologisches Warm-Up", category: "int", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Der Geist ist ein Muskel. Beanspruche ihn, bevor er verkümmert.",
    tags: ["sudoku", "rätsel", "kopf"],
    subQuests: [{ id: "1", title: "Löse ein anspruchsvolles Rätsel (Schach/Sudoku/Logik)", completed: false }]
  },
  { 
    id: "qp_int_02", title: "Kognitive Restrukturierung", category: "int", difficulty: "normal", minLevel: 5,
    desc: "[SYSTEM] Taktik erfordert tiefes Verständnis. Ein flacher Verstand wird in Dungeons scheitern.",
    tags: ["sprache", "studium", "weiterbildung"],
    subQuests: [{ id: "1", title: "45 Minuten konzentriert lernen/arbeiten", completed: false }, { id: "2", title: "Das Gelernte laut zusammenfassen", completed: false }]
  },
  {
    id: "qp_int_02b", title: "Fremde Runen entziffern", category: "int", difficulty: "normal", minLevel: 7,
    desc: "[SYSTEM] Fremdsprachen öffnen neue Welten. Baue deine Lingual-Fähigkeiten aus.",
    tags: ["sprachen", "vokabeln", "app"],
    subQuests: [{ id: "1", title: "30 Minuten Sprachentraining (z.B. Duolingo)", completed: false }, { id: "2", title: "20 neue Vokabeln einprägen", completed: false }]
  },
  { 
    id: "qp_int_03", title: "Archiv des Monarchen", category: "int", difficulty: "hard", minLevel: 12,
    desc: "[SYSTEM] Du musst dir Fähigkeiten aneignen, die andere für Magie halten. Studiere tiefgründig.",
    tags: ["deep-work", "skill-aquisition", "fokus"],
    subQuests: [{ id: "1", title: "2 Stunden Deep Work ohne jegliche Ablenkung", completed: false }, { id: "2", title: "Handy komplett aus dem Raum verbannen", completed: false }]
  },
  {
    id: "qp_int_03b", title: "Der Architektengrad", category: "int", difficulty: "hard", minLevel: 15,
    desc: "[SYSTEM] Programmierung, Mathematik oder Systemverständnis. Verstehe den Code der Realität.",
    tags: ["coding", "mathematik", "theorie"],
    subQuests: [{ id: "1", title: "Ein komplexes technisches/theoretisches Problem selbstständig lösen", completed: false }, { id: "2", title: "Die Lösung schriftlich dokumentieren", completed: false }]
  },
  { 
    id: "qp_int_04", title: "Das Omniszienz-Protokoll", category: "int", difficulty: "boss", minLevel: 25,
    desc: "[SYSTEM] Nur wer das System versteht, kann es brechen. Erwirtschafte massives neues Wissen heute.",
    tags: ["boss-trial", "mastery", "learning"],
    subQuests: [{ id: "1", title: "Ein Buch komplett lesen / Kurs abschließen", completed: false }, { id: "2", title: "Das Erlernte praktisch anwenden", completed: false }, { id: "3", title: "Anderen das Konzept erklären", completed: false }]
  },

  // ─── VIT: VITALITY & REGENERATION ───
  { 
    id: "qp_vit_01", title: "HP-Regenerationsschleife", category: "vit", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Deine Zellen brauchen Ressourcen zur Wiederherstellung.",
    tags: ["gesundheit", "hydrate", "schlaf"],
    subQuests: [{ id: "1", title: "2 Liter Wasser trinken", completed: false }, { id: "2", title: "7+ Stunden schlafen", completed: false }]
  },
  {
    id: "qp_vit_01b", title: "Sonnenlicht-Synthese", category: "vit", difficulty: "easy", minLevel: 2,
    desc: "[SYSTEM] UV-Strahlung aktiviert dein Immunsystem und die Vitamin-Produktion.",
    tags: ["natur", "spazieren", "sonne"],
    subQuests: [{ id: "1", title: "Direkt nach dem Aufwachen 15 Min nach draußen gehen", completed: false }]
  },
  { 
    id: "qp_vit_02", title: "Toxin-Reinigung", category: "vit", difficulty: "normal", minLevel: 4,
    desc: "[SYSTEM] Ein schwacher Körper wird durch Toxine gebildet. Verweigere sie.",
    tags: ["ernährung", "detox", "gesundheit"],
    subQuests: [{ id: "1", title: "Kompletter Verzicht auf Zucker heute", completed: false }, { id: "2", title: "Eine vollwertige, gesunde Mahlzeit kochen", completed: false }]
  },
  {
    id: "qp_vit_02b", title: "Mentale Heiltränke", category: "vit", difficulty: "normal", minLevel: 6,
    desc: "[SYSTEM] Dein Geist brennt auf Sparflamme. Meditation regeneriert dein Mana.",
    tags: ["meditation", "stressfrei", "mindfulness"],
    subQuests: [{ id: "1", title: "15 Minuten Box-Breathing oder Meditation", completed: false }, { id: "2", title: "Auf keinen Social Media Konsum für 4 Stunden", completed: false }]
  },
  { 
    id: "qp_vit_03", title: "Abhärtung des Gefäßes", category: "vit", difficulty: "hard", minLevel: 12,
    desc: "[SYSTEM] Physischer Stress trainiert die autonome Abwehr. Der Schmerz ist kurz.",
    tags: ["disziplin", "kalt", "abhärtung"],
    subQuests: [{ id: "1", title: "Morgendliche Eisdusche (min. 60 Sek)", completed: false }, { id: "2", title: "Digitale Distanz (kein Handy nach 20 Uhr)", completed: false }]
  },
  { 
    id: "qp_vit_04", title: "Tempel der Stille", category: "vit", difficulty: "boss", minLevel: 25,
    desc: "[SYSTEM] Wahre Heilung findet im absoluten Raum statt. Beruhige deinen Geist vollständig.",
    tags: ["boss-trial", "fasting", "mindfulness"],
    subQuests: [{ id: "1", title: "16 Stunden Intervallfasten (Autophagie)", completed: false }, { id: "2", title: "30 Minuten absolute Stille/Meditation", completed: false }, { id: "3", title: "Wald-Spaziergang (1h) ohne Medien", completed: false }]
  },

  // ─── AGI: AGILITY & PRODUKTIVITÄT ───
  { 
    id: "qp_agi_01", title: "Taktische Umgebungsbereinigung", category: "agi", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Ein chaotisches Schlachtfeld führt zu tödlichen Fehlern. Räume auf.",
    tags: ["ordnung", "haushalt", "momentum"],
    subQuests: [{ id: "1", title: "Bett sofort nach dem Aufstehen machen", completed: false }, { id: "2", title: "Schreibtisch komplett leerräumen", completed: false }]
  },
  {
    id: "qp_agi_01b", title: "Quest-Log Update", category: "agi", difficulty: "easy", minLevel: 2,
    desc: "[SYSTEM] Ohne Struktur versagst du in hohen Dungeons. Plane den heutigen Tag.",
    tags: ["planung", "todo", "organisation"],
    subQuests: [{ id: "1", title: "Alle Todos priorisieren", completed: false }, { id: "2", title: "Die Top 3 Ziele auf Papier aufschreiben", completed: false }]
  },
  { 
    id: "qp_agi_02", title: "Blitzschlag-Protokoll", category: "agi", difficulty: "normal", minLevel: 5,
    desc: "[SYSTEM] Geschwindigkeit ist König. Erledige anstehende kleine Tasks ohne zu zögern.",
    tags: ["fokus", "produktivität", "antiprokrastination"],
    subQuests: [{ id: "1", title: "Alle E-Mails beantworten/löschen (Inbox Zero)", completed: false }, { id: "2", title: "Die eine nervige Aufgabe erledigen, die du aufschiebst", completed: false }]
  },
  {
    id: "qp_agi_02b", title: "Pomodoro-Marathon", category: "agi", difficulty: "normal", minLevel: 8,
    desc: "[SYSTEM] Vermeide Ermüdung durch getaktetes Vorgehen. Führe Sprints aus.",
    tags: ["pomodoro", "fokus", "arbeit"],
    subQuests: [{ id: "1", title: "4x 25 Minuten Pomodoro Sessions abschließen", completed: false }, { id: "2", title: "Während der Pausen den Raum aufräumen/bewegen", completed: false }]
  },
  { 
    id: "qp_agi_03", title: "Schatten-Schritt Effizienz", category: "agi", difficulty: "hard", minLevel: 15,
    desc: "[SYSTEM] Nutze deine Zeit wie eine Waffe. Kein Leerlauf.",
    tags: ["zeit-management", "planung", "system"],
    subQuests: [{ id: "1", title: "Tagesplan in strikten Zeitblöcken (Time-Boxing) erstellen", completed: false }, { id: "2", title: "Priorität Nr. 1 des Tages vollständig abschließen", completed: false }]
  },
  {
    id: "qp_agi_03b", title: "Schallmauer durchbrechen", category: "agi", difficulty: "hard", minLevel: 18,
    desc: "[SYSTEM] Vor dem Sonnenaufgang hat die Welt kein Mitspracherecht. Nutze die Stille.",
    tags: ["earlybird", "morgenroutine", "hustle"],
    subQuests: [{ id: "1", title: "Vor 6:00 Uhr aufstehen", completed: false }, { id: "2", title: "Komplette Morgenroutine durchziehen ohne Handy", completed: false }, { id: "3", title: "Mindestens 1h produktive Arbeit vor 8 Uhr", completed: false }]
  },
  { 
    id: "qp_agi_04", title: "Die Zeitdilatation", category: "agi", difficulty: "boss", minLevel: 25,
    desc: "[SYSTEM] Meistere die Zeit. Erledige ein Wochenprojekt an einem einzigen Tag.",
    tags: ["boss-trial", "hustle", "vollendung"],
    subQuests: [{ id: "1", title: "Aufstehen vor Sonnenaufgang", completed: false }, { id: "2", title: "Komplette Wohnungs-Grundreinigung", completed: false }, { id: "3", title: "Ein größeres Projekt vor 12 Uhr abschließen", completed: false }]
  },

  // ─── CHA: CHARISMA & SOZIALES ───
  { 
    id: "qp_cha_01", title: "Netzwerk-Ping", category: "cha", difficulty: "easy", minLevel: 1,
    desc: "[SYSTEM] Dein Einflusskreis beginnt bei deinen Verbündeten.",
    tags: ["sozial", "kommunikation", "verbindung"],
    subQuests: [{ id: "1", title: "Eine wertschätzende Nachricht an Freunde/Familie senden", completed: false }, { id: "2", title: "Bewusst lächeln in Gesprächen", completed: false }]
  },
  {
    id: "qp_cha_01b", title: "Diplomatische Erste Hilfe", category: "cha", difficulty: "easy", minLevel: 2,
    desc: "[SYSTEM] Worte haben Macht. Nutze sie, um Gildenverbündete zu buffen.",
    tags: ["kompliment", "sozial", "freunde"],
    subQuests: [{ id: "1", title: "Jemandem ein aufrichtiges Kompliment machen", completed: false }]
  },
  { 
    id: "qp_cha_02", title: "Verbesserung der Aura", category: "cha", difficulty: "normal", minLevel: 4,
    desc: "[SYSTEM] Präsenz ist nicht nur physisch. Es ist die Art, wie du wahrgenommen wirst.",
    tags: ["styling", "haltung", "rhetorik"],
    subQuests: [{ id: "1", title: "Outfit bewusst und hochwertig auswählen", completed: false }, { id: "2", title: "Körperhaltung korrigieren (Brust raus, Schultern zurück)", completed: false }]
  },
  {
    id: "qp_cha_02b", title: "Allianzen schmieden", category: "cha", difficulty: "normal", minLevel: 7,
    desc: "[SYSTEM] Ein König bittet nicht, er lädt ein und verbindet Welten.",
    tags: ["treffen", "networking", "essen"],
    subQuests: [{ id: "1", title: "Freunde/Kollegen aktiv auf einen Kaffee oder Essen einladen", completed: false }, { id: "2", title: "Bei dem Treffen nicht aufs Handy schauen", completed: false }]
  },
  { 
    id: "qp_cha_03", title: "Die Stimme des Herrschers", category: "cha", difficulty: "hard", minLevel: 12,
    desc: "[SYSTEM] Führung bedeutet Kommunikation. Gehe heute bewusst in eine soziale Herausforderung.",
    tags: ["leadership", "mut", "interaktion"],
    subQuests: [{ id: "1", title: "Mit einem völlig Fremden Smalltalk starten", completed: false }, { id: "2", title: "Jemandem ehrliches und spezifisches Feedback geben", completed: false }]
  },
  {
    id: "qp_cha_03b", title: "Medien-Blackout: Realitätscheck", category: "cha", difficulty: "hard", minLevel: 15,
    desc: "[SYSTEM] Falsche Realitäten schwächen dich. Erlebe die wirkliche Welt.",
    tags: ["socialmedia", "detox", "präsenz"],
    subQuests: [{ id: "1", title: "24 Stunden kompletter Social-Media-Detox", completed: false }, { id: "2", title: "Ein echtes Gespräch stattdessen führen", completed: false }]
  },
  { 
    id: "qp_cha_04", title: "Gildenmeister-Prüfung", category: "cha", difficulty: "boss", minLevel: 25,
    desc: "[SYSTEM] Ein National-Hunter befehligt Massen. Du musst heute den Raum dominieren.",
    tags: ["boss-trial", "public-speaking", "hosting"],
    subQuests: [{ id: "1", title: "Ein soziales Event oder Treffen initiieren/organisieren", completed: false }, { id: "2", title: "Vor einer Gruppe sprechen / Ideen flüssig präsentieren", completed: false }]
  }
];
