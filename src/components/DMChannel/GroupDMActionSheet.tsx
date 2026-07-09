import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import {
  Box,
  ButtonGroup,
  Divider,
  Modal,
  Typography,
} from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  GearIcon,
  SignOutIcon,
  TrashIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
  onOpenManage: () => void;
}

export const GroupDMActionSheet = observer(
  ({ channel, visible, onClose, onOpenManage }: Props) => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const { navigate } = useAppNavigation();

    const readState = app.readStates.get(channel.id);
    const isOwner = !!channel.ownerId && channel.ownerId === app.account?.id;

    const onLeft = () => {
      onClose();
      navigate("/@me", { replace: true });
    };

    const { mutate: leaveGroup, isPending: isLeaving } = useMutation({
      mutationKey: ["leave-group-dm", channel.id],
      mutationFn: () => app.channels.leaveGroupDM(channel.id),
      onSuccess: onLeft,
    });

    const { mutate: deleteGroup, isPending: isDeleting } = useMutation({
      mutationKey: ["delete-group-dm", channel.id],
      mutationFn: () => app.channels.deleteGroupDM(channel.id),
      onSuccess: onLeft,
    });

    const isPending = isLeaving || isDeleting;
    const title =
      channel.name ??
      (channel.dmRecipientsList
        .map((user) => user.displayName)
        .filter(Boolean)
        .join(", ") || "Group DM");

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
                <Box style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}>
                  <Typography level="body-md" weight={700} truncate="double">
                    {title}
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
                  {readState?.isUnread ? (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <CheckCircleIcon size={20} weight="fill" />
                      }
                      onPress={() => {
                        void readState.ack();
                        onClose();
                      }}
                    >
                      Mark as read
                    </Button>
                  ) : null}

                  {isOwner ? (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={<GearIcon size={20} weight="fill" />}
                      onPress={() => {
                        onClose();
                        onOpenManage();
                      }}
                    >
                      Manage group
                    </Button>
                  ) : null}

                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={<SignOutIcon size={20} weight="fill" />}
                    disabled={isPending}
                    onPress={() => leaveGroup()}
                  >
                    Leave group
                  </Button>

                  {isOwner ? (
                    <Button
                      fullWidth
                      padding={12}
                      color="danger"
                      startDecorator={<TrashIcon size={20} weight="fill" />}
                      disabled={isPending}
                      onPress={() => deleteGroup()}
                    >
                      Delete group
                    </Button>
                  ) : null}
                </ButtonGroup>
              </Paper>
            </Box>
          </View>
        </View>
      </Modal>
    );
  },
);
