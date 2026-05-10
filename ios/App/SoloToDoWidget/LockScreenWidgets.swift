// ─── LOCK SCREEN WIDGETS ─────────────────────────────────────
// Circular: Streak count
// Rectangular: Next quest + streak
// Inline: Streak + quest count

import SwiftUI
import WidgetKit

// MARK: - Lock Screen Circular (Streak)
struct LockScreenCircularView: View {
    let data: WidgetData
    
    var body: some View {
        ZStack {
            // Progress ring
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 3)
            
            Circle()
                .trim(from: 0, to: min(Double(data.streak) / 30.0, 1.0))
                .stroke(
                    Color(hex: data.theme.primary),
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            
            // Center content
            VStack(spacing: 0) {
                Text("🔥")
                    .font(.system(size: 14))
                Text("\(data.streak)")
                    .font(.system(size: 16, weight: .black, design: .monospaced))
                    .foregroundColor(.white)
            }
        }
    }
}

// MARK: - Lock Screen Rectangular (Next Quest)
struct LockScreenRectangularView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let quest = data.quests.first {
                HStack(spacing: 4) {
                    Text(SLDesign.difficultyIcon(quest.difficulty))
                        .font(.system(size: 9))
                    Text(quest.title)
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(1)
                }
                
                HStack(spacing: 6) {
                    Text("🔥\(data.streak)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                    Text("·")
                        .foregroundColor(.secondary)
                    Text("LVL\(data.level)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                    Text("·")
                        .foregroundColor(.secondary)
                    Text("[\(quest.category.uppercased())]")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                }
                .foregroundColor(.secondary)
            } else {
                Text("Alle Quests erledigt ✓")
                    .font(.system(size: 12, weight: .semibold))
                HStack(spacing: 6) {
                    Text("🔥\(data.streak)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                    Text("·")
                    Text("LVL\(data.level)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                }
                .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Lock Screen Inline (Streak + Quests)
struct LockScreenInlineView: View {
    let data: WidgetData
    
    var body: some View {
        HStack(spacing: 4) {
            Text("🔥\(data.streak)")
                .font(.system(size: 12, weight: .bold, design: .monospaced))
            Text("·")
                .foregroundColor(.secondary)
            Text("\(data.totalOpen) Quests")
                .font(.system(size: 12, weight: .semibold))
        }
    }
}
