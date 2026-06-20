import { IconButton } from "@components/IconButton";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { GearIcon } from "phosphor-react-native";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

export const UserBar = observer(() => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const account = app.account;

    if (!account) return null;

    const openSettings = () => navigate("/settings");

    return (
        <Box
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                paddingHorizontal: 12,
                paddingVertical: 8,
                gap: 8,
            }}
        >
            <Pressable
                onPress={openSettings}
                style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                }}
            >
                <UserAvatar user={account} size="lg" />
                <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Typography level="body-sm" numberOfLines={1}>
                        {account.displayName}
                    </Typography>
                    <Typography
                        level="body-xs"
                        textColor="muted"
                        numberOfLines={1}
                    >
                        @{account.username}
                    </Typography>
                </Box>
            </Pressable>

            <IconButton padding={8} onPress={openSettings}>
                <GearIcon weight="fill" size={22} />
            </IconButton>
        </Box>
    );
});
