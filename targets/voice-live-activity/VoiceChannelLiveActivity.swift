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
          VoiceChannelIslandIdentityView(state: context.state)
        }
        DynamicIslandExpandedRegion(.center) {
          EmptyView()
        }
        DynamicIslandExpandedRegion(.trailing) {
          VoiceParticipantAvatarStack(state: context.state, size: 28, maxVisible: 3)
            .padding(.trailing, 2)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VoiceChannelBottomControlsView(state: context.state)
            .padding(.horizontal, 6)
            .padding(.bottom, 2)
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
    VStack(spacing: 10) {
      HStack(spacing: 12) {
        VoiceChannelIdentityView(state: state)
          .frame(maxWidth: .infinity, alignment: .leading)
          .layoutPriority(1)
        VoiceParticipantAvatarStack(state: state, size: 30, maxVisible: 3)
          .layoutPriority(2)
      }
      VoiceChannelBottomControlsView(state: state)
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
private struct VoiceChannelIslandIdentityView: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    HStack(alignment: .center, spacing: 8) {
      VoiceChannelSpaceIcon(state: state, size: 28)
      VoiceChannelTitleStack(state: state)
    }
    .padding(.leading, 4)
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
private struct VoiceChannelBottomControlsView: View {
  let state: VoiceChannelAttributes.ContentState

  var body: some View {
    HStack(spacing: 12) {
      Button(intent: VoiceMuteIntent()) {
        VoiceControlCircle(
          size: 36,
          active: state.muted || state.deafened,
          accent: Color(hex: state.accentColor) ?? .cyan,
          danger: Color(hex: state.dangerColor) ?? .red,
          text: Color(hex: state.textColor) ?? .white
        ) {
          Image(systemName: micSymbol(state: state))
            .font(.system(size: 15, weight: .semibold))
        }
      }
      .buttonStyle(.plain)

      Button(intent: VoiceDeafenIntent()) {
        VoiceControlCircle(
          size: 36,
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
            size: 15
          )
        }
      }
      .buttonStyle(.plain)

      Spacer(minLength: 0)

      Button(intent: VoiceDisconnectIntent()) {
        VoiceControlCircle(
          size: 36,
          active: true,
          accent: Color(hex: state.accentColor) ?? .cyan,
          danger: Color(hex: state.dangerColor) ?? .red,
          text: Color(hex: state.textColor) ?? .white
        ) {
          Image(systemName: "phone.down.fill")
            .font(.system(size: 14, weight: .semibold))
        }
      }
      .buttonStyle(.plain)
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceParticipantAvatarStack: View {
  let state: VoiceChannelAttributes.ContentState
  let size: CGFloat
  let maxVisible: Int

  private var icons: [String] {
    Array(state.participantIconFileNames.prefix(maxVisible))
  }

  private var overlap: CGFloat { size * 0.34 }

  var body: some View {
    if icons.isEmpty && state.participantOverflow <= 0 {
      EmptyView()
    } else {
      HStack(spacing: -overlap) {
        ForEach(Array(icons.enumerated()), id: \.offset) { index, fileName in
          VoiceParticipantAvatar(
            fileName: fileName,
            accent: Color(hex: state.accentColor) ?? .cyan,
            size: size
          )
          .zIndex(Double(icons.count - index))
        }

        if state.participantOverflow > 0 {
          ZStack {
            Circle()
              .fill(Color(hex: state.backgroundColor) ?? Color.black.opacity(0.85))
            Circle()
              .strokeBorder(Color.black.opacity(0.35), lineWidth: 1)
            Text("+\(min(state.participantOverflow, 99))")
              .font(.system(size: size * 0.34, weight: .bold))
              .foregroundStyle(Color(hex: state.textColor) ?? .white)
          }
          .frame(width: size, height: size)
          .zIndex(0)
        }
      }
    }
  }
}

@available(iOS 16.2, *)
private struct VoiceParticipantAvatar: View {
  let fileName: String
  let accent: Color
  let size: CGFloat

  var body: some View {
    Group {
      if let image = VoiceLiveActivityBridge.loadIcon(fileName: fileName) {
        Image(uiImage: image)
          .resizable()
          .aspectRatio(contentMode: .fill)
      } else {
        Circle()
          .fill(accent.opacity(0.85))
      }
    }
    .frame(width: size, height: size)
    .clipShape(Circle())
    .overlay(
      Circle()
        .strokeBorder(Color.black.opacity(0.45), lineWidth: 1.5)
    )
  }
}

@available(iOS 16.2, *)
private struct VoiceControlCircle<Content: View>: View {
  var size: CGFloat = 40
  let active: Bool
  let accent: Color
  let danger: Color
  let text: Color
  @ViewBuilder let content: () -> Content

  var body: some View {
    content()
      .foregroundStyle(active ? text : accent)
      .frame(width: size, height: size)
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
