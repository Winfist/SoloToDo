// Interactive tutorial step data.
// type: "cinematic" shows a full-screen system moment.
// type: "info" highlights UI and advances via the tooltip button.
// type: "action" requires the user to interact with the highlighted element.

import { translate } from "./i18n.js";

export const TUTORIAL_SEQUENCES = {
  onboarding: {
    id: "onboarding",
    triggerCondition: "first_app_load",
    steps: [
      {
        id: "awakening",
        type: "cinematic",
        title: "DAS SYSTEM ERWACHT",
        text: "Willkommen, Hunter. Diese App verwandelt deine Aufgaben in Quests, Fortschritt und Belohnungen.",
        position: "center",
        icon: "SYS",
      },
      {
        id: "system_online",
        type: "cinematic",
        title: "SYSTEM: ONLINE",
        text: "Du sammelst XP, Gold und Stats, indem du echte Aufgaben erledigst. Mit jedem Level werden neue Module freigeschaltet.",
        position: "center",
        icon: "LV",
      },
      {
        id: "show_header",
        type: "info",
        target: "[data-tutorial='header-stats']",
        contextTarget: "[data-tutorial='header-stats']",
        contextPadding: 8,
        title: "DEIN HUD",
        text: "Hier siehst du Rang, Level, Gold und deine Serie. Das ist dein schneller System-Status.",
        position: "bottom",
        scrollTo: true,
      },
      {
        id: "show_xp_bar",
        type: "info",
        target: "[data-tutorial='hunter-status']",
        contextTarget: "[data-tutorial='hunter-status']",
        contextPadding: 14,
        title: "HUNTER STATUS",
        text: "Diese Karte zeigt deine XP-Leiste und deinen Level-Fortschritt. Level-Ups schalten neue Bereiche frei.",
        position: "bottom",
        scrollTo: true,
      },
      {
        id: "show_dashboard_stats",
        type: "info",
        target: "[data-tutorial='dashboard-stats-panel']",
        contextTarget: "[data-tutorial='dashboard-stats-panel']",
        contextPadding: 14,
        title: "DEINE ATTRIBUTE",
        text: "STR, INT, VIT, AGI und CHA wachsen durch passende Quests. Diese Werte bestimmen sp\u00e4ter auch Skills, Gates und Builds.",
        position: "bottom",
        scrollTo: true,
        optional: true,
      },
      {
        id: "show_quest_board",
        type: "info",
        target: "[data-tutorial='quest-board']",
        contextTarget: "[data-tutorial='quest-board']",
        contextPadding: 16,
        title: "QUEST BOARD",
        text: "Hier landen deine offenen Quests. System-Quests kommen automatisch dazu, eigene Quests erstellst du selbst.",
        position: "top",
        scrollTo: true,
      },
      {
        id: "click_create_quest",
        type: "action",
        target: "[data-tutorial='create-quest-btn']",
        contextTarget: "[data-tutorial='quest-board']",
        contextPadding: 18,
        title: "ERSTE QUEST ERSTELLEN",
        text: "Tippe auf Neue Quest. F\u00fcr diesen Schritt ist nur dieser Button freigegeben.",
        action: "click",
        position: "top",
        scrollTo: true,
        pulseIntensity: "strong",
      },
      {
        id: "quest_title_input",
        type: "action",
        target: "[data-tutorial='quest-title-input']",
        contextTarget: "[data-tutorial='quest-form']",
        contextPadding: 14,
        title: "QUEST-NAME",
        text: "Gib deiner Aufgabe einen klaren Namen, zum Beispiel 30 Minuten lesen oder 10 Liegest\u00fctze.",
        action: "input",
        position: "bottom",
        scrollTo: true,
      },
      {
        id: "quest_difficulty",
        type: "info",
        target: "[data-tutorial='quest-difficulty']",
        contextTarget: "[data-tutorial='quest-form']",
        contextPadding: 14,
        title: "SCHWIERIGKEIT",
        text: "Easy, Normal, Hard und Boss bestimmen, wie stark die Belohnung ausf\u00e4llt. F\u00fcr den Anfang ist Normal perfekt.",
        position: "bottom",
      },
      {
        id: "quest_category",
        type: "info",
        target: "[data-tutorial='quest-category']",
        contextTarget: "[data-tutorial='quest-form']",
        contextPadding: 14,
        title: "KATEGORIE",
        text: "Jede Quest st\u00e4rkt einen Stat: STR, INT, VIT, AGI oder CHA. W\u00e4hle den Bereich, zu dem deine Aufgabe passt.",
        position: "bottom",
      },
      {
        id: "submit_quest",
        type: "action",
        target: "[data-tutorial='quest-submit-btn']",
        contextTarget: "[data-tutorial='quest-form']",
        contextPadding: 14,
        title: "QUEST AKTIVIEREN",
        text: "Jetzt annehmen. Sobald du klickst, wird die Quest in dein System eingetragen.",
        action: "click",
        position: "top",
        scrollTo: true,
        pulseIntensity: "strong",
      },
      {
        id: "quest_activated",
        type: "cinematic",
        title: "QUEST REGISTRIERT",
        text: "Sehr gut. Deine erste eigene Quest ist aktiv. Erledige sie, um XP und Gold zu verdienen.",
        position: "center",
        icon: "OK",
        confetti: true,
      },
      {
        id: "show_nav",
        type: "info",
        target: "[data-tutorial='bottom-nav']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "NAVIGATION",
        text: "Unten wechselst du zwischen den Modulen. Neue Tabs erscheinen, sobald dein Level hoch genug ist.",
        position: "top",
      },
      {
        id: "open_system_hub",
        type: "action",
        target: "[data-tutorial='nav-system']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "SYSTEM-HUB \u00d6FFNEN",
        text: "Tippe auf System. Dort findest du Hunter Stats, Einstellungen und sp\u00e4ter viele freigeschaltete Module.",
        action: "click",
        position: "top",
        pulseIntensity: "strong",
      },
      {
        id: "open_hunter_stats",
        type: "action",
        target: "[data-tutorial='system-stats']",
        contextTarget: "[data-tutorial='system-hunter-intel']",
        contextPadding: 14,
        title: "HUNTER STATS",
        text: "\u00d6ffne Hunter Stats. Das ist dein Charakterbogen: Attribute, Power Level, Skills und Artefakte.",
        action: "click",
        position: "bottom",
        scrollTo: true,
        pulseIntensity: "strong",
      },
      {
        id: "stats_overview",
        type: "info",
        target: "[data-tutorial='stats-overview']",
        contextTarget: "[data-tutorial='stats-view']",
        contextPadding: 14,
        title: "STATUS-ANALYSE",
        text: "Hier siehst du Radar, Power Level und Gesamtfortschritt. Das zeigt dir, wie dein Hunter-Profil gerade verteilt ist.",
        position: "bottom",
        scrollTo: true,
      },
      {
        id: "stats_attributes",
        type: "info",
        target: "[data-tutorial='stats-attributes']",
        contextTarget: "[data-tutorial='stats-view']",
        contextPadding: 14,
        title: "ATTRIBUTE STEIGERN",
        text: "Jede Kategorie hat einen Wert. Wenn du Stat-Punkte bekommst, kannst du hier gezielt STR, INT, VIT, AGI oder CHA verbessern.",
        position: "top",
        scrollTo: true,
      },
      {
        id: "return_dashboard",
        type: "action",
        target: "[data-tutorial='nav-dashboard']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "ZUR\u00dcCK ZUR JAGD",
        text: "Zur\u00fcck zum Heute-Tab. Dort startest du deine Quests und baust deinen Fortschritt weiter aus.",
        action: "click",
        position: "top",
        pulseIntensity: "strong",
      },
      {
        id: "arise_finale",
        type: "cinematic",
        title: "A R I S E",
        text: "Das System ist kalibriert. Ab jetzt begleitet dich das Tutorial nur noch, wenn du neue Features freischaltest.",
        position: "center",
        icon: "GO",
        isFinale: true,
        confetti: true,
      },
    ],
  },

  tier_1: {
    id: "tier_1",
    triggerCondition: "tier_unlock",
    triggerTier: 1,
    steps: [
      {
        id: "tier1_intro",
        type: "cinematic",
        title: "SYSTEM UPDATE",
        text: "Level 3 erreicht. Erste Zusatzmodule wurden freigeschaltet.",
        position: "center",
        icon: "UPD",
      },
      {
        id: "habit_tracker",
        type: "info",
        target: "[data-tutorial='habit-tracker']",
        contextTarget: "[data-tutorial='habit-tracker']",
        contextPadding: 16,
        title: "HABIT TRACKER",
        text: "Hier baust du Routinen auf. Habits helfen dir, kleine Wiederholungen sichtbar zu machen.",
        position: "top",
        scrollTo: true,
      },
      {
        id: "emergency_quests",
        type: "info",
        target: "[data-tutorial='emergency-quest']",
        contextTarget: "[data-tutorial='quest-board']",
        contextPadding: 16,
        title: "NOTFALL-QUESTS",
        text: "Wenn eine Notfall-Quest aktiv ist, erscheint sie hier. Sie ist zeitkritisch und lohnt sich besonders.",
        position: "bottom",
        optional: true,
      },
      {
        id: "tier1_done",
        type: "cinematic",
        title: "MODULE AKTIVIERT",
        text: "Habit Tracker, Notfall-Quests, Quest-Filter und Focus Mode sind jetzt Teil deines Systems.",
        position: "center",
        icon: "OK",
        confetti: true,
      },
    ],
  },

  tier_2: {
    id: "tier_2",
    triggerCondition: "tier_unlock",
    triggerTier: 2,
    steps: [
      {
        id: "tier2_intro",
        type: "cinematic",
        title: "SYSTEM EXPANSION",
        text: "Level 5 erreicht. Langfristige Ziele und Micro-Habits sind freigeschaltet.",
        position: "center",
        icon: "GOAL",
      },
      {
        id: "training_tab",
        type: "info",
        target: "[data-tutorial='nav-training']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "TRAINING HUB",
        text: "Der Training-Tab b\u00fcndelt Ziele, Habits und Planung. Hier entsteht dein l\u00e4ngerer Fortschritt.",
        position: "top",
        scrollTo: true,
      },
      {
        id: "tier2_done",
        type: "cinematic",
        title: "NEUE SYSTEME ONLINE",
        text: "Ziele, Micro-Habits, Vision Board und KI-Hilfe stehen bereit.",
        position: "center",
        icon: "OK",
        confetti: true,
      },
    ],
  },

  tier_3: {
    id: "tier_3",
    triggerCondition: "tier_unlock",
    triggerTier: 3,
    steps: [
      {
        id: "tier3_intro",
        type: "cinematic",
        title: "ERKENNUNG",
        text: "Level 8 erreicht. Achievements, Weekly Quests, Dawn/Dusk und der KI-Coach sind freigeschaltet.",
        position: "center",
        icon: "ACH",
        confetti: true,
      },
    ],
  },

  tier_4: {
    id: "tier_4",
    triggerCondition: "tier_unlock",
    triggerTier: 4,
    steps: [
      {
        id: "tier4_intro",
        type: "cinematic",
        title: "D-RANG AUFSTIEG",
        text: "Level 11 erreicht. Dungeon Gates, Shop, Equipment, Story und Inner Sanctum sind jetzt verf\u00fcgbar.",
        position: "center",
        icon: "GATE",
      },
      {
        id: "dungeon_nav",
        type: "info",
        target: "[data-tutorial='nav-dungeon']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "DUNGEON GATES",
        text: "\u00dcber diesen Tab betrittst du Gates. Dort warten Etagen, Bosse und seltene Belohnungen.",
        position: "top",
      },
      {
        id: "tier4_done",
        type: "cinematic",
        title: "NEUE \u00c4RA",
        text: "Du bist kein Anf\u00e4nger mehr. Die Jagd beginnt.",
        position: "center",
        icon: "OK",
        confetti: true,
      },
    ],
  },

  tier_5: {
    id: "tier_5",
    triggerCondition: "tier_unlock",
    triggerTier: 5,
    steps: [
      {
        id: "tier5_intro",
        type: "cinematic",
        title: "SCHATTEN-ERWECKUNG",
        text: "Level 15 erreicht. Shadow Army, Hunter Codex und dynamische KI-Quests sind freigeschaltet.",
        position: "center",
        icon: "SHA",
        confetti: true,
        isFinale: true,
      },
    ],
  },

  tier_6: {
    id: "tier_6",
    triggerCondition: "tier_unlock",
    triggerTier: 6,
    steps: [
      {
        id: "tier6_intro",
        type: "cinematic",
        title: "C-RANG \u00dcBERSCHRITTEN",
        text: "Level 21 erreicht. Jobs, Formationen, Events und Hidden Quests sind freigeschaltet.",
        position: "center",
        icon: "JOB",
        confetti: true,
      },
    ],
  },

  tier_7: {
    id: "tier_7",
    triggerCondition: "tier_unlock",
    triggerTier: 7,
    steps: [
      {
        id: "tier7_intro",
        type: "cinematic",
        title: "FORTGESCHRITTENE SYSTEME",
        text: "Level 30 erreicht. Soul Link, Charisma Dungeons, Named Shadows und Seasons sind freigeschaltet.",
        position: "center",
        icon: "LINK",
        confetti: true,
      },
    ],
  },

  tier_8: {
    id: "tier_8",
    triggerCondition: "tier_unlock",
    triggerTier: 8,
    steps: [
      {
        id: "tier8_intro",
        type: "cinematic",
        title: "B-RANG ELITESTATUS",
        text: "Level 36 erreicht. Multiplayer ist freigeschaltet. Die Hunter Association steht offen.",
        position: "center",
        icon: "MP",
        confetti: true,
        isFinale: true,
      },
    ],
  },
};

export function getTutorialForTier(tier) {
  return `tier_${tier}`;
}

function localizedValue(locale, key, fallback) {
  const value = translate(locale, key);
  return value === key ? fallback : value;
}

function localizeStep(locale, step) {
  return {
    ...step,
    title: localizedValue(locale, `tutorial.steps.${step.id}.title`, step.title),
    text: localizedValue(locale, `tutorial.steps.${step.id}.text`, step.text),
  };
}

export function getTutorialSequences(locale = "de") {
  return Object.fromEntries(
    Object.entries(TUTORIAL_SEQUENCES).map(([sequenceId, sequence]) => [
      sequenceId,
      {
        ...sequence,
        steps: sequence.steps.map(step => localizeStep(locale, step)),
      },
    ])
  );
}

export function hasTutorialSequence(id) {
  return Boolean(TUTORIAL_SEQUENCES[id]);
}
