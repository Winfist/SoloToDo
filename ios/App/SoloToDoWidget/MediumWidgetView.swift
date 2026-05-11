// ─── MEDIUM WIDGET VIEW (4×2) ────────────────────────────────
// "Quest Board" — Top quests with left accent bars, glass panels.
// Header: StatusBar. Each quest has difficulty color accent strip.

import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let data: WidgetData
    
    private var primary: Color { Color(hex: data.theme.primary) }
    private var accent: Color { Color(hex: data.theme.accent) }
    
    var body: some View {
        ZStack {
            SystemBackground(themeColor: primary)
            
            VStack(alignment: .leading, spacing: 0) {
                
                // ── Header ──
                HStack(alignment: .center) {
                    SystemHeader(text: "QUEST BOARD", color: accent, size: 6)
                    Spacer()
                    StatusBar(data: data, compact: true)
                }
                .padding(.bottom, 4)
                
                // Glowing separator
                GlowDivider(color: primary, opacity: 0.5)
                    .padding(.bottom, 4)
                
                // ── Quest List ──
                if data.quests.isEmpty {
                    // Empty state — premium
                    Spacer()
                    HStack {
                        Spacer()
                        VStack(spacing: 5) {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(SL.success)
                                .shadow(color: SL.success.opacity(0.4), radius: 6)
                            Text("ALLE QUESTS ERLEDIGT")
                                .font(.system(size: 7, weight: .bold, design: .monospaced))
                                .foregroundColor(SL.textGhost)
                                .tracking(2)
                        }
                        Spacer()
                    }
                    Spacer()
                } else {
                    GlassPanel(color: primary, cornerRadius: 8, padding: 6, intensity: 0.8) {
                        VStack(spacing: 0) {
                            ForEach(Array(data.quests.prefix(3).enumerated()), id: \.element.id) { index, quest in
                                QuestRow(quest: quest, themeColor: primary, compact: true)
                                if index < min(data.quests.count, 3) - 1 {
                                    Rectangle()
                                        .fill(Color.white.opacity(0.03))
                                        .frame(height: 0.5)
                                        .padding(.leading, 8)
                                }
                            }
                        }
                    }
                }
                
                Spacer(minLength: 0)
                
                // ── Footer ──
                HStack(spacing: 0) {
                    // Habits progress
                    HStack(spacing: 3) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(data.habitsCompleted >= data.habitsTotal && data.habitsTotal > 0 ? SL.success : SL.textGhost)
                        Text("\(data.habitsCompleted)/\(data.habitsTotal)")
                            .font(.system(size: 7, weight: .bold, design: .monospaced))
                            .foregroundColor(SL.textMuted)
                    }
                    
                    Spacer()
                    
                    // Completed today
                    HStack(spacing: 3) {
                        Image(systemName: "flag.fill")
                            .font(.system(size: 6, weight: .bold))
                            .foregroundColor(primary.opacity(0.5))
                        Text("\(data.completedToday) DONE")
                            .font(.system(size: 7, weight: .bold, design: .monospaced))
                            .foregroundColor(SL.textGhost)
                            .tracking(0.5)
                    }
                    
                    // +N more indicator
                    if data.totalOpen > 3 {
                        Spacer()
                        Text("+\(data.totalOpen - 3)")
                            .font(.system(size: 7, weight: .bold, design: .monospaced))
                            .foregroundColor(primary.opacity(0.5))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(primary.opacity(0.06))
                            )
                    }
                }
                .padding(.top, 3)
            }
            .padding(12)
        }
    }
}
