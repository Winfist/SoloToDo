import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests

    private var accent: Color { Color(hex: data.theme.primary) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    private var primaryItem: WidgetTaskItem? {
        widgetTaskItems(for: data, mode: contentMode, limit: 1).first
    }
    private var kicker: String {
        switch contentMode {
        case .quests: return "Fokus"
        case .habits: return "Habit"
        case .microHabits: return "Micro"
        case .mix: return "Next"
        }
    }

    var body: some View {
        ZStack {
            PremiumBackground(accent: accent)

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Kicker(kicker, color: accent)
                    Spacer()
                    MetaChip(text: "\(data.rank) · LV \(data.level)", accent: accent)
                }

                if let item = primaryItem {
                    Spacer(minLength: 10)
                    Link(destination: item.deepLink ?? URL(string: "solotodo://training")!) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(item.title)
                                .font(SLFont.ui(15, .semibold))
                                .foregroundColor(SL.t1)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            if let subtitle = item.subtitle {
                                Text(subtitle)
                                    .font(SLFont.ui(11.5, .regular))
                                    .foregroundColor(SL.t2)
                                    .lineLimit(2)
                            }
                        }
                    }
                    Spacer(minLength: 8)
                    HStack {
                        StreakBadge(streak: data.streak, size: 12)
                        Spacer()
                        WidgetActionButton(actionType: item.actionType, targetId: item.targetId, enabled: item.canComplete, accent: accent)
                    }
                    .padding(.bottom, 7)
                } else {
                    Spacer()
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 13))
                            .foregroundColor(SL.ok)
                        Text("Alles erledigt")
                            .font(SLFont.ui(12, .medium))
                            .foregroundColor(SL.t2)
                    }
                    Spacer()
                    HStack {
                        StreakBadge(streak: data.streak, size: 12)
                        Spacer()
                        Kicker("\(data.totalOpen) offen")
                    }
                    .padding(.bottom, 7)
                }

                XPBar(progress: xpPct, accent: accent)
            }
            .padding(15)
        }
        .widgetURL(primaryItem?.deepLink)
    }
}
