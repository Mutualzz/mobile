import ExpoModulesCore
import ActivityKit
import Foundation

public class VoiceLiveActivityModule: Module {
  private var observing = false

  public func definition() -> ModuleDefinition {
    Name("VoiceLiveActivity")

    Events("onVoiceLiveActivityAction")

    Constant("appGroupPath") {
      VoiceLiveActivityAppBridge.containerPath
    }

    Function("areActivitiesEnabled") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("start") { (props: [String: Any], deepLinkUrl: String) -> String in
      try await self.startActivity(props: props, deepLinkUrl: deepLinkUrl)
    }

    AsyncFunction("update") { (props: [String: Any]) in
      try await self.updateActivity(props: props)
    }

    AsyncFunction("end") { () in
      await self.endActivities()
    }

    OnStartObserving("onVoiceLiveActivityAction") {
      self.startObservingActions()
    }

    OnStopObserving("onVoiceLiveActivityAction") {
      self.stopObservingActions()
    }
  }

  @available(iOS 16.2, *)
  private func contentState(from props: [String: Any]) -> VoiceChannelAttributes.ContentState {
    VoiceChannelAttributes.ContentState(
      channelName: props["channelName"] as? String ?? "Voice",
      spaceName: props["spaceName"] as? String ?? "",
      muted: props["muted"] as? Bool ?? false,
      deafened: props["deafened"] as? Bool ?? false,
      spaceIconFileName: props["spaceIconFileName"] as? String ?? "",
      accentColor: props["accentColor"] as? String ?? "#B57EDC",
      textColor: props["textColor"] as? String ?? "#FFFFFF",
      mutedTextColor: props["mutedTextColor"] as? String ?? "#B0A8B8",
      dangerColor: props["dangerColor"] as? String ?? "#E1556B"
    )
  }

  private func startActivity(props: [String: Any], deepLinkUrl: String) async throws -> String {
    guard #available(iOS 16.2, *) else {
      throw Exception(name: "Unsupported", description: "Live Activities require iOS 16.2+")
    }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      throw Exception(name: "Disabled", description: "Live Activities are disabled")
    }

    for activity in Activity<VoiceChannelAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }

    let attributes = VoiceChannelAttributes(deepLinkUrl: deepLinkUrl)
    let state = contentState(from: props)
    let content = ActivityContent(state: state, staleDate: nil)
    let activity = try Activity.request(
      attributes: attributes,
      content: content,
      pushType: nil
    )
    return activity.id
  }

  private func updateActivity(props: [String: Any]) async throws {
    guard #available(iOS 16.2, *) else { return }
    let state = contentState(from: props)
    let content = ActivityContent(state: state, staleDate: nil)
    for activity in Activity<VoiceChannelAttributes>.activities {
      await activity.update(content)
    }
  }

  private func endActivities() async {
    guard #available(iOS 16.2, *) else { return }
    for activity in Activity<VoiceChannelAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }

  private func startObservingActions() {
    if observing { return }
    observing = true
    let observer = UnsafeRawPointer(Unmanaged.passUnretained(self).toOpaque())
    CFNotificationCenterAddObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      observer,
      { _, observer, _, _, _ in
        guard let observer else { return }
        let module = Unmanaged<VoiceLiveActivityModule>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async {
          module.emitPendingAction()
        }
      },
      VoiceLiveActivityAppBridge.darwinName,
      nil,
      .deliverImmediately
    )
  }

  private func stopObservingActions() {
    if !observing { return }
    observing = false
    let observer = UnsafeRawPointer(Unmanaged.passUnretained(self).toOpaque())
    CFNotificationCenterRemoveObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      observer,
      CFNotificationName(VoiceLiveActivityAppBridge.darwinName),
      nil
    )
  }

  private func emitPendingAction() {
    guard let action = VoiceLiveActivityAppBridge.consumePendingAction() else { return }
    sendEvent("onVoiceLiveActivityAction", ["action": action])
  }
}
