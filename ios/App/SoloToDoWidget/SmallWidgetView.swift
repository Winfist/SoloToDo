import SwiftUI
import WidgetKit

// Small widget: a single glanceable focus item. It opens the app and never
// completes or increments anything.
struct SmallWidgetView: View {
    let data: WidgetData
    var contentMode: WidgetContentMode = .quests

    private var accent: Color { Color(hex: data.theme.primary) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }

    private var quest: WidgetQuest? { contentMode == .quests ? data.quests.first : nil }
    private var item: WidgetTaskItem? {
        contentMode == .quests ? nil : widgetTaskItems(for: data, mode: contentMode, limit: 1).first
    }

    private var kicker: String {
        switch contentMode {
        case .quests: return "Fokus"
        case .habits: return "Habit"
        case .microHabits: return "Micro"
        case .mix: return "Next"
        }
    }

    private var title: String? { quest?.title ?? item?.title }
    private var subtitle: String? { quest?.nextOpenStageTitle ?? item?.subtitle }
    private var progressText: String? {
        if let quest, !quest.stages.isEmpty { return "\(quest.doneStageCount)/\(quest.stages.count)" }
        return item?.progressText
    }
    private var deepLink: URL? {
        if let quest { return solotodoDeepLink("solotodo://quest/\(quest.id)") }
        return item?.deepLink
    }

    var body: some View {
        ZStack {
            PremiumBackground(accent: accent)

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    Kicker(kicker, color: accent, size: 10)
                    Spacer(minLength: 6)
                    MetaChip(text: "\(data.rank) · LV \(data.level)", accent: accent)
                }

                if let title {
                    Spacer(minLength: 8)

                    Link(destination: deepLink ?? URL(string: "solotodo://training")!) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(title)
                                .font(SLFont.ui(14.2, .semibold))
                                .foregroundColor(SL.t1)
                                .lineLimit(2)
                                .minimumScaleFactor(0.78)
                                .fixedSize(horizontal: false, vertical: true)

                            if let subtitle, !subtitle.isEmpty {
                                HStack(spacing: 5) {
                                    Image(systemName: "arrow.turn.down.right")
                                        .font(.system(size: 7.5, weight: .semibold))
                                        .foregroundColor(accent.opacity(0.85))
                                    Text(subtitle)
                                        .font(SLFont.ui(10.8, .regular))
                                        .foregroundColor(SL.t2)
                                        .lineLimit(1)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Spacer(minLength: 6)

                    HStack {
                        StreakBadge(streak: data.streak, size: 11.5)
                        Spacer(minLength: 6)
                        if let progressText, !progressText.isEmpty {
                            MiniValuePill(text: progressText, accent: accent)
                        } else {
                            Kicker("\(data.totalOpen) offen", size: 8.5)
                        }
                    }
                    .padding(.bottom, 7)
                } else {
                    Spacer(minLength: 10)
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 13))
                            .foregroundColor(SL.ok)
                        Text("Alles erledigt")
                            .font(SLFont.ui(12, .medium))
                            .foregroundColor(SL.t2)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 8)
                    HStack {
                        StreakBadge(streak: data.streak, size: 11.5)
                        Spacer()
                        Kicker("\(data.totalOpen) offen", size: 8.5)
                    }
                    .padding(.bottom, 7)
                }

                XPBar(progress: xpPct, accent: accent)
            }
            .padding(13)
        }
        .widgetURL(deepLink)
    }
}
