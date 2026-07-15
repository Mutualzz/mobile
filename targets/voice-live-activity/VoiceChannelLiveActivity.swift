import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

struct VoiceChannelLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: VoiceChannelAttributes.self) { context in
      VoiceChannelBannerView(state: context.state)
        .activityBackgroundTint(
          Color(hex: context.state.backgroundColor) ?? Color.black.opacity(0.85)
        )
        .activitySystemActionForegroundColor(
          Color(hex: context.state.textColor) ?? .white
        )
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VoiceChannelSpaceIcon(state: context.state, size: 36)
        }
        DynamicIslandExpandedRegion(.center) {
          VoiceChannelTitleStack(state: context.state)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        DynamicIslandExpandedRegion(.trailing) {
          VoiceChannelControlsView(state: context.state)
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
      VoiceChannelIdentityView(state: state)
        .frame(maxWidth: .infinity, alignment: .leading)
        .layoutPriority(1)
      VoiceChannelControlsView(state: state)
        .layoutPriority(2)
    }
    .padding(12)
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelIdentityView: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    HStack(spacing: 10) {
      VoiceChannelSpaceIcon(state: state, size: 36)
      VoiceChannelTitleStack(state: state)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelTitleStack: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(state.spaceName.isEmpty ? "Voice" : state.spaceName)
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(Color(hex: state.textColor) ?? .white)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
        .truncationMode(.tail)
      Text(state.channelName)
        .font(.system(size: 12))
        .foregroundStyle(Color(hex: state.mutedTextColor) ?? .gray)
        .lineLimit(1)
        .minimumScaleFactor(0.85)
        .truncationMode(.tail)
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceChannelControlsView: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    HStack(spacing: 10) {
      Button(intent: VoiceMuteIntent()) {
        VoiceControlCircle(
          active: state.muted || state.deafened,
          accent: Color(hex: state.accentColor) ?? .cyan,
          danger: Color(hex: state.dangerColor) ?? .red,
          text: Color(hex: state.textColor) ?? .white
        ) {
          Image(systemName: micSymbol(state: state))
            .font(.system(size: 17, weight: .semibold))
        }
      }
      .buttonStyle(.plain)

      Button(intent: VoiceDeafenIntent()) {
        VoiceControlCircle(
          active: state.deafened,
          accent: Color(hex: state.accentColor) ?? .cyan,
          danger: Color(hex: state.dangerColor) ?? .red,
          text: Color(hex: state.textColor) ?? .white
        ) {
          HeadphonesIcon(
            deafened: state.deafened,
            color: state.deafened
              ? (Color(hex: state.textColor) ?? .white)
              : (Color(hex: state.accentColor) ?? .cyan),
            size: 17
          )
        }
      }
      .buttonStyle(.plain)
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceControlCircle<Content: View>: View {
  let active: Bool
  let accent: Color
  let danger: Color
  let text: Color
  @ViewBuilder let content: () -> Content

  var body: some View {
    content()
      .foregroundStyle(active ? text : accent)
      .frame(width: 40, height: 40)
      .background(
        Circle()
          .fill(active ? danger.opacity(0.85) : accent.opacity(0.18))
      )
      .overlay(
        Circle()
          .strokeBorder(
            active ? danger.opacity(0.95) : accent.opacity(0.45),
            lineWidth: 1
          )
      )
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
            .fill(Color(hex: state.accentColor) ?? .cyan)
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
  return Color(hex: state.accentColor) ?? .cyan
}

@available(iOS 16.2, *)
private func deafenColor(state: VoiceChannelAttributes.ContentState) -> Color {
  if state.deafened {
    return Color(hex: state.dangerColor) ?? .red
  }
  return Color(hex: state.accentColor) ?? .cyan
}
