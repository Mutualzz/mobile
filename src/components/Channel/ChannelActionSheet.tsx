import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { Box, ButtonGroup, Divider, Sheet, Typography } from "@mutualzz/ui-native";
import {
  flattenChannels,
  getChannelMoveState,
  moveChannelInList } from "@utils/channelReorder";
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  GearIcon,
  PaperPlaneTiltIcon,
  TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
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
    onDeleteCategory}: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const { openSheet } = useSheet();

    const isCategory = channel.type === ChannelType.Category;
    const readState = !isCategory ? app.readStates.get(channel.id) : null;
    const me = space.members.me;
    const canManageChannels =
      me?.hasPermission("ManageChannels", channel) ?? false;
    const canInvite = me?.hasPermission("CreateInvites", channel) ?? false;
    const flatChannels = flattenChannels(space.channels);
    const { canMoveUp, canMoveDown } = getChannelMoveState(
      flatChannels,
      channel.id,
    );
    const canReorder = canManageChannels && (canMoveUp || canMoveDown);

    const moveChannel = (direction: -1 | 1) => {
      const nextOrder = moveChannelInList(
        flatChannels,
        space.channels,
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
      openSheet(
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
                gap: 8}}
            >
              <Box style={{ gap: 8 }}>
                <Box
                  style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}
                >
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
                  {hasMarkRead && (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <CheckCircleIcon size={20} weight="fill" />
                      }
                      onPress={markRead}
                    >
                      {t("contextMenu.markAsRead")}
                    </Button>
                  )}

                  {!isCategory && canInvite && (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <PaperPlaneTiltIcon size={20} weight="fill" />
                      }
                      onPress={openInvite}
                    >
                      {t("contextMenu.inviteToChannel")}
                    </Button>
                  )}

                  {canReorder && (
                    <>
                      <Button
                        fullWidth
                        padding={12}
                        disabled={!canMoveUp}
                        startDecorator={<CaretUpIcon size={20} weight="fill" />}
                        onPress={() => moveChannel(-1)}
                      >
                        {t("contextMenu.moveUp")}
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
                        {t("contextMenu.moveDown")}
                      </Button>
                    </>
                  )}

                  {canManageChannels && (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={<GearIcon size={20} weight="fill" />}
                      onPress={openSettings}
                    >
                      {isCategory
                        ? t("contextMenu.editCategory")
                        : t("contextMenu.channelSettings")}
                    </Button>
                  )}

                  {isCategory && canManageChannels && onDeleteCategory && (
                    <Button
                      fullWidth
                      padding={12}
                      color="danger"
                      startDecorator={<TrashIcon size={20} weight="fill" />}
                      onPress={deleteCategory}
                    >
                      {t("contextMenu.deleteCategory")}
                    </Button>
                  )}
                </ButtonGroup>
              </Box>
            </Box>
          </View>
        </View>
      </Sheet>
    );
  },
);
