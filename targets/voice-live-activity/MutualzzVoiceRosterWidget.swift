import WidgetKit
import SwiftUI

struct MutualzzVoiceRosterWidget: Widget {
  let kind = WidgetSnapshotStore.voiceRosterKind

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: VoiceRosterProvider()) { entry in
      VoiceRosterView(entry: entry)
        .containerBackground(for: .widget) {
          Color(hex: entry.snapshot.theme.backgroundColor) ?? Color.black.opacity(0.85)
        }
    }
    .configurationDisplayName("Voice Roster")
    .description("Who is in your current Mutualzz voice channel.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

private struct VoiceRosterEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
}

private struct VoiceRosterProvider: TimelineProvider {
  func placeholder(in context: Context) -> VoiceRosterEntry {
    VoiceRosterEntry(date: .now, snapshot: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (VoiceRosterEntry) -> Void) {
    completion(VoiceRosterEntry(date: .now, snapshot: WidgetSnapshotStore.load() ?? .empty))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<VoiceRosterEntry>) -> Void) {
    let entry = VoiceRosterEntry(date: .now, snapshot: WidgetSnapshotStore.load() ?? .empty)
    completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(5 * 60))))
  }
}

private struct VoiceRosterView: View {
  @Environment(\.widgetFamily) private var family
  let entry: VoiceRosterEntry

  private var voice: WidgetSnapshot.VoiceSnapshot { entry.snapshot.voice }
  private var theme: WidgetSnapshot.ThemeSnapshot { entry.snapshot.theme }

  var body: some View {
    Group {
      if !voice.connected {
        VStack(alignment: .leading, spacing: 8) {
          Text("Voice")
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
          Spacer(minLength: 0)
          Text("Not connected")
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(Color(hex: theme.textColor) ?? .white)
        }
      } else if family == .systemMedium {
        VStack(alignment: .leading, spacing: 8) {
          HStack {
            VStack(alignment: .leading, spacing: 2) {
              Text(voice.spaceName.isEmpty ? "Voice" : voice.spaceName)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
              Text(voice.channelName)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Color(hex: theme.textColor) ?? .white)
                .lineLimit(1)
            }
            Spacer()
            Text("\(voice.members.count)")
              .font(.system(size: 18, weight: .bold))
              .foregroundStyle(Color(hex: theme.accentColor) ?? .cyan)
          }
          ForEach(voice.members.prefix(4), id: \.id) { member in
            HStack(spacing: 6) {
              Image(systemName: member.deafened ? "headphones" : member.muted ? "mic.slash.fill" : "mic.fill")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(
                  member.muted || member.deafened
                    ? (Color(hex: theme.dangerColor) ?? .red)
                    : (Color(hex: theme.accentColor) ?? .cyan)
                )
              Text(member.displayName)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color(hex: theme.textColor) ?? .white)
                .lineLimit(1)
              Spacer(minLength: 0)
            }
          }
          Spacer(minLength: 0)
        }
      } else {
        VStack(alignment: .leading, spacing: 8) {
          Text(voice.channelName)
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(Color(hex: theme.textColor) ?? .white)
            .lineLimit(2)
          Spacer(minLength: 0)
          Text("\(voice.members.count) in channel")
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Color(hex: theme.accentColor) ?? .cyan)
          Text(voice.members.first?.displayName ?? "")
            .font(.system(size: 12))
            .foregroundStyle(Color(hex: theme.mutedTextColor) ?? .gray)
            .lineLimit(1)
        }
      }
    }
    .widgetURL(URL(string: voice.deepLink.isEmpty ? "com.mutualzz.app://" : voice.deepLink))
  }
}
