import SwiftUI
import WidgetKit

// Medium widget: compact hunter chrome + a two-item page for the selected mode.
// Quests can expand inline; habits, micro-habits, and mix deep-link into the app.
struct MediumWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests
    var backgroundStyle: WidgetBackgroundStyle = .auto
    var expandedQuestId: String? = nil
    var pageIndex: Int = 0

    private var pageSize: Int { contentMode == .microHabits ? 4 : 2 }
    private var accent: Color { Color(hex: data.theme.primary) }
    private var expandedQuest: WidgetQuest? {
        guard contentMode == .quests, let id = expandedQuestId else { return nil }
        return data.quests.first { $0.id == id }
    }
    private var allItems: [WidgetTaskItem] { allWidgetTaskItems(for: data, mode: contentMode) }
    private var pagedQuests: [WidgetQuest] { widgetPageSlice(data.quests, pageIndex: pageIndex, pageSize: pageSize) }
    private var pagedItems: [WidgetTaskItem] { widgetPageSlice(allItems, pageIndex: pageIndex, pageSize: pageSize) }
    private var pagedMicroHabits: [WidgetMicroHabit] { widgetPageSlice(data.microHabits, pageIndex: pageIndex, pageSize: pageSize) }
    private var totalItems: Int {
        switch contentMode {
        case .quests: return data.quests.count
        case .microHabits: return data.microHabits.count
        case .habits, .mix: return allItems.count
        }
    }

    private var sectionTitle: String {
        switch contentMode {
        case .quests: return "Quest Board"
        case .habits: return "Habit Board"
        case .microHabits: return "Micro Board"
        case .mix: return "Next Actions"
        }
    }

    var body: some View {
        WidgetChrome(data: data, accent: accent, size: .medium, backgroundStyle: backgroundStyle) {
            if let quest = expandedQuest {
                FocusedQuestView(
                    quest: quest,
                    accent: accent,
                    maxStages: 2,
                    titleLineLimit: 1,
                    stageLineLimit: 1,
                    compact: true
                )
            } else {
                collapsedContent
            }
        }
        .widgetURL(solotodoDeepLink(expandedQuest.map { "solotodo://quest/\($0.id)" } ?? "solotodo://training"))
    }

    private var collapsedContent: some View {
        VStack(alignment: .leading, spacing: 5) {
            WidgetListHeader(
                title: sectionTitle,
                mode: contentMode,
                totalItems: totalItems,
                pageIndex: pageIndex,
                pageSize: pageSize,
                accent: accent
            )

            if contentMode == .quests {
                if pagedQuests.isEmpty {
                    emptyState
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(pagedQuests.enumerated()), id: \.element.id) { index, quest in
                            QuestTapArea(
                                questId: quest.id,
                                expandable: !quest.stages.isEmpty,
                                deepLink: solotodoDeepLink("solotodo://quest/\(quest.id)")
                            ) {
                                QuestCollapsedRow(quest: quest, accent: accent, focus: index == 0, compact: true)
                            }
                            .padding(.vertical, 2)
                            if index < pagedQuests.count - 1 { Divider1() }
                        }
                    }
                }
            } else if contentMode == .microHabits {
                if pagedMicroHabits.isEmpty {
                    emptyState
                } else {
                    MicroHabitRingStrip(habits: pagedMicroHabits, accent: accent, size: .medium)
                        .padding(.top, 4)
                }
            } else {
                if pagedItems.isEmpty {
                    emptyState
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(pagedItems.enumerated()), id: \.element.id) { index, item in
                            TaskListRow(item: item, accent: accent, focus: index == 0)
                                .padding(.vertical, 4)
                            if index < pagedItems.count - 1 { Divider1() }
                        }
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        HStack {
            Spacer()
            VStack(spacing: 5) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 17))
                    .foregroundColor(SL.ok)
                Text("Alles erledigt")
                    .font(SLFont.ui(11, .medium))
                    .foregroundColor(SL.t3)
            }
            Spacer()
        }
        .padding(.top, 14)
    }
}
