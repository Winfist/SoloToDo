import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests

    private var accent: Color { Color(hex: data.theme.primary) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    private var items: [WidgetTaskItem] {
        widgetTaskItems(for: data, mode: contentMode, limit: 2)
    }
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
                    .padding(.bottom, 2)

                if items.isEmpty {
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
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                            PremiumTaskRow(item: item, accent: accent, focus: index == 0)
                                .padding(.vertical, 5)
                            if index < items.count - 1 {
                                Divider1()
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
        }
        .widgetURL(items.first?.deepLink)
    }
}
