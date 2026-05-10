// ─── SHARED STYLES ───────────────────────────────────────────
// Solo Leveling "System Interface" design tokens for all widgets.
// Scanlines, Edge Glow, Corner Brackets, Hunter-UI aesthetics.

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

// MARK: - Solo Leveling Design Tokens
struct SLDesign {
    // Core colors
    static let bgDark = Color(hex: "#06060e")
    static let bgCard = Color(hex: "#0a0a16")
    static let textPrimary = Color(hex: "#f8fafc")
    static let textSecondary = Color(hex: "#94a3b8")
    static let textTertiary = Color(hex: "#475569")
    static let textDim = Color(hex: "#334155")
    
    // Accent colors
    static let gold = Color(hex: "#f59e0b")
    static let fire = Color(hex: "#f97316")
    static let danger = Color(hex: "#ef4444")
    static let success = Color(hex: "#22c55e")
    
    // Stat colors
    static let strColor = Color(hex: "#ef4444")
    static let intColor = Color(hex: "#3b82f6")
    static let vitColor = Color(hex: "#22c55e")
    static let agiColor = Color(hex: "#f59e0b")
    static let chaColor = Color(hex: "#a855f7")
    
    // Category to Color
    static func categoryColor(_ cat: String) -> Color {
        switch cat.lowercased() {
        case "str": return strColor
        case "int": return intColor
        case "vit": return vitColor
        case "agi": return agiColor
        case "cha": return chaColor
        default: return textSecondary
        }
    }
    
    // Difficulty color
    static func difficultyColor(_ diff: String) -> Color {
        switch diff.lowercased() {
        case "boss": return Color(hex: "#ef4444")
        case "hard": return Color(hex: "#a78bfa")
        case "normal": return Color(hex: "#22d3ee")
        default: return Color(hex: "#6b7280")
        }
    }
    
    // Difficulty icon
    static func difficultyIcon(_ diff: String) -> String {
        switch diff.lowercased() {
        case "boss": return "♛"
        case "hard": return "★"
        case "normal": return "◆"
        default: return "◇"
        }
    }
    
    // Rank color
    static func rankColor(_ rank: String) -> Color {
        switch rank.uppercased() {
        case "SSS": return Color(hex: "#e879f9")
        case "S": return Color(hex: "#ef4444")
        case "A": return Color(hex: "#f59e0b")
        case "B": return Color(hex: "#a78bfa")
        case "C": return Color(hex: "#34d399")
        case "D": return Color(hex: "#22d3ee")
        default: return Color(hex: "#6b7280")
        }
    }
}

// MARK: - Scanline Background
struct ScanlineBackground: View {
    var primaryColor: Color = Color(hex: "#22d3ee")
    
    var body: some View {
        ZStack {
            // Dark background
            LinearGradient(
                colors: [SLDesign.bgDark, SLDesign.bgCard],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // Scanlines overlay
            GeometryReader { geo in
                Path { path in
                    let spacing: CGFloat = 4
                    var y: CGFloat = 0
                    while y < geo.size.height {
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: geo.size.width, y: y))
                        y += spacing
                    }
                }
                .stroke(Color.white.opacity(0.03), lineWidth: 0.5)
            }
            
            // Edge glow (top)
            VStack {
                LinearGradient(
                    colors: [.clear, primaryColor, .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(height: 1)
                .opacity(0.6)
                Spacer()
            }
        }
    }
}

// MARK: - System Label (Corner Brackets)
struct SystemLabel: View {
    let text: String
    var color: Color = Color(hex: "#22d3ee")
    var size: CGFloat = 8
    
    var body: some View {
        Text("「\(text)」")
            .font(.system(size: size, weight: .heavy, design: .monospaced))
            .foregroundColor(color)
            .tracking(2)
    }
}

// MARK: - XP Progress Bar
struct XPBar: View {
    let progress: Double
    var primaryColor: Color = Color(hex: "#22d3ee")
    var accentColor: Color = Color(hex: "#67e8f9")
    var height: CGFloat = 4
    
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Color.white.opacity(0.08))
                
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(
                        LinearGradient(
                            colors: [primaryColor, accentColor],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * CGFloat(min(progress, 1.0)))
                    .shadow(color: primaryColor.opacity(0.5), radius: 4)
            }
        }
        .frame(height: height)
    }
}

// MARK: - Difficulty Badge
struct DifficultyBadge: View {
    let difficulty: String
    
    var body: some View {
        Text(SLDesign.difficultyIcon(difficulty))
            .font(.system(size: 8, weight: .bold))
            .foregroundColor(SLDesign.difficultyColor(difficulty))
    }
}

// MARK: - Category Tag
struct CategoryTag: View {
    let category: String
    
    var body: some View {
        Text(category.uppercased())
            .font(.system(size: 7, weight: .bold, design: .monospaced))
            .foregroundColor(SLDesign.categoryColor(category))
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(SLDesign.categoryColor(category).opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}

// MARK: - Stat Pill
struct StatPill: View {
    let label: String
    let value: Int
    var color: Color
    
    var body: some View {
        HStack(spacing: 2) {
            Text(label)
                .font(.system(size: 6, weight: .bold, design: .monospaced))
                .foregroundColor(color.opacity(0.7))
            Text("\(value)")
                .font(.system(size: 8, weight: .black, design: .monospaced))
                .foregroundColor(color)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 3))
    }
}

// MARK: - Streak Flame
struct StreakFlame: View {
    let streak: Int
    var size: CGFloat = 20
    
    var body: some View {
        HStack(spacing: 4) {
            Text("🔥")
                .font(.system(size: size))
            Text("\(streak)")
                .font(.system(size: size, weight: .black, design: .serif))
                .foregroundColor(SLDesign.fire)
                .shadow(color: SLDesign.fire.opacity(0.5), radius: 4)
        }
    }
}
