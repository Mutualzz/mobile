import { SpaceMenuSheet } from "@components/Space/SpaceMenuSheet";
import { ChannelCreateSheet } from "@components/Channel/ChannelCreateSheet";
import { CategoryCreateSheet } from "@components/Channel/CategoryCreateSheet";
import { CategoryDeleteSheet } from "@components/Channel/CategoryDeleteSheet";
import { ChannelSettingsSheet } from "@components/ChannelSettings/ChannelSettingsSheet";
import { IconButton } from "@components/IconButton";
import { ChannelListItem } from "@components/Channel/ChannelListItem/ChannelListItem";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { SpaceCreateInviteSheet } from "@components/SpaceSettings/SpaceCreateInviteSheet";
import { CaretDownIcon, PlusIcon, UserPlusIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, ButtonGroup, Typography } from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal, Pressable } from "react-native";

function flattenChannels(channels: Channel[]) {
  const childIds = new Set(channels.filter((c) => c.parent).map((c) => c.id));

  const result: Channel[] = [];
  for (const channel of channels) {
    if (childIds.has(channel.id)) continue;

    result.push(channel);

    if (channel.type === ChannelType.Category) {
      const children = channels.filter((c) => c.parent?.id === channel.id);

      children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      result.push(...children);
    }
  }

  return result;
}

export const ChannelList = observer(() => {
  const app = useAppStore();

  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Channel | null>(null);
  const [settingsChannel, setSettingsChannel] = useState<Channel | null>(null);
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
          <Typography level="body-lg" numberOfLines={1}>
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
            {canManageChannels ? (
              <IconButton
                accessibilityLabel="Create category"
                onPress={() => setCreateCategoryOpen(true)}
              >
                <PlusIcon weight="bold" />
              </IconButton>
            ) : null}
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
            onLongPress={
              canManageChannels
                ? () => {
                    if (channel.type === ChannelType.Category) {
                      setDeleteCategory(channel);
                      return;
                    }
                    if (
                      channel.type === ChannelType.Text ||
                      channel.type === ChannelType.Voice
                    ) {
                      setSettingsChannel(channel);
                    }
                  }
                : undefined
            }
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

      <SpaceMenuSheet
        space={space}
        visible={spaceMenuOpen}
        onClose={() => setSpaceMenuOpen(false)}
      />

      <Modal
        visible={inviteOpen}
        animationType="slide"
        onRequestClose={() => setInviteOpen(false)}
      >
        <Screen
          variant="elevation"
          style={{ flexDirection: "column", padding: 16 }}
        >
          <SpaceCreateInviteSheet
            space={space}
            onClose={() => setInviteOpen(false)}
          />
        </Screen>
      </Modal>
    </Screen>
  );
});
