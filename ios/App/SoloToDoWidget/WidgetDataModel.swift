// ─── WIDGET DATA MODEL ───────────────────────────────────────
// Decodes the JSON payload written by widgetDataService.js
// via capacitor-widget-bridge into the shared App Group container.

import Foundation
import WidgetKit

// MARK: - App Group Constants
let appGroupId = "group.com.solotodo.app"
let widgetDataKey = "widgetData"

// MARK: - Root Widget Data
struct WidgetData: Codable {
    let updatedAt: String?
    
    // Hunter Info
    let hunterName: String
    let level: Int
    let xp: Int
    let xpNeeded: Int
    let rank: String
    let rankColor: String
    let title: String?
    let streak: Int
    let gold: Int
    let gems: Int
    
    // Quest Data
    let quests: [WidgetQuest]
    let focusQuest: WidgetQuest?
    let totalOpen: Int
    let completedToday: Int
    let nearestDeadline: WidgetDeadline?
    
    // Habits
    let habits: [WidgetHabit]
    let habitsCompleted: Int
    let habitsTotal: Int
    
    // Micro-Habits
    let microHabits: [WidgetMicroHabit]
    
    // Stats
    let stats: WidgetStats
    
    // Health & Screen Time
    let health: WidgetHealth
    let screenTime: WidgetScreenTime
    
    // Shadow Army
    let shadowCount: Int
    let strongestShadow: WidgetShadow?
    
    // Heatmap
    let weekHeatmap: [WidgetHeatmapDay]
    
    // System Message
    let systemMessage: String?
    
    // Streak Shield
    let streakShield: WidgetStreakShield
    
    // Theme
    let theme: WidgetTheme
    
    // Config
    let config: WidgetConfig
}

// MARK: - Sub-Models
struct WidgetQuest: Codable, Identifiable {
    let id: String
    let title: String
    let category: String
    let difficulty: String
    let type: String
    let priority: String
    let dueDate: String?
    let isSystem: Bool
    
    var difficultyColor: String {
        switch difficulty {
        case "boss": return "#ef4444"
        case "hard": return "#a78bfa"
        case "normal": return "#22d3ee"
        default: return "#6b7280"
        }
    }
    
    var categoryLabel: String {
        category.uppercased()
    }
}

struct WidgetDeadline: Codable {
    let title: String
    let dueDate: String
}

struct WidgetHabit: Codable {
    let name: String
    let completed: Bool
    let icon: String
}

struct WidgetMicroHabit: Codable {
    let key: String
    let label: String
    let icon: String
    let current: Int
    let target: Int
}

struct WidgetStats: Codable {
    let str: Int
    let int: Int
    let vit: Int
    let agi: Int
    let cha: Int
}

struct WidgetHealth: Codable {
    let steps: Int
    let sleep: Double
}

struct WidgetScreenTime: Codable {
    let todayMinutes: Int
    let limitMinutes: Int
}

struct WidgetShadow: Codable {
    let name: String
    let tier: Int
    let level: Int
}

struct WidgetHeatmapDay: Codable {
    let date: String
    let day: String
    let count: Int
}

struct WidgetStreakShield: Codable {
    let active: Bool
    let daysProtected: Int
}

struct WidgetTheme: Codable {
    let primary: String
    let accent: String
    let glow: String
    let bg: String
}

struct WidgetConfig: Codable {
    let modules: [String]
    let maxQuests: Int
}

// MARK: - Data Loading
func loadWidgetData() -> WidgetData? {
    guard let defaults = UserDefaults(suiteName: appGroupId),
          let jsonString = defaults.string(forKey: widgetDataKey),
          let data = jsonString.data(using: .utf8) else {
        return nil
    }
    
    let decoder = JSONDecoder()
    return try? decoder.decode(WidgetData.self, from: data)
}

// MARK: - Placeholder Data
let placeholderData = WidgetData(
    updatedAt: nil,
    hunterName: "Hunter",
    level: 1,
    xp: 0,
    xpNeeded: 100,
    rank: "E",
    rankColor: "#6b7280",
    title: nil,
    streak: 0,
    gold: 0,
    gems: 0,
    quests: [],
    focusQuest: nil,
    totalOpen: 0,
    completedToday: 0,
    nearestDeadline: nil,
    habits: [],
    habitsCompleted: 0,
    habitsTotal: 0,
    microHabits: [],
    stats: WidgetStats(str: 0, int: 0, vit: 0, agi: 0, cha: 0),
    health: WidgetHealth(steps: 0, sleep: 0),
    screenTime: WidgetScreenTime(todayMinutes: 0, limitMinutes: 180),
    shadowCount: 0,
    strongestShadow: nil,
    weekHeatmap: [],
    systemMessage: "Das System wartet auf dich, Hunter...",
    streakShield: WidgetStreakShield(active: false, daysProtected: 0),
    theme: WidgetTheme(primary: "#22d3ee", accent: "#67e8f9", glow: "rgba(34,211,238,0.35)", bg: "#06060e"),
    config: WidgetConfig(modules: ["streak_xp", "quests", "habits"], maxQuests: 3)
)
