import WidgetKit
import SwiftUI
import AppIntents

struct MutualzzUnreadWidget: Widget {
  let kind = WidgetSnapshotStore.unreadKind

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: UnreadTimelineProvider()) { entry in
      UnreadWidgetView(entry: entry)
        .containerBackground(for: .widget) {
          Color(hex: entry.snapshot.theme.backgroundColor) ?? Color.black.opacity(0.85)
        }
    }
    .configurationDisplayName("Unread")
    .description("Unread channels and mentions across Mutualzz.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryCircular,
      .accessoryRectangular,
    ])
  }
}

private struct UnreadEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
}

private struct UnreadTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> UnreadEntry {
    UnreadEntry(date: .now, snapshot: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (UnreadEntry) -> Void) {
    completion(UnreadEntry(date: .now, snapshot: WidgetSnapshotStore.load() ?? .empty))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<UnreadEntry>) -> Void) {
    let entry = UnreadEntry(date: .now, snapshot: WidgetSnapshotStore.load() ?? .empty)
    completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(15 * 60))))
  }
}

private struct UnreadWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: UnreadEntry

  private var unread: WidgetSnapshot.UnreadSnapshot { entry.snapshot.unread }
  private var theme: WidgetSnapshot.ThemeSnapshot { entry.snapshot.theme }

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 1) {
          Text("\(unread.channelCount)")
            .font(.system(size: 20, weight: .bold))
          Text("Unread")
            .font(.system(size: 8, weight: .semibold))
        }
      }
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text("\(unread.channelCount) unread")
          .font(.headline)
        if unread.mentionCount > 0 {
          Text("\(unread.mentionCount) mentions")
            .font(.caption)
        } else if !unread.topChannelName.isEmpty {
          Text(unread.topChannelName)
            .font(.caption)
            .lineLimit(1)
        }
      }
    case .systemMedium:
      VStack(alignment: .leading, spacing: 10) {
        HStack(spacing: 14) {
          unreadBadge
          VStack(alignment: .leading, spacing: 4) {
            Text(unread.channelCount == 0 ? "You're all caught up" : unread.topChannelName)
              .font(.system(size: 16, weight: .bold))
              .foregroundStyle(Color(hex: theme.textColor) ?? .white)
              .lineLimit(2)
              .minimumScaleFactor(0.85)
            if unread.mentionCount > 0 {
              Text("\(unread.mentionCount) mention\(unread.mentionCount == 1 ? "" : "s")")
                .font(.system(size: 13))
                .foregroundStyle(Color(hex: theme.dangerColor) ?? .red)
            } else if unread.channelCount > 0 {
              Text(unread.topIsDm ? "Direct message" : "Channel")
                .font(.system(size: 13))
                .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
            } else {
              Text("No unread messages")
                .font(.system(size: 13))
                .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
            }
          }
          Spacer(minLength: 0)
        }
        if unread.channelCount > 0, !unread.topChannelId.isEmpty {
          HStack(spacing: 8) {
            Link(destination: URL(string: unread.topDeepLink) ?? URL(string: "com.mutualzz.app://")!) {
              Text("Open")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color(hex: theme.textColor) ?? .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Capsule().fill(Color(hex: theme.accentColor) ?? .cyan))
            }
            Button(intent: MarkTopUnreadIntent()) {
              Text("Mark read")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color(hex: theme.textColor) ?? .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(
                  Capsule().fill(Color(hex: theme.mutedTextColor)?.opacity(0.35) ?? Color.gray.opacity(0.35))
                )
            }
            .buttonStyle(.plain)
          }
        }
      }
      .widgetURL(URL(string: unread.topDeepLink.isEmpty ? "com.mutualzz.app://" : unread.topDeepLink))
    default:
      VStack(alignment: .leading, spacing: 8) {
        unreadBadge
        Spacer(minLength: 0)
        Text(unread.channelCount == 0 ? "All caught up" : unread.topChannelName)
          .font(.system(size: 14, weight: .bold))
          .foregroundStyle(Color(hex: theme.textColor) ?? .white)
          .lineLimit(2)
          .minimumScaleFactor(0.8)
        if unread.mentionCount > 0 {
          Text("\(unread.mentionCount) mentions")
            .font(.system(size: 11))
            .foregroundStyle(Color(hex: theme.dangerColor) ?? .red)
        }
      }
      .widgetURL(URL(string: unread.topDeepLink.isEmpty ? "com.mutualzz.app://" : unread.topDeepLink))
    }
  }

  private var unreadBadge: some View {
    ZStack {
      Circle()
        .fill(Color(hex: theme.accentColor) ?? .cyan)
        .frame(width: 44, height: 44)
      Text("\(min(unread.channelCount, 99))")
        .font(.system(size: 18, weight: .bold))
        .foregroundStyle(.white)
    }
  }
}
