import { useAppStore } from "@hooks/useStores";
import { Slot, useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";

const FeedLayout = () => {
    const app = useAppStore();

    useFocusEffect(() => {
        if (app.mode !== "feed") app.setMode("feed");

        return () => {
            if (app.mode === "feed") app.resetMode();
        };
    });

    return <Slot />;
};

export default observer(FeedLayout);
