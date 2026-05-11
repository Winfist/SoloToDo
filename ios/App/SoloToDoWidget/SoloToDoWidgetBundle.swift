// ─── SOLOTODO WIDGET BUNDLE ──────────────────────────────────
// @main entry point for the Widget Extension.
// Registers all widget families: Small, Medium, Large + Lock Screen.
// Quest Rotation: Generates multiple timeline entries to cycle
// through quest batches — configurable via widgetConfig.

import SwiftUI
import WidgetKit

// MARK: - Timeline Provider (with Quest Rotation)
struct SoloToDoProvider: TimelineProvider {
    func placeholder(in context: Context) -> SoloToDoEntry {
        SoloToDoEntry(date: Date(), data: placeholderData, questBatchIndex: 0)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (SoloToDoEntry) -> Void) {
        let data = loadWidgetData() ?? placeholderData
        completion(SoloToDoEntry(date: Date(), data: data, questBatchIndex: 0))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<SoloToDoEntry>) -> Void) {
        let fullData = loadWidgetData() ?? placeholderData
        let config = fullData.config
        
        // Determine max quests based on widget family
        let batchSize: Int
        switch context.family {
        case .systemLarge:
            batchSize = min(config.maxQuests, 6)
        case .systemMedium:
            batchSize = min(config.maxQuests, 3)
        default:
            batchSize = 1 // Small widget doesn't show quest list
        }
        
        let allQuests = fullData.quests
        var entries: [SoloToDoEntry] = []
        
        // If rotation is enabled and there are more quests than batch size
        if config.rotationEnabled && allQuests.count > batchSize && batchSize > 0 {
            let intervalMinutes = max(5, config.rotationIntervalMinutes)
            var batchIndex = 0
            var offset = 0
            
            while offset < allQuests.count {
                let batchEnd = min(offset + batchSize, allQuests.count)
                let batchQuests = Array(allQuests[offset..<batchEnd])
                
                var batchData = fullData
                batchData.quests = batchQuests
                
                let entryDate = Calendar.current.date(
                    byAdding: .minute,
                    value: intervalMinutes * batchIndex,
                    to: Date()
                )!
                
                entries.append(SoloToDoEntry(date: entryDate, data: batchData, questBatchIndex: batchIndex))
                
                batchIndex += 1
                offset += batchSize
            }
        } else {
            // No rotation — single entry with top quests
            var singleData = fullData
            if batchSize > 0 && batchSize < allQuests.count {
                singleData.quests = Array(allQuests.prefix(batchSize))
            }
            entries.append(SoloToDoEntry(date: Date(), data: singleData, questBatchIndex: 0))
        }
        
        // Refresh timeline after all entries have been shown (or 15 min)
        let totalDuration = config.rotationEnabled
            ? max(15, config.rotationIntervalMinutes * max(entries.count, 1))
            : 15
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: totalDuration, to: Date())!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Timeline Entry
struct SoloToDoEntry: TimelineEntry {
    let date: Date
    var data: WidgetData
    let questBatchIndex: Int
}

// MARK: - Main Widget (Home Screen)
struct SoloToDoMainWidget: Widget {
    let kind = "SoloToDoMainWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SoloToDoProvider()) { entry in
            if #available(iOS 17.0, *) {
                SoloToDoWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        Color(hex: entry.data.theme.bg)
                    }
            } else {
                SoloToDoWidgetEntryView(entry: entry)
                    .background(Color(hex: entry.data.theme.bg))
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
            if #available(iOS 17.0, *) {
                SoloToDoLockScreenEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        Color.clear
                    }
            } else {
                SoloToDoLockScreenEntryView(entry: entry)
                    .background(Color.clear)
            }
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
