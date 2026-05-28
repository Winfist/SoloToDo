import AppIntents
import Foundation
import WidgetKit

enum WidgetContentMode: String {
    case quests
    case habits
    case microHabits
    case mix
}

enum WidgetBackgroundStyle: String {
    case auto
    case dark
    case transparent
}

@available(iOSApplicationExtension 17.0, *)
enum WidgetContentModeIntent: String, AppEnum {
    case quests
    case habits
    case microHabits
    case mix

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Widget Mode")
    static var caseDisplayRepresentations: [WidgetContentModeIntent: DisplayRepresentation] = [
        .quests: "Quests",
        .habits: "Habits",
        .microHabits: "Micro-Habits",
        .mix: "Mix",
    ]

    var contentMode: WidgetContentMode {
        switch self {
        case .quests: return .quests
        case .habits: return .habits
        case .microHabits: return .microHabits
        case .mix: return .mix
        }
    }
}

@available(iOSApplicationExtension 17.0, *)
enum WidgetBackgroundStyleIntent: String, AppEnum {
    case auto
    case dark
    case transparent

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Hintergrund")
    static var caseDisplayRepresentations: [WidgetBackgroundStyleIntent: DisplayRepresentation] = [
        .auto: "Automatisch",
        .dark: "Dunkel",
        .transparent: "Transparent",
    ]

    var style: WidgetBackgroundStyle {
        switch self {
        case .auto: return .auto
        case .dark: return .dark
        case .transparent: return .transparent
        }
    }
}

@available(iOSApplicationExtension 17.0, *)
struct SoloToDoWidgetConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "SoloToDo"
    static var description = IntentDescription("Choose what this widget shows.")

    @Parameter(title: "Mode", default: WidgetContentModeIntent.quests)
    var mode: WidgetContentModeIntent

    @Parameter(title: "Hintergrund", default: WidgetBackgroundStyleIntent.auto)
    var background: WidgetBackgroundStyleIntent
}

/// Expands / collapses a quest's stage list inline in the widget. Tapping a
/// collapsed quest reveals its stages here; tapping the open one again clears
/// it. Never completes anything — completion only happens in the app.
@available(iOSApplicationExtension 17.0, *)
struct ToggleQuestExpandIntent: AppIntent {
    static var title: LocalizedStringResource = "Quest-Etappen anzeigen"
    static var description = IntentDescription("Zeigt die Etappen einer Quest im Widget.")
    static var openAppWhenRun = false

    @Parameter(title: "Quest ID")
    var questId: String

    init() {}
    init(questId: String) { self.questId = questId }

    func perform() async throws -> some IntentResult {
        let current = loadExpandedQuestId()
        setExpandedQuestId(current == questId ? nil : questId)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct WidgetTaskItem: Identifiable {
    var id: String
    var title: String
    var subtitle: String?
    var meta: String
    var progressText: String? = nil
    var iconName: String? = nil
    var deepLink: URL?
}

func solotodoDeepLink(_ value: String) -> URL? {
    URL(string: value)
}

func widgetPageCount(totalItems: Int, pageSize: Int) -> Int {
    guard totalItems > 0, pageSize > 0 else { return 1 }
    return Int(ceil(Double(totalItems) / Double(pageSize)))
}

func normalizedWidgetPageIndex(_ pageIndex: Int, totalItems: Int, pageSize: Int) -> Int {
    let pages = widgetPageCount(totalItems: totalItems, pageSize: pageSize)
    guard pages > 0 else { return 0 }
    return ((pageIndex % pages) + pages) % pages
}

func widgetPageSlice<T>(_ values: [T], pageIndex: Int, pageSize: Int) -> [T] {
    guard pageSize > 0, !values.isEmpty else { return [] }
    let page = normalizedWidgetPageIndex(pageIndex, totalItems: values.count, pageSize: pageSize)
    let start = min(page * pageSize, values.count)
    let end = min(start + pageSize, values.count)
    return Array(values[start..<end])
}

func widgetHabitIconName(_ habit: WidgetHabit) -> String {
    let verification = habit.verification.lowercased()
    if ["manual", "timer", "counter"].contains(verification) {
        return "habit_\(verification)"
    }

    switch habit.category.lowercased() {
    case "fitness": return "habit_fitness"
    case "health": return "habit_health"
    case "mindfulness": return "habit_mindfulness"
    default: return "habit_manual"
    }
}

func interleavedWidgetTaskItems(_ groups: [[WidgetTaskItem]]) -> [WidgetTaskItem] {
    let maxCount = groups.map(\.count).max() ?? 0
    guard maxCount > 0 else { return [] }

    var result: [WidgetTaskItem] = []
    for index in 0..<maxCount {
        for group in groups where index < group.count {
            result.append(group[index])
        }
    }
    return result
}

@available(iOSApplicationExtension 17.0, *)
struct AdvanceWidgetPageIntent: AppIntent {
    static var title: LocalizedStringResource = "Naechste Widget-Seite"
    static var description = IntentDescription("Blaettert im aktuellen Widget-Modus zur naechsten Seite.")
    static var openAppWhenRun = false

    @Parameter(title: "Mode")
    var mode: WidgetContentModeIntent

    init() {}
    init(mode: WidgetContentModeIntent) { self.mode = mode }

    func perform() async throws -> some IntentResult {
        let contentMode = mode.contentMode
        setWidgetPageIndex(for: contentMode, index: loadWidgetPageIndex(for: contentMode) + 1)
        setExpandedQuestId(nil)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

func allWidgetTaskItems(for data: WidgetData, mode: WidgetContentMode) -> [WidgetTaskItem] {
    func questItems(_ quests: [WidgetQuest]) -> [WidgetTaskItem] {
        quests.map { quest in
            let subtitle = (quest.nextOpenStageTitle?.isEmpty == false ? quest.nextOpenStageTitle : quest.questDescription)
            return WidgetTaskItem(
                id: "quest-\(quest.id)",
                title: quest.title,
                subtitle: subtitle,
                meta: quest.category.uppercased(),
                progressText: quest.stages.isEmpty ? nil : "\(quest.doneStageCount)/\(quest.stages.count)",
                iconName: widgetQuestIconName(quest),
                deepLink: solotodoDeepLink("solotodo://quest/\(quest.id)")
            )
        }
    }

    func habitItems(_ habits: [WidgetHabit]) -> [WidgetTaskItem] {
        habits.filter { !$0.completed }.map { habit in
            WidgetTaskItem(
                id: "habit-\(habit.id)",
                title: habit.name,
                subtitle: habit.verification == "manual" ? "Heute offen" : "\(habit.verification.capitalized) - in App oeffnen",
                meta: "HABIT",
                iconName: widgetHabitIconName(habit),
                deepLink: solotodoDeepLink("solotodo://training?type=habit&id=\(habit.id)")
            )
        }
    }

    func microItems(_ habits: [WidgetMicroHabit]) -> [WidgetTaskItem] {
        habits.filter { !$0.completed }.map { habit in
            WidgetTaskItem(
                id: "micro-\(habit.id)",
                title: habit.label,
                subtitle: "Fortschritt",
                meta: "MICRO",
                progressText: "\(habit.current)/\(habit.target)",
                iconName: widgetMicroIconName(habit),
                deepLink: solotodoDeepLink("solotodo://training?type=microHabit&id=\(habit.id)")
            )
        }
    }

    let items: [WidgetTaskItem]
    switch mode {
    case .quests:
        items = questItems(data.quests)
    case .habits:
        items = habitItems(data.habits)
    case .microHabits:
        items = microItems(data.microHabits)
    case .mix:
        items = interleavedWidgetTaskItems([
            questItems(data.quests),
            habitItems(data.habits),
            microItems(data.microHabits),
        ])
    }
    return items
}

func widgetTaskItems(for data: WidgetData, mode: WidgetContentMode, limit: Int) -> [WidgetTaskItem] {
    let items = allWidgetTaskItems(for: data, mode: mode)
    return Array(items.prefix(limit))
}
