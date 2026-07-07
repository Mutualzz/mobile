import { ChannelContentPane } from "@components/Channel/ChannelContentPane";
import { ChannelList } from "@components/Channel/ChannelList/ChannelList";
import { SwipeableDrawer } from "@components/Navigation/SwipeableDrawer";
import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

const SpacesDrawerLayout = () => {
  const app = useAppStore();
  const tabBarInset = useTabBarContentInset();
  const { spaceId, channelId } = useLocalSearchParams<{
    spaceId?: string;
    channelId?: string;
  }>();
  const lastSyncedChannelIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (app.mode === "spaces") app.resetMode();
    };
  }, [app]);

  const syncSpaceAndChannel = useCallback(() => {
    if (app.mode !== "spaces") app.setMode("spaces");

    if (channelId) {
      if (lastSyncedChannelIdRef.current === channelId) return;

      const channel = app.channels.get(channelId);
      if (channel) {
        lastSyncedChannelIdRef.current = channelId;
        const channelSpaceId = channel.spaceId;

        if (channelSpaceId && channelSpaceId !== app.spaces.activeId) {
          app.spaces.setActive(channelSpaceId);
        }

        app.channels.setActive(channelId);
        app.setSpacesDrawerOpen(false);

        if (channelSpaceId) {
          app.channels.setMostRecentChannelForSpace(channelSpaceId, channelId);
          runInAction(() =>
            app.gateway.onChannelOpen(channelSpaceId, channelId),
          );
        }
      }
      return;
    }

    lastSyncedChannelIdRef.current = undefined;

    if (spaceId && spaceId !== app.spaces.activeId) {
      app.spaces.setActive(spaceId);
      app.spaces.setMostRecentSpace(spaceId);
    }
  }, [spaceId, channelId, app]);

  useEffect(() => {
    syncSpaceAndChannel();
  }, [syncSpaceAndChannel]);

  useFocusEffect(
    useCallback(() => {
      syncSpaceAndChannel();
    }, [syncSpaceAndChannel]),
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (app.mode !== "spaces") return false;
        if (!app.channels.activeId) return false;

        if (!app.spacesDrawerOpen) {
          app.setSpacesDrawerOpen(true);
        }
        return true;
      },
    );
    return () => subscription.remove();
  }, [app]);

  return (
    <SwipeableDrawer
      open={app.spacesDrawerOpen}
      onOpenChange={(open) => app.setSpacesDrawerOpen(open)}
      drawerContent={
        <Box
          style={{
            flex: 1,
            flexDirection: "row",
            paddingBottom: tabBarInset,
          }}
        >
          <SpacesSidebar />
          <ChannelList />
        </Box>
      }
    >
      <ChannelContentPane />
    </SwipeableDrawer>
  );
};

export default observer(SpacesDrawerLayout);
