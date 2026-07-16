import { BridgeChannelList } from "@components/Bridge/BridgeChannelList";
import { Button } from "@components/Button";
import { ChannelActionSheet } from "@components/Channel/ChannelActionSheet";
import { SpaceMenuSheet } from "@components/Space/SpaceMenuSheet";
import { ChannelCreateSheet } from "@components/Channel/ChannelCreateSheet";
import { CategoryCreateSheet } from "@components/Channel/CategoryCreateSheet";
import { CategoryDeleteSheet } from "@components/Channel/CategoryDeleteSheet";
import { ChannelSettingsSheet } from "@components/ChannelSettings/ChannelSettingsSheet";
import { IconButton } from "@components/IconButton";
import { ChannelListItem } from "@components/Channel/ChannelListItem/ChannelListItem";
import { Paper } from "@components/Paper";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { SpaceInviteToSpaceSheet } from "@components/Space/SpaceInviteToSpaceSheet";
import {
  CaretDownIcon,
  CubeIcon,
  HashIcon,
  PlusIcon,
  UserPlusIcon,
} from "phosphor-react-native";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, ButtonGroup, Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import type { SpaceSidebarTab } from "@stores/Space.store";
import { flattenChannels } from "@utils/channelReorder";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, usePathname } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { BridgeSummary } from "@app-types/bridge";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { useAppNavigation } from "@hooks/useAppNavigation";

const ESTIMATED_CHANNEL_ROW_HEIGHT = 40;
const ESTIMATED_CATEGORY_ROW_HEIGHT = 42;

export const ChannelList = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("space");
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const tabBarInset = useKeyboardChromeInset();
  const pathname = usePathname();
  const { bridgeId } = useLocalSearchParams<{ bridgeId?: string }>();
  const onBridgeRoute = pathname.includes("/bridges/") || Boolean(bridgeId);
  const unreadDotSize = useScaledSquareSize(8);

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
  const sidebarTab: SpaceSidebarTab = spaceId
    ? onBridgeRoute
      ? "bridges"
      : app.spaces.getSidebarTab(spaceId)
    : "channels";

  const setSidebarTab = (tab: SpaceSidebarTab) => {
    if (!spaceId || !space) return;
    app.spaces.setSidebarTab(spaceId, tab);
    if (tab === "channels" && onBridgeRoute) {
      const mostRecent = app.channels.getMostRecentChannelForSpace(spaceId);
      const preferred =
        mostRecent ??
        space.visibleChannels.find((ch) => ch.type !== ChannelType.Category);
      if (preferred) {
        navigate(`/spaces/channel/${preferred.id}`);
      } else {
        navigate(`/spaces/${spaceId}`);
      }
    }
  };

  const bridgesQuery = useQuery({
    queryKey: ["me", "bridges"],
    queryFn: () => app.rest.get<BridgeSummary[]>("/@me/bridges"),
    refetchInterval: 15_000,
    enabled: Boolean(spaceId),
  });

  useEffect(() => {
    if (!bridgesQuery.data) return;
    app.bridgeChat.setUnreadFromList(bridgesQuery.data);
  }, [bridgesQuery.data, app.bridgeChat]);

  const bridgesUnread = spaceId
    ? app.bridgeChat.hasUnreadForSpace(spaceId)
    : false;
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
      <Paper
        style={{
          marginHorizontal: 8,
          marginTop: 8,
          marginBottom: 4,
          padding: 6,
          borderRadius: 12,
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          gap: 4,
        }}
        elevation={app.settings?.preferEmbossed ? 3 : 0}
      >
        <Button
          expand
          size="sm"
          variant={sidebarTab === "channels" ? "soft" : "plain"}
          onPress={() => setSidebarTab("channels")}
          startDecorator={<HashIcon weight="fill" size={16} />}
        >
          {t("sidebar.channels")}
        </Button>
        <Button
          expand
          size="sm"
          variant={sidebarTab === "bridges" ? "soft" : "plain"}
          onPress={() => setSidebarTab("bridges")}
          startDecorator={<CubeIcon weight="fill" size={16} />}
          endDecorator={
            bridgesUnread && sidebarTab !== "bridges" ? (
              <View
                style={{
                  width: unreadDotSize,
                  height: unreadDotSize,
                  borderRadius: 9999,
                  backgroundColor: theme.typography.colors.primary,
                }}
              />
            ) : undefined
          }
        >
          {t("sidebar.bridges")}
        </Button>
      </Paper>
      <Box
        style={{
          flex: 1,
          paddingTop: 6,
          paddingBottom: sidebarTab === "bridges" ? tabBarInset : 0,
        }}
      >
        {sidebarTab === "bridges" && spaceId ? (
          <BridgeChannelList spaceId={spaceId} />
        ) : (
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
            contentContainerStyle={{ paddingBottom: 12 + tabBarInset }}
          />
        )}
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
