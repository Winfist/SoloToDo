import SwiftUI
import WidgetKit

// Medium widget: collapsed = identity + a short quest list. Tapping a
// quest (iOS 17+) reveals its stages inline; tapping the open quest
// again opens it in the app. Nothing is ever completed here.
struct MediumWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests
    var expandedQuestId: String? = nil

    private var accent: Color { Color(hex: data.theme.primary) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }

    private var expandedQuest: WidgetQuest? {
        guard contentMode == .quests, let id = expandedQuestId else { return nil }
        return data.quests.first { $0.id == id }
    }
    private var quests: [WidgetQuest] { Array(data.quests.prefix(2)) }
    private var items: [WidgetTaskItem] { widgetTaskItems(for: data, mode: contentMode, limit: 2) }

    private var label: String {
        switch contentMode {
        case .quests: return "Quest Board"
        case .habits: return "Habit Board"
        case .microHabits: return "Micro Board"
        case .mix: return "Next Actions"
        }
    }

    var body: some View {
        ZStack {
            PremiumBackground(accent: accent)

            if let quest = expandedQuest {
                expandedLayout(quest)
            } else {
                listLayout
            }
        }
        .widgetURL(solotodoDeepLink(expandedQuest.map { "solotodo://quest/\($0.id)" } ?? "solotodo://training"))
    }

    // MARK: Expanded — one quest, its stages
    private func expandedLayout(_ quest: WidgetQuest) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 8) {
                Text(data.hunterName)
                    .font(SLFont.display(13, .bold))
                    .foregroundColor(SL.t2)
                    .lineLimit(1)
                MetaChip(text: "\(data.rank) · LV \(data.level)", accent: accent)
                Spacer(minLength: 4)
                StreakBadge(streak: data.streak, size: 12)
            }
            Divider1()
            FocusedQuestView(quest: quest, accent: accent, maxStages: 3, titleLineLimit: 1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 15)
    }

    // MARK: Collapsed — identity + short list
    private var listLayout: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(data.hunterName)
                    .font(SLFont.display(17, .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                MetaChip(text: "\(data.rank) · LV \(data.level)", accent: accent)
                Spacer(minLength: 6)
                StreakBadge(streak: data.streak, size: 13)
            }

            XPBar(progress: xpPct, accent: accent)
                .padding(.top, 9)

            Spacer(minLength: 8)
            Kicker(label)
                .padding(.bottom, 4)

            if contentMode == .quests {
                if quests.isEmpty { emptyState } else {
                    VStack(spacing: 0) {
                        ForEach(Array(quests.enumerated()), id: \.element.id) { index, quest in
                            QuestTapArea(
                                questId: quest.id,
                                expandable: !quest.stages.isEmpty,
                                deepLink: solotodoDeepLink("solotodo://quest/\(quest.id)")
                            ) {
                                QuestCollapsedRow(quest: quest, accent: accent, focus: index == 0)
                            }
                            .padding(.vertical, 5)
                            if index < quests.count - 1 { Divider1() }
                        }
                    }
                }
            } else {
                if items.isEmpty { emptyState } else {
                    VStack(spacing: 0) {
                        ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                            TaskDeepLinkRow(item: item, accent: accent, focus: index == 0)
                                .padding(.vertical, 5)
                            if index < items.count - 1 { Divider1() }
                        }
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
    }

    private var emptyState: some View {
        VStack {
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
            Spacer()
        }
    }
}
