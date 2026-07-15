import Foundation
import ActivityKit

public struct VoiceChannelAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var channelName: String
    public var spaceName: String
    public var muted: Bool
    public var deafened: Bool
    public var spaceIconFileName: String
    public var accentColor: String
    public var textColor: String
    public var mutedTextColor: String
    public var dangerColor: String
    public var backgroundColor: String

    public init(
      channelName: String,
      spaceName: String,
      muted: Bool,
      deafened: Bool,
      spaceIconFileName: String,
      accentColor: String,
      textColor: String,
      mutedTextColor: String,
      dangerColor: String,
      backgroundColor: String
    ) {
      self.channelName = channelName
      self.spaceName = spaceName
      self.muted = muted
      self.deafened = deafened
      self.spaceIconFileName = spaceIconFileName
      self.accentColor = accentColor
      self.textColor = textColor
      self.mutedTextColor = mutedTextColor
      self.dangerColor = dangerColor
      self.backgroundColor = backgroundColor
    }
  }

  public var deepLinkUrl: String

  public init(deepLinkUrl: String) {
    self.deepLinkUrl = deepLinkUrl
  }
}
