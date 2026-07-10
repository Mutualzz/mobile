import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { Space } from "@stores/objects/Space";
import type { VoiceState } from "@stores/objects/VoiceState";
import {
  Box,
  ButtonGroup,
  Divider,
  Modal,
  Typography,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import {
  HeadphonesIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  state: VoiceState;
  space: Space;
  visible: boolean;
  onRequestClose: () => void;
  onClose: () => void;
}

export const VoiceParticipantActionSheet = observer(
  ({ state, space, visible, onRequestClose, onClose }: Props) => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const user = state.user;
    const member = state.member;
    const isSelf = state.userId === app.account?.id;
    const me = space.members.me;

    const canMuteMembers = me?.hasPermission("MuteMembers") ?? false;
    const canDeafenMembers = me?.hasPermission("DeafenMembers") ?? false;
    const canDisconnectMembers = me?.hasPermission("MoveMembers") ?? false;

    const { mutate: moderateMember, isPending: moderating } = useMutation({
      mutationKey: ["moderate-member-voice", member?.id, space.id],
      mutationFn: async (action: "mute" | "deafen" | "disconnect") => {
        if (!member) return null;
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

    if (isSelf || !member || !user) return null;

    const hasActions =
      canMuteMembers || canDeafenMembers || canDisconnectMembers;
    if (!hasActions) return null;

    return (
      <Modal
        open={visible}
        onClose={onClose}
        layout="fullscreen"
        showCloseButton={false}
        style={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          backgroundColor: "transparent",
          paddingVertical: 0,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <View onStartShouldSetResponder={() => true}>
            <Box
              style={{
                marginHorizontal: 12,
                marginBottom: insets.bottom + 12,
              }}
            >
              <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  borderRadius: 16,
                  padding: 12,
                  gap: 8,
                }}
              >
                <Box
                  style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}
                >
                  <Typography level="body-md" weight={700}>
                    {user.displayName}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    Voice moderation
                  </Typography>
                </Box>

                <Divider lineColor="muted" />

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
                      {state.spaceMute ? "Remove space mute" : "Space mute"}
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
                      {state.spaceDeaf ? "Remove space deafen" : "Space deafen"}
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
                      Disconnect
                    </Button>
                  )}
                </ButtonGroup>
              </Paper>
            </Box>
          </View>
        </View>
      </Modal>
    );
  },
);
