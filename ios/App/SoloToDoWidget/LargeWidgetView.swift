// ─── LARGE WIDGET VIEW (4×4) ─────────────────────────────────
// "Full System Dashboard" — Quests, Habits, Micro-Habits, Stats.
// Solo Leveling System Interface style.

import SwiftUI
import WidgetKit

struct LargeWidgetView: View {
    let data: WidgetData
    
    private var primary: Color { Color(hex: data.theme.primary) }
    private var accent: Color { Color(hex: data.theme.accent) }
    private var xpProgress: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    
    var body: some View {
        ZStack {
            ScanlineBackground(primaryColor: primary)
            
            VStack(alignment: .leading, spacing: 6) {
                // ── Header ──
                HStack {
                    SystemLabel(text: "SYSTEM INTERFACE", color: accent, size: 7)
                    Spacer()
                    Text("LVL \(data.level)")
                        .font(.system(size: 10, weight: .black, design: .monospaced))
                        .foregroundColor(SLDesign.textPrimary)
                }
                
                // Hunter name + Streak + XP
                HStack(spacing: 8) {
                    Text(data.hunterName)
                        .font(.system(size: 12, weight: .bold, design: .serif))
                        .foregroundColor(SLDesign.textPrimary)
                    Spacer()
                    StreakFlame(streak: data.streak, size: 12)
                }
                
                XPBar(progress: xpProgress, primaryColor: primary, accentColor: accent)
                    .padding(.bottom, 2)
                
                // ── Quests Section ──
                SectionDivider(text: "AKTIVE QUESTS")
                
                if data.quests.isEmpty {
                    Text("Keine offenen Quests")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(SLDesign.textDim)
                        .italic()
                        .padding(.vertical, 2)
                } else {
                    ForEach(data.quests.prefix(data.config.maxQuests)) { quest in
                        QuestRow(quest: quest)
                    }
                }
                
                // ── Habits Section ──
                if !data.habits.isEmpty {
                    SectionDivider(text: "HABITS")
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 4) {
                        ForEach(Array(data.habits.prefix(6).enumerated()), id: \.offset) { _, habit in
                            HStack(spacing: 4) {
                                Text(habit.completed ? "✓" : "○")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(habit.completed ? SLDesign.success : SLDesign.textTertiary)
                                Text(habit.name)
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(habit.completed ? SLDesign.textSecondary : SLDesign.textTertiary)
                                    .lineLimit(1)
                                Spacer()
                            }
                        }
                    }
                }
                
                // ── Micro-Habits Section ──
                if !data.microHabits.isEmpty {
                    SectionDivider(text: "MICRO-HABITS")
                    
                    HStack(spacing: 6) {
                        ForEach(data.microHabits.prefix(5), id: \.key) { micro in
                            VStack(spacing: 2) {
                                Text(micro.icon)
                                    .font(.system(size: 12))
                                Text("\(micro.current)/\(micro.target)")
                                    .font(.system(size: 7, weight: .bold, design: .monospaced))
                                    .foregroundColor(micro.current >= micro.target ? SLDesign.success : SLDesign.textSecondary)
                            }
                        }
                        Spacer()
                    }
                }
                
                Spacer(minLength: 0)
                
                // ── Stats Footer ──
                HStack(spacing: 4) {
                    StatPill(label: "STR", value: data.stats.str, color: SLDesign.strColor)
                    StatPill(label: "INT", value: data.stats.intelligence, color: SLDesign.intColor)
                    StatPill(label: "VIT", value: data.stats.vit, color: SLDesign.vitColor)
                    StatPill(label: "AGI", value: data.stats.agi, color: SLDesign.agiColor)
                    StatPill(label: "CHA", value: data.stats.cha, color: SLDesign.chaColor)
                }
            }
            .padding(14)
        }
    }
}

// MARK: - Section Divider
struct SectionDivider: View {
    let text: String
    
    var body: some View {
        HStack(spacing: 4) {
            Text("──")
                .font(.system(size: 6, design: .monospaced))
                .foregroundColor(SLDesign.textDim)
            Text(text)
                .font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundColor(SLDesign.textTertiary)
                .tracking(2)
            Spacer()
            Text("──")
                .font(.system(size: 6, design: .monospaced))
                .foregroundColor(SLDesign.textDim)
        }
        .padding(.top, 2)
    }
}
