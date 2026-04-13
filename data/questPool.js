export const QUEST_POOL = [
  // ─── STR: STRENGTH & FITNESS ───
  { 
    id: "qp_str_01", title: "Sportlicher Start (Leicht)", category: "str", difficulty: "easy", minLevel: 1,
    desc: "Bewege deinen Körper, um fit und gesund zu bleiben. Ideal für den Einstieg in den Tag oder nach langem Sitzen.",
    tags: ["fitness", "bodyweight", "basics"],
    subQuests: [{ id: "1", title: "10 Liegestütze", completed: false }, { id: "2", title: "20 Kniebeugen", completed: false }]
  },
  {
    id: "qp_str_01b", title: "Dehnung & Beweglichkeit", category: "str", difficulty: "easy", minLevel: 1,
    desc: "Stretching löst Verspannungen und hält die Gelenke geschmeidig. Vorbeugen von Schmerzen.",
    tags: ["stretching", "mobility", "morgen"],
    subQuests: [{ id: "1", title: "10 Minuten aktives Stretching oder Yoga", completed: false }]
  },
  { 
    id: "qp_str_02", title: "Ganzkörper-Workout (Mittel)", category: "str", difficulty: "normal", minLevel: 3,
    desc: "Ein ausgewogenes Workout, um die Grundmuskulatur zu stärken und den Kreislauf in Schwung zu bringen.",
    tags: ["core", "ausdauer", "training"],
    subQuests: [{ id: "1", title: "30 Liegestütze", completed: false }, { id: "2", title: "60 Sekunden Unterarmstütz (Plank)", completed: false }, { id: "3", title: "10 Burpees", completed: false }]
  },
  {
    id: "qp_str_02b", title: "Ausdauer-Training: Laufen", category: "str", difficulty: "normal", minLevel: 5,
    desc: "Regelmäßiges Joggen stärkt das Herz-Kreislauf-System und verbrennt Kalorien.",
    tags: ["cardio", "laufen", "stamina"],
    subQuests: [{ id: "1", title: "30 Minuten am Stück laufen (Joggen/Rennen)", completed: false }]
  },
  {
    id: "qp_str_02c", title: "Intensiv-Intervalle (HIIT)", category: "str", difficulty: "normal", minLevel: 5,
    desc: "Kurze, aber hochintensive Trainingseinheiten feuern den Stoffwechsel an und bauen Muskeln auf.",
    tags: ["hiit", "sprint", "power"],
    subQuests: [{ id: "1", title: "15 Minuten HIIT Workout", completed: false }, { id: "2", title: "5 kurze Sprints", completed: false }]
  },
  { 
    id: "qp_str_03", title: "Krafttraining im Gym", category: "str", difficulty: "hard", minLevel: 10,
    desc: "Fokussierter Muskelaufbau. Gehe an deine Grenzen und absolviere ein geplantes, schweres Training.",
    tags: ["gym", "hypertrophie", "kraft"],
    subQuests: [{ id: "1", title: "45 Minuten fokussiertes Krafttraining", completed: false }, { id: "2", title: "Bis zum Muskelversagen in mindestens 2 Sätzen", completed: false }]
  },
  {
    id: "qp_str_03b", title: "Hohes Übungsvolumen", category: "str", difficulty: "hard", minLevel: 15,
    desc: "Trainiere Ausdauer und Durchhaltevermögen der Muskeln durch eine große Anzahl an Wiederholungen über den Tag verteilt.",
    tags: ["calisthenics", "volumen", "burnout"],
    subQuests: [{ id: "1", title: "100 Liegestütze", completed: false }, { id: "2", title: "200 Kniebeugen", completed: false }]
  },
  { 
    id: "qp_str_04", title: "Extrem-Herausforderung (Boss)", category: "str", difficulty: "boss", minLevel: 25,
    desc: "Ein körperlicher Härtetest. Nur für sehr fortgeschrittene Sportler.",
    tags: ["boss-trial", "marathon", "extreme"],
    subQuests: [{ id: "1", title: "100 Liegestütze am Stück", completed: false }, { id: "2", title: "100 Sit-Ups", completed: false }, { id: "3", title: "10 Kilometer Laufen", completed: false }]
  },

  // ─── INT: INTELLIGENCE & LERNEN ───
  { 
    id: "qp_int_01", title: "Lesen für den Geist", category: "int", difficulty: "easy", minLevel: 1,
    desc: "Wissen ist Macht. Lies einen Abschnitt und fasse das Wichtigste zusammen, um den Stoff besser zu behalten.",
    tags: ["lesen", "lernen", "fokus"],
    subQuests: [{ id: "1", title: "15 Seiten in einem Weiterbildungsbuch lesen", completed: false }, { id: "2", title: "Kurze Notizen zur Kernaussage machen", completed: false }]
  },
  {
    id: "qp_int_01b", title: "Gehirnjogging", category: "int", difficulty: "easy", minLevel: 1,
    desc: "Nutze Rätsel, um morgens dein logisches Denken zu aktivieren.",
    tags: ["logik", "rätsel", "kopf"],
    subQuests: [{ id: "1", title: "Löse ein anspruchsvolles Rätsel (z.B. Sudoku oder Schach)", completed: false }]
  },
  { 
    id: "qp_int_02", title: "Fokussiertes Lernen", category: "int", difficulty: "normal", minLevel: 5,
    desc: "Ohne Ablenkung lernst du effektiver. Plane feste Lernblöcke ein.",
    tags: ["studium", "weiterbildung", "konzentration"],
    subQuests: [{ id: "1", title: "45 Minuten hochkonzentriert ohne Handy lernen/arbeiten", completed: false }, { id: "2", title: "Das Gelernte laut mündlich zusammenfassen", completed: false }]
  },
  {
    id: "qp_int_02b", title: "Sprachenlernen", category: "int", difficulty: "normal", minLevel: 7,
    desc: "Eine neue Sprache öffnet viele Türen. Übe regelmäßig, um deinen Wortschatz zu festigen.",
    tags: ["sprachen", "vokabeln", "app"],
    subQuests: [{ id: "1", title: "30 Minuten aktive Sprachübung (z.B. Duolingo/Babbel)", completed: false }, { id: "2", title: "20 neue Vokabeln gezielt aufschreiben und merken", completed: false }]
  },
  { 
    id: "qp_int_03", title: "Deep Work Session", category: "int", difficulty: "hard", minLevel: 12,
    desc: "Tauche tief in ein wichtiges Projekt ein, ohne gestört zu werden. Schafft höchste Produktivität.",
    tags: ["deep-work", "produktivität", "fokus"],
    subQuests: [{ id: "1", title: "2 Stunden ununterbrochen arbeiten (Deep Work)", completed: false }, { id: "2", title: "Smartphone komplett außer Reichweite legen", completed: false }]
  },
  {
    id: "qp_int_03b", title: "Komplexes Problemlösen", category: "int", difficulty: "hard", minLevel: 15,
    desc: "Fördere dein logisches und systematisches Verständnis, indem du eine anspruchsvolle Aufgabe in Programmierung, Mathematik oder Fachwissen löst.",
    tags: ["coding", "mathematik", "theorie"],
    subQuests: [{ id: "1", title: "Ein kompliziertes Fachthema selbstständig erarbeiten", completed: false }, { id: "2", title: "Den Lösungsweg schriftlich sauber dokumentieren", completed: false }]
  },
  { 
    id: "qp_int_04", title: "Meisterschafts-Abschluss (Boss)", category: "int", difficulty: "boss", minLevel: 25,
    desc: "Beende ein großes Lernziel und gib dein Wissen an andere weiter.",
    tags: ["boss-trial", "mastery", "learning"],
    subQuests: [{ id: "1", title: "Einen langen Online-Kurs oder ein Fachbuch komplett beenden", completed: false }, { id: "2", title: "Die Konzepte direkt in der Praxis anwenden", completed: false }, { id: "3", title: "Anderen Personen Teile davon beibringen", completed: false }]
  },

  // ─── VIT: VITALITY & REGENERATION ───
  { 
    id: "qp_vit_01", title: "Ausreichend Schlaf & Hydration", category: "vit", difficulty: "easy", minLevel: 1,
    desc: "Genug Schlaf und Wasser geben deinem Körper die Möglichkeit, sich zu regenerieren und konzentriert zu bleiben.",
    tags: ["gesundheit", "wasser", "schlaf"],
    subQuests: [{ id: "1", title: "Mindestens 2 Liter (ungesüßtes) Wasser am Tag trinken", completed: false }, { id: "2", title: "In der kommenden Nacht mindestens 7 Stunden schlafen", completed: false }]
  },
  {
    id: "qp_vit_01b", title: "Tageslicht tanken", category: "vit", difficulty: "easy", minLevel: 2,
    desc: "Morgendliches Sonnenlicht sorgt für einen gesunden Schlafzyklus und hellt die Stimmung auf.",
    tags: ["natur", "spazieren", "sonne"],
    subQuests: [{ id: "1", title: "Direkt nach dem Aufwachen für 15 Minuten ans Tageslicht gehen", completed: false }]
  },
  { 
    id: "qp_vit_02", title: "Gesunde Ernährung (Zucker-Verzicht)", category: "vit", difficulty: "normal", minLevel: 4,
    desc: "Verzichte auf industriellen Zucker, um deinen Insulinspiegel konstant zu halten und Energie-Tiefs zu vermeiden.",
    tags: ["ernährung", "detox", "gesundheit"],
    subQuests: [{ id: "1", title: "Konsequenter Verzicht auf Süßigkeiten und Zuckergetränke heute", completed: false }, { id: "2", title: "Eine frische, vollwertige Mahlzeit kochen", completed: false }]
  },
  {
    id: "qp_vit_02b", title: "Meditation & Achtsamkeit", category: "vit", difficulty: "normal", minLevel: 6,
    desc: "Meditation reduziert Stress und hilft dabei, emotionale und mentale Klarheit zurückzugewinnen.",
    tags: ["meditation", "stressfrei", "mindfulness"],
    subQuests: [{ id: "1", title: "15 Minuten ruhige Atmung oder geführte Meditation", completed: false }, { id: "2", title: "Kein Social Media oder News-Konsum für 4 Stunden", completed: false }]
  },
  { 
    id: "qp_vit_03", title: "Körperliche Abhärtung", category: "vit", difficulty: "hard", minLevel: 12,
    desc: "Regelmäßige Wechselbäder oder Kälte fördern die Resilienz des Nerven- und Immunsystems.",
    tags: ["disziplin", "kaltbaden", "abhärtung"],
    subQuests: [{ id: "1", title: "Eine komplett kalte Dusche nehmen (min. 60 Sekunden)", completed: false }, { id: "2", title: "Bildschirme ab 20 Uhr strikt ausschalten (für besseren Schlaf)", completed: false }]
  },
  { 
    id: "qp_vit_04", title: "Der Reset-Tag (Boss)", category: "vit", difficulty: "boss", minLevel: 25,
    desc: "Ein vollkommener Entlastungstag für Magen, Sinne und Nervensystem.",
    tags: ["boss-trial", "fasten", "mindfulness"],
    subQuests: [{ id: "1", title: "16 Stunden strenges Intervallfasten einhalten", completed: false }, { id: "2", title: "30 Minuten völlige Stille aushalten", completed: false }, { id: "3", title: "Ein 1-stündiger Waldspaziergang (ohne Musik/Podcast)", completed: false }]
  },

  // ─── AGI: AGILITY & PRODUKTIVITÄT ───
  { 
    id: "qp_agi_01", title: "Aufräumen: Basis-Ordnung", category: "agi", difficulty: "easy", minLevel: 1,
    desc: "Eine aufgeräumte Umgebung sorgt für einen klaren Kopf. Erledige kleine, sichtbare Hausarbeiten direkt.",
    tags: ["ordnung", "haushalt", "momentum"],
    subQuests: [{ id: "1", title: "Das Bett sofort nach dem Aufstehen machen", completed: false }, { id: "2", title: "Den Arbeitsplatz bzw. Schreibtisch sauber hinterlassen", completed: false }]
  },
  {
    id: "qp_agi_01b", title: "Tagesplanung & Prioritäten", category: "agi", difficulty: "easy", minLevel: 2,
    desc: "Fange nicht blind an zu arbeiten. Eine strukturierte Aufgaben-Übersicht reduziert Stress enorm.",
    tags: ["planung", "todo", "organisation"],
    subQuests: [{ id: "1", title: "Alle Aufgaben schriftlich auflisten und priorisieren", completed: false }, { id: "2", title: "Die wichtigsten 3 Ziele des Tages identifizieren", completed: false }]
  },
  { 
    id: "qp_agi_02", title: "Altlasten bereinigen", category: "agi", difficulty: "normal", minLevel: 5,
    desc: "Kleine oder unangenehme Aufgaben blockieren oft den Kopf. Bring sie zügig hinter dich.",
    tags: ["fokus", "produktivität", "antiprokrastination"],
    subQuests: [{ id: "1", title: "E-Mail-Postfach abarbeiten (Inbox Zero anstreben)", completed: false }, { id: "2", title: "Genau die Aufgabe anpacken, die man am meisten vor sich herschiebt", completed: false }]
  },
  {
    id: "qp_agi_02b", title: "Die Pomodoro-Technik", category: "agi", difficulty: "normal", minLevel: 8,
    desc: "Arbeite in festen, konzentrierten Blöcken, um vorzeitige Erschöpfung durch Ablenkung zu vermeiden.",
    tags: ["pomodoro", "fokus", "arbeit"],
    subQuests: [{ id: "1", title: "Vier volle 25-Minuten Pomodoro-Arbeitsphasen absolvieren", completed: false }, { id: "2", title: "In den kurzen 5-Minuten-Pausen etwas trinken oder kurz dehnen", completed: false }]
  },
  { 
    id: "qp_agi_03", title: "Effizientes Time-Boxing", category: "agi", difficulty: "hard", minLevel: 15,
    desc: "Plane den Tag in Blöcken und arbeite diese gnadenlos ab, um keine Zeit unbewusst verstreichen zu lassen.",
    tags: ["zeit-management", "planung", "system"],
    subQuests: [{ id: "1", title: "Vollständigen Tagesplan im Kalender in Zeitblöcken eintragen", completed: false }, { id: "2", title: "Die Tagespriorität Nr. 1 ohne Aufschub restlos abschließen", completed: false }]
  },
  {
    id: "qp_agi_03b", title: "Der Early-Bird-Vorsprung", category: "agi", difficulty: "hard", minLevel: 18,
    desc: "Die frühen Morgenstunden gehören dir. Nutze diese ungestörte Zeit für produktive Arbeit.",
    tags: ["morgenroutine", "produktivität", "disziplin"],
    subQuests: [{ id: "1", title: "Mindestens vor 6:30 Uhr aufstehen", completed: false }, { id: "2", title: "Die Morgenroutine strickt durchführen, ohne das Smartphone zu checken", completed: false }, { id: "3", title: "Noch vor 9 Uhr morgens an einem zentralen Ziel arbeiten", completed: false }]
  },
  { 
    id: "qp_agi_04", title: "Maximale Tagesproduktion (Boss)", category: "agi", difficulty: "boss", minLevel: 25,
    desc: "Der ultimative Auslastungstest deiner Fähigkeiten. Schaffe an einem Tag mehr als andere in einer Woche.",
    tags: ["boss-trial", "hustle", "vollendung"],
    subQuests: [{ id: "1", title: "Vor Sonnenaufgang aktiv den Tag starten", completed: false }, { id: "2", title: "Die eigene Wohnung intensiv grundreinigen", completed: false }, { id: "3", title: "Ein größeres Projekt bis zum Mittag erfolgreich abschließen", completed: false }]
  },

  // ─── CHA: CHARISMA & SOZIALES ───
  { 
    id: "qp_cha_01", title: "Positiver Kontakt", category: "cha", difficulty: "easy", minLevel: 1,
    desc: "Gute Beziehungen müssen gepflegt werden, und ein positives Auftreten öffnet Türen.",
    tags: ["sozial", "kommunikation", "verbindung"],
    subQuests: [{ id: "1", title: "Aktiv bei einer befreundeten Person melden", completed: false }, { id: "2", title: "Sich bemühen, in Gesprächen bewusst öfter zu lächeln", completed: false }]
  },
  {
    id: "qp_cha_01b", title: "Wertschätzung zeigen", category: "cha", difficulty: "easy", minLevel: 2,
    desc: "Zeige Anerkennung für deine Mitmenschen. Das erhöht das Selbstvertrauen auf beiden Seiten.",
    tags: ["kompliment", "sozial", "freunde"],
    subQuests: [{ id: "1", title: "Mindestens einer Person heute ein aufrichtiges Kompliment machen", completed: false }]
  },
  { 
    id: "qp_cha_02", title: "Erscheinungsbild & Körpersprache", category: "cha", difficulty: "normal", minLevel: 4,
    desc: "Ein selbstsicheres Auftreten beginnt bei der Haltung und geht beim gepflegten Look weiter. Kleider machen Leute.",
    tags: ["styling", "haltung", "auftreten"],
    subQuests: [{ id: "1", title: "Sich morgens bewusst wertig und passend kleiden", completed: false }, { id: "2", title: "Im Laufe des Tages mehrmals Schultern zurück- und Brust rausnehmen", completed: false }]
  },
  {
    id: "qp_cha_02b", title: "Das Netzwerk pflegen", category: "cha", difficulty: "normal", minLevel: 7,
    desc: "Persönliche Treffen sind in der digitalen Welt seltener und damit viel entscheidender für langfristigen Erfolg.",
    tags: ["treffen", "networking", "essen"],
    subQuests: [{ id: "1", title: "Einen Freund oder Kollegen proaktiv auf einen Kaffee oder zum Essen einladen", completed: false }, { id: "2", title: "Während des gesamten Treffens präsent bleiben und das Smartphone in der Tasche lassen", completed: false }]
  },
  { 
    id: "qp_cha_03", title: "Soziale Komfortzone verlassen", category: "cha", difficulty: "hard", minLevel: 12,
    desc: "Ein starker Charakter muss auch unangenehmen Interaktionen gewachsen sein. Kommuniziere mutig.",
    tags: ["leadership", "mut", "interaktion"],
    subQuests: [{ id: "1", title: "Einen kurzen Plausch oder Smalltalk mit einer völlig fremden Person starten", completed: false }, { id: "2", title: "Jemandem professionelles, konstruktives und direktes Feedback geben", completed: false }]
  },
  {
    id: "qp_cha_03b", title: "Echter Kontakt statt Social Media", category: "cha", difficulty: "hard", minLevel: 15,
    desc: "Social Media belohnt oft oberflächliche Eindrücke. Entferne die App, um Platz für tiefgehende Interaktionen zu schaffen.",
    tags: ["socialmedia", "detox", "präsenz"],
    subQuests: [{ id: "1", title: "Einen vollen 24-Stunden Social-Media-Detox absolvieren", completed: false }, { id: "2", title: "Dafür im Gegenzug ein ausgedehntes, echtes Telefonat (oder Treffen) führen", completed: false }]
  },
  { 
    id: "qp_cha_04", title: "Präsentation & Leitung (Boss)", category: "cha", difficulty: "boss", minLevel: 25,
    desc: "Übernimm Verantwortung für eine Gruppe und bewältige den Druck, im Mittelpunkt der Aufmerksamkeit zu stehen.",
    tags: ["boss-trial", "public-speaking", "hosting"],
    subQuests: [{ id: "1", title: "Ein privates oder berufliches soziales Event initiieren", completed: false }, { id: "2", title: "Vollkommen ruhig und fließend vor mehreren Personen eine Idee präsentieren/vortragen", completed: false }]
  }
];
