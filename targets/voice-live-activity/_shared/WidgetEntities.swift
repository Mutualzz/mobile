import AppIntents
import Foundation

struct SpaceEntity: AppEntity {
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Space")
  static var defaultQuery = SpaceEntityQuery()

  var id: String
  var name: String
  var unreadCount: Int
  var mentionCount: Int
  var deepLink: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}

struct SpaceEntityQuery: EntityQuery {
  func entities(for identifiers: [SpaceEntity.ID]) async throws -> [SpaceEntity] {
    let spaces = WidgetSnapshotStore.load()?.spaces ?? []
    return spaces
      .filter { identifiers.contains($0.id) }
      .map {
        SpaceEntity(
          id: $0.id,
          name: $0.name,
          unreadCount: $0.unreadCount,
          mentionCount: $0.mentionCount,
          deepLink: $0.deepLink
        )
      }
  }

  func suggestedEntities() async throws -> [SpaceEntity] {
    (WidgetSnapshotStore.load()?.spaces ?? []).map {
      SpaceEntity(
        id: $0.id,
        name: $0.name,
        unreadCount: $0.unreadCount,
        mentionCount: $0.mentionCount,
        deepLink: $0.deepLink
      )
    }
  }
}

struct DmEntity: AppEntity {
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Direct Message")
  static var defaultQuery = DmEntityQuery()

  var id: String
  var name: String
  var unread: Bool
  var mentionCount: Int
  var deepLink: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}

struct DmEntityQuery: EntityQuery {
  func entities(for identifiers: [DmEntity.ID]) async throws -> [DmEntity] {
    let dms = WidgetSnapshotStore.load()?.dms ?? []
    return dms
      .filter { identifiers.contains($0.id) }
      .map {
        DmEntity(
          id: $0.id,
          name: $0.name,
          unread: $0.unread,
          mentionCount: $0.mentionCount,
          deepLink: $0.deepLink
        )
      }
  }

  func suggestedEntities() async throws -> [DmEntity] {
    Array((WidgetSnapshotStore.load()?.dms ?? []).prefix(20)).map {
      DmEntity(
        id: $0.id,
        name: $0.name,
        unread: $0.unread,
        mentionCount: $0.mentionCount,
        deepLink: $0.deepLink
      )
    }
  }
}

struct PinnedSpaceIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Pinned Space"
  static var description = IntentDescription("Choose a Mutualzz space to pin")

  @Parameter(title: "Space")
  var space: SpaceEntity?
}

struct PinnedDmIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Pinned DM"
  static var description = IntentDescription("Choose a DM to pin")

  @Parameter(title: "Conversation")
  var dm: DmEntity?
}

struct MarkTopUnreadIntent: AppIntent {
  static var title: LocalizedStringResource = "Mark Top Unread as Read"
  static var description = IntentDescription("Mark the top unread Mutualzz channel as read")
  static var openAppWhenRun = false
  static var isDiscoverable = true

  func perform() async throws -> some IntentResult {
    let channelId = WidgetSnapshotStore.load()?.unread.topChannelId ?? ""
    guard !channelId.isEmpty else { return .result() }
    WidgetSnapshotStore.postWidgetAction("markRead:\(channelId)")
    return .result()
  }
}

struct OpenTopUnreadIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Top Unread"
  static var description = IntentDescription("Open the top unread Mutualzz channel")
  static var openAppWhenRun = true
  static var isDiscoverable = true

  func perform() async throws -> some IntentResult {
    WidgetSnapshotStore.postWidgetAction("openTopUnread")
    return .result()
  }
}
