import { ChannelActionSheet } from "@components/Channel/ChannelActionSheet";
import { SpaceMenuSheet } from "@components/Space/SpaceMenuSheet";
import { ChannelCreateSheet } from "@components/Channel/ChannelCreateSheet";
import { CategoryCreateSheet } from "@components/Channel/CategoryCreateSheet";
import { CategoryDeleteSheet } from "@components/Channel/CategoryDeleteSheet";
import { ChannelSettingsSheet } from "@components/ChannelSettings/ChannelSettingsSheet";
import { IconButton } from "@components/IconButton";
import { ChannelListItem } from "@components/Channel/ChannelListItem/ChannelListItem";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { SpaceInviteToSpaceSheet } from "@components/Space/SpaceInviteToSpaceSheet";
import { CaretDownIcon, PlusIcon, UserPlusIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, ButtonGroup, Modal, Typography } from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import { flattenChannels } from "@utils/channelReorder";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable, View } from "react-native";

export const ChannelList = observer(() => {
  const app = useAppStore();

  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Channel | null>(null);
  const [settingsChannel, setSettingsChannel] = useState<Channel | null>(null);
  const [actionChannel, setActionChannel] = useState<Channel | null>(null);
  const [createParent, setCreateParent] = useState<Channel | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);

  const space = app.spaces.active;
  if (!space) return null;

  const spaceMe = space.members.me;
  const canManageChannels = !!spaceMe?.hasPermission("ManageChannels");

  const visibleChannels = space.visibleChannels;
  const activeChannel = app.channels.active;

  const flatChannels = flattenChannels(visibleChannels);

  const toggleCategory = (categoryId: string) => {
    app.channels.toggleCategoryCollapse(space.id, categoryId);
  };

  const openCreateChannel = (parent?: Channel) => {
    setCreateParent(parent ?? null);
    setCreateChannelOpen(true);
  };

  return (
    <Screen
      style={{
        flexDirection: "column",
        width: "100%",
        borderTopLeftRadius: app.settings?.preferEmbossed ? 0 : 8,
        borderBottomLeftRadius: app.settings?.preferEmbossed ? 0 : 8,
        borderRightWidth: 0,
        flex: 1,
      }}
    >
      <ScreenHeader
        style={{
          justifyContent: "space-between",
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderTopWidth: 0,
        }}
      >
        <Pressable
          style={{ flex: 1, minWidth: 0 }}
          onPress={() => setSpaceMenuOpen(true)}
        >
          <Typography level="body-lg" truncate="single">
            {space.name}
          </Typography>
        </Pressable>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <ButtonGroup size={12} spacing={4} variant="plain">
            <IconButton
              accessibilityLabel="Create invite"
              onPress={() => setInviteOpen(true)}
            >
              <UserPlusIcon weight="fill" />
            </IconButton>
            {canManageChannels && (
              <IconButton
                accessibilityLabel="Create category"
                onPress={() => setCreateCategoryOpen(true)}
              >
                <PlusIcon weight="bold" />
              </IconButton>
            )}
            <IconButton
              accessibilityLabel="Space menu"
              onPress={() => setSpaceMenuOpen(true)}
            >
              <CaretDownIcon weight="bold" />
            </IconButton>
          </ButtonGroup>
        </Box>
      </ScreenHeader>
      <Box
        style={{
          flex: 1,
          flexDirection: "column",
          gap: 4,
          paddingTop: 4,
        }}
      >
        {flatChannels.map((channel) => (
          <ChannelListItem
            key={channel.id}
            channel={channel}
            isCategory={channel.type === ChannelType.Category}
            active={activeChannel?.id === channel.id}
            space={space}
            canManageChannels={canManageChannels}
            isCollapsed={app.channels.isCategoryCollapsed(space.id, channel.id)}
            onToggleCollapse={
              channel.type === ChannelType.Category
                ? () => toggleCategory(channel.id)
                : undefined
            }
            onCreateInCategory={
              channel.type === ChannelType.Category && canManageChannels
                ? () => openCreateChannel(channel)
                : undefined
            }
            onLongPress={() => {
              if (channel.type === ChannelType.Category) {
                if (canManageChannels) setActionChannel(channel);
                return;
              }
              if (
                channel.type === ChannelType.Text ||
                channel.type === ChannelType.Voice
              ) {
                setActionChannel(channel);
              }
            }}
          />
        ))}
      </Box>

      <ChannelCreateSheet
        visible={createChannelOpen}
        onClose={() => {
          setCreateChannelOpen(false);
          setCreateParent(null);
        }}
        space={space}
        parent={createParent ?? undefined}
      />

      <CategoryCreateSheet
        visible={createCategoryOpen}
        onClose={() => setCreateCategoryOpen(false)}
        space={space}
      />

      {deleteCategory && (
        <CategoryDeleteSheet
          visible
          channel={deleteCategory}
          onClose={() => setDeleteCategory(null)}
        />
      )}

      {settingsChannel && (
        <ChannelSettingsSheet
          visible
          channel={settingsChannel}
          onClose={() => setSettingsChannel(null)}
        />
      )}

      {actionChannel && (
        <ChannelActionSheet
          space={space}
          channel={actionChannel}
          visible
          onClose={() => setActionChannel(null)}
          onOpenSettings={() => {
            setSettingsChannel(actionChannel);
            setActionChannel(null);
          }}
          onDeleteCategory={
            actionChannel.type === ChannelType.Category
              ? () => {
                  setDeleteCategory(actionChannel);
                  setActionChannel(null);
                }
              : undefined
          }
        />
      )}

      <SpaceMenuSheet
        space={space}
        visible={spaceMenuOpen}
        onClose={() => setSpaceMenuOpen(false)}
      />

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        layout="fullscreen"
        showCloseButton={false}
        style={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          backgroundColor: "transparent",
          paddingVertical: 0,
        }}
      >
        <View pointerEvents="box-none" style={{ width: "100%" }}>
          <Screen
            variant="elevation"
            fill={false}
            style={{ flexDirection: "column", padding: 16 }}
          >
            <SpaceInviteToSpaceSheet
              space={space}
              channel={activeChannel}
              onClose={() => setInviteOpen(false)}
            />
          </Screen>
        </View>
      </Modal>
    </Screen>
  );
});
