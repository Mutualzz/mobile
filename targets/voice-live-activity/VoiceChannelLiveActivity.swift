import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

@available(iOS 16.2, *)
struct VoiceChannelLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: VoiceChannelAttributes.self) { context in
      VoiceChannelBannerView(state: context.state)
        .activityBackgroundTint(Color.black.opacity(0.85))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VoiceChannelIdentityView(state: context.state, compact: false)
        }
        DynamicIslandExpandedRegion(.trailing) {
          VoiceChannelControlsView(state: context.state)
        }
        DynamicIslandExpandedRegion(.center) {
          EmptyView()
        }
        DynamicIslandExpandedRegion(.bottom) {
          Button(intent: VoiceDisconnectIntent()) {
            Label("Disconnect", systemImage: "phone.down.fill")
              .font(.headline)
              .frame(maxWidth: .infinity)
              .padding(.vertical, 10)
          }
          .tint(Color(hex: context.state.dangerColor) ?? .red)
          .buttonStyle(.borderedProminent)
          .padding(.horizontal, 8)
          .padding(.bottom, 4)
        }
      } compactLeading: {
        VoiceChannelSpaceIcon(state: context.state, size: 20)
      } compactTrailing: {
        HStack(spacing: 6) {
          Image(systemName: micSymbol(state: context.state))
            .foregroundStyle(muteColor(state: context.state))
          HeadphonesIcon(
            deafened: context.state.deafened,
            color: deafenColor(state: context.state),
            size: 14
          )
        }
      } minimal: {
        VoiceChannelSpaceIcon(state: context.state, size: 16)
      }
      .widgetURL(URL(string: context.attributes.deepLinkUrl))
      .keylineTint(Color(hex: context.state.accentColor) ?? .purple)
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelBannerView: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    HStack(spacing: 12) {
      VoiceChannelIdentityView(state: state, compact: false)
      Spacer(minLength: 8)
      VoiceChannelControlsView(state: state)
    }
    .padding(12)
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelIdentityView: View {
  let state: VoiceChannelAttributes.ContentState
  let compact: Bool

  var body: some View {
    HStack(spacing: 10) {
      VoiceChannelSpaceIcon(state: state, size: compact ? 20 : 36)
      VStack(alignment: .leading, spacing: 2) {
        Text(state.spaceName.isEmpty ? "Voice" : state.spaceName)
          .font(.system(size: 15, weight: .bold))
          .foregroundStyle(Color(hex: state.textColor) ?? .white)
          .lineLimit(1)
        Text(state.channelName)
          .font(.system(size: 12))
          .foregroundStyle(Color(hex: state.mutedTextColor) ?? .gray)
          .lineLimit(1)
      }
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelControlsView: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    HStack(spacing: 10) {
      Button(intent: VoiceMuteIntent()) {
        Image(systemName: micSymbol(state: state))
          .font(.system(size: 18, weight: .semibold))
          .foregroundStyle(muteColor(state: state))
          .frame(width: 36, height: 36)
      }
      .buttonStyle(.plain)

      Button(intent: VoiceDeafenIntent()) {
        HeadphonesIcon(
          deafened: state.deafened,
          color: deafenColor(state: state),
          size: 18
        )
        .frame(width: 36, height: 36)
      }
      .buttonStyle(.plain)
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelSpaceIcon: View {
  let state: VoiceChannelAttributes.ContentState
  let size: CGFloat

  private var monogram: String {
    let name = state.spaceName.trimmingCharacters(in: .whitespacesAndNewlines)
    if let first = name.first {
      return String(first).uppercased()
    }
    return "#"
  }

  var body: some View {
    Group {
      if let image = VoiceLiveActivityBridge.loadIcon(fileName: state.spaceIconFileName) {
        Image(uiImage: image)
          .resizable()
          .aspectRatio(contentMode: .fill)
      } else {
        ZStack {
          Circle()
            .fill(Color(hex: state.accentColor) ?? .purple)
          Text(monogram)
            .font(.system(size: size * 0.45, weight: .bold))
            .foregroundStyle(.white)
        }
      }
    }
    .frame(width: size, height: size)
    .clipShape(Circle())
  }
}

@available(iOS 16.2, *)
private struct HeadphonesIcon: View {
  let deafened: Bool
  let color: Color
  let size: CGFloat

  var body: some View {
    Image(systemName: "headphones")
      .font(.system(size: size, weight: .semibold))
      .foregroundStyle(color)
      .overlay {
        if deafened {
          Capsule()
            .fill(color)
            .frame(width: size * 1.15, height: max(2, size * 0.12))
            .rotationEffect(.degrees(-45))
        }
      }
  }
}

@available(iOS 16.2, *)
private func micSymbol(state: VoiceChannelAttributes.ContentState) -> String {
  state.muted || state.deafened ? "mic.slash.fill" : "mic.fill"
}

@available(iOS 16.2, *)
private func muteColor(state: VoiceChannelAttributes.ContentState) -> Color {
  if state.muted || state.deafened {
    return Color(hex: state.dangerColor) ?? .red
  }
  return Color(hex: state.accentColor) ?? .purple
}

@available(iOS 16.2, *)
private func deafenColor(state: VoiceChannelAttributes.ContentState) -> Color {
  if state.deafened {
    return Color(hex: state.dangerColor) ?? .red
  }
  return Color(hex: state.accentColor) ?? .purple
}
