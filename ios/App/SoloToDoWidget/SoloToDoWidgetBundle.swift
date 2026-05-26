import AppIntents
import SwiftUI
import WidgetKit

struct SoloToDoProvider: TimelineProvider {
    func placeholder(in context: Context) -> SoloToDoEntry {
        SoloToDoEntry(date: Date(), data: placeholderData, questBatchIndex: 0, contentMode: .quests)
    }

    func getSnapshot(in context: Context, completion: @escaping (SoloToDoEntry) -> Void) {
        let data = loadWidgetData() ?? placeholderData
        completion(SoloToDoEntry(date: Date(), data: data, questBatchIndex: 0, contentMode: .quests))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SoloToDoEntry>) -> Void) {
        completion(makeSoloToDoTimeline(family: context.family, contentMode: .quests))
    }
}

@available(iOSApplicationExtension 17.0, *)
struct SoloToDoIntentProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SoloToDoEntry {
        SoloToDoEntry(date: Date(), data: placeholderData, questBatchIndex: 0, contentMode: .quests)
    }

    func snapshot(for configuration: SoloToDoWidgetConfigurationIntent, in context: Context) async -> SoloToDoEntry {
        let data = loadWidgetData() ?? placeholderData
        return SoloToDoEntry(date: Date(), data: data, questBatchIndex: 0, contentMode: configuration.mode.contentMode)
    }

    func timeline(for configuration: SoloToDoWidgetConfigurationIntent, in context: Context) async -> Timeline<SoloToDoEntry> {
        makeSoloToDoTimeline(family: context.family, contentMode: configuration.mode.contentMode)
    }
}

func makeSoloToDoTimeline(family: WidgetFamily, contentMode: WidgetContentMode) -> Timeline<SoloToDoEntry> {
    let fullData = loadWidgetData() ?? placeholderData
    let config = fullData.config

    let batchSize: Int
    switch family {
    case .systemLarge:
        batchSize = min(config.maxQuests, 6)
    case .systemMedium:
        batchSize = min(config.maxQuests, 3)
    default:
        batchSize = 1
    }

    let allQuests = fullData.quests
    var entries: [SoloToDoEntry] = []
    let canRotate = contentMode == .quests && config.rotationEnabled && allQuests.count > batchSize && batchSize > 0

    if canRotate {
        let intervalMinutes = max(5, config.rotationIntervalMinutes)
        var batchIndex = 0
        var offset = 0

        while offset < allQuests.count {
            let batchEnd = min(offset + batchSize, allQuests.count)
            var batchData = fullData
            batchData.quests = Array(allQuests[offset..<batchEnd])
            let entryDate = Calendar.current.date(byAdding: .minute, value: intervalMinutes * batchIndex, to: Date())!
            entries.append(SoloToDoEntry(date: entryDate, data: batchData, questBatchIndex: batchIndex, contentMode: contentMode))
            batchIndex += 1
            offset += batchSize
        }
    } else {
        var singleData = fullData
        if contentMode == .quests && batchSize > 0 && batchSize < allQuests.count {
            singleData.quests = Array(allQuests.prefix(batchSize))
        }
        entries.append(SoloToDoEntry(date: Date(), data: singleData, questBatchIndex: 0, contentMode: contentMode))
    }

    let totalDuration = canRotate ? max(15, config.rotationIntervalMinutes * max(entries.count, 1)) : 15
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: totalDuration, to: Date())!
    return Timeline(entries: entries, policy: .after(nextUpdate))
}

struct SoloToDoEntry: TimelineEntry {
    let date: Date
    var data: WidgetData
    let questBatchIndex: Int
    let contentMode: WidgetContentMode
}

struct SoloToDoMainWidget: Widget {
    let kind = "SoloToDoMainWidget"

    var body: some WidgetConfiguration {
        if #available(iOSApplicationExtension 17.0, *) {
            AppIntentConfiguration(kind: kind, intent: SoloToDoWidgetConfigurationIntent.self, provider: SoloToDoIntentProvider()) { entry in
                SoloToDoWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        Color(hex: entry.data.theme.bg)
                    }
            }
            .configurationDisplayName("SoloToDo")
            .description("Dein Hunter Dashboard - Quests, Habits und Micro-Habits.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        } else {
            StaticConfiguration(kind: kind, provider: SoloToDoProvider()) { entry in
                SoloToDoWidgetEntryView(entry: entry)
                    .background(Color(hex: entry.data.theme.bg))
            }
            .configurationDisplayName("SoloToDo")
            .description("Dein Hunter Dashboard - Quests, Streak, Habits auf einen Blick.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        }
    }
}

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

struct SoloToDoWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: SoloToDoEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data, contentMode: entry.contentMode)
        case .systemMedium:
            MediumWidgetView(data: entry.data, contentMode: entry.contentMode)
        case .systemLarge:
            LargeWidgetView(data: entry.data, contentMode: entry.contentMode)
        default:
            SmallWidgetView(data: entry.data, contentMode: entry.contentMode)
        }
    }
}

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

@main
struct SoloToDoWidgetBundle: WidgetBundle {
    var body: some Widget {
        SoloToDoMainWidget()
        SoloToDoLockScreenWidget()
    }
}
