import SwiftUI
import WidgetKit

// Large widget: compact hunter chrome, four-item pages, and a safe stat footer.
// Expanded quest detail hides the footer so stages never run into the widget edge.
struct LargeWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests
    var backgroundStyle: WidgetBackgroundStyle = .auto
    var expandedQuestId: String? = nil
    var pageIndex: Int = 0

    // Quests-only mode is dense (no stats footer), so it fits more per page.
    private var pageSize: Int {
        switch contentMode {
        case .quests: return 6
        case .microHabits: return 5
        case .habits, .mix: return 4
        }
    }
    private var accent: Color { Color(hex: data.theme.primary) }
    private var expandedQuest: WidgetQuest? {
        guard contentMode == .quests, let id = expandedQuestId else { return nil }
        return data.quests.first { $0.id == id }
    }
    private var allItems: [WidgetTaskItem] { allWidgetTaskItems(for: data, mode: contentMode) }
    private var pagedQuests: [WidgetQuest] { widgetPageSlice(data.quests, pageIndex: pageIndex, pageSize: pageSize) }
    private var pagedItems: [WidgetTaskItem] { widgetPageSlice(allItems, pageIndex: pageIndex, pageSize: pageSize) }
    private var pagedMicroHabits: [WidgetMicroHabit] { widgetPageSlice(data.microHabits, pageIndex: pageIndex, pageSize: pageSize) }
    private var pagedMixQuests: [WidgetQuest] { widgetPageSlice(data.quests, pageIndex: pageIndex, pageSize: 3) }
    private var totalPages: Int { widgetPageCount(totalItems: totalItems, pageSize: pageSize) }
    private var currentPage: Int { normalizedWidgetPageIndex(pageIndex, totalItems: totalItems, pageSize: pageSize) + 1 }
    private var totalItems: Int {
        switch contentMode {
        case .quests: return data.quests.count
        case .microHabits: return data.microHabits.count
        case .habits, .mix: return allItems.count
        }
    }

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
                WidgetChrome(data: data, accent: accent, size: .large, backgroundStyle: backgroundStyle) {
                    FocusedQuestView(
                        quest: quest,
                        accent: accent,
                        maxStages: 4,
                        titleLineLimit: 1,
                        stageLineLimit: 2
                    )
                }
            } else if contentMode == .quests {
                // Maximize quests: no stats footer, more rows per page.
                // A slim steps bar still surfaces when Health has data.
                if data.health.steps > 0 {
                    WidgetChrome(data: data, accent: accent, size: .large, backgroundStyle: backgroundStyle) {
                        collapsedContent
                    } footer: {
                        VStack(spacing: 6) {
                            Divider1()
                            StepsBar(steps: data.health.steps, accent: accent)
                        }
                    }
                } else {
                    WidgetChrome(data: data, accent: accent, size: .large, backgroundStyle: backgroundStyle) {
                        collapsedContent
                    }
                }
            } else if contentMode == .mix {
                WidgetChrome(data: data, accent: accent, size: .large, backgroundStyle: backgroundStyle) {
                    mixDashboardContent
                } footer: {
                    CompactStatsFooter(data: data)
                }
            } else {
                WidgetChrome(data: data, accent: accent, size: .large, backgroundStyle: backgroundStyle) {
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
                                QuestCollapsedRow(quest: quest, accent: accent, focus: index == 0, showDifficultyLabel: true, showOwnMarker: !quest.isSystem)
                            }
                            .padding(.vertical, 2.5)
                            if index < pagedQuests.count - 1 { Divider1() }
                        }
                    }

                    if totalItems > pageSize {
                        largeQuestPagerFooter
                    }
                }
            } else if contentMode == .microHabits {
                if pagedMicroHabits.isEmpty {
                    emptyState
                } else {
                    MicroHabitRingStrip(habits: pagedMicroHabits, accent: accent, size: .large)
                        .padding(.top, 8)
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

    private var largeQuestPagerFooter: some View {
        HStack(spacing: 7) {
            Spacer()
            Text("SEITE \(currentPage)/\(totalPages) · TIPPE")
                .font(SLFont.mono(8.5, .semibold))
                .foregroundColor(SL.t3)
            PageButton(mode: .quests, accent: accent)
        }
        .padding(.top, 5)
    }

    private var mixDashboardContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            WidgetListHeader(
                title: "Next Quests",
                mode: .mix,
                totalItems: data.quests.count,
                pageIndex: pageIndex,
                pageSize: 3,
                accent: accent
            )

            VStack(spacing: 0) {
                ForEach(Array(pagedMixQuests.enumerated()), id: \.element.id) { index, quest in
                    QuestTapArea(
                        questId: quest.id,
                        expandable: !quest.stages.isEmpty,
                        deepLink: solotodoDeepLink("solotodo://quest/\(quest.id)")
                    ) {
                        QuestCollapsedRow(quest: quest, accent: accent, focus: index == 0, compact: true, showDifficultyLabel: false)
                    }
                    .padding(.vertical, 2)
                    if index < pagedMixQuests.count - 1 { Divider1() }
                }
            }

            if !data.microHabits.isEmpty {
                Divider1()
                MicroHabitRingStrip(habits: Array(data.microHabits.prefix(5)), accent: accent, size: .compactLarge)
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
