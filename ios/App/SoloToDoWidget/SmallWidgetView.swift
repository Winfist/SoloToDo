import SwiftUI
import WidgetKit

// Small widget: a single glanceable focus item. It shows what to do
// next (the quest's next stage) and opens the app on tap — it never
// completes anything, and it's too small to expand inline.
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
    private var deepLink: URL? {
        if let q = quest { return solotodoDeepLink("solotodo://quest/\(q.id)") }
        return item?.deepLink
    }
    private var hasContent: Bool { title != nil }

    var body: some View {
        ZStack {
            PremiumBackground(accent: accent)

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Kicker(kicker, color: accent)
                    Spacer()
                    MetaChip(text: "\(data.rank) · LV \(data.level)", accent: accent)
                }

                if hasContent {
                    Spacer(minLength: 10)
                    Link(destination: deepLink ?? URL(string: "solotodo://training")!) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(title ?? "")
                                .font(SLFont.ui(15, .semibold))
                                .foregroundColor(SL.t1)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            if let sub = subtitle, !sub.isEmpty {
                                HStack(spacing: 5) {
                                    Image(systemName: "arrow.turn.down.right")
                                        .font(.system(size: 8, weight: .semibold))
                                        .foregroundColor(accent.opacity(0.85))
                                    Text(sub)
                                        .font(SLFont.ui(11.5, .regular))
                                        .foregroundColor(SL.t2)
                                        .lineLimit(2)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    Spacer(minLength: 8)
                    HStack {
                        StreakBadge(streak: data.streak, size: 12)
                        Spacer()
                        if let q = quest, !q.stages.isEmpty {
                            StageCountBadge(done: q.doneStageCount, total: q.stages.count, accent: accent)
                        } else {
                            Kicker("\(data.totalOpen) offen")
                        }
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
        .widgetURL(deepLink)
    }
}
