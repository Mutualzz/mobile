import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import {
  Box,
  ButtonGroup,
  Divider,
  Modal,
  Typography,
} from "@mutualzz/ui-native";
import {
  flattenChannels,
  getChannelMoveState,
  moveChannelInList,
} from "@utils/channelReorder";
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  GearIcon,
  PaperPlaneTiltIcon,
  TrashIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpaceInviteToSpaceSheet } from "@components/Space/SpaceInviteToSpaceSheet";

interface Props {
  space: Space;
  channel: Channel;
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onDeleteCategory?: () => void;
}

export const ChannelActionSheet = observer(
  ({
    space,
    channel,
    visible,
    onClose,
    onOpenSettings,
    onDeleteCategory,
  }: Props) => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const { openModal } = useModal();

    const isCategory = channel.type === ChannelType.Category;
    const readState = !isCategory ? app.readStates.get(channel.id) : null;
    const me = space.members.me;
    const canManageChannels =
      me?.hasPermission("ManageChannels", channel) ?? false;
    const canInvite = me?.hasPermission("CreateInvites", channel) ?? false;
    const flatChannels = flattenChannels(space.visibleChannels);
    const { canMoveUp, canMoveDown } = getChannelMoveState(
      flatChannels,
      channel.id,
    );
    const canReorder = canManageChannels && (canMoveUp || canMoveDown);

    const moveChannel = (direction: -1 | 1) => {
      const nextOrder = moveChannelInList(
        flatChannels,
        space.visibleChannels,
        channel.id,
        direction,
      );
      if (!nextOrder) return;
      app.channels.setChannelOrder(space.id, nextOrder);
      onClose();
    };

    const markRead = () => {
      void readState?.ack();
      onClose();
    };

    const openInvite = () => {
      onClose();
      openModal(
        `channel-invite-${channel.id}`,
        <SpaceInviteToSpaceSheet space={space} channel={channel} />,
      );
    };

    const openSettings = () => {
      onClose();
      onOpenSettings();
    };

    const deleteCategory = () => {
      onClose();
      onDeleteCategory?.();
    };

    const hasMarkRead = !!readState?.isUnread;
    const hasActions =
      hasMarkRead ||
      canInvite ||
      canManageChannels ||
      canReorder ||
      (isCategory && canManageChannels);

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
                <Box style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}>
                  <Typography level="body-md" weight={700} truncate="single">
                    {isCategory ? channel.name : `#${channel.name}`}
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
                  {hasMarkRead ? (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <CheckCircleIcon size={20} weight="fill" />
                      }
                      onPress={markRead}
                    >
                      Mark as read
                    </Button>
                  ) : null}

                  {!isCategory && canInvite ? (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <PaperPlaneTiltIcon size={20} weight="fill" />
                      }
                      onPress={openInvite}
                    >
                      Invite to channel
                    </Button>
                  ) : null}

                  {canReorder ? (
                    <>
                      <Button
                        fullWidth
                        padding={12}
                        disabled={!canMoveUp}
                        startDecorator={<CaretUpIcon size={20} weight="fill" />}
                        onPress={() => moveChannel(-1)}
                      >
                        Move up
                      </Button>
                      <Button
                        fullWidth
                        padding={12}
                        disabled={!canMoveDown}
                        startDecorator={
                          <CaretDownIcon size={20} weight="fill" />
                        }
                        onPress={() => moveChannel(1)}
                      >
                        Move down
                      </Button>
                    </>
                  ) : null}

                  {canManageChannels ? (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={<GearIcon size={20} weight="fill" />}
                      onPress={openSettings}
                    >
                      {isCategory ? "Edit category" : "Channel settings"}
                    </Button>
                  ) : null}

                  {isCategory && canManageChannels && onDeleteCategory ? (
                    <Button
                      fullWidth
                      padding={12}
                      color="danger"
                      startDecorator={<TrashIcon size={20} weight="fill" />}
                      onPress={deleteCategory}
                    >
                      Delete category
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
