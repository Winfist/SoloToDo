// ─── SMALL WIDGET VIEW (2×2) ─────────────────────────────────
// "Hunter Emblem" — Premium circular XP ring with rank in center.
// Multi-glow effects, corner brackets, status dot.

import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
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
            
            VStack(spacing: 0) {
                
                // ── Top row: System label + status ──
                HStack(alignment: .top) {
                    SystemHeader(text: "SYS", color: accent, size: 5)
                    Spacer()
                    StatusDot(color: primary)
                }
                .padding(.bottom, 3)
                
                Spacer(minLength: 0)
                
                // ── Central: Progress Ring with Rank ──
                ZStack {
                    ProgressRing(
                        progress: xpPct,
                        primary: primary,
                        accent: accent,
                        lineWidth: 4.5,
                        size: 58
                    )
                    
                    VStack(spacing: 1) {
                        // Rank letter — the hero element
                        Text(data.rank)
                            .font(.system(size: 20, weight: .black, design: .monospaced))
                            .foregroundColor(rankCol)
                            .shadow(color: rankCol.opacity(0.6), radius: 6)
                            .shadow(color: rankCol.opacity(0.3), radius: 14)
                        
                        // XP percentage
                        Text("\(Int(xpPct * 100))%")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundColor(accent.opacity(0.8))
                    }
                }
                
                Spacer(minLength: 0)
                
                // ── Bottom: Streak + Level + Quests ──
                VStack(spacing: 4) {
                    StreakFlame(streak: data.streak, size: 13)
                    
                    HStack {
                        Text("LV \(data.level)")
                            .font(.system(size: 8, weight: .black, design: .monospaced))
                            .foregroundColor(SL.textMain)
                        
                        Spacer()
                        
                        HStack(spacing: 3) {
                            Image(systemName: "scroll.fill")
                                .font(.system(size: 6, weight: .bold))
                                .foregroundColor(primary.opacity(0.6))
                            Text("\(data.totalOpen)")
                                .font(.system(size: 8, weight: .bold, design: .monospaced))
                                .foregroundColor(SL.textMuted)
                        }
                    }
                }
            }
            .padding(11)
        }
    }
}
