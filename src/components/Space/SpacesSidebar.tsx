import { Paper } from "@components/Paper";
import { PillType, SidebarPill } from "@components/SidebarPill";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { SpaceInviteModal } from "@components/Space/SpaceInviteModal";
import { FontAwesome } from "@expo/vector-icons";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Box, IconButton } from "@mutualzz/ui-native";
import { Space } from "@stores/objects/Space";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SidebarSpace = observer(
    ({ space, active }: { space: Space; active: boolean }) => {
        const router = useRouter();

        const pillType: PillType = active ? "active" : "none";

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
                    disabled={active}
                    onPress={() => {
                        console.log("pressed", space.name, space.id);
                        if (active) {
                            // router.push(
                            //     `/spaces/${space.id}/${app.channels.activeId}`,
                            // );
                            return;
                        }

                        router.replace(`/spaces/${space.id}`);
                    }}
                >
                    <SpaceIcon selected={active} space={space} />
                </Pressable>
            </Box>
        );
    },
);

export const SpacesSidebar = observer(() => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const { openModal } = useModal();

    return (
        <Paper
            style={{
                flexDirection: "column",
                paddingHorizontal: 8,
                paddingTop: insets.top,
                gap: 12,
                borderTopWidth: 0,
                borderBottomWidth: 0,
                borderLeftWidth: 0,
            }}
            elevation={app.preferEmbossed ? 1 : 0}
        >
            {app.spaces.positioned.map((space) => (
                <SidebarSpace
                    active={space.id === app.spaces.activeId}
                    key={space.id}
                    space={space}
                />
            ))}
            <IconButton
                style={{
                    borderRadius: 9999,
                }}
                color="success"
                variant="outlined"
                padding={8}
                size="sm"
                onPress={() =>
                    openModal("space-invite", <SpaceInviteModal />, {
                        style: {
                            padding: 26,
                        },
                    })
                }
            >
                <FontAwesome name="plus" />
            </IconButton>
        </Paper>
    );
});
