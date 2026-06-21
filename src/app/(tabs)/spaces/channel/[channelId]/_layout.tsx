import { useAppStore } from "@hooks/useStores";
import { Slot, useGlobalSearchParams } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useLayoutEffect } from "react";

const SpaceChannelLayout = () => {
    const app = useAppStore();
    const { channelId } = useGlobalSearchParams<{
        channelId: string;
    }>();

    useLayoutEffect(() => {
        if (!channelId) return;

        const channel = app.channels.get(channelId);
        app.channels.setActive(channelId);

        if (channel?.spaceId) {
            app.channels.setMostRecentChannelForSpace(
                channel.spaceId,
                channelId,
            );
        }
    }, [channelId, app.channels]);

    useLayoutEffect(() => {
        if (!channelId) return;

        const channel = app.channels.get(channelId);
        const spaceId = channel?.spaceId;
        if (!spaceId) return;

        runInAction(() => app.gateway.onChannelOpen(spaceId, channelId));
    }, [channelId, app.channels, app.gateway]);

    return <Slot key={channelId} />;
};

export default observer(SpaceChannelLayout);
