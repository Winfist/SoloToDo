// ─── LOCK SCREEN WIDGETS ─────────────────────────────────────
// System renders these monochrome/tinted, so design for legibility
// without color. Circular: XP ring + level. Rectangular: focus
// quest + next step + status. Inline: streak + open count.

import SwiftUI
import WidgetKit

// MARK: - Circular (XP ring + level)
struct LockScreenCircularView: View {
    let data: WidgetData
    private var xpPct: Double {
        guard data.xpNeeded > 0 else { return 0 }
        return Double(data.xp) / Double(data.xpNeeded)
    }
    var body: some View {
        ZStack {
            XPRing(progress: xpPct, accent: .white, size: 58, line: 4)
            VStack(spacing: 0) {
                Text("\(data.level)")
                    .font(.system(size: 19, weight: .heavy, design: .rounded))
                Text("RANG \(data.rank)")
                    .font(.system(size: 7, weight: .semibold, design: .monospaced))
                    .opacity(0.7)
            }
            .foregroundColor(.white)
        }
    }
}

// MARK: - Rectangular (focus quest + next step)
struct LockScreenRectangularView: View {
    let data: WidgetData
    private var quest: WidgetQuest? { data.quests.first }
    private var step: String? {
        let s = quest?.nextStep
        return (s?.isEmpty == false) ? s : nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let quest = quest {
                HStack(spacing: 5) {
                    Image(systemName: "scope")
                        .font(.system(size: 10, weight: .semibold))
                    Text(quest.title)
                        .font(.system(size: 14, weight: .semibold))
                        .lineLimit(1)
                }
                if let step = step {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.turn.down.right")
                            .font(.system(size: 8, weight: .semibold))
                        Text(step)
                            .font(.system(size: 12, weight: .regular))
                            .lineLimit(1)
                    }
                    .opacity(0.8)
                }
                Text("△ \(data.streak) · LV \(data.level) · \(data.totalOpen) OFFEN")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .opacity(0.62)
            } else {
                HStack(spacing: 5) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 11))
                    Text("Alle Quests erledigt")
                        .font(.system(size: 14, weight: .semibold))
                }
                Text("△ \(data.streak) · LV \(data.level)")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .opacity(0.62)
            }
        }
    }
}

// MARK: - Inline (above the clock)
struct LockScreenInlineView: View {
    let data: WidgetData
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "flame.fill")
            Text("\(data.streak) · \(data.totalOpen) Quests offen")
        }
    }
}

// ─── STEPS LOCK SCREEN ───────────────────────────────────────
// Dedicated steps accessory. Rendered monochrome/tinted by the
// system, so progress is conveyed by ring fill / bar length, not
// color. Goal matches the app (WIDGET_STEP_GOAL = 10000).

private func stepsProgress(_ steps: Int) -> Double {
    guard WIDGET_STEP_GOAL > 0 else { return 0 }
    return min(1, max(0, Double(steps) / Double(WIDGET_STEP_GOAL)))
}

// Compact step label: 8.420 → "8,4k" for the tight circular center.
private func stepsShort(_ n: Int) -> String {
    if n >= 1000 {
        let k = Double(n) / 1000
        return String(format: "%.1fk", k).replacingOccurrences(of: ".", with: ",")
    }
    return "\(max(0, n))"
}

struct StepsLockScreenCircularView: View {
    let data: WidgetData
    private var steps: Int { data.health.steps }
    var body: some View {
        ZStack {
            XPRing(progress: stepsProgress(steps), accent: .white, size: 58, line: 4)
            VStack(spacing: 0) {
                Image(systemName: "figure.walk")
                    .font(.system(size: 11, weight: .bold))
                Text(stepsShort(steps))
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
            }
            .foregroundColor(.white)
        }
    }
}

struct StepsLockScreenRectangularView: View {
    let data: WidgetData
    private var steps: Int { data.health.steps }
    private var reached: Bool { steps >= WIDGET_STEP_GOAL }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 5) {
                Image(systemName: "figure.walk")
                    .font(.system(size: 12, weight: .bold))
                Text(widgetFormatSteps(steps))
                    .font(.system(size: 16, weight: .heavy, design: .rounded))
                Text("Schritte")
                    .font(.system(size: 11, weight: .regular))
                    .opacity(0.7)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.22))
                    Capsule()
                        .fill(Color.white)
                        .frame(width: max(3, geo.size.width * stepsProgress(steps)))
                }
            }
            .frame(height: 4)
            Text(reached ? "Tagesziel erreicht ✓" : "von \(widgetFormatSteps(WIDGET_STEP_GOAL))")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .opacity(0.62)
        }
    }
}

struct StepsLockScreenInlineView: View {
    let data: WidgetData
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "figure.walk")
            Text("\(widgetFormatSteps(data.health.steps)) Schritte")
        }
    }
}
