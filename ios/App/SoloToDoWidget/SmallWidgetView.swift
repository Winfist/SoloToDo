// ─── SMALL WIDGET VIEW (2×2) ─────────────────────────────────
// "Hunter Status Card" — Streak, Level, XP at a glance.
// Solo Leveling System Interface style.

import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
    let data: WidgetData
    
    private var primary: Color {
        Color(hex: data.theme.primary)
    }
    private var accent: Color {
        Color(hex: data.theme.accent)
    }
    private var xpProgress: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    
    var body: some View {
        ZStack {
            ScanlineBackground(primaryColor: primary)
            
            VStack(alignment: .leading, spacing: 6) {
                // Header
                HStack {
                    SystemLabel(text: "HUNTER INTERFACE", color: accent, size: 6)
                    Spacer()
                }
                
                Spacer()
                
                // Streak (centered, prominent)
                HStack {
                    Spacer()
                    StreakFlame(streak: data.streak, size: 24)
                    Spacer()
                }
                
                // Streak label
                HStack {
                    Spacer()
                    Text("STREAK")
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .foregroundColor(SLDesign.textTertiary)
                        .tracking(3)
                    Spacer()
                }
                
                Spacer()
                
                // Level + XP Bar
                VStack(spacing: 4) {
                    HStack {
                        Text("LVL \(data.level)")
                            .font(.system(size: 9, weight: .black, design: .monospaced))
                            .foregroundColor(SLDesign.textPrimary)
                        Spacer()
                        Text("\(Int(xpProgress * 100))%")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundColor(accent)
                    }
                    XPBar(progress: xpProgress, primaryColor: primary, accentColor: accent)
                }
                
                // Quest count
                Text("\(data.totalOpen) QUESTS OFFEN")
                    .font(.system(size: 7, weight: .bold, design: .monospaced))
                    .foregroundColor(SLDesign.textDim)
                    .tracking(1)
            }
            .padding(12)
        }
    }
}
