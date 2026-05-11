// ─── SHARED STYLES ───────────────────────────────────────────
// Solo Leveling "System Interface" — Premium Design System
// Every pixel matters. SF Symbols, multi-layer glow, glass panels.

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
    // ── Backgrounds ──
    static let bgAbyss    = Color(hex: "#03030a")
    static let bgDeep     = Color(hex: "#06060e")
    static let bgCard     = Color(hex: "#0a0a16")
    static let bgPanel    = Color(hex: "#0d0d1a")
    static let bgSurface  = Color(hex: "#111122")
    
    // ── Text hierarchy ──
    static let textBright = Color.white
    static let textMain   = Color(hex: "#f1f5f9")
    static let textSub    = Color(hex: "#94a3b8")
    static let textMuted  = Color(hex: "#64748b")
    static let textGhost  = Color(hex: "#334155")
    static let textDim    = Color(hex: "#1e293b")
    
    // ── Semantic colors ──
    static let gold       = Color(hex: "#fbbf24")
    static let goldDark   = Color(hex: "#d97706")
    static let fire       = Color(hex: "#f97316")
    static let danger     = Color(hex: "#ef4444")
    static let success    = Color(hex: "#34d399")
    static let successDim = Color(hex: "#065f46")
    
    // ── Stat colors ──
    static let str = Color(hex: "#ef4444")
    static let int = Color(hex: "#60a5fa")
    static let vit = Color(hex: "#34d399")
    static let agi = Color(hex: "#fbbf24")
    static let cha = Color(hex: "#c084fc")
    
    // ── Category helpers ──
    static func catColor(_ c: String) -> Color {
        switch c.lowercased() {
        case "str": return str; case "int": return self.int
        case "vit": return vit; case "agi": return agi
        case "cha": return cha; default: return textSub
        }
    }
    
    static func catSymbol(_ c: String) -> String {
        switch c.lowercased() {
        case "str": return "figure.strengthtraining.traditional"
        case "int": return "brain.head.profile"
        case "vit": return "heart.fill"
        case "agi": return "bolt.fill"
        case "cha": return "person.2.fill"
        default: return "circle.fill"
        }
    }
    
    // ── Difficulty helpers ──
    static func diffColor(_ d: String) -> Color {
        switch d.lowercased() {
        case "boss": return Color(hex: "#ef4444")
        case "hard": return Color(hex: "#a78bfa")
        case "normal": return Color(hex: "#22d3ee")
        default: return Color(hex: "#64748b")
        }
    }
    
    static func diffSymbol(_ d: String) -> String {
        switch d.lowercased() {
        case "boss": return "crown.fill"
        case "hard": return "star.fill"
        case "normal": return "diamond.fill"
        default: return "circle"
        }
    }
    
    // ── Rank helpers ──
    static func rankColor(_ r: String) -> Color {
        switch r.uppercased() {
        case "SSS": return Color(hex: "#e879f9")
        case "S":   return Color(hex: "#ef4444")
        case "A":   return Color(hex: "#f59e0b")
        case "B":   return Color(hex: "#a78bfa")
        case "C":   return Color(hex: "#34d399")
        case "D":   return Color(hex: "#22d3ee")
        default:    return Color(hex: "#6b7280")
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - PREMIUM BACKGROUND SYSTEM
// ═══════════════════════════════════════════════════════════════

struct SystemBackground: View {
    var themeColor: Color = Color(hex: "#22d3ee")
    
    var body: some View {
        ZStack {
            // Layer 1: Deep abyss base
            LinearGradient(
                colors: [SL.bgAbyss, SL.bgDeep, SL.bgCard.opacity(0.6), SL.bgAbyss],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // Layer 2: Radial depth — center is slightly lighter
            RadialGradient(
                colors: [
                    themeColor.opacity(0.03),
                    Color.clear,
                    Color.black.opacity(0.3)
                ],
                center: .center,
                startRadius: 20,
                endRadius: 250
            )
            
            // Layer 3: Scanlines (ultra-fine, barely visible)
            GeometryReader { geo in
                Path { path in
                    var y: CGFloat = 0
                    while y < geo.size.height {
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: geo.size.width, y: y))
                        y += 2.5
                    }
                }
                .stroke(Color.white.opacity(0.018), lineWidth: 0.5)
            }
            
            // Layer 4: Top edge glow (the signature Solo Leveling effect)
            VStack(spacing: 0) {
                // Primary glow line
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color.clear, themeColor.opacity(0.7), themeColor, themeColor.opacity(0.7), Color.clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(height: 1)
                    .shadow(color: themeColor.opacity(0.5), radius: 8, y: 3)
                    .shadow(color: themeColor.opacity(0.2), radius: 20, y: 6)
                
                // Soft bloom below the line
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [themeColor.opacity(0.08), Color.clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: 25)
                
                Spacer()
                
                // Bottom edge — subtle
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color.clear, themeColor.opacity(0.2), Color.clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(height: 0.5)
                    .shadow(color: themeColor.opacity(0.15), radius: 4, y: -2)
            }
            
            // Layer 5: Corner vignette (darkens corners for depth)
            GeometryReader { geo in
                let r = max(geo.size.width, geo.size.height) * 0.7
                RadialGradient(
                    colors: [Color.clear, Color.black.opacity(0.25)],
                    center: .center,
                    startRadius: r * 0.5,
                    endRadius: r
                )
            }
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - GLASS PANELS
// ═══════════════════════════════════════════════════════════════

/// Premium glass container with colored border glow
struct GlassPanel<Content: View>: View {
    var color: Color = Color(hex: "#22d3ee")
    var cornerRadius: CGFloat = 10
    var padding: CGFloat = 9
    var intensity: Double = 1.0
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        content()
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.white.opacity(0.025 * intensity))
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [color.opacity(0.04 * intensity), Color.clear],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [color.opacity(0.25 * intensity), color.opacity(0.08 * intensity), color.opacity(0.15 * intensity)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
            )
    }
}

/// Minimal inner panel for nesting
struct InnerPanel<Content: View>: View {
    var color: Color = Color.white
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        content()
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(color.opacity(0.02))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .stroke(color.opacity(0.06), lineWidth: 0.5)
            )
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - TYPOGRAPHY & LABELS
// ═══════════════════════════════════════════════════════════════

/// System header with corner brackets 「TEXT」
struct SystemHeader: View {
    let text: String
    var color: Color = Color(hex: "#22d3ee")
    var size: CGFloat = 7
    
    var body: some View {
        HStack(spacing: 0) {
            Text("「")
                .foregroundColor(color.opacity(0.4))
            Text(text)
                .foregroundColor(color)
                .tracking(2.5)
            Text("」")
                .foregroundColor(color.opacity(0.4))
        }
        .font(.system(size: size, weight: .heavy, design: .monospaced))
        .shadow(color: color.opacity(0.25), radius: 6)
    }
}

/// Glowing separator line
struct GlowDivider: View {
    var color: Color = Color(hex: "#22d3ee")
    var opacity: Double = 0.5
    
    var body: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [Color.clear, color.opacity(opacity), Color.clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(height: 0.5)
            .shadow(color: color.opacity(opacity * 0.4), radius: 4)
            .padding(.vertical, 1)
    }
}

/// Section label with decorative lines
struct SectionTitle: View {
    let text: String
    var color: Color = SL.textGhost
    
    var body: some View {
        HStack(spacing: 5) {
            RoundedRectangle(cornerRadius: 1)
                .fill(color.opacity(0.4))
                .frame(width: 10, height: 1)
            Text(text)
                .font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundColor(color)
                .tracking(2)
            Rectangle()
                .fill(color.opacity(0.12))
                .frame(height: 0.5)
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - PROGRESS INDICATORS
// ═══════════════════════════════════════════════════════════════

/// Circular XP progress ring with gradient stroke + glow
struct ProgressRing: View {
    let progress: Double
    var primary: Color = Color(hex: "#22d3ee")
    var accent: Color = Color(hex: "#67e8f9")
    var lineWidth: CGFloat = 4
    var size: CGFloat = 56
    
    var body: some View {
        ZStack {
            // Track
            Circle()
                .stroke(Color.white.opacity(0.04), lineWidth: lineWidth)
            
            // Inner glow track (very subtle)
            Circle()
                .stroke(primary.opacity(0.06), lineWidth: lineWidth + 4)
                .blur(radius: 2)
            
            // Progress arc
            Circle()
                .trim(from: 0, to: min(CGFloat(progress), 1.0))
                .stroke(
                    AngularGradient(
                        colors: [primary.opacity(0.4), primary, accent, primary.opacity(0.4)],
                        center: .center,
                        startAngle: .degrees(0),
                        endAngle: .degrees(360)
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            
            // Outer glow on the progress
            Circle()
                .trim(from: 0, to: min(CGFloat(progress), 1.0))
                .stroke(primary.opacity(0.3), lineWidth: lineWidth + 6)
                .blur(radius: 4)
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

/// Horizontal XP bar with gradient + bloom
struct XPBar: View {
    let progress: Double
    var primary: Color = Color(hex: "#22d3ee")
    var accent: Color = Color(hex: "#67e8f9")
    var height: CGFloat = 4
    
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Track
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Color.white.opacity(0.04))
                
                // Fill
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(
                        LinearGradient(
                            colors: [primary, accent],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * CGFloat(min(progress, 1.0)))
                    .shadow(color: primary.opacity(0.6), radius: 6)
                    .shadow(color: accent.opacity(0.3), radius: 12)
            }
        }
        .frame(height: height)
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - BADGES & INDICATORS
// ═══════════════════════════════════════════════════════════════

/// Rank badge with double glow halo
struct RankBadge: View {
    let rank: String
    var size: CGFloat = 20
    
    private var color: Color { SL.rankColor(rank) }
    
    var body: some View {
        Text(rank)
            .font(.system(size: size, weight: .black, design: .monospaced))
            .foregroundColor(color)
            .shadow(color: color.opacity(0.7), radius: 4)
            .shadow(color: color.opacity(0.4), radius: 10)
            .shadow(color: color.opacity(0.15), radius: 20)
    }
}

/// Streak flame with SF Symbol + count
struct StreakFlame: View {
    let streak: Int
    var size: CGFloat = 12
    
    private var color: Color {
        if streak >= 30 { return SL.danger }
        if streak >= 7 { return SL.fire }
        if streak >= 3 { return Color(hex: "#fbbf24") }
        return SL.textSub
    }
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: streak > 0 ? "flame.fill" : "flame")
                .font(.system(size: size * 0.7, weight: .bold))
                .foregroundColor(color)
                .shadow(color: color.opacity(streak > 0 ? 0.5 : 0), radius: 4)
            Text("\(streak)")
                .font(.system(size: size * 0.75, weight: .black, design: .monospaced))
                .foregroundColor(color)
        }
    }
}

/// Difficulty icon (SF Symbol with color)
struct DiffIcon: View {
    let diff: String
    var size: CGFloat = 10
    
    var body: some View {
        Image(systemName: SL.diffSymbol(diff))
            .font(.system(size: size, weight: .bold))
            .foregroundColor(SL.diffColor(diff))
            .shadow(color: SL.diffColor(diff).opacity(0.4), radius: 3)
    }
}

/// Category tag chip
struct CatTag: View {
    let cat: String
    var compact: Bool = false
    
    var body: some View {
        HStack(spacing: compact ? 2 : 3) {
            Image(systemName: SL.catSymbol(cat))
                .font(.system(size: compact ? 5 : 6, weight: .bold))
            if !compact {
                Text(cat.uppercased())
                    .font(.system(size: 6, weight: .heavy, design: .monospaced))
                    .tracking(0.5)
            }
        }
        .foregroundColor(SL.catColor(cat))
        .padding(.horizontal, compact ? 4 : 5)
        .padding(.vertical, 2)
        .background(
            RoundedRectangle(cornerRadius: 3, style: .continuous)
                .fill(SL.catColor(cat).opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 3, style: .continuous)
                        .stroke(SL.catColor(cat).opacity(0.15), lineWidth: 0.5)
                )
        )
    }
}

/// Stat pill with icon + value
struct StatPill: View {
    let label: String
    let value: Int
    
    private var color: Color { SL.catColor(label) }
    private var symbol: String { SL.catSymbol(label) }
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: symbol)
                .font(.system(size: 5, weight: .bold))
                .foregroundColor(color.opacity(0.7))
            Text("\(value)")
                .font(.system(size: 8, weight: .black, design: .monospaced))
                .foregroundColor(color)
        }
        .padding(.horizontal, 5)
        .padding(.vertical, 3)
        .background(
            RoundedRectangle(cornerRadius: 4, style: .continuous)
                .fill(color.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .stroke(color.opacity(0.12), lineWidth: 0.5)
                )
        )
    }
}

/// Gold indicator
struct GoldBadge: View {
    let amount: Int
    var size: CGFloat = 7
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "rhombus.fill")
                .font(.system(size: size * 0.7, weight: .bold))
                .foregroundColor(SL.gold)
                .shadow(color: SL.gold.opacity(0.3), radius: 2)
            Text("\(amount)")
                .font(.system(size: size, weight: .bold, design: .monospaced))
                .foregroundColor(SL.gold)
        }
    }
}

/// Active status dot
struct StatusDot: View {
    var color: Color = SL.success
    var size: CGFloat = 5
    
    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .shadow(color: color.opacity(0.6), radius: 3)
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - QUEST ROW
// ═══════════════════════════════════════════════════════════════

struct QuestRow: View {
    let quest: WidgetQuest
    var themeColor: Color = Color(hex: "#22d3ee")
    var compact: Bool = false
    
    private var diffColor: Color { SL.diffColor(quest.difficulty) }
    
    var body: some View {
        HStack(spacing: 0) {
            // Left accent bar
            RoundedRectangle(cornerRadius: 1)
                .fill(diffColor)
                .frame(width: 2)
                .shadow(color: diffColor.opacity(0.4), radius: 2)
                .padding(.vertical, 2)
            
            HStack(spacing: 6) {
                // Difficulty icon
                DiffIcon(diff: quest.difficulty, size: compact ? 8 : 9)
                
                // Title
                Text(quest.title)
                    .font(.system(size: compact ? 10 : 11, weight: .semibold))
                    .foregroundColor(SL.textMain)
                    .lineLimit(1)
                
                Spacer(minLength: 2)
                
                // Category tag
                CatTag(cat: quest.category, compact: compact)
                
                // Priority
                if quest.priority == "high" {
                    Text("!!")
                        .font(.system(size: 7, weight: .black, design: .monospaced))
                        .foregroundColor(SL.danger)
                        .shadow(color: SL.danger.opacity(0.3), radius: 2)
                }
            }
            .padding(.leading, 6)
        }
        .padding(.vertical, compact ? 3 : 4)
    }
}


// ═══════════════════════════════════════════════════════════════
// MARK: - COMPACT STATUS BAR
// ═══════════════════════════════════════════════════════════════

struct StatusBar: View {
    let data: WidgetData
    var compact: Bool = false
    
    private var primary: Color { Color(hex: data.theme.primary) }
    
    var body: some View {
        HStack(spacing: compact ? 4 : 6) {
            // Rank
            Text(data.rank)
                .font(.system(size: compact ? 8 : 9, weight: .black, design: .monospaced))
                .foregroundColor(SL.rankColor(data.rank))
                .shadow(color: SL.rankColor(data.rank).opacity(0.3), radius: 3)
            
            Circle().fill(SL.textGhost).frame(width: 2, height: 2)
            
            // Level
            Text("LV\(data.level)")
                .font(.system(size: compact ? 7 : 8, weight: .bold, design: .monospaced))
                .foregroundColor(SL.textSub)
            
            Circle().fill(SL.textGhost).frame(width: 2, height: 2)
            
            // Streak
            StreakFlame(streak: data.streak, size: compact ? 9 : 11)
            
            if !compact {
                Circle().fill(SL.textGhost).frame(width: 2, height: 2)
                GoldBadge(amount: data.gold, size: 7)
            }
        }
    }
}
