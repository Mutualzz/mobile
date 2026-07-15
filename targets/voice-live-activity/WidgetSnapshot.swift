import Foundation
import WidgetKit

enum WidgetSnapshotStore {
  static let appGroupId = "group.com.mutualzz.app"
  static let snapshotKey = "mutualzz.widget.snapshot"
  static let pendingWidgetActionKey = "mutualzz.widget.pendingAction"
  static let darwinWidgetAction = "com.mutualzz.app.widgetAction" as CFString

  static let unreadKind = "MutualzzUnread"
  static let friendsKind = "MutualzzFriends"
  static let pinnedSpaceKind = "MutualzzPinnedSpace"
  static let pinnedDmKind = "MutualzzPinnedDm"
  static let voiceRosterKind = "MutualzzVoiceRoster"

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  static func load() -> WidgetSnapshot? {
    guard let raw = defaults?.string(forKey: snapshotKey),
          let data = raw.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
  }

  static func reloadAll() {
    let kinds = [
      unreadKind,
      friendsKind,
      pinnedSpaceKind,
      pinnedDmKind,
      voiceRosterKind,
    ]
    for kind in kinds {
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
  }

  static func postWidgetAction(_ action: String) {
    defaults?.set(action, forKey: pendingWidgetActionKey)
    defaults?.synchronize()
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(darwinWidgetAction),
      nil,
      nil,
      true
    )
  }
}

struct WidgetSnapshot: Codable, Hashable {
  var updatedAt: Double
  var unread: UnreadSnapshot
  var friends: [FriendSnapshot]
  var spaces: [SpaceSnapshot]
  var dms: [DmSnapshot]
  var voice: VoiceSnapshot
  var theme: ThemeSnapshot

  struct UnreadSnapshot: Codable, Hashable {
    var channelCount: Int
    var mentionCount: Int
    var topChannelId: String
    var topChannelName: String
    var topDeepLink: String
    var topIsDm: Bool
  }

  struct FriendSnapshot: Codable, Hashable {
    var id: String
    var displayName: String
    var status: String
  }

  struct SpaceSnapshot: Codable, Hashable {
    var id: String
    var name: String
    var unreadCount: Int
    var mentionCount: Int
    var deepLink: String
  }

  struct DmSnapshot: Codable, Hashable {
    var id: String
    var name: String
    var unread: Bool
    var mentionCount: Int
    var deepLink: String
  }

  struct VoiceMemberSnapshot: Codable, Hashable {
    var id: String
    var displayName: String
    var muted: Bool
    var deafened: Bool
  }

  struct VoiceSnapshot: Codable, Hashable {
    var connected: Bool
    var muted: Bool
    var deafened: Bool
    var channelId: String
    var channelName: String
    var spaceName: String
    var deepLink: String
    var members: [VoiceMemberSnapshot]
  }

  struct ThemeSnapshot: Codable, Hashable {
    var accentColor: String
    var textColor: String
    var mutedTextColor: String
    var dangerColor: String
    var backgroundColor: String
  }

  static let empty = WidgetSnapshot(
    updatedAt: 0,
    unread: UnreadSnapshot(
      channelCount: 0,
      mentionCount: 0,
      topChannelId: "",
      topChannelName: "",
      topDeepLink: "com.mutualzz.app://",
      topIsDm: false
    ),
    friends: [],
    spaces: [],
    dms: [],
    voice: VoiceSnapshot(
      connected: false,
      muted: false,
      deafened: false,
      channelId: "",
      channelName: "",
      spaceName: "",
      deepLink: "com.mutualzz.app://",
      members: []
    ),
    theme: ThemeSnapshot(
      accentColor: "#00D1C1",
      textColor: "#FFFFFF",
      mutedTextColor: "#B0A8B8",
      dangerColor: "#E1556B",
      backgroundColor: "#241927"
    )
  )
}
