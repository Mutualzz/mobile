import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { VoiceState } from "@stores/objects/VoiceState";
import type { Space } from "@stores/objects/Space";
import { Box, IconButton, Slider, Typography, useTheme } from "@mutualzz/ui-native";
import {
  MicrophoneSlashIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Pressable, View } from "react-native";
import { RTCView } from "react-native-webrtc";

interface Props {
  state: VoiceState;
  space?: Space | null;
  selfId?: string;
  showAudioControls?: boolean;
  onModerate?: () => void;
}

export const VoiceChannelParticipant = observer(
  ({ state, space, selfId, showAudioControls = false, onModerate }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const user = state.user;
  const isSelf = state.userId === selfId;
  const me = space?.members.me;
  const canModerate =
    !isSelf &&
    !!space &&
    !!onModerate &&
    ((me?.hasPermission("MuteMembers") ?? false) ||
      (me?.hasPermission("DeafenMembers") ?? false) ||
      (me?.hasPermission("MoveMembers") ?? false));
  const speaking =
    app.voice.isUserSpeaking(state.userId) &&
    !(isSelf && app.voice.effectiveSelfMute);
  const volume = app.voice.getUserVoiceVolume(state.userId);
  const locallyMuted = app.voice.isUserVoiceMuted(state.userId);
  const cameraStream = app.voice.getCameraStreamForUser(state.userId);

  return (
    <Pressable
      disabled={!canModerate}
      onLongPress={canModerate ? onModerate : undefined}
    >
    <Box
      style={{
        flexDirection: "column",
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: speaking
          ? `${theme.colors.success}18`
          : `${theme.typography.colors.muted}14`,
        borderWidth: speaking ? 1 : 0,
        borderColor: speaking ? theme.colors.success : "transparent",
      }}
    >
      {cameraStream ? (
        <View
          style={{
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "#000",
          }}
        >
          <RTCView
            streamURL={cameraStream.toURL()}
            style={{ width: "100%", height: "100%" }}
            objectFit="cover"
            mirror={isSelf}
          />
        </View>
      ) : null}

      <Box style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <UserAvatar user={user ?? undefined} size={40} speaking={speaking} />
        <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography truncate="single">
            {user?.displayName ?? state.userId}
            {isSelf ? " (You)" : ""}
          </Typography>
          {speaking ? (
            <Typography level="body-xs" textColor="accent">
              Speaking
            </Typography>
          ) : state.selfMute || state.spaceMute ? (
            <Typography level="body-xs" textColor="muted">
              {state.spaceMute ? "Server muted" : "Muted"}
            </Typography>
          ) : state.spaceDeaf ? (
            <Typography level="body-xs" textColor="muted">
              Server deafened
            </Typography>
          ) : null}
        </Box>

        {!isSelf && showAudioControls ? (
          <IconButton
            padding={8}
            accessibilityLabel={
              locallyMuted ? "Unmute this user locally" : "Mute this user locally"
            }
            onPress={() => app.voice.toggleUserVoiceMuted(state.userId)}
          >
            {locallyMuted ? (
              <SpeakerSlashIcon
                size={18}
                color={theme.colors.danger}
                weight="fill"
              />
            ) : (
              <SpeakerHighIcon
                size={18}
                color={theme.typography.colors.primary}
                weight="fill"
              />
            )}
          </IconButton>
        ) : state.selfMute || app.voice.effectiveSelfMute ? (
          <MicrophoneSlashIcon
            size={18}
            color={theme.typography.colors.muted}
            weight="fill"
          />
        ) : null}
      </Box>

      {!isSelf && showAudioControls ? (
        <Box style={{ gap: 4, paddingHorizontal: 4 }}>
          <Typography level="body-xs" textColor="muted">
            Volume {volume}%
          </Typography>
          <Slider
            min={0}
            max={200}
            step={1}
            value={volume}
              onChange={(value) =>
                app.voice.setUserVoiceVolume(
                  state.userId,
                  Array.isArray(value) ? value[0] : value,
                )
              }
          />
        </Box>
      ) : null}
    </Box>
    </Pressable>
  );
},
);
