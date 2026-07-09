import { useAppStore } from "@hooks/useStores";
import { Slot, useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

const FeedLayout = () => {
    const app = useAppStore();

    const syncMode = useCallback(() => {
        if (app.mode !== "feed") app.setMode("feed");

        return () => {
            if (app.mode === "feed") app.resetMode();
        };
    }, [app]);

    useFocusEffect(syncMode);

    return <Slot />;
};

export default observer(FeedLayout);
