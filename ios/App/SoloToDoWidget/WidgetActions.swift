import AppIntents
import Foundation
import WidgetKit

enum WidgetContentMode: String {
    case quests
    case habits
    case microHabits
    case mix
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
struct SoloToDoWidgetConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "SoloToDo"
    static var description = IntentDescription("Choose what this widget shows.")

    @Parameter(title: "Mode", default: WidgetContentModeIntent.quests)
    var mode: WidgetContentModeIntent
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
    var actionType: String
    var targetId: String
    var canComplete: Bool
    var deepLink: URL?
}

func solotodoDeepLink(_ value: String) -> URL? {
    URL(string: value)
}

func widgetTaskItems(for data: WidgetData, mode: WidgetContentMode, limit: Int) -> [WidgetTaskItem] {
    func questItems(_ quests: [WidgetQuest]) -> [WidgetTaskItem] {
        quests.map { quest in
            let subtitle = (quest.nextStep?.isEmpty == false ? quest.nextStep : quest.questDescription)
            return WidgetTaskItem(
                id: "quest-\(quest.id)",
                title: quest.title,
                subtitle: subtitle,
                meta: quest.category.uppercased(),
                actionType: "completeQuest",
                targetId: quest.id,
                canComplete: quest.canCompleteFromWidget,
                deepLink: solotodoDeepLink("solotodo://quest/\(quest.id)")
            )
        }
    }

    func habitItems(_ habits: [WidgetHabit]) -> [WidgetTaskItem] {
        habits.filter { !$0.completed }.map { habit in
            WidgetTaskItem(
                id: "habit-\(habit.id)",
                title: habit.name,
                subtitle: habit.verification == "manual" ? "Manual Habit" : "\(habit.verification.capitalized) - in App oeffnen",
                meta: "HABIT",
                actionType: "completeHabit",
                targetId: habit.id,
                canComplete: habit.canCompleteFromWidget,
                deepLink: solotodoDeepLink("solotodo://training?type=habit&id=\(habit.id)")
            )
        }
    }

    func microItems(_ habits: [WidgetMicroHabit]) -> [WidgetTaskItem] {
        habits.filter { !$0.completed }.map { habit in
            WidgetTaskItem(
                id: "micro-\(habit.id)",
                title: habit.label,
                subtitle: "\(habit.current)/\(habit.target)",
                meta: "MICRO",
                actionType: "incrementMicroHabit",
                targetId: habit.id,
                canComplete: !habit.completed,
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
        let priorityQuests = Array(questItems(data.quests).prefix(2))
        items = priorityQuests + habitItems(data.habits).filter { $0.canComplete } + microItems(data.microHabits)
    }
    return Array(items.prefix(limit))
}
