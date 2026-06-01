---
type: architecture
tags:
  - architecture
  - database
---
# Firebase Firestore Schema

Übersicht über unsere NoSQL-Datenstruktur. Quests werden im laufenden Betrieb direkt im `users`-Dokument als Array gespeichert, während abgeschlossene und archivierte Quests in Unterkollektionen ausgelagert werden.

## 👥 Collection: `users`
Dokument-ID: `user.uid` (aus Firebase Auth)

### Dokument-Struktur
```json
{
  "email": "hunter@example.com",
  "displayName": "Sung Jin-Woo",
  "level": 15,
  "xp": 4500,
  "gold": 1250,
  "totalGoldEarned": 5300,
  "gems": 50,
  "totalGemsEarned": 100,
  "gemStreak": { "current": 2, "lastClaimDate": "2026-06-01" },
  "activeGemBoosters": [],
  "tutorialCompleted": true,
  "completedTutorials": ["DoubleDungeonTutorial"],
  "stats": {
    "str": 20,
    "agi": 15,
    "int": 10,
    "vit": 12,
    "cha": 8
  },
  "statPoints": 0,
  "streak": 5,
  "lastActiveDate": "2026-06-01",
  "lastWelcomeDate": "2026-06-01",
  "quests": [
    {
      "id": "q_xyz123",
      "title": "React Three Fiber optimieren",
      "difficulty": "normal",
      "category": "agi",
      "type": "side",
      "priority": "medium",
      "energy": "medium",
      "createdAt": "2026-06-01",
      "createdAtMs": 1780312000000,
      "linkedHabitId": "h_abc456"
    }
  ],
  "completedQuests": [],
  "questArchive": [],
  "questPlanning": {
    "overloadPreset": "balanced",
    "pinnedQuestIds": [],
    "deferredUntilById": {},
    "lifecycleById": {}
  },
  "shopPurchases": ["monarch_cloak"],
  "selectedTheme": "default",
  "selectedTitle": "The Shadow Monarch",
  "selectedPageTransition": "domain_shift",
  "shadowArmy": {
    "shadows": [],
    "capacity": 20,
    "formations": { "vanguard": [], "core": [], "rearguard": [] },
    "totalShadowXp": 0
  },
  "totalXpEarned": 14500,
  "totalQuestsCompleted": 32,
  "dailyUserQuestsCreated": 1,
  "extraDailySlots": 0,
  "dailyUserXP": 150,
  "integrityScore": 100,
  "dungeons": [],
  "lastDungeonRefresh": "Timestamp",
  "dungeonHistory": [],
  "achievements": { "unlocked": ["first_quest"], "notified": ["first_quest"] },
  "skills": { "unlocked": ["shadow_extract"] },
  "equipment": {
    "slots": { "weapon": null, "armor": null, "ring1": null, "ring2": null },
    "inventory": []
  },
  "artifacts": { "discovered": [], "totalFound": 0 },
  "dailyFocusQuestId": null,
  "dailyQuestCompletionCount": 2,
  "questReplacements": { "date": "2026-06-01", "used": 0, "replacedKeys": [] },
  "penaltyZone": { "active": false, "redemptionLeft": 0, "questsCompletedInPenalty": 0 },
  "emergencyQuest": null,
  "emergencyDone": false,
  "emergencyFailed": false,
  "goals": [],
  "habits": [],
  "reminders": [],
  "healthPreferences": {
    "sleepMode": "auto",
    "manualSleepToday": 0,
    "manualSleepLog": {},
    "healthHistoryRange": "7d"
  },
  "healthDailyHistory": {},
  "healthRewardsClaimed": {},
  "screenTimePreferences": {
    "enabled": false,
    "dailyLimitMinutes": 180,
    "screenTimeHistoryRange": "7d",
    "fallbackEnabled": false,
    "lastCapability": null
  },
  "screenTimeDailyHistory": {},
  "screenTimeRewardsClaimed": {},
  "screenTimeSyncDate": null,
  "microHabits": { "habits": null, "daily": {} },
  "hiddenQuests": { "discovered": [], "completed": [] },
  "weeklyQuestReset": "Timestamp",
  "lastSystemTaskTime": "Timestamp",
  "jobs": {
    "current": "necromancer",
    "levels": { "berserker": 0, "archmage": 0, "guardian": 0, "assassin": 0, "monarch": 0, "necromancer": 1 },
    "xp": { "berserker": 0, "archmage": 0, "guardian": 0, "assassin": 0, "monarch": 0, "necromancer": 50 },
    "activeAbilityCooldowns": {}
  },
  "story": {
    "completedChapters": [],
    "completedArcs": [],
    "defeatedBosses": [],
    "totalStoryXp": 0
  },
  "lifeDomains": [],
  "manifestations": [],
  "focus": {
    "totalMinutes": 0,
    "totalSessions": 0,
    "streak": 0,
    "bestStreak": 0,
    "lastSessionDate": null,
    "bestDayMinutes": 0,
    "longestSessionMinutes": 0,
    "daily": {},
    "modes": {
      "pomodoro": { "totalMinutes": 0, "sessions": 0 },
      "deepWork": { "totalMinutes": 0, "sessions": 0 },
      "sprint": { "totalMinutes": 0, "sessions": 0 },
      "sanctum": { "totalMinutes": 0, "sessions": 0 }
    },
    "recentSessions": []
  },
  "sanctum": {
    "level": 1,
    "willpower": 10,
    "totalMeditationMinutes": 0
  },
  "multiplayer": {
    "activeRaid": null,
    "guild": null,
    "social": null,
    "publicStats": { "totalXp": 14500, "dungeonsCleared": 0 }
  },
  "shadowRegression": {
    "active": false,
    "previousStreak": 0,
    "redemptionQuests": [],
    "questsCompleted": 0,
    "completedAt": null,
    "regressionHistory": []
  },
  "soulLink": {
    "linkCode": null,
    "partnerUid": null,
    "partnerName": null,
    "partnerStreak": 0,
    "partnerLevel": 0,
    "partnerQuestsToday": 0,
    "partnerLastActive": null,
    "bothActive": false,
    "revivesLeft": 3,
    "revivesReceived": 0,
    "linkedAt": null
  },
  "seasons": {
    "currentSeason": null,
    "currentWorldEvent": null,
    "worldEventExpires": null,
    "seasonalCompletions": [],
    "seasonStartDate": null,
    "earnedSeasonalTitles": []
  },
  "dawnDusk": {
    "morningTasks": [],
    "eveningTasks": [],
    "currentRun": null,
    "lastMorningRun": null,
    "lastEveningRun": null,
    "perfectRuns": 0,
    "runHistory": []
  },
  "charismaDungeons": {
    "unlockedChains": ["social_exposure"],
    "activeChains": {},
    "completedChains": [],
    "stepHistory": []
  },
  "customQuestPool": {
    "templates": [],
    "favorites": [],
    "recentlyUsed": [],
    "collections": []
  },
  "ai": {
    "enabled": true,
    "verificationEnabled": true,
    "dynamicMessagesEnabled": true,
    "coachEnabled": true,
    "verifiedQuests": 0,
    "scannedTasks": 0
  },
  "settings": {
    "language": "de",
    "autoSystemTasks": false,
    "questIntensity": "baby_gate",
    "pageTransitionSpeed": 1
  },
  "widgetConfig": {
    "modules": ["streak_xp", "quests", "habits", "micro_habits", "hunter_card"],
    "questFilter": "all",
    "questSort": "focus",
    "maxQuests": 5,
    "showHunterCard": true,
    "showSystemMessage": true,
    "syncTheme": true,
    "rotationEnabled": false,
    "rotationIntervalMinutes": 5,
    "showSections": {
      "streak": true,
      "quests": true,
      "habits": true,
      "microHabits": true,
      "stats": true,
      "heatmap": true,
      "systemMessage": true
    },
    "liveActivity": {
      "emergencyQuest": true,
      "streakWarning": true,
      "deadlineAlert": true
    }
  }
}
```

---

## 🛡️ Sub-Collection: `users/{uid}/questHistory`
Speichert den Verlauf aller **abgeschlossenen Quests**.
Dokument-ID: Quest-ID (`quest.id`)

### Dokument-Struktur
```json
{
  "id": "q_xyz123",
  "title": "React Three Fiber optimieren",
  "description": "WebGL Shader Fix und Touch Event Throttling",
  "category": "agi",
  "difficulty": "normal",
  "type": "side",
  "priority": "medium",
  "energy": "medium",
  "createdAt": "2026-06-01",
  "createdAtMs": 1780312000000,
  "completedAt": "2026-06-01T14:30:00.000Z",
  "completedAtMs": 1780362600000,
  "rewarded": { "xp": 150, "gold": 50 },
  "isDeleted": false
}
```

---

## 🗄️ Sub-Collection: `users/{uid}/questArchive`
Speichert **archivierte oder weich gelöschte Quests**.
Dokument-ID: Quest-ID (`quest.id`)

### Dokument-Struktur
Entspricht dem Schema von `questHistory` mit `isDeleted: true` oder `status: "archived"`.

