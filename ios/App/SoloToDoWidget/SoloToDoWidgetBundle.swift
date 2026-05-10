// ─── SOLOTODO WIDGET BUNDLE ──────────────────────────────────
// @main entry point for the Widget Extension.
// Registers all widget families: Small, Medium, Large + Lock Screen.

import SwiftUI
import WidgetKit

// MARK: - Timeline Provider
struct SoloToDoProvider: TimelineProvider {
    func placeholder(in context: Context) -> SoloToDoEntry {
        SoloToDoEntry(date: Date(), data: placeholderData)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (SoloToDoEntry) -> Void) {
        let data = loadWidgetData() ?? placeholderData
        completion(SoloToDoEntry(date: Date(), data: data))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<SoloToDoEntry>) -> Void) {
        let data = loadWidgetData() ?? placeholderData
        let entry = SoloToDoEntry(date: Date(), data: data)
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Timeline Entry
struct SoloToDoEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Main Widget (Home Screen)
struct SoloToDoMainWidget: Widget {
    let kind = "SoloToDoMainWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SoloToDoProvider()) { entry in
            SoloToDoWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(hex: entry.data.theme.bg)
                }
        }
        .configurationDisplayName("SoloToDo")
        .description("Dein Hunter Dashboard — Quests, Streak, Habits auf einen Blick.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Lock Screen Widget
struct SoloToDoLockScreenWidget: Widget {
    let kind = "SoloToDoLockScreen"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SoloToDoProvider()) { entry in
            SoloToDoLockScreenEntryView(entry: entry)
        }
        .configurationDisplayName("SoloToDo Lock")
        .description("Streak & Quests auf dem Sperrbildschirm.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Home Screen Entry View (routes to correct size)
struct SoloToDoWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: SoloToDoEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        case .systemMedium:
            MediumWidgetView(data: entry.data)
        case .systemLarge:
            LargeWidgetView(data: entry.data)
        default:
            SmallWidgetView(data: entry.data)
        }
    }
}

// MARK: - Lock Screen Entry View (routes to correct type)
struct SoloToDoLockScreenEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: SoloToDoEntry
    
    var body: some View {
        switch family {
        case .accessoryCircular:
            LockScreenCircularView(data: entry.data)
        case .accessoryRectangular:
            LockScreenRectangularView(data: entry.data)
        case .accessoryInline:
            LockScreenInlineView(data: entry.data)
        default:
            LockScreenInlineView(data: entry.data)
        }
    }
}

// MARK: - Widget Bundle
@main
struct SoloToDoWidgetBundle: WidgetBundle {
    var body: some Widget {
        SoloToDoMainWidget()
        SoloToDoLockScreenWidget()
    }
}
