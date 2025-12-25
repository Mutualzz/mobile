import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const SpacesLayout = () => {
    const app = useAppStore();
    const segments: string[] = useSegments();
    const router = useRouter();
    const inChannel = segments[1] === "spaces" && segments.length >= 4;
    const inSpace = segments[1] === "spaces" && segments.length >= 3;

    useEffect(() => {
        if (app.mode !== "spaces") app.setMode("spaces");
    }, []);

    useEffect(() => {
        if (inSpace) return;

        const space = app.spaces.setPreferredActive();
        if (!space) return;

        router.replace(`/spaces/${space.id}`);
    }, [inSpace]);

    return (
        <Box style={{ flexDirection: "row", width: "100%", height: "100%" }}>
            {!inChannel && <SpacesSidebar />}
            <Stack screenOptions={{ headerShown: false }} />
        </Box>
    );
};

export default observer(SpacesLayout);
