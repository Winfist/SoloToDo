import SwiftUI
import WidgetKit

struct LargeWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests

    private var accent: Color { Color(hex: data.theme.primary) }
    private var rankCol: Color { SL.rankColor(data.rank) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    private var items: [WidgetTaskItem] {
        widgetTaskItems(for: data, mode: contentMode, limit: 4)
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
        ZStack {
            PremiumBackground(accent: accent)

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
                .padding(.bottom, 4)

                XPBar(progress: xpPct, accent: accent)

                Divider1().padding(.vertical, 12)

                Kicker(sectionTitle)
                    .padding(.bottom, 2)

                if items.isEmpty {
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
                } else {
                    VStack(spacing: 8) {
                        ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                            PremiumTaskRow(item: item, accent: accent, focus: index == 0)
                        }
                    }
                    .padding(.top, 6)

                    if contentMode == .quests && data.totalOpen > items.count {
                        Text("+\(data.totalOpen - items.count) weitere")
                            .font(SLFont.mono(8.5, .semibold))
                            .foregroundColor(SL.t4)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .padding(.top, 5)
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
            .padding(18)
        }
        .widgetURL(items.first?.deepLink)
    }
}
