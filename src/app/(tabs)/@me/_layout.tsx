import { BridgeChatView } from "@components/Bridge/BridgeChatView";
import { DMContentPane } from "@components/DMChannel/DMContentPane";
import { MeDrawerContent } from "@components/DMChannel/MeDrawerContent";
import { SwipeableDrawer } from "@components/Navigation/SwipeableDrawer";
import { useAppStore } from "@hooks/useStores";
import { hasOpenSheets } from "@mutualzz/ui-native";
import { useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

const MeLayout = () => {
  const app = useAppStore();
  const pathname = usePathname();
  const { channelId, bridgeId } = useLocalSearchParams<{
    channelId?: string;
    bridgeId?: string;
  }>();
  const lastSyncedChannelIdRef = useRef<string | undefined>(undefined);
  const resolvingChannelIdRef = useRef<string | undefined>(undefined);
  const channelFromRoute = channelId ? app.channels.get(channelId) : undefined;
  const onBridgeRoute =
    pathname.includes("/bridges/") || Boolean(bridgeId);

  useEffect(() => {
    return () => {
      if (app.mode === "@me") app.resetMode();
    };
  }, [app]);

  const syncDM = useCallback(() => {
    if (app.mode !== "@me") app.setMode("@me");

    if (onBridgeRoute) {
      lastSyncedChannelIdRef.current = undefined;
      resolvingChannelIdRef.current = undefined;
      app.spaces.unsetActive();
      app.setDMDrawerOpen(false);
      return;
    }

    if (channelId) {
      if (lastSyncedChannelIdRef.current === channelId) return;

      const channel = app.channels.get(channelId);
      if (channel) {
        lastSyncedChannelIdRef.current = channelId;
        resolvingChannelIdRef.current = undefined;
        app.spaces.unsetActive();
        app.channels.setActive(channelId);
        app.channels.setMostRecentChannelForSpace("@me", channelId);
        app.setDMDrawerOpen(false);
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
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (hasOpenSheets()) return false;
        if (app.mode !== "@me") return false;
        if (onBridgeRoute) {
          if (!app.dmDrawerOpen) {
            app.setDMDrawerOpen(true);
            return true;
          }
          return false;
        }
        if (!app.channels.activeId) return false;

        if (!app.dmDrawerOpen) {
          app.setDMDrawerOpen(true);
          return true;
        }

        return false;
      },
    );
    return () => subscription.remove();
  }, [app, onBridgeRoute]);

  return (
    <SwipeableDrawer
      open={app.dmDrawerOpen}
      onOpenChange={(open) => app.setDMDrawerOpen(open)}
      drawerContent={<MeDrawerContent />}
    >
      {bridgeId ? (
        <BridgeChatView bridgeId={bridgeId} />
      ) : (
        <DMContentPane />
      )}
    </SwipeableDrawer>
  );
};

export default observer(MeLayout);
