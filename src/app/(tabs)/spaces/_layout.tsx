import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import {
    Slot,
    useGlobalSearchParams,
    useRouter,
    useSegments,
} from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

// TODO: Fix clicking on space in sidebar not updating the view correctly and channels as well
const SpacesLayout = () => {
    const app = useAppStore();
    const segments = useSegments();
    const router = useRouter();
    const { spaceId, channelId } = useGlobalSearchParams<{
        spaceId?: string;
        channelId?: string;
    }>();
    const inChannel = Boolean(channelId);

    useEffect(() => {
        if (app.mode !== "spaces") app.setMode("spaces");

        return () => {
            if (app.mode === "spaces") app.resetMode();
        };
    }, []);

    useEffect(() => {
        const atSpacesRoot = segments.length === 2 && segments[1] === "spaces";

        if (!spaceId) {
            if (!atSpacesRoot) return;

            const recentSpace = app.spaces.setPreferredActive();
            router.replace(`/spaces/${recentSpace.id}`);

            return;
        }

        if (spaceId !== app.spaces.activeId) app.spaces.setActive(spaceId);
    }, [spaceId, segments.join("/")]);

    console.log(app.spaces.active?.name);

    return (
        <Box style={{ flex: 1, flexDirection: "row" }}>
            {!inChannel && <SpacesSidebar />}
            <Slot />
        </Box>
    );
};

export default observer(SpacesLayout);
