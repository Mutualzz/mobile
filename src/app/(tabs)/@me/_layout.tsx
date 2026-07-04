import { DMContentPane } from "@components/DMChannel/DMContentPane";
import { MeDrawerContent } from "@components/DMChannel/MeDrawerContent";
import { SwipeableDrawer } from "@components/Navigation/SwipeableDrawer";
import { useAppStore } from "@hooks/useStores";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";

const MeLayout = () => {
  const app = useAppStore();
  const { channelId } = useLocalSearchParams<{ channelId?: string }>();

  useEffect(() => {
    return () => {
      if (app.mode === "@me") app.resetMode();
    };
  }, [app]);

  const syncDM = useCallback(() => {
    if (app.mode !== "@me") app.setMode("@me");

    if (channelId) {
      app.spaces.unsetActive();
      app.channels.setActive(channelId);
      app.channels.setMostRecentChannelForSpace("@me", channelId);
      app.setDMDrawerOpen(false);
      return;
    }

    app.spaces.setActive("@me");
  }, [channelId, app]);

  useEffect(() => {
    syncDM();
  }, [syncDM]);

  useFocusEffect(
    useCallback(() => {
      syncDM();
    }, [syncDM]),
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (app.mode !== "@me") return false;
        if (!app.channels.activeId) return false;

        if (!app.dmDrawerOpen) {
          app.setDMDrawerOpen(true);
        }
        return true;
      },
    );
    return () => subscription.remove();
  }, [app]);

  return (
    <SwipeableDrawer
      open={app.dmDrawerOpen}
      onOpenChange={(open) => app.setDMDrawerOpen(open)}
      drawerContent={<MeDrawerContent />}
    >
      <DMContentPane />
    </SwipeableDrawer>
  );
};

export default observer(MeLayout);
