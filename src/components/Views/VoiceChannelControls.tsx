import { HeadphonesOffIcon } from "@components/icons/HeadphonesOffIcon";
import { IconButton } from "@components/IconButton";
import { SpaceModeratedSheet } from "@components/Sheets/SpaceModeratedSheet";
import { useNoiseSuppressionSheet } from "@components/User/NoiseSuppressionSheet";
import { useElapsedClock } from "@hooks/useElapsedClock";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { dynamicElevation, formatColor } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import {
  HeadphonesIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  WaveformIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const CONTROL_SIZE = 52;

export const VOICE_CHANNEL_CONTROLS_HEIGHT = 128;

export const VoiceChannelControls = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const insets = useSafeAreaInsets();
  const { openSheet } = useSheet();
  const openNoiseSuppression = useNoiseSuppressionSheet();

  const voiceStatus = app.voice.connectionStatus;
  const selfMute = app.voice.effectiveSelfMute;
  const selfDeaf = app.voice.effectiveSelfDeaf;
  const cameraEnabled = app.voice.cameraEnabled;
  const isPushToTalk = app.voice.isPushToTalkMode;
  const pushToTalkActive = app.voice.pushToTalkActive;
  const canUsePushToTalk =
    isPushToTalk && voiceStatus === "connected" && !selfMute;

  const selfVoiceState = app.account
    ? app.voiceStates.get(app.account.id)
    : undefined;
  const selfElapsed = useElapsedClock(
    selfVoiceState?.channelId && !selfVoiceState.disconnectedAt
      ? selfVoiceState.joinedAt
      : null,
  );

  const controlCircle = dynamicElevation(theme.colors.surface, 4);
  const dangerCircle = theme.colors.danger;

  const openSpaceModerated = (type: "muted" | "deafened") => {
    const sheetId = type === "muted" ? "space-muted" : "space-deafened";
    openSheet(sheetId, <SpaceModeratedSheet type={type} sheetId={sheetId} />);
  };

  return (
    <Box
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 12),
        gap: 10,
        backgroundColor: formatColor(theme.colors.background, {
          alpha: 0.92,
          format: "hexa",
        }),
        borderTopWidth: 1,
        borderTopColor: `${theme.typography.colors.muted}22`,
      }}
    >
      {(selfElapsed || voiceStatus !== "connected") && (
        <Typography
          level="label-sm"
          textColor="secondary"
          style={{
            textAlign: "center",
            fontVariant: ["tabular-nums"],
          }}
        >
          {voiceStatus === "connecting"
            ? t("voice.connection.connecting")
            : voiceStatus === "failed"
              ? (app.voice.connectionError ??
                t("voice.connection.failedFallback"))
              : selfElapsed}
        </Typography>
      )}

      {canUsePushToTalk && (
        <Pressable
          onPressIn={() => app.voice.setPushToTalkPressed(true)}
          onPressOut={() => app.voice.setPushToTalkPressed(false)}
          onTouchCancel={() => app.voice.setPushToTalkPressed(false)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: pushToTalkActive
              ? theme.colors.success
              : `${theme.colors.primary}22`,
          }}
          accessibilityRole="button"
          accessibilityLabel={t("voice.controls.holdToTalkA11y")}
          accessibilityState={{ selected: pushToTalkActive }}
        >
          <MicrophoneIcon
            size={18}
            weight="fill"
            color={
              pushToTalkActive ? "#fff" : theme.typography.colors.primary
            }
          />
          <Typography
            level="body-sm"
            weight={600}
            style={{
              color: pushToTalkActive
                ? "#fff"
                : theme.typography.colors.primary,
            }}
          >
            {pushToTalkActive
              ? t("voice.controls.talking")
              : t("voice.controls.holdToTalk")}
          </Typography>
        </Pressable>
      )}

      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <IconButton
          padding={12}
          variant="soft"
          accessibilityLabel={
            app.voice.spaceMute
              ? t("voice.controls.spaceMuted")
              : selfMute
                ? t("voice.controls.unmute")
                : t("voice.controls.mute")
          }
          onPress={() => {
            if (app.voice.spaceMute) {
              openSpaceModerated("muted");
              return;
            }
            app.voice.setMute(!app.voice.selfMute);
          }}
          style={{
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selfMute ? dangerCircle : controlCircle,
          }}
        >
          {selfMute ? (
            <MicrophoneSlashIcon size={22} weight="fill" color="#fff" />
          ) : (
            <MicrophoneIcon size={22} weight="fill" />
          )}
        </IconButton>

        <IconButton
          padding={12}
          variant="soft"
          accessibilityLabel={
            app.voice.spaceDeaf
              ? t("voice.controls.spaceDeafened")
              : selfDeaf
                ? t("voice.controls.undeafen")
                : t("voice.controls.deafen")
          }
          onPress={() => {
            if (app.voice.spaceDeaf) {
              openSpaceModerated("deafened");
              return;
            }
            app.voice.setDeaf(!app.voice.selfDeaf);
          }}
          style={{
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selfDeaf ? dangerCircle : controlCircle,
          }}
        >
          {selfDeaf ? (
            <HeadphonesOffIcon size={22} weight="fill" color="#fff" />
          ) : (
            <HeadphonesIcon size={22} weight="fill" />
          )}
        </IconButton>

        <IconButton
          padding={12}
          variant="soft"
          accessibilityLabel={
            cameraEnabled
              ? t("voice.controls.disableCamera")
              : t("voice.controls.enableCamera")
          }
          onPress={() => void app.voice.toggleCamera()}
          style={{
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: cameraEnabled ? controlCircle : dangerCircle,
          }}
        >
          {cameraEnabled ? (
            <VideoCameraIcon size={22} weight="fill" />
          ) : (
            <VideoCameraSlashIcon size={22} weight="fill" color="#fff" />
          )}
        </IconButton>

        {voiceStatus === "connected" && (
          <IconButton
            padding={12}
            variant="soft"
            accessibilityLabel={t("voice.controls.noiseSuppressionA11y")}
            accessibilityState={{ selected: app.voice.noiseSuppression }}
            onPress={openNoiseSuppression}
            style={{
              width: CONTROL_SIZE,
              height: CONTROL_SIZE,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: controlCircle,
            }}
          >
            <WaveformIcon
              size={22}
              weight="fill"
              color={
                app.voice.noiseSuppression
                  ? theme.colors.success
                  : theme.typography.colors.primary
              }
            />
          </IconButton>
        )}

        <IconButton
          padding={12}
          variant="soft"
          accessibilityLabel={t("voice.connection.disconnectA11y")}
          onPress={() => {
            void app.voice.leave();
          }}
          style={{
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dangerCircle,
          }}
        >
          <PhoneXIcon size={22} weight="fill" color="#fff" />
        </IconButton>
      </Box>
    </Box>
  );
});
