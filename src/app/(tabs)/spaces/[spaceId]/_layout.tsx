import { useAppStore } from "@hooks/useStores";
import { Stack, useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const SpaceLayout = () => {
    const app = useAppStore();
    const { spaceId } = useLocalSearchParams();

    useEffect(() => {
        if (Array.isArray(spaceId)) return;

        app.spaces.setActive(spaceId);
    }, [spaceId]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
};

export default observer(SpaceLayout);
