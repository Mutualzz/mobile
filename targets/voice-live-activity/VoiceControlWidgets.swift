import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct VoiceMuteControlWidget: ControlWidget {
  static let kind = "com.mutualzz.app.controls.mute"

  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: Self.kind) {
      ControlWidgetButton(action: VoiceMuteControlIntent()) {
        Label("Mute", systemImage: "mic.fill")
      }
    }
    .displayName("Mute")
    .description("Toggle mute in Mutualzz voice")
  }
}

@available(iOS 18.0, *)
struct VoiceDeafenControlWidget: ControlWidget {
  static let kind = "com.mutualzz.app.controls.deafen"

  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: Self.kind) {
      ControlWidgetButton(action: VoiceDeafenControlIntent()) {
        Label("Deafen", systemImage: "headphones")
      }
    }
    .displayName("Deafen")
    .description("Toggle deafen in Mutualzz voice")
  }
}

struct VoiceMuteControlIntent: AppIntent {
  static var title: LocalizedStringResource = "Toggle Mute"
  static var description = IntentDescription("Toggle mute in Mutualzz voice")
  static var openAppWhenRun = false
  static var isDiscoverable = true

  func perform() async throws -> some IntentResult {
    if #available(iOS 16.2, *) {
      await VoiceLiveActivityBridge.updateCurrentActivity { state in
        if state.deafened {
          state.deafened = false
          state.muted = false
        } else {
          state.muted.toggle()
        }
      }
    }
    VoiceLiveActivityBridge.postAction("mute")
    return .result()
  }
}

struct VoiceDeafenControlIntent: AppIntent {
  static var title: LocalizedStringResource = "Toggle Deafen"
  static var description = IntentDescription("Toggle deafen in Mutualzz voice")
  static var openAppWhenRun = false
  static var isDiscoverable = true

  func perform() async throws -> some IntentResult {
    if #available(iOS 16.2, *) {
      await VoiceLiveActivityBridge.updateCurrentActivity { state in
        state.deafened.toggle()
        if state.deafened {
          state.muted = true
        }
      }
    }
    VoiceLiveActivityBridge.postAction("deafen")
    return .result()
  }
}
