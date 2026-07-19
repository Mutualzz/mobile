import { HeadphonesOffIcon } from "@components/icons/HeadphonesOffIcon";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { dynamicElevation, formatColor } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { VoiceState } from "@stores/objects/VoiceState";
import { MicrophoneSlashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";
import { RTCView } from "react-native-webrtc";
import { useTranslation } from "react-i18next";

interface Props {
  state: VoiceState;
  selfId?: string;
  fill?: boolean;
  tileWidth?: number;
  onOpenActions?: () => void;
}

export const VoiceChannelParticipant = observer(
  ({
    state,
    selfId,
    fill = false,
    tileWidth,
    onOpenActions,
  }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { t } = useTranslation("chat");
    const user = state.user;
    const isSelf = state.userId === selfId;
    const speaking =
      app.voice.isUserSpeaking(state.userId) &&
      !(isSelf && app.voice.effectiveSelfMute) &&
      !(isSelf && app.voice.effectiveSelfDeaf);
    const muted = isSelf
      ? app.voice.effectiveSelfMute
      : !!(state.selfMute || state.spaceMute);
    const deafened = isSelf
      ? app.voice.effectiveSelfDeaf
      : !!(state.selfDeaf || state.spaceDeaf);
    const locallyMuted =
      !isSelf && app.voice.isUserVoiceMuted(state.userId);
    const cameraStream = isSelf
      ? app.voice.getLocalCameraStream()
      : app.voice.getCameraStreamForUser(state.userId);
    const streamURL = cameraStream?.toURL?.() ?? null;
    const displayName = user?.displayName ?? t("deletedUser");
    const interactive = !!onOpenActions && !isSelf;
    const showMuteBadge = muted || locallyMuted || deafened;
    const showDeafBadge = deafened;
    const badgeBackground = formatColor(theme.colors.danger, {
      alpha: 0.92,
      format: "hexa",
    });

    return (
      <Pressable
        disabled={!interactive}
        onLongPress={interactive ? onOpenActions : undefined}
        style={{
          flex: fill ? 1 : undefined,
          width: fill ? undefined : tileWidth,
          maxWidth: fill ? undefined : tileWidth,
        }}
      >
        <Box
          style={{
            flex: fill ? 1 : undefined,
            width: fill ? "100%" : tileWidth,
            aspectRatio: fill ? undefined : 1,
            minHeight: fill ? 200 : undefined,
            borderRadius: 12,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dynamicElevation(theme.colors.surface, 3),
            borderWidth: speaking ? 3 : 0,
            borderColor: speaking ? theme.colors.success : "transparent",
          }}
        >
          {streamURL ? (
            <RTCView
              streamURL={streamURL}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              objectFit="cover"
              mirror={isSelf}
              zOrder={0}
            />
          ) : (
            <UserAvatar
              user={user ?? undefined}
              size={fill ? 96 : tileWidth && tileWidth < 160 ? 64 : 80}
              speaking={speaking}
            />
          )}

          {(showMuteBadge || showDeafBadge) && (
            <Box
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                zIndex: 2,
              }}
            >
              {showMuteBadge && (
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: badgeBackground,
                  }}
                >
                  <MicrophoneSlashIcon size={14} weight="fill" color="#fff" />
                </Box>
              )}
              {showDeafBadge && (
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: badgeBackground,
                  }}
                >
                  <HeadphonesOffIcon size={14} weight="fill" color="#fff" />
                </Box>
              )}
            </Box>
          )}

          <Box
            style={{
              position: "absolute",
              left: 10,
              right: 10,
              bottom: 10,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              zIndex: 2,
              backgroundColor: formatColor(theme.colors.background, {
                alpha: 0.65,
                format: "hexa",
              }),
            }}
          >
            <Typography level="label-xs" textColor="primary" truncate="single">
              {isSelf
                ? `${displayName} ${t("voice.participant.you")}`
                : displayName}
            </Typography>
          </Box>
        </Box>
      </Pressable>
    );
  },
);
