import { BridgeChatView } from "@components/Bridge/BridgeChatView";
import { ChannelContentPane } from "@components/Channel/ChannelContentPane";
import { ChannelList } from "@components/Channel/ChannelList/ChannelList";
import { SwipeableDrawer } from "@components/Navigation/SwipeableDrawer";
import { SpaceLockdownOverlay } from "@components/Space/SpaceLockdownOverlay";
import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { SpaceThemeProvider } from "@contexts/SpaceTheme.context";
import { useAppStore } from "@hooks/useStores";
import { Box, hasOpenSheets } from "@mutualzz/ui-native";
import { useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

const SpacesDrawerLayout = () => {
  const app = useAppStore();
  const activeSpace = app.spaces.active;
  const pathname = usePathname();
  const { spaceId, channelId, bridgeId } = useLocalSearchParams<{
    spaceId?: string;
    channelId?: string;
    bridgeId?: string;
  }>();
  const onBridgeRoute = pathname.includes("/bridges/") || Boolean(bridgeId);
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

    if (onBridgeRoute) {
      lastSyncedChannelIdRef.current = undefined;
      resolvingChannelIdRef.current = undefined;
      app.setSpacesDrawerOpen(false);
      const bridgeSpaceId =
        spaceId ??
        (bridgeId ? app.bridgeChat.spaceIdByBridge.get(bridgeId) : undefined);
      if (bridgeSpaceId) {
        app.spaces.setActive(bridgeSpaceId);
        app.spaces.setSidebarTab(bridgeSpaceId, "bridges");
      }
      return;
    }

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
  }, [spaceId, channelId, bridgeId, onBridgeRoute, app]);

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
        if (hasOpenSheets()) return false;
        if (app.mode !== "spaces") return false;
        if (onBridgeRoute) {
          if (!app.spacesDrawerOpen) {
            app.setSpacesDrawerOpen(true);
            return true;
          }
          return false;
        }
        if (!app.channels.activeId) return false;

        if (!app.spacesDrawerOpen) {
          app.setSpacesDrawerOpen(true);
          return true;
        }

        return false;
      },
    );
    return () => subscription.remove();
  }, [app, onBridgeRoute]);

  return (
    <SwipeableDrawer
      open={app.spacesDrawerOpen}
      onOpenChange={(open) => app.setSpacesDrawerOpen(open)}
      drawerContent={
        <Box
          style={{
            flex: 1,
            flexDirection: "row",
          }}
        >
          <SpacesSidebar />
          <SpaceThemeProvider>
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
          </SpaceThemeProvider>
        </Box>
      }
    >
      <SpaceThemeProvider>
        <Box style={{ flex: 1, position: "relative" }}>
          {bridgeId ? (
            <BridgeChatView
              bridgeId={bridgeId}
              returnToSpaceId={
                spaceId ??
                app.bridgeChat.spaceIdByBridge.get(bridgeId) ??
                activeSpace?.id
              }
            />
          ) : (
            <ChannelContentPane />
          )}
          {activeSpace && <SpaceLockdownOverlay space={activeSpace} />}
        </Box>
      </SpaceThemeProvider>
    </SwipeableDrawer>
  );
};

export default observer(SpacesDrawerLayout);
