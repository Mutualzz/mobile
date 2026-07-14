import { ChannelContentPane } from "@components/Channel/ChannelContentPane";
import { ChannelList } from "@components/Channel/ChannelList/ChannelList";
import { SwipeableDrawer } from "@components/Navigation/SwipeableDrawer";
import { SpaceLockdownOverlay } from "@components/Space/SpaceLockdownOverlay";
import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { Box, hasOpenModals } from "@mutualzz/ui-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

const SpacesDrawerLayout = () => {
  const app = useAppStore();
  const tabBarInset = useKeyboardChromeInset();
  const activeSpace = app.spaces.active;
  const { spaceId, channelId } = useLocalSearchParams<{
    spaceId?: string;
    channelId?: string;
  }>();
  const lastSyncedChannelIdRef = useRef<string | undefined>(undefined);
  const resolvingChannelIdRef = useRef<string | undefined>(undefined);
  const channelFromRoute = channelId ? app.channels.get(channelId) : undefined;

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
        resolvingChannelIdRef.current = undefined;
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
        return;
      }

      if (resolvingChannelIdRef.current !== channelId) {
        resolvingChannelIdRef.current = channelId;
        void app.channels.resolve(channelId).catch(() => {
          if (resolvingChannelIdRef.current === channelId) {
            resolvingChannelIdRef.current = undefined;
          }
        });
      }
      return;
    }

    lastSyncedChannelIdRef.current = undefined;
    resolvingChannelIdRef.current = undefined;

    if (spaceId && spaceId !== app.spaces.activeId) {
      app.spaces.setActive(spaceId);
      app.spaces.setMostRecentSpace(spaceId);
    }
  }, [spaceId, channelId, app]);

  useEffect(() => {
    syncSpaceAndChannel();
  }, [syncSpaceAndChannel, channelFromRoute?.id]);

  useFocusEffect(
    useCallback(() => {
      syncSpaceAndChannel();
    }, [syncSpaceAndChannel]),
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (hasOpenModals()) return false;
        if (app.mode !== "spaces") return false;
        if (!app.channels.activeId) return false;

        if (!app.spacesDrawerOpen) {
          app.setSpacesDrawerOpen(true);
          return true;
        }

        return false;
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
          <Box style={{ flex: 1, position: "relative" }}>
            <ChannelList />
            {activeSpace && (
              <SpaceLockdownOverlay
                space={activeSpace}
                showMessage={false}
                headerClearance={56}
              />
            )}
          </Box>
        </Box>
      }
    >
      <Box style={{ flex: 1, position: "relative" }}>
        <ChannelContentPane />
        {activeSpace && <SpaceLockdownOverlay space={activeSpace} />}
      </Box>
    </SwipeableDrawer>
  );
};

export default observer(SpacesDrawerLayout);
