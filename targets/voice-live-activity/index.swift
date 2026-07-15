import WidgetKit
import SwiftUI

@main
struct MutualzzWidgetsBundle: WidgetBundle {
  var body: some Widget {
    VoiceChannelLiveActivityWidget()
    MutualzzUnreadWidget()
    MutualzzFriendsWidget()
    MutualzzPinnedSpaceWidget()
    MutualzzPinnedDmWidget()
    MutualzzVoiceRosterWidget()
    if #available(iOS 18.0, *) {
      VoiceMuteControlWidget()
      VoiceDeafenControlWidget()
    }
  }
}
