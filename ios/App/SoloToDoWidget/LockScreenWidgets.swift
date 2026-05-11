// ─── LOCK SCREEN WIDGETS ─────────────────────────────────────
// Circular: XP Ring + Level (tight, clean)
// Rectangular: Focus quest + streak info
// Inline: Streak flame + quest count

import SwiftUI
import WidgetKit

// MARK: - Lock Screen Circular
struct LockScreenCircularView: View {
    let data: WidgetData
    
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    
    var body: some View {
        ZStack {
            // Track
            Circle()
                .stroke(Color.white.opacity(0.12), lineWidth: 3)
            
            // Progress
            Circle()
                .trim(from: 0, to: min(xpPct, 1.0))
                .stroke(
                    Color(hex: data.theme.primary),
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            
            VStack(spacing: 0) {
                Text("\(data.level)")
                    .font(.system(size: 20, weight: .black, design: .monospaced))
                    .foregroundColor(.white)
                Text(data.rank)
                    .font(.system(size: 7, weight: .heavy, design: .monospaced))
                    .foregroundColor(.white.opacity(0.6))
            }
        }
    }
}

// MARK: - Lock Screen Rectangular
struct LockScreenRectangularView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let quest = data.quests.first {
                HStack(spacing: 4) {
                    Image(systemName: SL.diffSymbol(quest.difficulty))
                        .font(.system(size: 9, weight: .bold))
                    Text(quest.title)
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(1)
                }
                
                HStack(spacing: 6) {
                    HStack(spacing: 2) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 8))
                        Text("\(data.streak)")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                    }
                    Text("·").foregroundColor(.secondary)
                    Text("LV\(data.level)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                    Text("·").foregroundColor(.secondary)
                    Text("[\(quest.category.uppercased())]")
                        .font(.system(size: 8, weight: .heavy, design: .monospaced))
                }
                .foregroundColor(.secondary)
            } else {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 10))
                    Text("Alle Quests erledigt")
                        .font(.system(size: 12, weight: .semibold))
                }
                HStack(spacing: 6) {
                    HStack(spacing: 2) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 8))
                        Text("\(data.streak)")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                    }
                    Text("·")
                    Text("LV\(data.level)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                }
                .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Lock Screen Inline
struct LockScreenInlineView: View {
    let data: WidgetData
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "flame.fill")
                .font(.system(size: 10, weight: .bold))
            Text("\(data.streak)")
                .font(.system(size: 12, weight: .bold, design: .monospaced))
            Text("·").foregroundColor(.secondary)
            Text("\(data.totalOpen) Quests")
                .font(.system(size: 12, weight: .semibold))
        }
    }
}
