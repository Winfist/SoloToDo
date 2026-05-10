// ─── MEDIUM WIDGET VIEW (4×2) ────────────────────────────────
// "Quest Board" — Shows top quests with difficulty badges.
// Solo Leveling System Interface style.

import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let data: WidgetData
    
    private var primary: Color { Color(hex: data.theme.primary) }
    private var accent: Color { Color(hex: data.theme.accent) }
    
    var body: some View {
        ZStack {
            ScanlineBackground(primaryColor: primary)
            
            VStack(alignment: .leading, spacing: 4) {
                // Header row
                HStack(alignment: .center) {
                    SystemLabel(text: "QUEST BOARD", color: accent, size: 7)
                    Spacer()
                    HStack(spacing: 6) {
                        Text("LVL \(data.level)")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundColor(SLDesign.textSecondary)
                        StreakFlame(streak: data.streak, size: 10)
                        Text("♦ \(data.gold)")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundColor(SLDesign.gold)
                    }
                }
                
                // Separator
                Rectangle()
                    .fill(primary.opacity(0.3))
                    .frame(height: 0.5)
                
                // Quest list
                if data.quests.isEmpty {
                    Spacer()
                    HStack {
                        Spacer()
                        VStack(spacing: 4) {
                            Text("✓")
                                .font(.system(size: 16))
                                .foregroundColor(SLDesign.success)
                            Text("ALLE QUESTS ERLEDIGT")
                                .font(.system(size: 8, weight: .bold, design: .monospaced))
                                .foregroundColor(SLDesign.textDim)
                                .tracking(2)
                        }
                        Spacer()
                    }
                    Spacer()
                } else {
                    ForEach(data.quests.prefix(data.config.maxQuests)) { quest in
                        QuestRow(quest: quest)
                    }
                }
                
                Spacer(minLength: 0)
                
                // Footer stats
                HStack(spacing: 4) {
                    Text("▸ Habits: \(data.habitsCompleted)/\(data.habitsTotal)")
                        .font(.system(size: 7, weight: .semibold, design: .monospaced))
                        .foregroundColor(SLDesign.textTertiary)
                    Spacer()
                    Text("▸ Heute: \(data.completedToday) erledigt")
                        .font(.system(size: 7, weight: .semibold, design: .monospaced))
                        .foregroundColor(SLDesign.textTertiary)
                }
            }
            .padding(12)
        }
    }
}

// MARK: - Quest Row
struct QuestRow: View {
    let quest: WidgetQuest
    
    var body: some View {
        HStack(spacing: 6) {
            // Difficulty indicator
            DifficultyBadge(difficulty: quest.difficulty)
            
            // Title
            Text(quest.title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(SLDesign.textPrimary)
                .lineLimit(1)
            
            Spacer()
            
            // Category tag
            CategoryTag(category: quest.category)
            
            // Difficulty label
            Text(quest.difficulty.capitalized)
                .font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundColor(SLDesign.difficultyColor(quest.difficulty))
        }
        .padding(.vertical, 2)
    }
}
