import SwiftUI
import WidgetKit

// Large widget: compact hunter chrome, four-item pages, and a safe stat footer.
// Expanded quest detail hides the footer so stages never run into the widget edge.
struct LargeWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests
    var expandedQuestId: String? = nil
    var pageIndex: Int = 0

    private let pageSize = 4
    private var accent: Color { Color(hex: data.theme.primary) }
    private var expandedQuest: WidgetQuest? {
        guard contentMode == .quests, let id = expandedQuestId else { return nil }
        return data.quests.first { $0.id == id }
    }
    private var allItems: [WidgetTaskItem] { allWidgetTaskItems(for: data, mode: contentMode) }
    private var pagedQuests: [WidgetQuest] { widgetPageSlice(data.quests, pageIndex: pageIndex, pageSize: pageSize) }
    private var pagedItems: [WidgetTaskItem] { widgetPageSlice(allItems, pageIndex: pageIndex, pageSize: pageSize) }
    private var totalItems: Int { contentMode == .quests ? data.quests.count : allItems.count }

    private var sectionTitle: String {
        switch contentMode {
        case .quests: return "Aktive Quests"
        case .habits: return "Heute Habits"
        case .microHabits: return "Micro-Habits"
        case .mix: return "Next Actions"
        }
    }

    var body: some View {
        Group {
            if let quest = expandedQuest {
                WidgetChrome(data: data, accent: accent, size: .large) {
                    FocusedQuestView(
                        quest: quest,
                        accent: accent,
                        maxStages: 4,
                        titleLineLimit: 1,
                        stageLineLimit: 2
                    )
                }
            } else {
                WidgetChrome(data: data, accent: accent, size: .large) {
                    collapsedContent
                } footer: {
                    CompactStatsFooter(data: data)
                }
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
                                QuestCollapsedRow(quest: quest, accent: accent, focus: index == 0)
                            }
                            .padding(.vertical, 4)
                            if index < pagedQuests.count - 1 { Divider1() }
                        }
                    }
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
                    .font(.system(size: 18))
                    .foregroundColor(SL.ok)
                Text("Alles erledigt")
                    .font(SLFont.ui(11, .medium))
                    .foregroundColor(SL.t3)
            }
            Spacer()
        }
        .padding(.top, 28)
    }
}
