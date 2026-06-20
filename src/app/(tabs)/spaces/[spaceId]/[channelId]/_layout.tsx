import { useAppStore } from "@hooks/useStores";
import { Slot, useGlobalSearchParams } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useLayoutEffect } from "react";

const SpaceChannelLayout = () => {
  const app = useAppStore();
  const { spaceId, channelId } = useGlobalSearchParams<{
    spaceId: string;
    channelId: string;
  }>();

  useLayoutEffect(() => {
    if (!channelId) return;

    app.channels.setActive(channelId);
    if (spaceId) app.channels.setMostRecentChannelForSpace(spaceId, channelId);
  }, [channelId, spaceId, app.channels]);

  useLayoutEffect(() => {
    runInAction(() => app.gateway.onChannelOpen(spaceId, channelId));
  }, [spaceId, channelId]);

  return <Slot key={channelId} />;
};

export default observer(SpaceChannelLayout);
