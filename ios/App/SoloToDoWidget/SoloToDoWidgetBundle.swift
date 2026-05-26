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

func makeSoloToDoTimeline(family _: WidgetFamily, contentMode: WidgetContentMode) -> Timeline<SoloToDoEntry> {
    let fullData = loadWidgetData() ?? placeholderData
    // Which quest (if any) the user has expanded inline. Only meaningful in
    // quests mode and only when that quest is still present.
    let rawExpanded = loadExpandedQuestId()
    let expandedId: String? = (contentMode == .quests && rawExpanded != nil
        && fullData.quests.contains { $0.id == rawExpanded }) ? rawExpanded : nil
    let pageIndex = loadWidgetPageIndex(for: contentMode)
    let entry = SoloToDoEntry(
        date: Date(),
        data: fullData,
        questBatchIndex: 0,
        contentMode: contentMode,
        expandedQuestId: expandedId,
        pageIndex: pageIndex
    )
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    return Timeline(entries: [entry], policy: .after(nextUpdate))
}

struct SoloToDoEntry: TimelineEntry {
    let date: Date
    var data: WidgetData
    let questBatchIndex: Int
    let contentMode: WidgetContentMode
    var expandedQuestId: String? = nil
    var pageIndex: Int = 0
}

struct SoloToDoMainWidget: Widget {
    let kind = "SoloToDoMainWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SoloToDoProvider()) { entry in
            SoloToDoWidgetEntryView(entry: entry)
                .background(Color(hex: entry.data.theme.bg))
        }
        .configurationDisplayName("SoloToDo")
        .description("Dein Hunter Dashboard - Quests, Streak, Habits auf einen Blick.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@available(iOSApplicationExtension 17.0, *)
struct SoloToDoInteractiveMainWidget: Widget {
    let kind = "SoloToDoMainWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SoloToDoWidgetConfigurationIntent.self, provider: SoloToDoIntentProvider()) { entry in
            SoloToDoWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(hex: entry.data.theme.bg)
                }
        }
        .configurationDisplayName("SoloToDo")
        .description("Dein Hunter Dashboard - Quests, Habits und Micro-Habits.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
            MediumWidgetView(data: entry.data, contentMode: entry.contentMode, expandedQuestId: entry.expandedQuestId, pageIndex: entry.pageIndex)
        case .systemLarge:
            LargeWidgetView(data: entry.data, contentMode: entry.contentMode, expandedQuestId: entry.expandedQuestId, pageIndex: entry.pageIndex)
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
struct SoloToDoWidgetLauncher {
    static func main() {
        if #available(iOSApplicationExtension 17.0, *) {
            SoloToDoWidgetBundle17.main()
        } else {
            SoloToDoWidgetBundle16.main()
        }
    }
}

@available(iOSApplicationExtension 17.0, *)
struct SoloToDoWidgetBundle17: WidgetBundle {
    var body: some Widget {
        SoloToDoInteractiveMainWidget()
        SoloToDoLockScreenWidget()
    }
}

struct SoloToDoWidgetBundle16: WidgetBundle {
    var body: some Widget {
        SoloToDoMainWidget()
        SoloToDoLockScreenWidget()
    }
}
