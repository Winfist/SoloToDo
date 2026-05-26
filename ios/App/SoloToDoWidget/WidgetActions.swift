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

@available(iOSApplicationExtension 17.0, *)
struct QueueWidgetActionIntent: AppIntent {
    static var title: LocalizedStringResource = "Update SoloToDo"
    static var description = IntentDescription("Queues a SoloToDo widget action for the app.")
    static var openAppWhenRun = false

    @Parameter(title: "Action Type")
    var actionType: String

    @Parameter(title: "Target ID")
    var targetId: String

    init() {}

    init(actionType: String, targetId: String) {
        self.actionType = actionType
        self.targetId = targetId
    }

    func perform() async throws -> some IntentResult {
        appendWidgetAction(type: actionType, targetId: targetId)
        applyOptimisticWidgetAction(type: actionType, targetId: targetId)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct WidgetQueuedAction: Codable {
    var actionId: String
    var type: String
    var targetId: String
    var createdAt: Int64
    var source: String
}

func appendWidgetAction(type: String, targetId: String) {
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
    let existing = defaults.string(forKey: widgetActionQueueKey) ?? "[]"
    let decoder = JSONDecoder()
    let current = (try? decoder.decode([WidgetQueuedAction].self, from: Data(existing.utf8))) ?? []
    let action = WidgetQueuedAction(
        actionId: UUID().uuidString,
        type: type,
        targetId: targetId,
        createdAt: Int64(Date().timeIntervalSince1970 * 1000),
        source: "widget"
    )
    let next = Array((current + [action]).suffix(50))
    if let data = try? JSONEncoder().encode(next),
       let json = String(data: data, encoding: .utf8) {
        defaults.set(json, forKey: widgetActionQueueKey)
        defaults.synchronize()
    }
}

func applyOptimisticWidgetAction(type: String, targetId: String) {
    guard let defaults = UserDefaults(suiteName: appGroupId),
          var widgetData = loadWidgetData() else { return }

    switch type {
    case "completeQuest":
        widgetData.quests.removeAll { $0.id == targetId }
        if widgetData.focusQuest?.id == targetId {
            widgetData.focusQuest = widgetData.quests.first.map {
                WidgetFocusQuest(
                    id: $0.id,
                    title: $0.title,
                    questDescription: $0.questDescription,
                    nextStep: $0.nextStep,
                    category: $0.category,
                    difficulty: $0.difficulty,
                    canCompleteFromWidget: $0.canCompleteFromWidget
                )
            }
        }
        widgetData.totalOpen = max(0, widgetData.totalOpen - 1)

    case "completeHabit":
        widgetData.habits = widgetData.habits.map { habit in
            guard habit.id == targetId else { return habit }
            var next = habit
            next.completed = true
            next.canCompleteFromWidget = false
            return next
        }
        widgetData.habitsCompleted = min(widgetData.habitsTotal, widgetData.habitsCompleted + 1)

    case "incrementMicroHabit":
        widgetData.microHabits = widgetData.microHabits.map { habit in
            guard habit.id == targetId || habit.key == targetId else { return habit }
            var next = habit
            next.current = min(next.target, next.current + 1)
            next.completed = next.current >= next.target
            return next
        }

    default:
        break
    }

    if let encoded = try? JSONEncoder().encode(widgetData),
       let json = String(data: encoded, encoding: .utf8) {
        defaults.set(json, forKey: widgetDataKey)
        defaults.synchronize()
    }
}

extension WidgetFocusQuest {
    init(id: String?, title: String, questDescription: String?, nextStep: String?, category: String, difficulty: String, canCompleteFromWidget: Bool) {
        self.id = id
        self.title = title
        self.questDescription = questDescription
        self.nextStep = nextStep
        self.category = category
        self.difficulty = difficulty
        self.canCompleteFromWidget = canCompleteFromWidget
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
