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
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, ButtonGroup, Sheet, Typography } from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import { flattenChannels } from "@utils/channelReorder";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

const ESTIMATED_CHANNEL_ROW_HEIGHT = 44;
const ESTIMATED_CATEGORY_ROW_HEIGHT = 52;

export const ChannelList = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("space");
  const tabBarInset = useKeyboardChromeInset();

  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Channel | null>(null);
  const [settingsChannel, setSettingsChannel] = useState<Channel | null>(null);
  const [actionChannel, setActionChannel] = useState<Channel | null>(null);
  const [createParent, setCreateParent] = useState<Channel | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);

  const space = app.spaces.active;
  const spaceId = space?.id;
  const spaceMe = space?.members.me;
  const canManageChannels = !!spaceMe?.hasPermission("ManageChannels");
  const visibleChannels = space?.visibleChannels ?? [];
  const activeChannel = app.channels.active;
  const flatChannels = space ? flattenChannels(visibleChannels) : [];

  const toggleCategory = useCallback(
    (categoryId: string) => {
      if (!spaceId) return;
      app.channels.toggleCategoryCollapse(spaceId, categoryId);
    },
    [app.channels, spaceId],
  );

  const openCreateChannel = useCallback((parent?: Channel) => {
    setCreateParent(parent ?? null);
    setCreateChannelOpen(true);
  }, []);

  const renderChannel = useCallback(
    ({ item: channel }: { item: Channel }) => {
      if (!space) return null;
      return (
        <ChannelListItem
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
      );
    },
    [
      activeChannel?.id,
      app.channels,
      canManageChannels,
      openCreateChannel,
      space,
      toggleCategory,
    ],
  );

  if (!space) return null;

  return (
    <Screen
      style={{
        flexDirection: "column",
        width: "100%",
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomWidth: 0,
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
              accessibilityLabel={t("chrome.createInviteA11y")}
              onPress={() => setInviteOpen(true)}
              hitSlop={4}
            >
              <UserPlusIcon weight="fill" />
            </IconButton>
            {canManageChannels && (
              <IconButton
                accessibilityLabel={t("chrome.createCategoryA11y")}
                onPress={() => setCreateCategoryOpen(true)}
                hitSlop={4}
              >
                <PlusIcon weight="bold" />
              </IconButton>
            )}
            <IconButton
              accessibilityLabel={t("chrome.spaceMenuA11y")}
              onPress={() => setSpaceMenuOpen(true)}
              hitSlop={4}
            >
              <CaretDownIcon weight="bold" />
            </IconButton>
          </ButtonGroup>
        </Box>
      </ScreenHeader>
      <Box
        style={{
          flex: 1,
          paddingTop: 10,
        }}
      >
        <FlashList
          data={flatChannels}
          keyExtractor={(channel) => channel.id}
          renderItem={renderChannel}
          drawDistance={250}
          overrideItemLayout={(
            layout: { span?: number; size?: number },
            item: Channel,
          ) => {
            layout.size =
              item.type === ChannelType.Category
                ? ESTIMATED_CATEGORY_ROW_HEIGHT
                : ESTIMATED_CHANNEL_ROW_HEIGHT;
          }}
          contentContainerStyle={{ paddingBottom: 16 + tabBarInset, paddingTop: 4 }}
        />
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

      <Sheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        showCloseButton={false}
        enableDynamicSizing
      >
        <View style={{ width: "100%", padding: 16 }}>
          <SpaceInviteToSpaceSheet
            space={space}
            channel={activeChannel}
            onClose={() => setInviteOpen(false)}
          />
        </View>
      </Sheet>
    </Screen>
  );
});
