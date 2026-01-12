import { useDebouncedEffect } from "@hooks/useDebouncedEffect";
import { useAppStore } from "@hooks/useStores";
import { Slot, useGlobalSearchParams } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const SpaceChannelLayout = () => {
    const app = useAppStore();
    const { spaceId, channelId } = useGlobalSearchParams<{
        spaceId: string;
        channelId: string;
    }>();

    useEffect(() => {
        if (channelId && app.channels.activeId !== channelId)
            app.channels.setActive(channelId);
    }, [channelId]);

    useDebouncedEffect(
        () => {
            runInAction(() => app.gateway.onChannelOpen(spaceId, channelId));
        },
        [spaceId, channelId],
        2000,
    );

    return <Slot />;
};

export default observer(SpaceChannelLayout);
