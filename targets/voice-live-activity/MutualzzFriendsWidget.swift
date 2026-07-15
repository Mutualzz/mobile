import WidgetKit
import SwiftUI

struct MutualzzFriendsWidget: Widget {
  let kind = WidgetSnapshotStore.friendsKind

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: FriendsTimelineProvider()) { entry in
      FriendsWidgetView(entry: entry)
        .containerBackground(for: .widget) {
          Color(hex: entry.snapshot.theme.backgroundColor) ?? Color.black.opacity(0.85)
        }
    }
    .configurationDisplayName("Friends Online")
    .description("Friends who are online on Mutualzz.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryRectangular,
    ])
  }
}

private struct FriendsEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
}

private struct FriendsTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> FriendsEntry {
    FriendsEntry(date: .now, snapshot: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (FriendsEntry) -> Void) {
    completion(FriendsEntry(date: .now, snapshot: WidgetSnapshotStore.load() ?? .empty))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<FriendsEntry>) -> Void) {
    let entry = FriendsEntry(date: .now, snapshot: WidgetSnapshotStore.load() ?? .empty)
    completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(15 * 60))))
  }
}

private struct FriendsWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: FriendsEntry

  private var friends: [WidgetSnapshot.FriendSnapshot] { entry.snapshot.friends }
  private var theme: WidgetSnapshot.ThemeSnapshot { entry.snapshot.theme }

  var body: some View {
    switch family {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text("\(friends.count) online")
          .font(.headline)
        Text(friends.prefix(2).map(\.displayName).joined(separator: ", "))
          .font(.caption)
          .lineLimit(1)
      }
      .widgetURL(URL(string: "com.mutualzz.app://@me"))
    case .systemMedium:
      VStack(alignment: .leading, spacing: 10) {
        HStack {
          Text("Friends online")
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
          Spacer()
          Text("\(friends.count)")
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(Color(hex: theme.accentColor) ?? .cyan)
        }
        if friends.isEmpty {
          Text("No friends online")
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(Color(hex: theme.textColor) ?? .white)
          Spacer(minLength: 0)
        } else {
          ForEach(friends.prefix(4), id: \.id) { friend in
            HStack(spacing: 8) {
              statusDot(friend.status)
              Text(friend.displayName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color(hex: theme.textColor) ?? .white)
                .lineLimit(1)
              Spacer(minLength: 0)
            }
          }
          Spacer(minLength: 0)
        }
      }
      .widgetURL(URL(string: "com.mutualzz.app://@me"))
    default:
      VStack(alignment: .leading, spacing: 8) {
        Text("\(friends.count)")
          .font(.system(size: 28, weight: .bold))
          .foregroundStyle(Color(hex: theme.accentColor) ?? .cyan)
        Text("Online")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
        Spacer(minLength: 0)
        Text(friends.first?.displayName ?? "Nobody yet")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(Color(hex: theme.textColor) ?? .white)
          .lineLimit(1)
      }
      .widgetURL(URL(string: "com.mutualzz.app://@me"))
    }
  }

  private func statusDot(_ status: String) -> some View {
    Circle()
      .fill(statusColor(status))
      .frame(width: 8, height: 8)
  }

  private func statusColor(_ status: String) -> Color {
    switch status {
    case "online":
      return Color(hex: theme.accentColor) ?? .green
    case "idle":
      return .yellow
    case "dnd":
      return Color(hex: theme.dangerColor) ?? .red
    default:
      return Color(hex: theme.mutedTextColor) ?? .gray
    }
  }
}
