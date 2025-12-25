import { useDebouncedEffect } from "@hooks/useDebouncedEffect";
import { useAppStore } from "@hooks/useStores";
import { Slot, useLocalSearchParams } from "expo-router";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

// TODO: Fix wrong navigation when opening a different channel first time
const SpaceChannelLayout = () => {
    const app = useAppStore();
    const { channelId } = useLocalSearchParams();

    useEffect(() => {
        if (Array.isArray(channelId)) return;

        app.channels.setActive(channelId);
    }, [channelId]);

    useDebouncedEffect(
        () => {
            const spaceActiveId = app.spaces.activeId;
            const channelActiveId = app.channels.activeId;
            if (!spaceActiveId || !channelActiveId) return;

            runInAction(() =>
                app.gateway.onChannelOpen(spaceActiveId, channelActiveId),
            );
        },
        [app.channels.activeId, app.spaces.activeId],
        2000,
    );

    return <Slot />;
};

export default observer(SpaceChannelLayout);
