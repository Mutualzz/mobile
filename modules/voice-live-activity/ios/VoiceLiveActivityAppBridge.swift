import Foundation

enum VoiceLiveActivityAppBridge {
  static let appGroupId = "group.com.mutualzz.app"
  static let pendingActionKey = "voice.liveActivity.pendingAction"
  static let darwinName = "com.mutualzz.app.voiceLiveActivityAction" as CFString

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  static var containerPath: String? {
    FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: appGroupId)?
      .path
  }

  static func consumePendingAction() -> String? {
    guard let action = defaults?.string(forKey: pendingActionKey) else {
      return nil
    }
    defaults?.removeObject(forKey: pendingActionKey)
    defaults?.synchronize()
    return action
  }
}
