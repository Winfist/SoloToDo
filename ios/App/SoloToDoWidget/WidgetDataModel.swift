// ─── WIDGET DATA MODEL ───────────────────────────────────────
// Decodes the JSON payload written by widgetDataService.js
// via capacitor-widget-bridge into the shared App Group container.
// ALL fields use optional decoding with defaults to ensure
// the widget never fails to decode, even with partial data.

import Foundation
import WidgetKit

// MARK: - App Group Constants
let appGroupId = "group.com.solotodo.app"
let widgetDataKey = "widgetData"
let widgetActionQueueKey = "widgetActionQueue"
// ID of the quest the user expanded inline in the widget (set by the tap intent,
// cleared by the app on the next data sync).
let widgetExpandedKey = "widgetExpandedQuestId"

// MARK: - Root Widget Data
struct WidgetData: Codable {
    var updatedAt: String?
    
    // Hunter Info
    var hunterName: String
    var level: Int
    var xp: Int
    var xpNeeded: Int
    var rank: String
    var rankColor: String
    var title: String?
    var streak: Int
    var gold: Int
    var gems: Int
    
    // Quest Data
    var quests: [WidgetQuest]
    var focusQuest: WidgetFocusQuest?
    var totalOpen: Int
    var completedToday: Int
    var nearestDeadline: WidgetDeadline?
    
    // Habits
    var habits: [WidgetHabit]
    var habitsCompleted: Int
    var habitsTotal: Int
    
    // Micro-Habits
    var microHabits: [WidgetMicroHabit]
    
    // Stats
    var stats: WidgetStats
    
    // Health & Screen Time
    var health: WidgetHealth
    var screenTime: WidgetScreenTime
    
    // Shadow Army
    var shadowCount: Int
    var strongestShadow: WidgetShadow?
    
    // Heatmap
    var weekHeatmap: [WidgetHeatmapDay]
    
    // System Message
    var systemMessage: String?
    
    // Streak Shield
    var streakShield: WidgetStreakShield
    
    // Theme
    var theme: WidgetTheme
    
    // Config
    var config: WidgetConfig
    
    // CodingKeys + init(from:) with defaults for every field
    enum CodingKeys: String, CodingKey {
        case updatedAt, hunterName, level, xp, xpNeeded, rank, rankColor, title
        case streak, gold, gems, quests, focusQuest, totalOpen, completedToday
        case nearestDeadline, habits, habitsCompleted, habitsTotal, microHabits
        case stats, health, screenTime, shadowCount, strongestShadow
        case weekHeatmap, systemMessage, streakShield, theme, config
    }
    
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        updatedAt = try? c.decode(String.self, forKey: .updatedAt)
        hunterName = (try? c.decode(String.self, forKey: .hunterName)) ?? "Hunter"
        level = (try? c.decode(Int.self, forKey: .level)) ?? 1
        xp = (try? c.decode(Int.self, forKey: .xp)) ?? 0
        xpNeeded = (try? c.decode(Int.self, forKey: .xpNeeded)) ?? 100
        rank = (try? c.decode(String.self, forKey: .rank)) ?? "E"
        rankColor = (try? c.decode(String.self, forKey: .rankColor)) ?? "#6b7280"
        title = try? c.decode(String.self, forKey: .title)
        streak = (try? c.decode(Int.self, forKey: .streak)) ?? 0
        gold = (try? c.decode(Int.self, forKey: .gold)) ?? 0
        gems = (try? c.decode(Int.self, forKey: .gems)) ?? 0
        quests = (try? c.decode([WidgetQuest].self, forKey: .quests)) ?? []
        focusQuest = try? c.decode(WidgetFocusQuest.self, forKey: .focusQuest)
        totalOpen = (try? c.decode(Int.self, forKey: .totalOpen)) ?? 0
        completedToday = (try? c.decode(Int.self, forKey: .completedToday)) ?? 0
        nearestDeadline = try? c.decode(WidgetDeadline.self, forKey: .nearestDeadline)
        habits = (try? c.decode([WidgetHabit].self, forKey: .habits)) ?? []
        habitsCompleted = (try? c.decode(Int.self, forKey: .habitsCompleted)) ?? 0
        habitsTotal = (try? c.decode(Int.self, forKey: .habitsTotal)) ?? 0
        microHabits = (try? c.decode([WidgetMicroHabit].self, forKey: .microHabits)) ?? []
        stats = (try? c.decode(WidgetStats.self, forKey: .stats)) ?? WidgetStats()
        health = (try? c.decode(WidgetHealth.self, forKey: .health)) ?? WidgetHealth()
        screenTime = (try? c.decode(WidgetScreenTime.self, forKey: .screenTime)) ?? WidgetScreenTime()
        shadowCount = (try? c.decode(Int.self, forKey: .shadowCount)) ?? 0
        strongestShadow = try? c.decode(WidgetShadow.self, forKey: .strongestShadow)
        weekHeatmap = (try? c.decode([WidgetHeatmapDay].self, forKey: .weekHeatmap)) ?? []
        systemMessage = try? c.decode(String.self, forKey: .systemMessage)
        streakShield = (try? c.decode(WidgetStreakShield.self, forKey: .streakShield)) ?? WidgetStreakShield()
        theme = (try? c.decode(WidgetTheme.self, forKey: .theme)) ?? WidgetTheme()
        config = (try? c.decode(WidgetConfig.self, forKey: .config)) ?? WidgetConfig()
    }
    
    // Direct initializer for placeholder
    init(hunterName: String = "Hunter", level: Int = 1, xp: Int = 0, xpNeeded: Int = 100,
         rank: String = "E", rankColor: String = "#6b7280", title: String? = nil,
         streak: Int = 0, gold: Int = 0, gems: Int = 0, quests: [WidgetQuest] = [],
         focusQuest: WidgetFocusQuest? = nil, totalOpen: Int = 0, completedToday: Int = 0,
         nearestDeadline: WidgetDeadline? = nil, habits: [WidgetHabit] = [],
         habitsCompleted: Int = 0, habitsTotal: Int = 0, microHabits: [WidgetMicroHabit] = [],
         stats: WidgetStats = WidgetStats(), health: WidgetHealth = WidgetHealth(),
         screenTime: WidgetScreenTime = WidgetScreenTime(), shadowCount: Int = 0,
         strongestShadow: WidgetShadow? = nil, weekHeatmap: [WidgetHeatmapDay] = [],
         systemMessage: String? = "Das System wartet auf dich, Hunter...",
         streakShield: WidgetStreakShield = WidgetStreakShield(),
         theme: WidgetTheme = WidgetTheme(), config: WidgetConfig = WidgetConfig()) {
        self.updatedAt = nil
        self.hunterName = hunterName; self.level = level; self.xp = xp; self.xpNeeded = xpNeeded
        self.rank = rank; self.rankColor = rankColor; self.title = title
        self.streak = streak; self.gold = gold; self.gems = gems
        self.quests = quests; self.focusQuest = focusQuest; self.totalOpen = totalOpen
        self.completedToday = completedToday; self.nearestDeadline = nearestDeadline
        self.habits = habits; self.habitsCompleted = habitsCompleted; self.habitsTotal = habitsTotal
        self.microHabits = microHabits; self.stats = stats; self.health = health
        self.screenTime = screenTime; self.shadowCount = shadowCount
        self.strongestShadow = strongestShadow; self.weekHeatmap = weekHeatmap
        self.systemMessage = systemMessage; self.streakShield = streakShield
        self.theme = theme; self.config = config
    }
}

// MARK: - Sub-Models (all with default initializers)

/// A quest stage ("Etappe") — the concrete thing to do, e.g. "20 Liegestütze".
struct WidgetStage: Codable, Identifiable {
    var title: String
    var done: Bool
    var id: String { title }

    enum CodingKeys: String, CodingKey { case title, done }
    init(title: String, done: Bool) { self.title = title; self.done = done }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        title = (try? c.decode(String.self, forKey: .title)) ?? ""
        done = (try? c.decode(Bool.self, forKey: .done)) ?? false
    }
}

struct WidgetFocusQuest: Codable {
    var id: String?
    var title: String
    var questDescription: String?
    var nextStep: String?
    var stages: [WidgetStage]
    var category: String
    var difficulty: String
    var canCompleteFromWidget: Bool

    enum CodingKeys: String, CodingKey {
        case id, title
        case questDescription = "description"
        case nextStep, stages
        case category, difficulty
        case canCompleteFromWidget
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try? c.decode(String.self, forKey: .id)
        title = (try? c.decode(String.self, forKey: .title)) ?? "Quest"
        questDescription = try? c.decode(String.self, forKey: .questDescription)
        nextStep = try? c.decode(String.self, forKey: .nextStep)
        stages = (try? c.decode([WidgetStage].self, forKey: .stages)) ?? []
        category = (try? c.decode(String.self, forKey: .category)) ?? "agi"
        difficulty = (try? c.decode(String.self, forKey: .difficulty)) ?? "normal"
        canCompleteFromWidget = (try? c.decode(Bool.self, forKey: .canCompleteFromWidget)) ?? false
    }
}

struct WidgetQuest: Codable, Identifiable {
    var id: String
    var title: String
    var questDescription: String?
    var nextStep: String?
    var stages: [WidgetStage]
    var category: String
    var difficulty: String
    var type: String
    var priority: String
    var dueDate: String?
    var isSystem: Bool
    var canCompleteFromWidget: Bool

    enum CodingKeys: String, CodingKey {
        case id, title
        case questDescription = "description"
        case nextStep, stages
        case category, difficulty, type, priority, dueDate, isSystem
        case canCompleteFromWidget
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? c.decode(String.self, forKey: .id)) ?? UUID().uuidString
        title = (try? c.decode(String.self, forKey: .title)) ?? "Quest"
        questDescription = try? c.decode(String.self, forKey: .questDescription)
        nextStep = try? c.decode(String.self, forKey: .nextStep)
        stages = (try? c.decode([WidgetStage].self, forKey: .stages)) ?? []
        category = (try? c.decode(String.self, forKey: .category)) ?? "agi"
        difficulty = (try? c.decode(String.self, forKey: .difficulty)) ?? "normal"
        type = (try? c.decode(String.self, forKey: .type)) ?? "side"
        priority = (try? c.decode(String.self, forKey: .priority)) ?? "medium"
        dueDate = try? c.decode(String.self, forKey: .dueDate)
        isSystem = (try? c.decode(Bool.self, forKey: .isSystem)) ?? false
        canCompleteFromWidget = (try? c.decode(Bool.self, forKey: .canCompleteFromWidget)) ?? true
    }

    // Direct initializer for placeholder
    init(id: String = UUID().uuidString, title: String = "Quest",
         questDescription: String? = nil, nextStep: String? = nil, stages: [WidgetStage] = [],
         category: String = "agi",
         difficulty: String = "normal", type: String = "side", priority: String = "medium",
         dueDate: String? = nil, isSystem: Bool = false, canCompleteFromWidget: Bool = true) {
        self.id = id; self.title = title
        self.questDescription = questDescription; self.nextStep = nextStep
        self.stages = stages
        self.category = category
        self.difficulty = difficulty; self.type = type; self.priority = priority
        self.dueDate = dueDate; self.isSystem = isSystem
        self.canCompleteFromWidget = canCompleteFromWidget
    }

    /// Open stages first; preserves order. Used for the collapsed "next step".
    var nextOpenStageTitle: String? {
        if let s = stages.first(where: { !$0.done })?.title, !s.isEmpty { return s }
        if let n = nextStep, !n.isEmpty { return n }
        return nil
    }
    var doneStageCount: Int { stages.filter { $0.done }.count }
}

struct WidgetDeadline: Codable {
    var title: String
    var dueDate: String
    
    enum CodingKeys: String, CodingKey { case title, dueDate }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        title = (try? c.decode(String.self, forKey: .title)) ?? ""
        dueDate = (try? c.decode(String.self, forKey: .dueDate)) ?? ""
    }
}

struct WidgetHabit: Codable {
    var id: String
    var title: String
    var name: String
    var completed: Bool
    var icon: String
    var verification: String
    var category: String
    var linkedQuestId: String?
    var canCompleteFromWidget: Bool

    enum CodingKeys: String, CodingKey {
        case id, title, name, completed, icon, verification, category, linkedQuestId, canCompleteFromWidget
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? c.decode(String.self, forKey: .id)) ?? UUID().uuidString
        title = (try? c.decode(String.self, forKey: .title)) ?? (try? c.decode(String.self, forKey: .name)) ?? "Habit"
        name = (try? c.decode(String.self, forKey: .name)) ?? title
        completed = (try? c.decode(Bool.self, forKey: .completed)) ?? false
        icon = (try? c.decode(String.self, forKey: .icon)) ?? "H"
        verification = (try? c.decode(String.self, forKey: .verification)) ?? "manual"
        category = (try? c.decode(String.self, forKey: .category)) ?? "habit"
        linkedQuestId = try? c.decode(String.self, forKey: .linkedQuestId)
        canCompleteFromWidget = (try? c.decode(Bool.self, forKey: .canCompleteFromWidget)) ?? (verification == "manual" && !completed)
    }
}

struct WidgetMicroHabit: Codable {
    var id: String
    var key: String
    var label: String
    var icon: String
    var current: Int
    var target: Int
    var completed: Bool

    enum CodingKeys: String, CodingKey { case id, key, label, icon, current, target, completed }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? c.decode(String.self, forKey: .id)) ?? (try? c.decode(String.self, forKey: .key)) ?? ""
        key = (try? c.decode(String.self, forKey: .key)) ?? id
        label = (try? c.decode(String.self, forKey: .label)) ?? ""
        icon = (try? c.decode(String.self, forKey: .icon)) ?? String(label.prefix(1))
        current = (try? c.decode(Int.self, forKey: .current)) ?? 0
        target = (try? c.decode(Int.self, forKey: .target)) ?? 5
        completed = (try? c.decode(Bool.self, forKey: .completed)) ?? (current >= target)
    }
}

struct WidgetStats: Codable {
    var str: Int
    var intelligence: Int
    var vit: Int
    var agi: Int
    var cha: Int
    
    enum CodingKeys: String, CodingKey {
        case str
        case intelligence = "int"
        case vit, agi, cha
    }
    
    init(str: Int = 0, intelligence: Int = 0, vit: Int = 0, agi: Int = 0, cha: Int = 0) {
        self.str = str; self.intelligence = intelligence; self.vit = vit; self.agi = agi; self.cha = cha
    }
    
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        str = (try? c.decode(Int.self, forKey: .str)) ?? 0
        intelligence = (try? c.decode(Int.self, forKey: .intelligence)) ?? 0
        vit = (try? c.decode(Int.self, forKey: .vit)) ?? 0
        agi = (try? c.decode(Int.self, forKey: .agi)) ?? 0
        cha = (try? c.decode(Int.self, forKey: .cha)) ?? 0
    }
}

struct WidgetHealth: Codable {
    var steps: Int
    var sleep: Double
    
    init(steps: Int = 0, sleep: Double = 0) { self.steps = steps; self.sleep = sleep }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        steps = (try? c.decode(Int.self, forKey: .steps)) ?? 0
        sleep = (try? c.decode(Double.self, forKey: .sleep)) ?? 0
    }
}

struct WidgetScreenTime: Codable {
    var todayMinutes: Int
    var limitMinutes: Int
    
    init(todayMinutes: Int = 0, limitMinutes: Int = 180) {
        self.todayMinutes = todayMinutes; self.limitMinutes = limitMinutes
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        todayMinutes = (try? c.decode(Int.self, forKey: .todayMinutes)) ?? 0
        limitMinutes = (try? c.decode(Int.self, forKey: .limitMinutes)) ?? 180
    }
}

struct WidgetShadow: Codable {
    var name: String
    var tier: Int
    var level: Int
    
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        name = (try? c.decode(String.self, forKey: .name)) ?? "Shadow"
        tier = (try? c.decode(Int.self, forKey: .tier)) ?? 1
        level = (try? c.decode(Int.self, forKey: .level)) ?? 1
    }
}

struct WidgetHeatmapDay: Codable {
    var date: String
    var day: String
    var count: Int
    
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        date = (try? c.decode(String.self, forKey: .date)) ?? ""
        day = (try? c.decode(String.self, forKey: .day)) ?? ""
        count = (try? c.decode(Int.self, forKey: .count)) ?? 0
    }
}

struct WidgetStreakShield: Codable {
    var active: Bool
    var daysProtected: Int
    
    init(active: Bool = false, daysProtected: Int = 0) {
        self.active = active; self.daysProtected = daysProtected
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        active = (try? c.decode(Bool.self, forKey: .active)) ?? false
        daysProtected = (try? c.decode(Int.self, forKey: .daysProtected)) ?? 0
    }
}

struct WidgetTheme: Codable {
    var primary: String
    var accent: String
    var glow: String
    var bg: String
    
    init(primary: String = "#22d3ee", accent: String = "#67e8f9",
         glow: String = "rgba(34,211,238,0.35)", bg: String = "#06060e") {
        self.primary = primary; self.accent = accent; self.glow = glow; self.bg = bg
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        primary = (try? c.decode(String.self, forKey: .primary)) ?? "#22d3ee"
        accent = (try? c.decode(String.self, forKey: .accent)) ?? "#67e8f9"
        glow = (try? c.decode(String.self, forKey: .glow)) ?? "rgba(34,211,238,0.35)"
        bg = (try? c.decode(String.self, forKey: .bg)) ?? "#06060e"
    }
}

struct WidgetShowSections: Codable {
    var streak: Bool
    var quests: Bool
    var habits: Bool
    var microHabits: Bool
    var stats: Bool
    var heatmap: Bool
    var systemMessage: Bool
    
    init(streak: Bool = true, quests: Bool = true, habits: Bool = true,
         microHabits: Bool = true, stats: Bool = true, heatmap: Bool = true,
         systemMessage: Bool = true) {
        self.streak = streak; self.quests = quests; self.habits = habits
        self.microHabits = microHabits; self.stats = stats
        self.heatmap = heatmap; self.systemMessage = systemMessage
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        streak = (try? c.decode(Bool.self, forKey: .streak)) ?? true
        quests = (try? c.decode(Bool.self, forKey: .quests)) ?? true
        habits = (try? c.decode(Bool.self, forKey: .habits)) ?? true
        microHabits = (try? c.decode(Bool.self, forKey: .microHabits)) ?? true
        stats = (try? c.decode(Bool.self, forKey: .stats)) ?? true
        heatmap = (try? c.decode(Bool.self, forKey: .heatmap)) ?? true
        systemMessage = (try? c.decode(Bool.self, forKey: .systemMessage)) ?? true
    }
}

struct WidgetConfig: Codable {
    var modules: [String]
    var maxQuests: Int
    var rotationEnabled: Bool
    var rotationIntervalMinutes: Int
    var showSections: WidgetShowSections
    
    init(modules: [String] = ["streak_xp", "quests", "habits"], maxQuests: Int = 5,
         rotationEnabled: Bool = false, rotationIntervalMinutes: Int = 5,
         showSections: WidgetShowSections = WidgetShowSections()) {
        self.modules = modules; self.maxQuests = maxQuests
        self.rotationEnabled = rotationEnabled
        self.rotationIntervalMinutes = rotationIntervalMinutes
        self.showSections = showSections
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        modules = (try? c.decode([String].self, forKey: .modules)) ?? ["streak_xp", "quests", "habits"]
        maxQuests = (try? c.decode(Int.self, forKey: .maxQuests)) ?? 5
        rotationEnabled = (try? c.decode(Bool.self, forKey: .rotationEnabled)) ?? false
        rotationIntervalMinutes = (try? c.decode(Int.self, forKey: .rotationIntervalMinutes)) ?? 5
        showSections = (try? c.decode(WidgetShowSections.self, forKey: .showSections)) ?? WidgetShowSections()
    }
}

// MARK: - Data Loading (with error logging)
func loadWidgetData() -> WidgetData? {
    guard let defaults = UserDefaults(suiteName: appGroupId) else {
        print("[SoloToDoWidget] ❌ Cannot open App Group: \(appGroupId)")
        return nil
    }
    
    guard let jsonString = defaults.string(forKey: widgetDataKey) else {
        print("[SoloToDoWidget] ⚠️ No data found for key: \(widgetDataKey)")
        return nil
    }
    
    guard let data = jsonString.data(using: .utf8) else {
        print("[SoloToDoWidget] ❌ Cannot convert JSON string to data")
        return nil
    }
    
    do {
        let decoder = JSONDecoder()
        let result = try decoder.decode(WidgetData.self, from: data)
        print("[SoloToDoWidget] ✅ Decoded: LVL\(result.level), \(result.quests.count) quests, streak \(result.streak)")
        return result
    } catch {
        print("[SoloToDoWidget] ❌ JSON decode error: \(error)")
        // Try to log the raw JSON for debugging
        if let rawStr = String(data: data.prefix(500), encoding: .utf8) {
            print("[SoloToDoWidget] Raw JSON (first 500 chars): \(rawStr)")
        }
        return nil
    }
}

// MARK: - Expanded-quest state
/// The quest the user expanded inline in the widget, or nil for the list view.
func loadExpandedQuestId() -> String? {
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return nil }
    let value = defaults.string(forKey: widgetExpandedKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
    return (value?.isEmpty == false) ? value : nil
}

func setExpandedQuestId(_ id: String?) {
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
    defaults.set(id ?? "", forKey: widgetExpandedKey)
    defaults.synchronize()
}

// MARK: - Placeholder Data
let placeholderData = WidgetData(
    hunterName: "Hunter",
    level: 1,
    quests: [
        WidgetQuest(title: "Öffne die App", category: "agi", difficulty: "normal"),
    ],
    totalOpen: 1,
    systemMessage: "Öffne die App, um deine Daten zu laden..."
)
