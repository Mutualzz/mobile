import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import type { Space } from "@stores/objects/Space";
import type { VoiceState } from "@stores/objects/VoiceState";
import {
  Box,
  ButtonGroup,
  Divider,
  Sheet,
  Slider,
  Typography,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import {
  HeadphonesIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  state: VoiceState;
  space?: Space | null;
  visible: boolean;
  showAudioControls?: boolean;
  onRequestClose: () => void;
  onClose: () => void;
}

export const VoiceParticipantActionSheet = observer(
  ({
    state,
    space,
    visible,
    showAudioControls = false,
    onRequestClose,
    onClose,
  }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const user = state.user;
    const member = state.member;
    const isSelf = state.userId === app.account?.id;
    const me = space?.members.me;

    const canMuteMembers = me?.hasPermission("MuteMembers") ?? false;
    const canDeafenMembers = me?.hasPermission("DeafenMembers") ?? false;
    const canDisconnectMembers = me?.hasPermission("MoveMembers") ?? false;
    const hasModActions =
      !!member &&
      !!space &&
      (canMuteMembers || canDeafenMembers || canDisconnectMembers);
    const volume = app.voice.getUserVoiceVolume(state.userId);
    const locallyMuted = app.voice.isUserVoiceMuted(state.userId);

    const { mutate: moderateMember, isPending: moderating } = useMutation({
      mutationKey: ["moderate-member-voice", member?.id, space?.id],
      mutationFn: async (action: "mute" | "deafen" | "disconnect") => {
        if (!member || !space) return null;
        const body: Record<string, boolean> = {};

        if (action === "mute") body.spaceMute = !state.spaceMute;
        else if (action === "deafen") body.spaceDeaf = !state.spaceDeaf;
        else if (action === "disconnect") body.disconnect = true;

        return app.rest.patch(
          `/spaces/${space.id}/members/${member.id}/voice`,
          body,
        );
      },
      onSuccess: () => {
        onRequestClose();
      },
    });

    if (isSelf || !user) return null;
    if (!hasModActions && !showAudioControls) return null;

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
        enableDynamicSizing
      >
        <View style={{ width: "100%" }}>
          <View onStartShouldSetResponder={() => true}>
            <Box
              style={{
                width: "100%",
                padding: 16,
                gap: 8,
              }}
            >
              <Box style={{ gap: 8 }}>
                <Box
                  style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}
                >
                  <Typography level="body-md" weight={700}>
                    {user.displayName}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {hasModActions
                      ? t("voice.moderation.title")
                      : t("voice.controls.volume")}
                  </Typography>
                </Box>

                <Divider lineColor="muted" />

                {showAudioControls && (
                  <Box style={{ gap: 10, paddingVertical: 4 }}>
                    <Button
                      fullWidth
                      padding={12}
                      variant={locallyMuted ? "soft" : "plain"}
                      color={locallyMuted ? "danger" : "neutral"}
                      startDecorator={
                        locallyMuted ? (
                          <SpeakerSlashIcon size={20} weight="fill" />
                        ) : (
                          <SpeakerHighIcon size={20} weight="fill" />
                        )
                      }
                      onPress={() =>
                        app.voice.toggleUserVoiceMuted(state.userId)
                      }
                    >
                      {locallyMuted
                        ? t("voice.controls.unmuteUserLocally")
                        : t("voice.controls.muteUserLocally")}
                    </Button>

                    <Box style={{ gap: 4, paddingHorizontal: 4 }}>
                      <Typography level="body-xs" textColor="muted">
                        {t("voice.controls.volumePercent", { value: volume })}
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
                  </Box>
                )}

                {hasModActions && showAudioControls && (
                  <Divider lineColor="muted" />
                )}

                {hasModActions && (
                  <ButtonGroup
                    orientation="vertical"
                    variant="plain"
                    fullWidth
                    horizontalAlign="left"
                    spacing={0.5}
                  >
                    {canMuteMembers && (
                      <Button
                        fullWidth
                        padding={12}
                        color="danger"
                        variant={state.spaceMute ? "soft" : "plain"}
                        startDecorator={
                          <MicrophoneSlashIcon size={20} weight="fill" />
                        }
                        disabled={moderating}
                        onPress={() => moderateMember("mute")}
                      >
                        {state.spaceMute
                          ? t("voice.moderation.removeSpaceMute")
                          : t("voice.moderation.spaceMute")}
                      </Button>
                    )}

                    {canDeafenMembers && (
                      <Button
                        fullWidth
                        padding={12}
                        color="danger"
                        variant={state.spaceDeaf ? "soft" : "plain"}
                        startDecorator={
                          <HeadphonesIcon size={20} weight="fill" />
                        }
                        disabled={moderating}
                        onPress={() => moderateMember("deafen")}
                      >
                        {state.spaceDeaf
                          ? t("voice.moderation.removeSpaceDeafen")
                          : t("voice.moderation.spaceDeafen")}
                      </Button>
                    )}

                    {canDisconnectMembers && (
                      <Button
                        fullWidth
                        padding={12}
                        color="danger"
                        startDecorator={<PhoneXIcon size={20} weight="fill" />}
                        disabled={moderating}
                        onPress={() => moderateMember("disconnect")}
                      >
                        {t("voice.moderation.disconnect")}
                      </Button>
                    )}
                  </ButtonGroup>
                )}
              </Box>
            </Box>
          </View>
        </View>
      </Sheet>
    );
  },
);
