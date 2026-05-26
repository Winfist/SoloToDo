// ─── SHARED STYLES ───────────────────────────────────────────
// Premium design system, ported 1:1 from the app ("Arise v2.0").
// Principles: frosted-dark glass, ONE accent + neutral grays,
// serif (Cinzel-substitute) for identity, default sans for content,
// monospace only for small kickers & numbers. No scanlines / HUD /
// multi-glow overload — let the content speak.

import AppIntents
import SwiftUI

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
    // Surface
    static let bg1 = Color(hex: "#0d1020")
    static let bg2 = Color(hex: "#070810")
    static let hairline = Color.white.opacity(0.06)
    static let track    = Color.white.opacity(0.07)

    // Text hierarchy (neutral slate)
    static let t1 = Color(hex: "#f1f5f9")   // bright
    static let t2 = Color(hex: "#94a3b8")   // sub
    static let t3 = Color(hex: "#64748b")   // muted
    static let t4 = Color(hex: "#3f4a5c")   // ghost

    // Semantic (used sparingly)
    static let ok     = Color(hex: "#34d399")
    static let streak = Color(hex: "#fb923c")

    // Rank tint (kept for the rank letter / identity accent)
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

// MARK: - Typography helpers (system-font substitutes for the app fonts)
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
            LinearGradient(colors: [SL.bg1, SL.bg2],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            // single soft accent sheen from the top — the only "glow"
            RadialGradient(colors: [accent.opacity(0.14), .clear],
                           center: .init(x: 0.5, y: -0.15),
                           startRadius: 4, endRadius: 180)
                .opacity(0.7)
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MARK: - SMALL PARTS
// ═══════════════════════════════════════════════════════════════

/// Monospace kicker label (one per section).
struct Kicker: View {
    let text: String
    var color: Color = SL.t3
    var size: CGFloat = 9
    var body: some View {
        Text(text.uppercased())
            .font(SLFont.mono(size, .semibold))
            .tracking(1.5)
            .foregroundColor(color)
    }
}

/// Neutral metadata chip (category, level…).
struct MetaChip: View {
    let text: String
    var accent: Color? = nil
    var body: some View {
        Text(text.uppercased())
            .font(SLFont.mono(9, .semibold))
            .tracking(0.5)
            .foregroundColor(accent ?? SL.t2)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill((accent ?? Color.white).opacity(accent == nil ? 0.04 : 0.14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .stroke((accent ?? Color.white).opacity(accent == nil ? 0.06 : 0.30), lineWidth: 0.5)
                    )
            )
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

/// Thin XP progress bar.
struct XPBar: View {
    let progress: Double
    var accent: Color
    var height: CGFloat = 4
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(SL.track)
                Capsule()
                    .fill(LinearGradient(colors: [accent, accent.opacity(0.65)],
                                         startPoint: .leading, endPoint: .trailing))
                    .frame(width: geo.size.width * CGFloat(min(max(progress, 0), 1)))
            }
        }
        .frame(height: height)
    }
}

/// XP ring (for the identity widget + lock circular).
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
        VStack(spacing: 1) {
            Text("\(value)").font(SLFont.ui(13, .heavy)).foregroundColor(SL.t1)
            Text(label.uppercased()).font(SLFont.mono(7.5, .semibold)).tracking(0.8).foregroundColor(SL.t3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(Color.white.opacity(0.03))
                .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).stroke(SL.hairline, lineWidth: 0.5))
        )
    }
}

// ═══════════════════════════════════════════════════════════════
// MARK: - QUEST ROW (premium)
// Title (sans) + next-step/description (sub) + neutral category chip.
// ═══════════════════════════════════════════════════════════════
struct PremiumQuestRow: View {
    let quest: WidgetQuest
    var accent: Color
    var focus: Bool = false
    var showStep: Bool = true
    var titleSize: CGFloat = 13.5

    private var subtitle: String? {
        if let s = quest.nextStep, !s.isEmpty { return s }
        if let d = quest.questDescription, !d.isEmpty { return d }
        return nil
    }
    private var subtitleIsStep: Bool {
        if let s = quest.nextStep, !s.isEmpty { return true }
        return false
    }
    private var catLabel: String {
        let c = quest.category.uppercased()
        return ["STR", "INT", "VIT", "AGI", "CHA"].contains(c) ? c : "—"
    }

    var body: some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 2)
                .fill(focus ? accent : SL.t4)
                .frame(width: 3)
                .padding(.vertical, 1)

            VStack(alignment: .leading, spacing: 2) {
                Text(quest.title)
                    .font(SLFont.ui(titleSize, .semibold))
                    .foregroundColor(SL.t1)
                    .lineLimit(1)

                if showStep, let sub = subtitle {
                    HStack(spacing: 5) {
                        if subtitleIsStep {
                            Image(systemName: "arrow.turn.down.right")
                                .font(.system(size: 7, weight: .semibold))
                                .foregroundColor(accent.opacity(0.85))
                        }
                        Text(sub)
                            .font(SLFont.ui(11.5, .regular))
                            .foregroundColor(subtitleIsStep ? SL.t2 : SL.t3)
                            .lineLimit(1)
                    }
                }
            }

            Spacer(minLength: 6)

            MetaChip(text: catLabel)
        }
        .padding(.vertical, 1)
    }
}

struct WidgetActionButton: View {
    let actionType: String
    let targetId: String
    var enabled: Bool
    var accent: Color

    var body: some View {
        if #available(iOSApplicationExtension 17.0, *), enabled {
            Button(intent: QueueWidgetActionIntent(actionType: actionType, targetId: targetId)) {
                Image(systemName: actionType == "incrementMicroHabit" ? "plus" : "checkmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(accent)
                    .frame(width: 22, height: 22)
                    .background(Circle().fill(accent.opacity(0.12)))
                    .overlay(Circle().stroke(accent.opacity(0.45), lineWidth: 1))
            }
            .buttonStyle(.plain)
        } else {
            Image(systemName: enabled ? "checkmark" : "arrow.up.forward")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(enabled ? accent : SL.t3)
                .frame(width: 22, height: 22)
                .background(Circle().fill((enabled ? accent : SL.t3).opacity(0.08)))
                .overlay(Circle().stroke((enabled ? accent : SL.t3).opacity(0.28), lineWidth: 1))
        }
    }
}

struct PremiumTaskRow: View {
    let item: WidgetTaskItem
    var accent: Color
    var focus: Bool = false
    var titleSize: CGFloat = 13.5

    var body: some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 2)
                .fill(focus ? accent : SL.t4)
                .frame(width: 3)
                .padding(.vertical, 1)

            Link(destination: item.deepLink ?? URL(string: "solotodo://training")!) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title)
                        .font(SLFont.ui(titleSize, .semibold))
                        .foregroundColor(SL.t1)
                        .lineLimit(1)
                    if let subtitle = item.subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(SLFont.ui(11.5, .regular))
                            .foregroundColor(SL.t2)
                            .lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            MetaChip(text: item.meta)
            if item.canComplete {
                WidgetActionButton(actionType: item.actionType, targetId: item.targetId, enabled: true, accent: accent)
            } else {
                Link(destination: item.deepLink ?? URL(string: "solotodo://training")!) {
                    WidgetActionButton(actionType: item.actionType, targetId: item.targetId, enabled: false, accent: accent)
                }
            }
        }
        .padding(.vertical, 1)
    }
}
