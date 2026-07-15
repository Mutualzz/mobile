import WidgetKit
import SwiftUI
import AppIntents

struct MutualzzPinnedSpaceWidget: Widget {
  let kind = WidgetSnapshotStore.pinnedSpaceKind

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: PinnedSpaceIntent.self,
      provider: PinnedSpaceProvider()
    ) { entry in
      PinnedSpaceView(entry: entry)
        .containerBackground(for: .widget) {
          Color(hex: entry.theme.backgroundColor) ?? Color.black.opacity(0.85)
        }
    }
    .configurationDisplayName("Pinned Space")
    .description("Unread status for a Mutualzz space you choose.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

private struct PinnedSpaceEntry: TimelineEntry {
  let date: Date
  let space: SpaceEntity?
  let theme: WidgetSnapshot.ThemeSnapshot
}

private struct PinnedSpaceProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> PinnedSpaceEntry {
    PinnedSpaceEntry(date: .now, space: nil, theme: WidgetSnapshot.empty.theme)
  }

  func snapshot(for configuration: PinnedSpaceIntent, in context: Context) async -> PinnedSpaceEntry {
    entry(for: configuration)
  }

  func timeline(for configuration: PinnedSpaceIntent, in context: Context) async -> Timeline<PinnedSpaceEntry> {
    Timeline(entries: [entry(for: configuration)], policy: .after(.now.addingTimeInterval(15 * 60)))
  }

  private func entry(for configuration: PinnedSpaceIntent) -> PinnedSpaceEntry {
    let snapshot = WidgetSnapshotStore.load() ?? .empty
    let selected = configuration.space
    let resolved: SpaceEntity? = {
      guard let selected else {
        return snapshot.spaces.first.map {
          SpaceEntity(
            id: $0.id,
            name: $0.name,
            unreadCount: $0.unreadCount,
            mentionCount: $0.mentionCount,
            deepLink: $0.deepLink
          )
        }
      }
      if let latest = snapshot.spaces.first(where: { $0.id == selected.id }) {
        return SpaceEntity(
          id: latest.id,
          name: latest.name,
          unreadCount: latest.unreadCount,
          mentionCount: latest.mentionCount,
          deepLink: latest.deepLink
        )
      }
      return selected
    }()
    return PinnedSpaceEntry(date: .now, space: resolved, theme: snapshot.theme)
  }
}

private struct PinnedSpaceView: View {
  let entry: PinnedSpaceEntry

  var body: some View {
    let theme = entry.theme
    VStack(alignment: .leading, spacing: 8) {
      Text(entry.space?.name ?? "Choose a space")
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(Color(hex: theme.textColor) ?? .white)
        .lineLimit(2)
        .minimumScaleFactor(0.85)
      Spacer(minLength: 0)
      if let space = entry.space {
        Text(space.unreadCount == 0 ? "All caught up" : "\(space.unreadCount) unread")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(
            space.unreadCount == 0
              ? (Color(hex: theme.mutedTextColor) ?? .gray)
              : (Color(hex: theme.accentColor) ?? .cyan)
          )
        if space.mentionCount > 0 {
          Text("\(space.mentionCount) mentions")
            .font(.system(size: 12))
            .foregroundStyle(Color(hex: theme.dangerColor) ?? .red)
        }
      } else {
        Text("Edit widget to pick a space")
          .font(.system(size: 12))
          .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
      }
    }
    .widgetURL(URL(string: entry.space?.deepLink ?? "com.mutualzz.app://"))
  }
}

struct MutualzzPinnedDmWidget: Widget {
  let kind = WidgetSnapshotStore.pinnedDmKind

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: PinnedDmIntent.self,
      provider: PinnedDmProvider()
    ) { entry in
      PinnedDmView(entry: entry)
        .containerBackground(for: .widget) {
          Color(hex: entry.theme.backgroundColor) ?? Color.black.opacity(0.85)
        }
    }
    .configurationDisplayName("Pinned DM")
    .description("A Mutualzz DM or group you choose.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

private struct PinnedDmEntry: TimelineEntry {
  let date: Date
  let dm: DmEntity?
  let theme: WidgetSnapshot.ThemeSnapshot
}

private struct PinnedDmProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> PinnedDmEntry {
    PinnedDmEntry(date: .now, dm: nil, theme: WidgetSnapshot.empty.theme)
  }

  func snapshot(for configuration: PinnedDmIntent, in context: Context) async -> PinnedDmEntry {
    entry(for: configuration)
  }

  func timeline(for configuration: PinnedDmIntent, in context: Context) async -> Timeline<PinnedDmEntry> {
    Timeline(entries: [entry(for: configuration)], policy: .after(.now.addingTimeInterval(15 * 60)))
  }

  private func entry(for configuration: PinnedDmIntent) -> PinnedDmEntry {
    let snapshot = WidgetSnapshotStore.load() ?? .empty
    let selected = configuration.dm
    let resolved: DmEntity? = {
      guard let selected else {
        return snapshot.dms.first.map {
          DmEntity(
            id: $0.id,
            name: $0.name,
            unread: $0.unread,
            mentionCount: $0.mentionCount,
            deepLink: $0.deepLink
          )
        }
      }
      if let latest = snapshot.dms.first(where: { $0.id == selected.id }) {
        return DmEntity(
          id: latest.id,
          name: latest.name,
          unread: latest.unread,
          mentionCount: latest.mentionCount,
          deepLink: latest.deepLink
        )
      }
      return selected
    }()
    return PinnedDmEntry(date: .now, dm: resolved, theme: snapshot.theme)
  }
}

private struct PinnedDmView: View {
  let entry: PinnedDmEntry

  var body: some View {
    let theme = entry.theme
    VStack(alignment: .leading, spacing: 8) {
      Text(entry.dm?.name ?? "Choose a DM")
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(Color(hex: theme.textColor) ?? .white)
        .lineLimit(2)
        .minimumScaleFactor(0.85)
      Spacer(minLength: 0)
      if let dm = entry.dm {
        Text(dm.unread ? "Unread" : "Up to date")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(
            dm.unread
              ? (Color(hex: theme.accentColor) ?? .cyan)
              : (Color(hex: theme.mutedTextColor) ?? .gray)
          )
        if dm.mentionCount > 0 {
          Text("\(dm.mentionCount) mentions")
            .font(.system(size: 12))
            .foregroundStyle(Color(hex: theme.dangerColor) ?? .red)
        }
      } else {
        Text("Edit widget to pick a conversation")
          .font(.system(size: 12))
          .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
      }
    }
    .widgetURL(URL(string: entry.dm?.deepLink ?? "com.mutualzz.app://@me"))
  }
}
