import ExpoModulesCore
import ActivityKit
import Foundation
import OSLog
import WidgetKit

private let log = Logger(subsystem: "com.mutualzz.app", category: "VoiceLiveActivity")
private let widgetSnapshotKey = "mutualzz.widget.snapshot"
private let pendingWidgetActionKey = "mutualzz.widget.pendingAction"
private let widgetActionDarwinName = "com.mutualzz.app.widgetAction" as CFString
private let widgetKinds = [
  "MutualzzUnread",
  "MutualzzFriends",
  "MutualzzPinnedSpace",
  "MutualzzPinnedDm",
  "MutualzzVoiceRoster",
]

struct VoiceLiveActivityPropsRecord: Record {
  @Field var channelName: String = "Voice"
  @Field var spaceName: String = ""
  @Field var muted: Bool = false
  @Field var deafened: Bool = false
  @Field var spaceIconFileName: String = ""
  @Field var accentColor: String = "#00D1C1"
  @Field var textColor: String = "#FFFFFF"
  @Field var mutedTextColor: String = "#B0A8B8"
  @Field var dangerColor: String = "#E1556B"
  @Field var backgroundColor: String = "#241927"
}

public class VoiceLiveActivityModule: Module {
  private var observing = false

  public func definition() -> ModuleDefinition {
    Name("VoiceLiveActivity")

    Events("onVoiceLiveActivityAction", "onWidgetAction")

    Constant("appGroupPath") {
      VoiceLiveActivityAppBridge.containerPath ?? ""
    }

    Function("areActivitiesEnabled") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    Function("isModuleAvailable") { () -> Bool in
      true
    }

    Function("writeWidgetSnapshot") { (json: String) in
      VoiceLiveActivityAppBridge.defaults?.set(json, forKey: widgetSnapshotKey)
      VoiceLiveActivityAppBridge.defaults?.synchronize()
    }

    Function("reloadWidgets") { () in
      for kind in widgetKinds {
        WidgetCenter.shared.reloadTimelines(ofKind: kind)
      }
    }

    AsyncFunction("start") { (props: VoiceLiveActivityPropsRecord, deepLinkUrl: String) -> String in
      try await startVoiceLiveActivity(props: props, deepLinkUrl: deepLinkUrl)
    }

    AsyncFunction("update") { (props: VoiceLiveActivityPropsRecord) in
      try await updateVoiceLiveActivity(props: props)
    }

    AsyncFunction("end") { () in
      await endVoiceLiveActivities()
    }

    OnStartObserving("onVoiceLiveActivityAction") {
      self.startObservingActions()
    }

    OnStopObserving("onVoiceLiveActivityAction") {
      self.stopObservingActions()
    }

    OnStartObserving("onWidgetAction") {
      self.startObservingWidgetActions()
    }

    OnStopObserving("onWidgetAction") {
      self.stopObservingWidgetActions()
    }
  }

  private var observingWidgetActions = false

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

  private func startObservingWidgetActions() {
    if observingWidgetActions { return }
    observingWidgetActions = true
    let observer = UnsafeRawPointer(Unmanaged.passUnretained(self).toOpaque())
    CFNotificationCenterAddObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      observer,
      { _, observer, _, _, _ in
        guard let observer else { return }
        let module = Unmanaged<VoiceLiveActivityModule>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async {
          module.emitPendingWidgetAction()
        }
      },
      widgetActionDarwinName,
      nil,
      .deliverImmediately
    )
  }

  private func stopObservingWidgetActions() {
    if !observingWidgetActions { return }
    observingWidgetActions = false
    let observer = UnsafeRawPointer(Unmanaged.passUnretained(self).toOpaque())
    CFNotificationCenterRemoveObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      observer,
      CFNotificationName(widgetActionDarwinName),
      nil
    )
  }

  private func emitPendingAction() {
    guard let action = VoiceLiveActivityAppBridge.consumePendingAction() else { return }
    sendEvent("onVoiceLiveActivityAction", ["action": action])
  }

  private func emitPendingWidgetAction() {
    guard let action = VoiceLiveActivityAppBridge.defaults?.string(forKey: pendingWidgetActionKey) else {
      return
    }
    VoiceLiveActivityAppBridge.defaults?.removeObject(forKey: pendingWidgetActionKey)
    VoiceLiveActivityAppBridge.defaults?.synchronize()
    sendEvent("onWidgetAction", ["action": action])
  }
}

private func contentState(
  from props: VoiceLiveActivityPropsRecord
) -> VoiceChannelAttributes.ContentState {
  VoiceChannelAttributes.ContentState(
    channelName: props.channelName,
    spaceName: props.spaceName,
    muted: props.muted,
    deafened: props.deafened,
    spaceIconFileName: props.spaceIconFileName,
    accentColor: props.accentColor,
    textColor: props.textColor,
    mutedTextColor: props.mutedTextColor,
    dangerColor: props.dangerColor,
    backgroundColor: props.backgroundColor
  )
}

private func startVoiceLiveActivity(
  props: VoiceLiveActivityPropsRecord,
  deepLinkUrl: String
) async throws -> String {
  guard #available(iOS 16.2, *) else {
    throw Exception(name: "Unsupported", description: "Live Activities require iOS 16.2+")
  }

  for activity in Activity<VoiceChannelAttributes>.activities {
    await activity.end(nil, dismissalPolicy: .immediate)
  }

  return try await MainActor.run {
    let auth = ActivityAuthorizationInfo()
    log.info(
      "areActivitiesEnabled=\(auth.areActivitiesEnabled, privacy: .public) frequentUpdates=\(auth.frequentPushesEnabled, privacy: .public)"
    )

    guard auth.areActivitiesEnabled else {
      throw Exception(
        name: "Disabled",
        description: "Live Activities are disabled in system settings for this device/app"
      )
    }

    let attributes = VoiceChannelAttributes(deepLinkUrl: deepLinkUrl)
    let state = contentState(from: props)
    let content = ActivityContent(state: state, staleDate: nil)

    do {
      let activity = try Activity.request(
        attributes: attributes,
        content: content,
        pushType: nil
      )
      log.info(
        "Started Live Activity id=\(activity.id, privacy: .public) channel=\(props.channelName, privacy: .public)"
      )
      return activity.id
    } catch {
      log.error("Activity.request failed: \(error.localizedDescription, privacy: .public)")
      throw Exception(name: "StartFailed", description: error.localizedDescription)
    }
  }
}

private func updateVoiceLiveActivity(props: VoiceLiveActivityPropsRecord) async throws {
  guard #available(iOS 16.2, *) else { return }
  let state = contentState(from: props)
  let content = ActivityContent(state: state, staleDate: nil)
  let activities = Activity<VoiceChannelAttributes>.activities
  log.info("Updating \(activities.count, privacy: .public) Live Activities")
  for activity in activities {
    await activity.update(content)
  }
}

private func endVoiceLiveActivities() async {
  guard #available(iOS 16.2, *) else { return }
  for activity in Activity<VoiceChannelAttributes>.activities {
    await activity.end(nil, dismissalPolicy: .immediate)
  }
  log.info("Ended Live Activities")
}
