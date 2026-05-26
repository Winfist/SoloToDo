import SwiftUI
import WidgetKit

// Large widget: collapsed = full hunter dashboard (identity, quest
// list, stats). Tapping a quest (iOS 17+) expands it into a focused
// stage checklist; tapping the open quest again opens it in the app.
struct LargeWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests
    var expandedQuestId: String? = nil

    private var accent: Color { Color(hex: data.theme.primary) }
    private var rankCol: Color { SL.rankColor(data.rank) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }

    private var expandedQuest: WidgetQuest? {
        guard contentMode == .quests, let id = expandedQuestId else { return nil }
        return data.quests.first { $0.id == id }
    }
    private var quests: [WidgetQuest] { Array(data.quests.prefix(4)) }
    private var items: [WidgetTaskItem] { widgetTaskItems(for: data, mode: contentMode, limit: 4) }

    private var sectionTitle: String {
        switch contentMode {
        case .quests: return "Aktive Quests"
        case .habits: return "Heute Habits"
        case .microHabits: return "Micro-Habits"
        case .mix: return "Next Actions"
        }
    }

    var body: some View {
        ZStack {
            PremiumBackground(accent: accent)

            VStack(alignment: .leading, spacing: 0) {
                identityHeader

                XPBar(progress: xpPct, accent: accent)

                Divider1().padding(.vertical, 12)

                if let quest = expandedQuest {
                    FocusedQuestView(quest: quest, accent: accent, maxStages: 8)
                    Spacer(minLength: 0)
                } else {
                    collapsedBody
                }
            }
            .padding(18)
        }
        .widgetURL(solotodoDeepLink(expandedQuest.map { "solotodo://quest/\($0.id)" } ?? "solotodo://training"))
    }

    // MARK: Identity header
    private var identityHeader: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Kicker("Hunter", color: accent)
                    Text(data.hunterName)
                        .font(SLFont.display(21, .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(data.rank)
                        .font(SLFont.display(26, .bold))
                        .foregroundColor(rankCol)
                    StreakBadge(streak: data.streak, size: 13)
                }
            }

            HStack {
                Kicker("Level \(data.level)")
                Spacer()
                Kicker("\(data.xp) / \(data.xpNeeded) XP")
            }
            .padding(.top, 10)
            .padding(.bottom, 6)
        }
    }

    // MARK: Collapsed body — list + stats
    private var collapsedBody: some View {
        VStack(alignment: .leading, spacing: 0) {
            Kicker(sectionTitle).padding(.bottom, 2)

            if contentMode == .quests {
                if quests.isEmpty { emptyState } else {
                    VStack(spacing: 9) {
                        ForEach(Array(quests.enumerated()), id: \.element.id) { index, quest in
                            QuestTapArea(
                                questId: quest.id,
                                expandable: !quest.stages.isEmpty,
                                deepLink: solotodoDeepLink("solotodo://quest/\(quest.id)")
                            ) {
                                QuestCollapsedRow(quest: quest, accent: accent, focus: index == 0)
                            }
                        }
                    }
                    .padding(.top, 6)

                    if data.totalOpen > quests.count {
                        Text("+\(data.totalOpen - quests.count) weitere")
                            .font(SLFont.mono(8.5, .semibold))
                            .foregroundColor(SL.t4)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .padding(.top, 5)
                    }
                }
            } else {
                if items.isEmpty { emptyState } else {
                    VStack(spacing: 9) {
                        ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                            TaskDeepLinkRow(item: item, accent: accent, focus: index == 0)
                        }
                    }
                    .padding(.top, 6)
                }
            }

            Spacer(minLength: 0)

            Divider1().padding(.vertical, 12)

            HStack(spacing: 7) {
                StatCell(label: "STR", value: data.stats.str)
                StatCell(label: "INT", value: data.stats.intelligence)
                StatCell(label: "VIT", value: data.stats.vit)
                StatCell(label: "AGI", value: data.stats.agi)
                StatCell(label: "CHA", value: data.stats.cha)
            }
        }
    }

    private var emptyState: some View {
        VStack {
            Spacer(minLength: 8)
            HStack {
                Spacer()
                VStack(spacing: 5) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 20))
                        .foregroundColor(SL.ok)
                    Text("Alles erledigt")
                        .font(SLFont.ui(11, .medium))
                        .foregroundColor(SL.t3)
                }
                Spacer()
            }
            Spacer(minLength: 8)
        }
    }
}
