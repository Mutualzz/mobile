import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
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

const SpacesBrowseLayout = () => {
    const app = useAppStore();
    const segments = useSegments();
    const router = useRouter();
    const tabBarInset = useTabBarContentInset();
    const { spaceId } = useGlobalSearchParams<{
        spaceId?: string;
    }>();

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
            if (!recentSpace) return;

            router.replace(`/spaces/${recentSpace.id}`);

            return;
        }

        if (spaceId !== app.spaces.activeId) {
            app.spaces.setActive(spaceId);
            app.spaces.setMostRecentSpace(spaceId);
        }
    }, [spaceId, segments.join("/")]);

    return (
        <Box style={{ flex: 1, flexDirection: "row" }}>
            <SpacesSidebar />
            <Box
                style={{
                    flex: 1,
                    paddingBottom: tabBarInset,
                }}
            >
                <Slot key={spaceId ?? "spaces-root"} />
            </Box>
        </Box>
    );
};

export default observer(SpacesBrowseLayout);
