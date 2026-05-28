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
    var style: WidgetBackgroundStyle = .auto
    var body: some View {
        ZStack {
            if style == .transparent {
                Rectangle().fill(.ultraThinMaterial)
                LinearGradient(
                    colors: [Color.black.opacity(0.18), Color.black.opacity(0.34)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                RadialGradient(colors: [accent.opacity(0.14), .clear],
                               center: .init(x: 0.5, y: -0.25),
                               startRadius: 4, endRadius: 220)
                    .opacity(0.75)
            } else {
                LinearGradient(colors: [SL.panelTop, SL.panelBottom],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
                RadialGradient(colors: [accent.opacity(0.10), .clear],
                               center: .init(x: 0.5, y: -0.2),
                               startRadius: 4, endRadius: 220)
                    .opacity(0.6)
            }

            RadialGradient(
                colors: [.clear, Color.black.opacity(style == .transparent ? 0.20 : 0.34)],
                center: .center,
                startRadius: 90,
                endRadius: 260
            )
            .allowsHitTesting(false)

            LinearGradient(
                colors: [.clear, Color.white.opacity(style == .transparent ? 0.13 : 0.09), .clear],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 1)
            .frame(maxHeight: .infinity, alignment: .top)
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

struct CurrencyBadge: View {
    let value: Int
    let imageName: String
    var tint: Color

    var body: some View {
        HStack(spacing: 3) {
            Image(imageName)
                .resizable()
                .scaledToFit()
                .frame(width: 12, height: 12)
            Text("\(value)")
                .font(SLFont.mono(10, .semibold))
                .foregroundColor(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
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

func widgetDifficultyColor(_ difficulty: String) -> Color {
    switch difficulty.lowercased() {
    case "boss": return Color(hex: "#a855f7")
    case "hard": return Color(hex: "#f97316")
    case "easy": return Color(hex: "#22c55e")
    default: return Color(hex: "#22d3ee")
    }
}

func widgetDifficultyLabel(_ difficulty: String) -> String {
    switch difficulty.lowercased() {
    case "boss": return "BOSS"
    case "hard": return "HARD"
    case "easy": return "EASY"
    default: return "NORMAL"
    }
}

func widgetQuestIconName(_ quest: WidgetQuest) -> String {
    let difficulty = quest.difficulty.lowercased()
    if ["boss", "hard", "normal", "easy"].contains(difficulty) {
        return "diff_\(difficulty)"
    }

    switch quest.type.lowercased() {
    case "daily": return "quest_daily"
    case "weekly": return "quest_weekly"
    case "emergency": return "quest_emergency"
    case "chained", "chain": return "quest_chain"
    case "hidden": return "quest_hidden"
    default: return "quest_side"
    }
}

func widgetMicroIconName(_ habit: WidgetMicroHabit) -> String {
    let icon = habit.icon.trimmingCharacters(in: .whitespacesAndNewlines)
    if ["micro_water", "micro_posture", "micro_stretch", "micro_gratitude", "micro_breathe"].contains(icon) {
        return icon
    }
    let key = habit.key.trimmingCharacters(in: .whitespacesAndNewlines)
    let candidate = key.isEmpty ? "micro_water" : "micro_\(key)"
    return ["micro_water", "micro_posture", "micro_stretch", "micro_gratitude", "micro_breathe"].contains(candidate) ? candidate : "micro_water"
}

func widgetHabitTint(_ habit: WidgetMicroHabit) -> Color {
    switch habit.key.lowercased() {
    case "water": return Color(hex: "#3b82f6")
    case "posture": return Color(hex: "#22c55e")
    case "stretch": return Color(hex: "#f59e0b")
    case "gratitude": return Color(hex: "#a855f7")
    case "breathe": return Color(hex: "#06b6d4")
    default: return Color(hex: "#22d3ee")
    }
}

func widgetProgress(done: Int, total: Int) -> Double {
    guard total > 0 else { return 0 }
    return min(max(Double(done) / Double(total), 0), 1)
}

struct RankSigil: View {
    let rank: String
    var accent: Color
    var size: CGFloat = 27

    var body: some View {
        ZStack {
            Hexagon()
                .stroke(accent.opacity(0.82), lineWidth: 1.15)
                .background(Hexagon().fill(accent.opacity(0.07)))
            Text(rank.uppercased())
                .font(SLFont.display(size * 0.36, .bold))
                .foregroundColor(SL.t1)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .padding(.horizontal, 3)
        }
        .frame(width: size, height: size + 2)
    }
}

struct Hexagon: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        var path = Path()
        path.move(to: CGPoint(x: w * 0.5, y: 0))
        path.addLine(to: CGPoint(x: w, y: h * 0.24))
        path.addLine(to: CGPoint(x: w, y: h * 0.76))
        path.addLine(to: CGPoint(x: w * 0.5, y: h))
        path.addLine(to: CGPoint(x: 0, y: h * 0.76))
        path.addLine(to: CGPoint(x: 0, y: h * 0.24))
        path.closeSubpath()
        return path
    }
}

struct WidgetIconTile: View {
    let imageName: String
    var tint: Color
    var size: CGFloat = 30
    var iconSize: CGFloat = 21

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(Color.white.opacity(0.055))
                .overlay(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .stroke(tint.opacity(0.40), lineWidth: 1)
                )
                .shadow(color: tint.opacity(0.13), radius: 7, x: 0, y: 0)
            Image(imageName)
                .resizable()
                .scaledToFit()
                .frame(width: iconSize, height: iconSize)
        }
        .frame(width: size, height: size)
    }
}

struct ProgressRingBadge: View {
    let done: Int
    let total: Int
    var accent: Color
    var size: CGFloat = 30
    var line: CGFloat = 2.5
    var showText: Bool = true

    private var progress: Double { widgetProgress(done: done, total: total) }
    private var tint: Color { progress >= 1 ? SL.ok : accent }

    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.10), lineWidth: line)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(tint, style: StrokeStyle(lineWidth: line, lineCap: .round))
                .rotationEffect(.degrees(-90))
            if showText {
                Text(total > 0 ? "\(done)/\(total)" : "--")
                    .font(SLFont.mono(size * 0.27, .semibold))
                    .foregroundColor(tint)
                    .minimumScaleFactor(0.55)
                    .lineLimit(1)
            }
        }
        .frame(width: size, height: size)
    }
}

struct PageDots: View {
    let totalPages: Int
    let currentPage: Int
    var accent: Color

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<min(totalPages, 4), id: \.self) { index in
                Capsule()
                    .fill(index == currentPage ? accent : Color.white.opacity(0.18))
                    .frame(width: index == currentPage ? 13 : 5, height: 5)
            }
        }
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

enum WidgetChromeSize {
    case medium
    case large

    var horizontalPadding: CGFloat { 16 }
    var topPadding: CGFloat {
        switch self { case .large: return 13; case .medium: return 10 }
    }
    var bottomPadding: CGFloat {
        switch self { case .large: return 13; case .medium: return 10 }
    }
    var nameSize: CGFloat {
        switch self { case .large: return 18; case .medium: return 17 }
    }
    var isLarge: Bool {
        switch self { case .large: return true; case .medium: return false }
    }
}

struct WidgetChrome<Content: View, Footer: View>: View {
    let data: WidgetData
    var accent: Color
    var size: WidgetChromeSize
    var backgroundStyle: WidgetBackgroundStyle = .auto
    let content: Content
    let footer: Footer

    init(
        data: WidgetData,
        accent: Color,
        size: WidgetChromeSize,
        backgroundStyle: WidgetBackgroundStyle = .auto,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer
    ) {
        self.data = data
        self.accent = accent
        self.size = size
        self.backgroundStyle = backgroundStyle
        self.content = content()
        self.footer = footer()
    }

    var body: some View {
        ZStack {
            PremiumBackground(accent: accent, style: backgroundStyle)

            VStack(alignment: .leading, spacing: 0) {
                HunterCompactHeader(data: data, accent: accent, nameSize: size.nameSize, showCurrency: size.isLarge)

                HStack(spacing: 8) {
                    XPBar(progress: xpProgress, accent: accent)
                    Text("\(data.xp)/\(data.xpNeeded)")
                        .font(SLFont.mono(size.isLarge ? 9.5 : 8.6, .semibold))
                        .foregroundColor(SL.t3)
                        .lineLimit(1)
                }
                .padding(.top, size.isLarge ? 7 : 6)

                Divider1()
                    .padding(.top, size.isLarge ? 10 : 7)
                    .padding(.bottom, size.isLarge ? 9 : 5)

                content

                if size.isLarge {
                    Spacer(minLength: 6)
                }

                footer
            }
            .padding(.horizontal, size.horizontalPadding)
            .padding(.top, size.topPadding)
            .padding(.bottom, size.bottomPadding)
        }
    }

    private var xpProgress: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
}

extension WidgetChrome where Footer == EmptyView {
    init(
        data: WidgetData,
        accent: Color,
        size: WidgetChromeSize,
        backgroundStyle: WidgetBackgroundStyle = .auto,
        @ViewBuilder content: () -> Content
    ) {
        self.init(data: data, accent: accent, size: size, backgroundStyle: backgroundStyle, content: content) { EmptyView() }
    }
}

struct HunterCompactHeader: View {
    let data: WidgetData
    var accent: Color
    var nameSize: CGFloat = 17
    var showCurrency: Bool = false

    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            RankSigil(rank: data.rank, accent: accent, size: showCurrency ? 28 : 25)

            Text(data.hunterName)
                .font(SLFont.display(nameSize, .bold))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.78)

            Text("LV \(data.level)")
                .font(SLFont.mono(9.2, .semibold))
                .foregroundColor(SL.t2)
                .lineLimit(1)

            Spacer(minLength: 6)

            StreakBadge(streak: data.streak, size: 12)

            if showCurrency {
                CurrencyBadge(value: data.gold, imageName: "coin", tint: Color(hex: "#d6b15a"))
                CurrencyBadge(value: data.gems, imageName: "gem", tint: Color(hex: "#67e8f9"))
            }
        }
        .frame(height: showCurrency ? 30 : 27)
    }
}

struct MiniValuePill: View {
    let text: String
    var accent: Color

    var body: some View {
        Text(text)
            .font(SLFont.mono(9.5, .semibold))
            .foregroundColor(accent)
            .lineLimit(1)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(Capsule().fill(accent.opacity(0.10)))
    }
}

struct PageButton: View {
    var mode: WidgetContentMode
    var accent: Color

    var body: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            Button(intent: AdvanceWidgetPageIntent(mode: WidgetContentModeIntent(rawValue: mode.rawValue) ?? .quests)) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(accent)
                    .frame(width: 24, height: 24)
                    .background(Circle().fill(accent.opacity(0.10)))
            }
            .buttonStyle(.plain)
        } else {
            EmptyView()
        }
    }
}

struct WidgetListHeader: View {
    let title: String
    var mode: WidgetContentMode
    var totalItems: Int
    var pageIndex: Int
    var pageSize: Int
    var accent: Color

    private var totalPages: Int { widgetPageCount(totalItems: totalItems, pageSize: pageSize) }
    private var currentPage: Int { normalizedWidgetPageIndex(pageIndex, totalItems: totalItems, pageSize: pageSize) + 1 }

    var body: some View {
        HStack(spacing: 8) {
            Kicker(title)
            Spacer(minLength: 6)
            if totalItems > pageSize {
                if #available(iOSApplicationExtension 17.0, *) {
                    PageDots(totalPages: totalPages, currentPage: currentPage - 1, accent: accent)
                    Text("\(currentPage)/\(totalPages)")
                        .font(SLFont.mono(8.5, .semibold))
                        .foregroundColor(SL.t4)
                    PageButton(mode: mode, accent: accent)
                }
            }
        }
        .frame(height: 21)
    }
}

struct CompactStatsFooter: View {
    let data: WidgetData

    var body: some View {
        VStack(spacing: 9) {
            Divider1()
            HStack(spacing: 6) {
                StatCell(label: "STR", value: data.stats.str)
                StatCell(label: "INT", value: data.stats.intelligence)
                StatCell(label: "VIT", value: data.stats.vit)
                StatCell(label: "AGI", value: data.stats.agi)
                StatCell(label: "CHA", value: data.stats.cha)
            }
        }
    }
}

enum MicroHabitRingSize {
    case medium
    case large
    case compactLarge

    var ring: CGFloat {
        switch self {
        case .medium: return 42
        case .large: return 55
        case .compactLarge: return 38
        }
    }

    var icon: CGFloat {
        switch self {
        case .medium: return 20
        case .large: return 25
        case .compactLarge: return 18
        }
    }

    var label: CGFloat {
        switch self {
        case .medium: return 8.4
        case .large: return 9.3
        case .compactLarge: return 7.8
        }
    }
}

struct MicroHabitRingStrip: View {
    let habits: [WidgetMicroHabit]
    var accent: Color
    var size: MicroHabitRingSize

    private var completed: Int { habits.filter { $0.completed }.count }

    var body: some View {
        VStack(alignment: .leading, spacing: size == .large ? 8 : 6) {
            HStack {
                Kicker("Heute", size: size == .large ? 9.5 : 8.8)
                Spacer()
                Text("\(completed)/\(habits.count)")
                    .font(SLFont.mono(size == .large ? 9.5 : 8.8, .semibold))
                    .foregroundColor(SL.t3)
            }

            HStack(alignment: .top, spacing: size == .large ? 10 : 7) {
                ForEach(habits, id: \.id) { habit in
                    Link(destination: solotodoDeepLink("solotodo://training?type=microHabit&id=\(habit.id)") ?? URL(string: "solotodo://training")!) {
                        MicroHabitRing(habit: habit, accent: accent, size: size)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }
}

struct MicroHabitRing: View {
    let habit: WidgetMicroHabit
    var accent: Color
    var size: MicroHabitRingSize

    private var tint: Color { habit.completed ? SL.ok : widgetHabitTint(habit) }
    private var progress: Double { widgetProgress(done: habit.current, total: habit.target) }

    var body: some View {
        VStack(spacing: size == .large ? 5 : 3) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.10), lineWidth: 3)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(tint, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Image(widgetMicroIconName(habit))
                    .resizable()
                    .scaledToFit()
                    .frame(width: size.icon, height: size.icon)
            }
            .frame(width: size.ring, height: size.ring)

            Text(habit.label)
                .font(SLFont.ui(size.label, .semibold))
                .foregroundColor(SL.t2)
                .lineLimit(1)
                .minimumScaleFactor(0.68)

            Text("\(habit.current)/\(habit.target)")
                .font(SLFont.mono(size.label, .semibold))
                .foregroundColor(habit.completed ? SL.ok : accent)
                .lineLimit(1)
        }
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
    var lineLimit: Int = 2
    var fontSize: CGFloat = 12.2
    var markerSize: CGFloat = 14

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            ZStack {
                if stage.done {
                    Circle().fill(SL.ok.opacity(0.16)).frame(width: markerSize + 2, height: markerSize + 2)
                    Image(systemName: "checkmark")
                        .font(.system(size: markerSize * 0.55, weight: .bold))
                        .foregroundColor(SL.ok)
                } else {
                    Circle()
                        .stroke(isNext ? accent : SL.t4, lineWidth: 1.4)
                        .frame(width: markerSize, height: markerSize)
                }
            }
            .frame(width: markerSize + 2, height: markerSize + 2)
            .padding(.top, 1)

            Text(stage.title)
                .font(SLFont.ui(fontSize, .regular))
                .foregroundColor(stage.done ? SL.t3 : SL.body)
                .strikethrough(stage.done, color: SL.t4)
                .lineLimit(lineLimit)
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
    var titleSize: CGFloat = 13.6
    var compact: Bool = false
    var showDifficultyLabel: Bool = false
    var showOwnMarker: Bool = false

    private var difficultyTint: Color { widgetDifficultyColor(quest.difficulty) }
    private var rowTitleSize: CGFloat { compact ? 12.7 : titleSize }
    private var subtitleSize: CGFloat { compact ? 10.1 : 10.8 }
    private var iconSize: CGFloat { compact ? 28 : 30 }

    var body: some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 2)
                .fill(focus ? accent : SL.t4.opacity(0.7))
                .frame(width: 3)
                .padding(.vertical, 2)

            WidgetIconTile(
                imageName: widgetQuestIconName(quest),
                tint: difficultyTint,
                size: iconSize,
                iconSize: compact ? 20 : 21
            )

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(quest.title)
                        .font(SLFont.ui(rowTitleSize, .semibold))
                        .foregroundColor(SL.t1)
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)

                    if showOwnMarker {
                        Text("DEINE")
                            .font(SLFont.mono(6.8, .semibold))
                            .foregroundColor(accent)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(
                                RoundedRectangle(cornerRadius: 4, style: .continuous)
                                    .stroke(accent.opacity(0.30), lineWidth: 1)
                            )
                    }

                    if showDifficultyLabel {
                        Text(widgetDifficultyLabel(quest.difficulty))
                            .font(SLFont.mono(7.2, .semibold))
                            .foregroundColor(difficultyTint)
                            .lineLimit(1)
                    }
                }

                if let step = quest.nextOpenStageTitle {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.turn.down.right")
                            .font(.system(size: 7.5, weight: .semibold))
                            .foregroundColor(accent.opacity(0.8))
                        Text(step)
                            .font(SLFont.ui(subtitleSize, .regular))
                            .foregroundColor(SL.t2)
                            .lineLimit(1)
                    }
                }
            }

            Spacer(minLength: 6)

            if !quest.stages.isEmpty {
                ProgressRingBadge(done: quest.doneStageCount, total: quest.stages.count, accent: accent, size: compact ? 28 : 30)
            } else {
                CategoryTag(category: quest.category)
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(SL.t4)
        }
        .padding(.vertical, compact ? 1 : 1.5)
        .padding(.trailing, 1)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(focus ? accent.opacity(0.075) : Color.clear)
        )
    }
}

/// Habit / micro-habit / mixed row (deep-link only, never completes).
struct TaskListRow: View {
    let item: WidgetTaskItem
    var accent: Color
    var focus: Bool = false
    var titleSize: CGFloat = 13.6

    var body: some View {
        Link(destination: item.deepLink ?? URL(string: "solotodo://training")!) {
            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(focus ? accent : SL.t4.opacity(0.7))
                    .frame(width: 3)
                    .padding(.vertical, 2)

                if let iconName = item.iconName {
                    WidgetIconTile(imageName: iconName, tint: accent, size: 28, iconSize: 20)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title)
                        .font(SLFont.ui(titleSize, .semibold))
                        .foregroundColor(SL.t1)
                        .lineLimit(1)
                        .minimumScaleFactor(0.86)

                    if let subtitle = item.subtitle, !subtitle.isEmpty {
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.turn.down.right")
                                .font(.system(size: 7.5, weight: .semibold))
                                .foregroundColor(accent.opacity(0.8))
                            Text(subtitle)
                                .font(SLFont.ui(10.8, .regular))
                                .foregroundColor(SL.t2)
                                .lineLimit(1)
                        }
                    }
                }

                Spacer(minLength: 6)

                if let progress = item.progressText, !progress.isEmpty {
                    MiniValuePill(text: progress, accent: accent)
                } else {
                    Text(item.meta.uppercased())
                        .font(SLFont.ui(9.3, .semibold))
                        .tracking(0.6)
                        .foregroundColor(SL.t3)
                        .lineLimit(1)
                }

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
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(SL.t3)
                    .frame(width: 24, height: 24)
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
    var stageLineLimit: Int = 2
    var compact: Bool = false

    private var deepLink: URL? { solotodoDeepLink("solotodo://quest/\(quest.id)") }
    private var nextStageId: String? { quest.stages.first(where: { !$0.done })?.id }
    private var shownStages: [WidgetStage] { Array(quest.stages.prefix(maxStages)) }
    private var stackSpacing: CGFloat { compact ? 6 : 8 }
    private var headerSpacing: CGFloat { compact ? 3 : 4 }
    private var titleSize: CGFloat { compact ? 13.4 : 14.6 }
    private var labelSize: CGFloat { compact ? 9.2 : 10 }
    private var kickerSize: CGFloat { compact ? 9 : 9.5 }
    private var stageSpacing: CGFloat { compact ? 4 : 6 }
    private var stageFontSize: CGFloat { compact ? 11.2 : 12.2 }
    private var markerSize: CGFloat { compact ? 12 : 14 }

    var body: some View {
        VStack(alignment: .leading, spacing: stackSpacing) {
            // Header — title links to the app, chevron collapses.
            HStack(alignment: .top, spacing: 8) {
                Link(destination: deepLink ?? URL(string: "solotodo://training")!) {
                    VStack(alignment: .leading, spacing: headerSpacing) {
                        Text(quest.title)
                            .font(SLFont.ui(titleSize, .bold))
                            .foregroundColor(SL.t1)
                            .lineLimit(titleLineLimit)
                            .minimumScaleFactor(0.86)
                            .fixedSize(horizontal: false, vertical: true)
                        HStack(spacing: compact ? 4 : 6) {
                            CategoryTag(category: quest.category)
                            Text("In App öffnen")
                                .font(SLFont.ui(labelSize, .semibold))
                                .foregroundColor(accent.opacity(0.9))
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: compact ? 7 : 8, weight: .bold))
                                .foregroundColor(accent.opacity(0.9))
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                CollapseButton(questId: quest.id)
            }

            if !shownStages.isEmpty {
                HStack {
                    Kicker("Etappen", size: kickerSize)
                    Spacer()
                    Text("\(quest.doneStageCount)/\(quest.stages.count)")
                        .font(SLFont.mono(9.5, .semibold))
                        .foregroundColor(SL.t3)
                }
                VStack(alignment: .leading, spacing: stageSpacing) {
                    ForEach(Array(shownStages.enumerated()), id: \.offset) { _, stage in
                        StageLine(
                            stage: stage,
                            accent: accent,
                            isNext: !stage.done && stage.id == nextStageId,
                            lineLimit: stageLineLimit,
                            fontSize: stageFontSize,
                            markerSize: markerSize
                        )
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
