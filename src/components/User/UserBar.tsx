import { CustomStatusSheet } from "@components/UserSettings/CustomStatusSheet";
import { IconButton } from "@components/IconButton";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { GearIcon, SmileyIcon } from "phosphor-react-native";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

export const UserBar = observer(() => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const account = app.account;
    const [statusOpen, setStatusOpen] = useState(false);

    if (!account) return null;

    const openSettings = () => navigate("/settings");
    const customStatus = app.customStatus.effectiveText;

    return (
        <>
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
                    onLongPress={() => setStatusOpen(true)}
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                    }}
                >
                    <UserAvatar user={account} size="lg" badge showInvisible />
                    <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Typography level="body-sm" numberOfLines={1}>
                            {account.displayName}
                        </Typography>
                        <Typography
                            level="body-xs"
                            textColor="muted"
                            numberOfLines={1}
                        >
                            {customStatus || `@${account.username}`}
                        </Typography>
                    </Box>
                </Pressable>

                <IconButton
                    padding={8}
                    accessibilityLabel="Set custom status"
                    onPress={() => setStatusOpen(true)}
                >
                    <SmileyIcon weight="fill" size={20} />
                </IconButton>

                <IconButton padding={8} onPress={openSettings}>
                    <GearIcon weight="fill" size={22} />
                </IconButton>
            </Box>

            <CustomStatusSheet
                visible={statusOpen}
                onClose={() => setStatusOpen(false)}
            />
        </>
    );
});
