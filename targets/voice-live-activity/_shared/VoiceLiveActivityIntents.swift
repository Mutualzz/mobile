import AppIntents
import ActivityKit
import Foundation

@available(iOS 16.2, *)
struct VoiceMuteIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Mute"
  static var description = IntentDescription("Toggle mute in the voice channel")
  static var openAppWhenRun = false
  static var isDiscoverable = false

  func perform() async throws -> some IntentResult {
    await VoiceLiveActivityBridge.updateCurrentActivity { state in
      if state.deafened {
        state.deafened = false
        state.muted = false
      } else {
        state.muted.toggle()
      }
    }
    VoiceLiveActivityBridge.postAction("mute")
    return .result()
  }
}

@available(iOS 16.2, *)
struct VoiceDeafenIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Deafen"
  static var description = IntentDescription("Toggle deafen in the voice channel")
  static var openAppWhenRun = false
  static var isDiscoverable = false

  func perform() async throws -> some IntentResult {
    await VoiceLiveActivityBridge.updateCurrentActivity { state in
      state.deafened.toggle()
      if state.deafened {
        state.muted = true
      }
    }
    VoiceLiveActivityBridge.postAction("deafen")
    return .result()
  }
}

@available(iOS 16.2, *)
struct VoiceDisconnectIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Disconnect"
  static var description = IntentDescription("Leave the voice channel")
  static var openAppWhenRun = false
  static var isDiscoverable = false

  func perform() async throws -> some IntentResult {
    VoiceLiveActivityBridge.postAction("disconnect")
    for activity in Activity<VoiceChannelAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
    return .result()
  }
}
