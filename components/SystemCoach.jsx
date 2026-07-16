import { STAT_ICONS, NAV_ICONS, HABIT_ICONS, STORY_ICONS, SEASON_ICONS } from "../data/icons.js";
import { getToday, getLocalDateKey } from "../data/dateUtils.js";
import { getStateLocale, translate } from "../data/i18n.js";
import { getFocusStats } from "../data/lifeDomains.js";
import { getQuestPlanningSnapshot } from "../data/questPlanning.js";
import { getCoachPosture } from "../data/hunterDossier.js";

function ct(state, key, params = {}) {
    return translate(getStateLocale(state), key, params);
}

/**
 * SystemCoach – Adaptive AI Coach Interventions.
 *
 * Called from useGameState on each state update to check
 * if any intervention triggers should fire. Returns system
 * messages that get displayed as notifications.
 *
 * Intervention types:
 *  - inactivity: No quest in 48h
 *  - overexertion: 20+ quests in 3 days
 *  - imbalance: One stat 3x higher than lowest
 *  - streakDanger: Streak >= 3 and no quest/habit today after 18:00
 *  - habitReminder: Habits unfinished after 20:00
 *  - celebration: Milestone reached
 */

// ── Intervention Checks ──────────────────────────────────────

export function checkInactivity(state) {
    if (!state.lastActiveDate) return null;
    const lastActive = new Date(state.lastActiveDate);
    const hoursSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 48) return null;
    const days = Math.floor(hoursSince / 24);
    return {
        type: "coaching",
        checkId: "inactivity",
        icon: "⚠",
        iconSrc: NAV_ICONS.events,
        title: ct(state, "systemCoach.anomalyTitle"),
        lines: [
            ct(state, "systemCoach.inactivityHunter", { name: state.hunterName || ct(state, "common.unknown") }),
            ct(state, "systemCoach.lastActionDays", { days }),
            ct(state, "systemCoach.inactivityWarning"),
            ct(state, "systemCoach.startEasy"),
        ],
        priority: 2,
    };
}

export function checkOverexertion(state) {
    const completed = state.completedQuests || [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const thresholdDate = getLocalDateKey(threeDaysAgo);
    const recent = completed.filter(q => q.completedAt >= thresholdDate).length;
    if (recent < 20) return null;
    return {
        type: "coaching",
        checkId: "overexertion",
        icon: "🛡️",
        iconSrc: STAT_ICONS.vit,
        title: ct(state, "systemCoach.overloadTitle"),
        lines: [
            ct(state, "systemCoach.overloadDetected", { count: recent }),
            ct(state, "systemCoach.overloadEfficiency"),
            ct(state, "systemCoach.recovery"),
        ],
        priority: 1,
    };
}

export function checkQuestOverload(state, prevState) {
    const current = getQuestPlanningSnapshot(state).overloadStatus;
    const previous = prevState ? getQuestPlanningSnapshot(prevState).overloadStatus : { level: "calm" };
    if (current.level === "calm" || current.level === previous.level) return null;
    const isEnglish = getStateLocale(state) === "en";
    const overloaded = current.level === "overload";
    return {
        type: overloaded ? "warning" : "coaching",
        checkId: "questOverload",
        icon: overloaded ? "!" : "LOG",
        iconSrc: NAV_ICONS.events,
        title: overloaded ? (isEnglish ? "QUEST LOG PROTECTION" : "QUEST-LOG SCHUTZ") : (isEnglish ? "QUEST LOG REVIEW" : "QUEST-LOG PRÜFEN"),
        lines: overloaded
            ? [
                isEnglish ? "The System is pausing optional calls." : "Das System pausiert optionale Rufe.",
                isEnglish ? `${current.actionableCount} actionable Quests are open. Sort your Quest Log calmly.` : `${current.actionableCount} ausführbare Quests sind offen. Sortiere dein Quest-Log in Ruhe.`,
              ]
            : [
                isEnglish ? "Your Quest Log is getting full." : "Dein Quest-Log wird voller.",
                isEnglish ? "Pin what matters now and park the rest for later." : "Pinne, was jetzt zählt, und verschiebe den Rest auf später.",
              ],
        priority: overloaded ? 3 : 1,
    };
}

export function checkImbalance(state) {
    const stats = state.stats || {};
    const values = Object.values(stats).filter(v => typeof v === "number");
    if (values.length < 5) return null;
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (min === 0 || max < min * 3) return null;

    const statNames = { str: "STR", int: "INT", vit: "VIT", agi: "AGI", cha: "CHA" };
    const weakest = Object.entries(stats).reduce((a, b) => a[1] <= b[1] ? a : b);
    const weakName = statNames[weakest[0]] || weakest[0];

    return {
        type: "coaching",
        checkId: "imbalance",
        icon: "⚖️",
        iconSrc: STAT_ICONS.int,
        title: ct(state, "systemCoach.imbalanceTitle"),
        lines: [
            ct(state, "systemCoach.imbalanceDetected"),
            ct(state, "systemCoach.statBelowAverage", { stat: weakName }),
            ct(state, "systemCoach.balancedWarning"),
            ct(state, "systemCoach.focusWeak", { stat: weakName }),
        ],
        priority: 1,
    };
}

export function checkStreakDanger(state) {
    const streak = state.streak || 0;
    if (streak < 3) return null;
    const hour = new Date().getHours();
    if (hour < 18) return null;
    const today = getToday();
    const questsToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
    const habitsToday = (state.habits || []).filter(h => h.history?.[today]?.completed).length;
    if (questsToday > 0 || habitsToday > 0) return null;
    const hoursLeft = 24 - hour;
    const streakBonus = Math.min(streak, 30);
    return {
        type: "warning",
        checkId: "streakDanger",
        icon: "🔥",
        iconSrc: STAT_ICONS.str,
        title: ct(state, "systemCoach.streakDangerTitle"),
        lines: [
            ct(state, "systemCoach.criticalWarning"),
            ct(state, "systemCoach.streakEnds", { streak, hours: hoursLeft }),
            ct(state, "systemCoach.oneQuest"),
            ct(state, "systemCoach.streakBonus", { bonus: streakBonus }),
        ],
        priority: 3,
    };
}

export function checkHabitReminder(state) {
    const habits = state.habits || [];
    if (habits.length === 0) return null;
    const hour = new Date().getHours();
    if (hour < 20) return null;
    const today = getToday();
    const unfinished = habits.filter(h => h.active && !h.history?.[today]?.completed).length;
    if (unfinished === 0) return null;
    return {
        type: "coaching",
        checkId: "habitReminder",
        icon: "🔄",
        iconSrc: HABIT_ICONS.weekday,
        title: ct(state, "systemCoach.habitOpenTitle"),
        lines: [
            ct(state, "systemCoach.habitOpenLine", { count: unfinished, plural: unfinished > 1 ? "s" : "" }),
            ct(state, "systemCoach.consistencyLine"),
            ct(state, "systemCoach.smallActionLine"),
        ],
        priority: 1,
    };
}

export function checkOpenedButIdle(state) {
    const today = getToday();
    const day = state.sessionSignals?.days?.[today];
    if (!day || (day.opens || 0) < 3 || (day.actions || 0) > 0) return null;
    return {
        type: "coaching",
        checkId: "openedButIdle",
        icon: "◈",
        iconSrc: NAV_ICONS.dashboard,
        title: ct(state, "systemCoach.openedButIdleTitle"),
        lines: [
            ct(state, "systemCoach.openedButIdleLine1"),
            ct(state, "systemCoach.openedButIdleLine2"),
        ],
        priority: 2,
    };
}

// ── Celebration Messages ─────────────────────────────────────

const CELEBRATIONS = [
    { check: s => (s.totalQuestsCompleted || 0) === 1, msgKey: "systemCoach.firstQuest", icon: "⚔️", iconSrc: STAT_ICONS.str },
    { check: s => (s.streak || 0) === 7, msgKey: "systemCoach.celebrationWeek", icon: "🔥", iconSrc: STAT_ICONS.str },
    { check: s => (s.streak || 0) === 30, msgKey: "systemCoach.celebrationThirty", icon: "💎", iconSrc: STORY_ICONS.butterfly },
    { check: s => s.level === 10, msgKey: "systemCoach.celebrationLevel10", icon: "✨", iconSrc: STAT_ICONS.cha },
    { check: s => s.level === 25, msgKey: "systemCoach.celebrationLevel25", icon: "🌟", iconSrc: NAV_ICONS.achievements },
    { check: s => s.level === 50, msgKey: "systemCoach.celebrationLevel50", icon: "👑", iconSrc: SEASON_ICONS.merchant },
    { check: s => (s.totalQuestsCompleted || 0) === 100, msgKey: "systemCoach.hundredQuests", icon: "💯", iconSrc: NAV_ICONS.achievements },
    { check: s => (s.shadowArmy?.shadows || []).length === 1, msgKey: "systemCoach.celebrationFirstShadow", icon: "🌑", iconSrc: STORY_ICONS.arise },
    { check: s => (s.shadowArmy?.shadows || []).some(sh => sh.isNamed), msgKey: "systemCoach.celebrationNamedShadow", icon: "🩸", iconSrc: SEASON_ICONS.redgate },
    { check: s => (s.dungeonHistory || []).filter(d => d.won).length === 1, msgKey: "systemCoach.celebrationFirstGate", icon: "🌀", iconSrc: NAV_ICONS.dashboard },
];

export function checkCelebrations(state, prevState) {
    if (!prevState) return null;
    for (const c of CELEBRATIONS) {
        try {
            if (c.check(state) && !c.check(prevState)) {
                return {
                    type: "celebration",
                    checkId: "celebration",
                    icon: c.icon,
                    iconSrc: c.iconSrc,
                    title: ct(state, "systemCoach.systemMessageTitle"),
                    lines: [ct(state, c.msgKey)],
                    priority: 2,
                };
            }
        } catch { }
    }
    return null;
}

// ── Best Time Detection ──────────────────────────────────────

export function detectBestTime(state) {
    const completed = state.completedQuests || [];
    if (completed.length < 10) return null;

    // Count completions by rough hour buckets
    const buckets = { morgen: 0, mittag: 0, abend: 0, nacht: 0 };
    completed.forEach(q => {
        if (!q.completedAtTime) return;
        const h = parseInt(q.completedAtTime.split(":")[0]);
        if (h >= 5 && h < 10) buckets.morgen++;
        else if (h >= 10 && h < 14) buckets.mittag++;
        else if (h >= 14 && h < 20) buckets.abend++;
        else buckets.nacht++;
    });

    const best = Object.entries(buckets).reduce((a, b) => a[1] >= b[1] ? a : b);
    const timeLabels = { morgen: "morgens (5-10 Uhr)", mittag: "mittags (10-14 Uhr)", abend: "abends (14-20 Uhr)", nacht: "nachts (20-5 Uhr)" };

    return {
        bestTime: best[0],
        label: timeLabels[best[0]],
        count: best[1],
        total: Object.values(buckets).reduce((a, b) => a + b, 0),
        percentage: Math.round((best[1] / Math.max(Object.values(buckets).reduce((a, b) => a + b, 0), 1)) * 100),
    };
}

// ── Weekly Path Report ───────────────────────────────────────

export function checkWeeklyPathReport(state) {
    // Only fire on Mondays, once per week
    const now = new Date();
    if (now.getDay() !== 1) return null; // 1 = Monday
    const today = getToday();
    if (state.lastWeeklyPathReport === today) return null;

    const completed = state.completedQuests || [];
    if (completed.length < 5) return null;

    // Count quests from last 7 days by category
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threshold = getLocalDateKey(sevenDaysAgo);
    const recent = completed.filter(q => q.completedAt >= threshold);

    const statNames = { str: "STR", int: "INT", vit: "VIT", agi: "AGI", cha: "CHA" };
    const counts = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
    recent.forEach(q => { if (q.category && counts[q.category] !== undefined) counts[q.category]++; });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    // Find strongest and weakest
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    // Check focus domains for mismatch
    const focusDomains = state.lifeDomains || [];
    let focusWarning = "";
    if (focusDomains.length > 0) {
        const focusStats = getFocusStats(focusDomains);
        const neglectedFocus = focusStats.filter(s => (counts[s] || 0) <= 1);
        if (neglectedFocus.length > 0) {
            focusWarning = ct(state, "systemCoach.focusDomainsWarning", { stats: neglectedFocus.map(s => statNames[s]).join(", ") });
        }
    }

    const lines = [
        ct(state, "systemCoach.weeklyAnalysis", { count: total }),
        sorted.map(([s, c]) => `${statNames[s]}: ${c}`).join(" - "),
        ct(state, "systemCoach.weeklyStrongWeak", {
            strongest: statNames[strongest[0]],
            strongestCount: strongest[1],
            weakest: statNames[weakest[0]],
            weakestCount: weakest[1],
        }),
    ];
    if (focusWarning) lines.push(focusWarning);
    lines.push(ct(state, "systemCoach.weeklyFocus", { stat: statNames[weakest[0]] }));

    return {
        type: "coaching",
        checkId: "weeklyPathReport",
        icon: "📊",
        iconSrc: NAV_ICONS.analytics,
        title: "WEEKLY PATH REPORT",
        lines,
        priority: 2,
        _setLastWeeklyPathReport: today, // Flag for caller to persist
    };
}

// ── Run all checks (called periodically) ────────────────────

export function runCoachChecks(state, prevState) {
    const messages = [];

    const checks = [
        checkStreakDanger,
        checkHabitReminder,
        checkInactivity,
        checkOverexertion,
        checkImbalance,
        checkOpenedButIdle,
        checkWeeklyPathReport,
    ];

    for (const check of checks) {
        const msg = check(state);
        if (msg) messages.push(msg);
    }
    const questOverload = checkQuestOverload(state, prevState);
    if (questOverload) messages.push(questOverload);

    // Celebrations
    const celebration = checkCelebrations(state, prevState);
    if (celebration) messages.push(celebration);

    // Sort by priority (highest first)
    messages.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Celebrations always lead: pickCoachMessage returns the FIRST surviving
    // message, and celebrations are one-shot state transitions — if a
    // budget-passing coaching message sat in front of one, the celebration
    // would be shadowed and lost for good.
    const celebrations = messages.filter(m => m.type === "celebration");
    const rest = messages.filter(m => m.type !== "celebration");
    let sorted = [...celebrations, ...rest];

    // Struggling-Posture: erste Zeile (= Toast-Text) wird sanft, plus Mini-Einstieg.
    if (getCoachPosture(state) === "struggling") {
        const SOFT_KEYS = { inactivity: "systemCoach.inactivitySoft", habitReminder: "systemCoach.habitReminderSoft", openedButIdle: "systemCoach.openedButIdleSoft" };
        sorted = sorted.map(msg => SOFT_KEYS[msg.checkId]
            ? { ...msg, lines: [ct(state, SOFT_KEYS[msg.checkId]), ...msg.lines.slice(1), ct(state, "systemCoach.miniStep")] }
            : msg);
    }

    return sorted;
}

// ── AI Enrichment (optional, async) ─────────────────────────
// Replaces the lines[] of the top-priority message with AI-generated text.
// Falls back to the original hardcoded lines on any error or timeout.
// Session-limited: max 5 AI messages per day (tracked in sessionStorage).

const AI_SESSION_KEY = "coach_ai_calls_today";
const AI_SESSION_DATE_KEY = "coach_ai_calls_date";
const MAX_AI_COACH_CALLS = 5;

function getAICallsToday() {
    const today = getToday();
    const stored = sessionStorage.getItem(AI_SESSION_DATE_KEY);
    if (stored !== today) {
        sessionStorage.setItem(AI_SESSION_DATE_KEY, today);
        sessionStorage.setItem(AI_SESSION_KEY, "0");
        return 0;
    }
    return parseInt(sessionStorage.getItem(AI_SESSION_KEY) || "0", 10);
}

function incrementAICallsToday() {
    const current = getAICallsToday();
    sessionStorage.setItem(AI_SESSION_KEY, String(current + 1));
}

const MESSAGE_TYPE_MAP = {
    "warning": "streak_danger",
    "coaching": "inactivity",
    "celebration": "milestone",
};

/**
 * Optionally enrich the top coach message with AI-generated lines.
 * @param {Array} messages - Result from runCoachChecks()
 * @param {object} state - Current game state
 * @param {Function} generateFn - generateSystemMsg(context, type) from useGeminiAI
 * @returns {Promise<Array>} - Same messages array, top message potentially enriched
 */
export async function enrichCoachMessagesAsync(messages, state, generateFn) {
    if (!messages.length || !generateFn) return messages;
    if (getAICallsToday() >= MAX_AI_COACH_CALLS) return messages;

    const top = messages[0];
    const messageType = MESSAGE_TYPE_MAP[top.type] || "inactivity";
    const statSummary = state?.stats
        ? `STR ${state.stats.str || 0} INT ${state.stats.int || 0} VIT ${state.stats.vit || 0} AGI ${state.stats.agi || 0} CHA ${state.stats.cha || 0}`
        : "";
    const context = `${top.lines.join(" ")} Hunter: Level ${state?.level || 1}, Streak ${state?.streak || 0}. ${statSummary}`;

    try {
        // 3s timeout so it never blocks the UI
        const aiResult = await Promise.race([
            generateFn(context, messageType),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
        ]);

        if (aiResult?.lines?.length > 0) {
            incrementAICallsToday();
            return [
                { ...top, title: aiResult.title || top.title, lines: aiResult.lines },
                ...messages.slice(1),
            ];
        }
    } catch {
        // Fallback to hardcoded lines silently
    }

    return messages;
}
