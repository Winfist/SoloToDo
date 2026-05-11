// ─── LARGE WIDGET VIEW (4×4) ─────────────────────────────────
// "Full System Dashboard" — The showstopper.
// Multi-zone layout: Header → XP → Quests → Habits → Stats.
// Glass panels, glow dividers, premium spacing.

import SwiftUI
import WidgetKit

struct LargeWidgetView: View {
    let data: WidgetData
    
    private var primary: Color { Color(hex: data.theme.primary) }
    private var accent: Color { Color(hex: data.theme.accent) }
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    private var rankCol: Color { SL.rankColor(data.rank) }
    
    var body: some View {
        ZStack {
            SystemBackground(themeColor: primary)
            
            VStack(alignment: .leading, spacing: 0) {
                
                // ═══════════════════════════════════
                // ZONE 1: HEADER — Hunter Identity
                // ═══════════════════════════════════
                
                HStack(alignment: .center) {
                    SystemHeader(text: "SYSTEM", color: accent, size: 6)
                    Spacer()
                    StatusDot(color: primary)
                    RankBadge(rank: data.rank, size: 12)
                }
                
                // Hunter name + info
                HStack(alignment: .bottom, spacing: 8) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(data.hunterName)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(SL.textBright)
                        
                        Text("LEVEL \(data.level)")
                            .font(.system(size: 8, weight: .black, design: .monospaced))
                            .foregroundColor(SL.textMuted)
                            .tracking(1.5)
                    }
                    
                    Spacer()
                    
                    StreakFlame(streak: data.streak, size: 14)
                    GoldBadge(amount: data.gold, size: 8)
                }
                .padding(.top, 2)
                
                // XP Bar
                HStack(spacing: 6) {
                    XPBar(progress: xpPct, primary: primary, accent: accent, height: 4)
                    Text("\(data.xp)/\(data.xpNeeded)")
                        .font(.system(size: 6, weight: .bold, design: .monospaced))
                        .foregroundColor(SL.textGhost)
                }
                .padding(.top, 5)
                .padding(.bottom, 4)
                
                GlowDivider(color: primary, opacity: 0.4)
                
                
                // ═══════════════════════════════════
                // ZONE 2: ACTIVE QUESTS
                // ═══════════════════════════════════
                
                SectionTitle(text: "AKTIVE QUESTS", color: SL.textGhost)
                    .padding(.top, 4)
                    .padding(.bottom, 3)
                
                GlassPanel(color: primary, cornerRadius: 8, padding: 6, intensity: 0.7) {
                    VStack(spacing: 0) {
                        if data.quests.isEmpty {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.system(size: 11))
                                    .foregroundColor(SL.success)
                                    .shadow(color: SL.success.opacity(0.3), radius: 3)
                                Text("Keine offenen Quests")
                                    .font(.system(size: 9, weight: .medium))
                                    .foregroundColor(SL.textGhost)
                                    .italic()
                            }
                            .padding(.vertical, 6)
                        } else {
                            let questLimit = min(data.config.maxQuests, 5)
                            let displayQuests = Array(data.quests.prefix(questLimit > 0 ? questLimit : 5))
                            
                            ForEach(Array(displayQuests.enumerated()), id: \.element.id) { index, quest in
                                QuestRow(quest: quest, themeColor: primary, compact: true)
                                if index < displayQuests.count - 1 {
                                    Rectangle()
                                        .fill(Color.white.opacity(0.025))
                                        .frame(height: 0.5)
                                        .padding(.leading, 8)
                                }
                            }
                            
                            // Overflow indicator
                            if data.totalOpen > questLimit {
                                HStack {
                                    Spacer()
                                    Text("+\(data.totalOpen - questLimit) weitere")
                                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                                        .foregroundColor(primary.opacity(0.4))
                                        .tracking(0.5)
                                }
                                .padding(.top, 2)
                            }
                        }
                    }
                }
                
                
                // ═══════════════════════════════════
                // ZONE 3: HABITS (if data exists)
                // ═══════════════════════════════════
                
                if !data.habits.isEmpty {
                    SectionTitle(text: "HABITS  \(data.habitsCompleted)/\(data.habitsTotal)", color: SL.textGhost)
                        .padding(.top, 5)
                        .padding(.bottom, 3)
                    
                    // 2-column habit grid
                    let cols = [GridItem(.flexible()), GridItem(.flexible())]
                    LazyVGrid(columns: cols, spacing: 2) {
                        ForEach(Array(data.habits.prefix(6).enumerated()), id: \.offset) { _, habit in
                            HStack(spacing: 4) {
                                Image(systemName: habit.completed ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundColor(habit.completed ? SL.success : SL.textGhost)
                                    .shadow(color: habit.completed ? SL.success.opacity(0.3) : Color.clear, radius: 2)
                                
                                Text(habit.name)
                                    .font(.system(size: 8, weight: habit.completed ? .semibold : .regular))
                                    .foregroundColor(habit.completed ? SL.textSub : SL.textGhost)
                                    .lineLimit(1)
                                    .strikethrough(habit.completed, color: SL.textGhost)
                                
                                Spacer()
                            }
                        }
                    }
                }
                
                
                // ═══════════════════════════════════
                // ZONE 4: MICRO-HABITS (progress dots)
                // ═══════════════════════════════════
                
                if !data.microHabits.isEmpty {
                    SectionTitle(text: "MICRO", color: SL.textGhost)
                        .padding(.top, 4)
                        .padding(.bottom, 2)
                    
                    HStack(spacing: 10) {
                        ForEach(data.microHabits.prefix(4), id: \.key) { micro in
                            VStack(spacing: 2) {
                                // Progress dots
                                HStack(spacing: 1.5) {
                                    ForEach(0..<min(micro.target, 5), id: \.self) { i in
                                        Circle()
                                            .fill(i < micro.current ? primary : Color.white.opacity(0.06))
                                            .frame(width: 4, height: 4)
                                            .shadow(color: i < micro.current ? primary.opacity(0.3) : Color.clear, radius: 2)
                                    }
                                }
                                Text(micro.label)
                                    .font(.system(size: 5.5, weight: .bold, design: .monospaced))
                                    .foregroundColor(micro.current >= micro.target ? SL.success : SL.textMuted)
                                    .lineLimit(1)
                            }
                        }
                        Spacer()
                    }
                }
                
                
                Spacer(minLength: 0)
                
                
                // ═══════════════════════════════════
                // ZONE 5: STATS FOOTER
                // ═══════════════════════════════════
                
                GlowDivider(color: primary, opacity: 0.2)
                    .padding(.bottom, 3)
                
                HStack(spacing: 4) {
                    StatPill(label: "STR", value: data.stats.str)
                    StatPill(label: "INT", value: data.stats.intelligence)
                    StatPill(label: "VIT", value: data.stats.vit)
                    StatPill(label: "AGI", value: data.stats.agi)
                    StatPill(label: "CHA", value: data.stats.cha)
                }
            }
            .padding(13)
        }
    }
}
