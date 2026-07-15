import Foundation
import ActivityKit
import UIKit
import SwiftUI

enum VoiceLiveActivityBridge {
  static let appGroupId = "group.com.mutualzz.app"
  static let pendingActionKey = "voice.liveActivity.pendingAction"
  static let darwinName = "com.mutualzz.app.voiceLiveActivityAction" as CFString

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  static var containerURL: URL? {
    FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: appGroupId
    )
  }

  static func iconURL(fileName: String) -> URL? {
    guard !fileName.isEmpty, let containerURL else { return nil }
    return containerURL.appendingPathComponent(fileName)
  }

  static func loadIcon(fileName: String) -> UIImage? {
    guard let url = iconURL(fileName: fileName),
          let data = try? Data(contentsOf: url),
          let image = UIImage(data: data)
    else { return nil }
    return image
  }

  static func postAction(_ action: String) {
    defaults?.set(action, forKey: pendingActionKey)
    defaults?.synchronize()
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(darwinName),
      nil,
      nil,
      true
    )
  }

  static func consumePendingAction() -> String? {
    guard let action = defaults?.string(forKey: pendingActionKey) else {
      return nil
    }
    defaults?.removeObject(forKey: pendingActionKey)
    defaults?.synchronize()
    return action
  }

  @available(iOS 16.2, *)
  static func updateCurrentActivity(
    mutate: (inout VoiceChannelAttributes.ContentState) -> Void
  ) async {
    for activity in Activity<VoiceChannelAttributes>.activities {
      var next = activity.content.state
      mutate(&next)
      let content = ActivityContent(state: next, staleDate: nil)
      await activity.update(content)
    }
  }
}

extension Color {
  init?(hex: String) {
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if cleaned.hasPrefix("#") {
      cleaned.removeFirst()
    }
    guard cleaned.count == 6,
          let value = UInt64(cleaned, radix: 16)
    else { return nil }
    let r = Double((value >> 16) & 0xFF) / 255.0
    let g = Double((value >> 8) & 0xFF) / 255.0
    let b = Double(value & 0xFF) / 255.0
    self.init(red: r, green: g, blue: b)
  }
}
