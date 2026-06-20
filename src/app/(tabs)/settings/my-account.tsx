import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const MyAccountSettings = () => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const account = app.account;

    if (!account) return null;

    return (
        <SettingsScreen
            title="My Account"
            contentStyle={{ padding: 16, gap: 16 }}
        >
            <Box style={{ gap: 4 }}>
                <Typography level="body-xs" textColor="muted">
                    Display name
                </Typography>
                <Typography level="body-md">{account.displayName}</Typography>
                <Button
                    size="sm"
                    variant="soft"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => navigate("/(tabs)/settings/profile")}
                >
                    Edit display name
                </Button>
            </Box>

            <Box style={{ gap: 4 }}>
                <Typography level="body-xs" textColor="muted">
                    Username
                </Typography>
                <Typography level="body-md">@{account.username}</Typography>
            </Box>

            <Box style={{ gap: 4 }}>
                <Typography level="body-xs" textColor="muted">
                    Email
                </Typography>
                <Typography level="body-md">
                    {account.email ?? "Not set"}
                </Typography>
            </Box>
        </SettingsScreen>
    );
};

export default observer(MyAccountSettings);
