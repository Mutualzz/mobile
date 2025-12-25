import { Paper } from "@components/Paper";
import { PillType, SidebarPill } from "@components/SidebarPill";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { Space } from "@stores/objects/Space";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SidebarSpace = observer(({ space }: { space: Space }) => {
    const app = useAppStore();
    const router = useRouter();

    const [pillType, setPillType] = useState<PillType>("none");

    useEffect(() => {
        if (app.spaces.activeId === space.id) return setPillType("active");
        // TODO: unread
        else return setPillType("none");
    }, [app.spaces.activeId]);

    return (
        <Box
            style={{
                position: "relative",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <SidebarPill type={pillType} />
            <Pressable
                disabled={app.spaces.activeId === space.id}
                onPress={() => {
                    if (app.spaces.activeId === space.id) return;
                    router.replace(`/spaces/${space.id}`);
                }}
            >
                <SpaceIcon
                    selected={app.spaces.activeId === space.id}
                    space={space}
                />
            </Pressable>
        </Box>
    );
});

export const SpacesSidebar = observer(() => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();

    return (
        <Paper
            style={{
                flexDirection: "column",
                paddingHorizontal: 8,
                paddingTop: insets.top,
                gap: 12,
            }}
            variant="plain"
            elevation={app.preferEmbossed ? 1 : 0}
        >
            {app.spaces.positioned.map((space) => (
                <SidebarSpace key={space.id} space={space} />
            ))}
        </Paper>
    );
});
