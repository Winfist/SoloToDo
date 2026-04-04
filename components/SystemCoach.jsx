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
 *  - streakDanger: Streak > 5 and no quest today after 18:00
 *  - habitReminder: Habits unfinished after 20:00
 *  - celebration: Milestone reached
 */

function getToday() { return new Date().toISOString().slice(0, 10); }

// ── Intervention Checks ──────────────────────────────────────

export function checkInactivity(state) {
    if (!state.lastActiveDate) return null;
    const lastActive = new Date(state.lastActiveDate);
    const hoursSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 48) return null;
    const days = Math.floor(hoursSince / 24);
    return {
        type: "coaching",
        icon: "⚠",
        title: "ANOMALIE DETEKTIERT",
        lines: [
            `SYSTEM: Hunter ${state.hunterName || "Unbekannt"} zeigt reduzierte Aktivität.`,
            `Letzte Aktion vor ${days} Tagen.`,
            `Warnung: Langfristige Inaktivität führt zu Streak-Verlust.`,
            `Empfehlung: Starte mit einer Easy-Quest um Momentum aufzubauen.`,
        ],
        priority: 2,
    };
}

export function checkOverexertion(state) {
    const completed = state.completedQuests || [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const thresholdDate = threeDaysAgo.toISOString().slice(0, 10);
    const recent = completed.filter(q => q.completedAt >= thresholdDate).length;
    if (recent < 20) return null;
    return {
        type: "coaching",
        icon: "🛡️",
        title: "ÜBERLASTUNG ERKANNT",
        lines: [
            `SYSTEM: ${recent} Quests in 3 Tagen. Überlastungsmuster erkannt.`,
            `Hunter-Effizienz sinkt bei Erschöpfung um 40%.`,
            `Empfehlung: Mache eine VIT-Quest. Erholung stärkt den Körper.`,
        ],
        priority: 1,
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
        icon: "⚖️",
        title: "STAT-UNGLEICHGEWICHT",
        lines: [
            `SYSTEM: Kritisches Ungleichgewicht in Hunter-Profil.`,
            `${weakName}-Stat ist deutlich unter dem Durchschnitt deines Levels.`,
            `Warnung: Ausgewogene Hunter überleben länger in Dungeons.`,
            `Empfehlung: Fokussiere ${weakName}-Quests in den nächsten Tagen.`,
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
    if (questsToday > 0) return null;
    const hoursLeft = 24 - hour;
    const streakBonus = Math.min(streak, 30);
    return {
        type: "warning",
        icon: "🔥",
        title: "STREAK IN GEFAHR",
        lines: [
            `⚠ KRITISCHE WARNUNG ⚠`,
            `Dein ${streak}-Tage-Streak endet in ${hoursLeft} Stunden!`,
            `Eine einzige Easy-Quest rettet deinen Fortschritt.`,
            `Streak-Bonus aktuell: +${streakBonus}% XP`,
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
        icon: "🔄",
        title: "HABITS OFFEN",
        lines: [
            `SYSTEM: ${unfinished} Habit${unfinished > 1 ? "s" : ""} noch nicht erledigt.`,
            `Konsistenz ist der Schlüssel zu echter Veränderung.`,
            `Selbst eine kleine Aktion zählt.`,
        ],
        priority: 1,
    };
}

// ── Celebration Messages ─────────────────────────────────────

const CELEBRATIONS = [
    { check: s => (s.totalQuestsCompleted || 0) === 1, msg: "Deine erste Quest. Der Anfang einer Reise.", icon: "⚔️" },
    { check: s => (s.streak || 0) === 7, msg: "Eine Woche ungebrochener Wille. Du wirst stärker.", icon: "🔥" },
    { check: s => (s.streak || 0) === 30, msg: "30 Tage. Eiserne Disziplin. Du bist nicht derselbe Mensch.", icon: "💎" },
    { check: s => s.level === 10, msg: "Level 10. Der schwächste Hunter überlebt.", icon: "✨" },
    { check: s => s.level === 25, msg: "Level 25. Du hast mehr erreicht als die meisten.", icon: "🌟" },
    { check: s => s.level === 50, msg: "Level 50. Ein wahrer Veteran.", icon: "👑" },
    { check: s => (s.totalQuestsCompleted || 0) === 100, msg: "100 Quests. Du bist kein E-Rank mehr.", icon: "💯" },
    { check: s => (s.shadowArmy?.shadows || []).length === 1, msg: "Dein erster Schatten erhebt sich. ARISE.", icon: "🌑" },
    { check: s => (s.shadowArmy?.shadows || []).some(sh => sh.isNamed), msg: "Ein Named Shadow erkennt dich als würdig an.", icon: "🩸" },
    { check: s => (s.dungeonHistory || []).filter(d => d.won).length === 1, msg: "Dein erstes Gate. Der Pfad der Stärke beginnt.", icon: "🌀" },
];

export function checkCelebrations(state, prevState) {
    if (!prevState) return null;
    for (const c of CELEBRATIONS) {
        try {
            if (c.check(state) && !c.check(prevState)) {
                return {
                    type: "celebration",
                    icon: c.icon,
                    title: "SYSTEM NACHRICHT",
                    lines: [c.msg],
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

// ── Run all checks (called periodically) ────────────────────

export function runCoachChecks(state, prevState) {
    const messages = [];

    const checks = [
        checkStreakDanger,
        checkHabitReminder,
        checkInactivity,
        checkOverexertion,
        checkImbalance,
    ];

    for (const check of checks) {
        const msg = check(state);
        if (msg) messages.push(msg);
    }

    // Celebrations
    const celebration = checkCelebrations(state, prevState);
    if (celebration) messages.push(celebration);

    // Sort by priority (highest first)
    messages.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return messages;
}
