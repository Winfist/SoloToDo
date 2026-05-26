// ─── SHARED STYLES ───────────────────────────────────────────
// Design system aligned 1:1 with the app's current "minimal-luxe"
// dashboard (DashboardWidgets.jsx). Principles:
//   • frosted-dark glass surface, generous radius, soft shadow
//   • ONE accent (theme color) used only for kicker + progress +
//     the active marker — everything else is neutral slate
//   • serif (Cinzel substitute) only for identity, sans (Outfit
//     substitute) for all content/labels, mono only for numbers
//     and the small section kicker
//   • NO corner brackets, NO neon glow, NO multi-color rainbow
// The widget is a *view* of your hunter: it never completes tasks.
// Tapping a quest reveals its stages inline; tapping again opens it
// in the app.

import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Color from Hex String
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}

// MARK: - Design Tokens
struct SL {
    // Surface (frosted glass on dark)
    static let panelTop    = Color(hex: "#0e1120")
    static let panelBottom = Color(hex: "#070810")
    static let hairline    = Color.white.opacity(0.06)
    static let track       = Color.white.opacity(0.06)
    static let tile        = Color.white.opacity(0.03)
    static let tileStrong  = Color.white.opacity(0.055)

    // Text hierarchy (neutral slate — matches the app dashboard)
    static let t1   = Color(hex: "#f8fafc")   // titles / bright
    static let body = Color(hex: "#e2e8f0")   // stage & body text
    static let t2   = Color(hex: "#94a3b8")   // sub
    static let t3   = Color(hex: "#64748b")   // muted labels
    static let t4   = Color(hex: "#334155")   // ghost

    // Semantic (used sparingly)
    static let ok     = Color(hex: "#22c55e")
    static let streak = Color(hex: "#f97316")

    // Rank tint (identity accent for the rank letter)
    static func rankColor(_ r: String) -> Color {
        switch r.uppercased() {
        case "SSS": return Color(hex: "#e879f9")
        case "S":   return Color(hex: "#ef4444")
        case "A":   return Color(hex: "#f59e0b")
        case "B":   return Color(hex: "#a78bfa")
        case "C":   return Color(hex: "#34d399")
        case "D":   return Color(hex: "#22d3ee")
        default:    return Color(hex: "#94a3b8")
        }
    }
}

// MARK: - Typography (system-font substitutes for the app fonts)
enum SLFont {
    static func display(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .serif)        // Cinzel substitute
    }
    static func ui(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)                        // Outfit substitute
    }
    static func mono(_ size: CGFloat, _ weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight, design: .monospaced)   // JetBrains Mono substitute
    }
}

// ═══════════════════════════════════════════════════════════════
// MARK: - PREMIUM BACKGROUND
// Dark glass gradient + a single, very subtle top accent sheen.
// ═══════════════════════════════════════════════════════════════
struct PremiumBackground: View {
    var accent: Color
    var body: some View {
        ZStack {
            LinearGradient(colors: [SL.panelTop, SL.panelBottom],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            RadialGradient(colors: [accent.opacity(0.10), .clear],
                           center: .init(x: 0.5, y: -0.2),
                           startRadius: 4, endRadius: 220)
                .opacity(0.6)
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MARK: - SMALL PARTS
// ═══════════════════════════════════════════════════════════════

/// Monospace section kicker (one per section).
struct Kicker: View {
    let text: String
    var color: Color = SL.t3
    var size: CGFloat = 10.5

    init(_ text: String, color: Color = SL.t3, size: CGFloat = 10.5) {
        self.text = text
        self.color = color
        self.size = size
    }

    var body: some View {
        Text(text.uppercased())
            .font(SLFont.mono(size, .semibold))
            .tracking(1.4)
            .foregroundColor(color)
    }
}

/// Soft pill (rank · level, etc.) — sans, no border, faint fill.
struct MetaChip: View {
    let text: String
    var accent: Color? = nil
    var body: some View {
        Text(text.uppercased())
            .font(SLFont.ui(9.5, .semibold))
            .tracking(0.4)
            .foregroundColor(accent ?? SL.t2)
            .padding(.horizontal, 8).padding(.vertical, 3.5)
            .background(
                Capsule().fill((accent ?? Color.white).opacity(accent == nil ? 0.05 : 0.12))
            )
    }
}

/// Minimal category/stat label — neutral, no chrome.
struct CategoryTag: View {
    let category: String
    private var label: String {
        let c = category.uppercased()
        return ["STR", "INT", "VIT", "AGI", "CHA"].contains(c) ? c : "—"
    }
    var body: some View {
        Text(label)
            .font(SLFont.ui(9.5, .semibold))
            .tracking(0.6)
            .foregroundColor(SL.t3)
    }
}

/// Streak badge — flame + count, single warm color.
struct StreakBadge: View {
    let streak: Int
    var size: CGFloat = 12
    private var color: Color { streak > 0 ? SL.streak : SL.t3 }
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: streak > 0 ? "flame.fill" : "flame")
                .font(.system(size: size * 0.85, weight: .semibold))
            Text("\(streak)")
                .font(SLFont.mono(size, .semibold))
        }
        .foregroundColor(color)
    }
}

/// Small "done/total" stage-progress pill (numbers → mono).
struct StageCountBadge: View {
    let done: Int
    let total: Int
    var accent: Color
    private var complete: Bool { total > 0 && done >= total }
    private var tint: Color { complete ? SL.ok : accent }
    var body: some View {
        Text("\(done)/\(total)")
            .font(SLFont.mono(9.5, .semibold))
            .foregroundColor(tint)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(Capsule().fill(tint.opacity(0.10)))
    }
}

/// Thin XP progress bar (3px, matches the app dashboard).
struct XPBar: View {
    let progress: Double
    var accent: Color
    var height: CGFloat = 3
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(SL.track)
                Capsule()
                    .fill(LinearGradient(colors: [accent, accent.opacity(0.62)],
                                         startPoint: .leading, endPoint: .trailing))
                    .frame(width: geo.size.width * CGFloat(min(max(progress, 0), 1)))
            }
        }
        .frame(height: height)
    }
}

/// XP ring (lock-screen circular).
struct XPRing: View {
    let progress: Double
    var accent: Color
    var size: CGFloat = 88
    var line: CGFloat = 5
    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.08), lineWidth: line)
            Circle()
                .trim(from: 0, to: min(max(progress, 0), 1))
                .stroke(accent, style: StrokeStyle(lineWidth: line, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

/// Hairline divider.
struct Divider1: View {
    var body: some View {
        Rectangle().fill(SL.hairline).frame(height: 1)
    }
}

/// Neutral stat cell (STR/INT/…).
struct StatCell: View {
    let label: String
    let value: Int
    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)").font(SLFont.ui(14, .heavy)).foregroundColor(SL.t1)
            Text(label.uppercased()).font(SLFont.mono(7.5, .semibold)).tracking(0.8).foregroundColor(SL.t3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(SL.tile))
    }
}

// ═══════════════════════════════════════════════════════════════
// MARK: - QUEST PARTS
// ═══════════════════════════════════════════════════════════════

/// A single stage ("Etappe") line: marker + text. Display only.
struct StageLine: View {
    let stage: WidgetStage
    var accent: Color
    var isNext: Bool = false
    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            ZStack {
                if stage.done {
                    Circle().fill(SL.ok.opacity(0.16)).frame(width: 16, height: 16)
                    Image(systemName: "checkmark").font(.system(size: 8, weight: .bold)).foregroundColor(SL.ok)
                } else {
                    Circle().stroke(isNext ? accent : SL.t4, lineWidth: 1.4).frame(width: 14, height: 14)
                }
            }
            .frame(width: 16, height: 16)
            .padding(.top, 1)

            Text(stage.title)
                .font(SLFont.ui(12.5, .regular))
                .foregroundColor(stage.done ? SL.t3 : SL.body)
                .strikethrough(stage.done, color: SL.t4)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
    }
}

/// Collapsed quest row (title + next stage + progress + chevron).
/// Display only — the parent view wraps it in the tap behavior.
struct QuestCollapsedRow: View {
    let quest: WidgetQuest
    var accent: Color
    var focus: Bool = false
    var titleSize: CGFloat = 14

    var body: some View {
        HStack(spacing: 11) {
            RoundedRectangle(cornerRadius: 2)
                .fill(focus ? accent : SL.t4.opacity(0.7))
                .frame(width: 3)
                .padding(.vertical, 2)

            VStack(alignment: .leading, spacing: 3) {
                Text(quest.title)
                    .font(SLFont.ui(titleSize, .semibold))
                    .foregroundColor(SL.t1)
                    .lineLimit(1)

                if let step = quest.nextOpenStageTitle {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.turn.down.right")
                            .font(.system(size: 7.5, weight: .semibold))
                            .foregroundColor(accent.opacity(0.8))
                        Text(step)
                            .font(SLFont.ui(11.5, .regular))
                            .foregroundColor(SL.t2)
                            .lineLimit(1)
                    }
                }
            }

            Spacer(minLength: 6)

            if !quest.stages.isEmpty {
                StageCountBadge(done: quest.doneStageCount, total: quest.stages.count, accent: accent)
            } else {
                CategoryTag(category: quest.category)
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(SL.t4)
        }
        .padding(.vertical, 1)
    }
}

/// Habit / micro-habit row (deep-link only, never completes).
struct TaskDeepLinkRow: View {
    let item: WidgetTaskItem
    var accent: Color
    var focus: Bool = false
    var body: some View {
        Link(destination: item.deepLink ?? URL(string: "solotodo://training")!) {
            HStack(spacing: 11) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(focus ? accent : SL.t4.opacity(0.7))
                    .frame(width: 3)
                    .padding(.vertical, 2)
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title)
                        .font(SLFont.ui(14, .semibold))
                        .foregroundColor(SL.t1)
                        .lineLimit(1)
                    if let subtitle = item.subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(SLFont.ui(11.5, .regular))
                            .foregroundColor(SL.t2)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 6)
                Text(item.meta.uppercased())
                    .font(SLFont.ui(9.5, .semibold))
                    .tracking(0.6)
                    .foregroundColor(SL.t3)
                Image(systemName: "chevron.right")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(SL.t4)
            }
            .padding(.vertical, 1)
        }
    }
}

/// Wraps a collapsed quest row in the right tap behavior:
/// expandable + collapsed + iOS17 → toggle stages inline;
/// otherwise → open the quest in the app.
struct QuestTapArea<Content: View>: View {
    let questId: String
    let expandable: Bool
    let deepLink: URL?
    let content: () -> Content

    init(questId: String, expandable: Bool, deepLink: URL?, @ViewBuilder content: @escaping () -> Content) {
        self.questId = questId
        self.expandable = expandable
        self.deepLink = deepLink
        self.content = content
    }

    private var fallback: URL { deepLink ?? URL(string: "solotodo://training")! }

    var body: some View {
        if expandable, #available(iOSApplicationExtension 17.0, *) {
            Button(intent: ToggleQuestExpandIntent(questId: questId)) {
                content()
            }
            .buttonStyle(.plain)
        } else {
            Link(destination: fallback) { content() }
        }
    }
}

/// Small circular control that collapses the expanded quest (iOS17+).
struct CollapseButton: View {
    let questId: String
    var body: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            Button(intent: ToggleQuestExpandIntent(questId: questId)) {
                Image(systemName: "chevron.up")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(SL.t3)
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(SL.tile))
            }
            .buttonStyle(.plain)
        } else {
            EmptyView()
        }
    }
}

/// Expanded quest: title (→ opens app) + collapse + stage checklist.
struct FocusedQuestView: View {
    let quest: WidgetQuest
    var accent: Color
    var maxStages: Int = 8
    var titleLineLimit: Int = 2

    private var deepLink: URL? { solotodoDeepLink("solotodo://quest/\(quest.id)") }
    private var nextStageId: String? { quest.stages.first(where: { !$0.done })?.id }
    private var shownStages: [WidgetStage] { Array(quest.stages.prefix(maxStages)) }

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            // Header — title links to the app, chevron collapses.
            HStack(alignment: .top, spacing: 8) {
                Link(destination: deepLink ?? URL(string: "solotodo://training")!) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(quest.title)
                            .font(SLFont.ui(15.5, .bold))
                            .foregroundColor(SL.t1)
                            .lineLimit(titleLineLimit)
                            .fixedSize(horizontal: false, vertical: true)
                        HStack(spacing: 6) {
                            CategoryTag(category: quest.category)
                            Text("In App öffnen")
                                .font(SLFont.ui(10, .semibold))
                                .foregroundColor(accent.opacity(0.9))
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(accent.opacity(0.9))
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                CollapseButton(questId: quest.id)
            }

            if !shownStages.isEmpty {
                HStack {
                    Kicker("Etappen")
                    Spacer()
                    Text("\(quest.doneStageCount)/\(quest.stages.count)")
                        .font(SLFont.mono(9.5, .semibold))
                        .foregroundColor(SL.t3)
                }
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(shownStages.enumerated()), id: \.offset) { _, stage in
                        StageLine(stage: stage, accent: accent, isNext: !stage.done && stage.id == nextStageId)
                    }
                }
            } else if let desc = quest.questDescription, !desc.isEmpty {
                Text(desc)
                    .font(SLFont.ui(12.5, .regular))
                    .foregroundColor(SL.body)
                    .lineLimit(4)
            }
        }
    }
}
