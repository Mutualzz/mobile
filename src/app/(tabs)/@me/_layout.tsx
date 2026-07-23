import { DMContentPane } from "@components/DMChannel/DMContentPane";
import { MeDrawerContent } from "@components/DMChannel/MeDrawerContent";
import { SwipeableDrawer } from "@components/Navigation/SwipeableDrawer";
import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useBridgeListSync } from "@hooks/useBridgeListSync";
import { useAppStore } from "@hooks/useStores";
import { Box, hasOpenSheets } from "@mutualzz/ui-native";
import { useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

const DRAWER_ANIM_MS = 280;

const MeLayout = () => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const pathname = usePathname();
  const bridgesQuery = useBridgeListSync();
  const { channelId } = useLocalSearchParams<{
    channelId?: string;
  }>();
  const lastSyncedChannelIdRef = useRef<string | undefined>(undefined);
  const resolvingChannelIdRef = useRef<string | undefined>(undefined);
  const prevDrawerOpenRef = useRef(app.dmDrawerOpen);
  const channelFromRoute = channelId ? app.channels.get(channelId) : undefined;
  const onBridgeRoute = pathname.includes("/@me/bridges/");
  const onDetailRoute = Boolean(channelId);

  useEffect(() => {
    return () => {
      if (app.mode === "@me") app.resetMode();
    };
  }, [app]);

  useEffect(() => {
    if (!onBridgeRoute) return;

    const bridgeId = pathname.match(/\/@me\/bridges\/([^/]+)/)?.[1];
    if (!bridgeId) {
      const space = app.spaces.mostRecentSpace ?? app.spaces.all[0];
      if (space) {
        app.spaces.setSidebarTab(space.id, "bridges");
        navigate(`/spaces/${space.id}`, { replace: true });
      }
      return;
    }

    const spaceId =
      app.bridgeChat.spaceIdByBridge.get(bridgeId) ??
      bridgesQuery.data?.find((bridge) => bridge.id === bridgeId)?.spaceId;

    if (!spaceId) return;

    app.spaces.setSidebarTab(spaceId, "bridges");
    navigate(`/spaces/bridges/${bridgeId}`, { replace: true });
  }, [onBridgeRoute, pathname, app, navigate, bridgesQuery.data]);

  const syncDM = useCallback(() => {
    if (onBridgeRoute) return;
    if (app.mode !== "@me") app.setMode("@me");

    if (channelId) {
      if (lastSyncedChannelIdRef.current === channelId) return;

      const channel = app.channels.get(channelId);
      if (channel) {
        lastSyncedChannelIdRef.current = channelId;
        resolvingChannelIdRef.current = undefined;
        app.spaces.unsetActive();
        app.channels.setActive(channelId);
        app.channels.setMostRecentChannelForSpace("@me", channelId);
        if (!app.dmDrawerOpen) app.setDMDrawerOpen(false);
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
    app.spaces.setActive("@me");
  }, [channelId, onBridgeRoute, app]);

  useEffect(() => {
    syncDM();
  }, [syncDM, channelFromRoute?.id]);

  useFocusEffect(
    useCallback(() => {
      syncDM();
    }, [syncDM]),
  );

  useEffect(() => {
    const wasOpen = prevDrawerOpenRef.current;
    prevDrawerOpenRef.current = app.dmDrawerOpen;
    if (!wasOpen && app.dmDrawerOpen && onDetailRoute) {
      const timeout = setTimeout(() => {
        navigate("/@me", { replace: true });
      }, DRAWER_ANIM_MS);
      return () => clearTimeout(timeout);
    }
  }, [app.dmDrawerOpen, onDetailRoute, navigate]);

  useEffect(() => {
    if (channelId) {
      app.setDMDrawerOpen(false);
    }
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (hasOpenSheets()) return false;
        if (app.mode !== "@me") return false;

        if (!app.dmDrawerOpen) {
          app.setDMDrawerOpen(true);
          return true;
        }

        if (onDetailRoute) {
          navigate("/@me", { replace: true });
          return true;
        }

        return false;
      },
    );
    return () => subscription.remove();
  }, [app, onDetailRoute, navigate]);

  return (
    <SwipeableDrawer
      open={app.dmDrawerOpen}
      onOpenChange={(open) => app.setDMDrawerOpen(open)}
      drawerContent={
        <Box
          style={{
            flex: 1,
            flexDirection: "row",
          }}
        >
          <SpacesSidebar />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <MeDrawerContent />
          </Box>
        </Box>
      }
    >
      <DMContentPane />
    </SwipeableDrawer>
  );
};

export default observer(MeLayout);
