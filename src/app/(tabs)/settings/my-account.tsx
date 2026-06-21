import { ChangePasswordSheet } from "@components/UserSettings/ChangePasswordSheet";
import { EmailChangeSheet } from "@components/UserSettings/EmailChangeSheet";
import { EmailVerifySheet } from "@components/UserSettings/EmailVerifySheet";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { UsernameChangeSheet } from "@components/UserSettings/UsernameChangeSheet";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";

const MyAccountSettings = () => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const account = app.account;

    const [passwordOpen, setPasswordOpen] = useState(false);
    const [usernameOpen, setUsernameOpen] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);
    const [verifyOpen, setVerifyOpen] = useState(false);

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

            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    Username
                </Typography>
                <Typography level="body-md">@{account.username}</Typography>
                <Button
                    size="sm"
                    variant="soft"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => setUsernameOpen(true)}
                >
                    Change username
                </Button>
            </Box>

            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    Email
                </Typography>
                <Typography level="body-md">
                    {account.email ?? "Not set"}
                </Typography>
                <Box style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <Button
                        size="sm"
                        variant="soft"
                        onPress={() => setEmailOpen(true)}
                    >
                        Change email
                    </Button>
                    <Button
                        size="sm"
                        variant="soft"
                        onPress={() => setVerifyOpen(true)}
                    >
                        Verify email
                    </Button>
                </Box>
            </Box>

            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    Password
                </Typography>
                <Button
                    size="sm"
                    variant="soft"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => setPasswordOpen(true)}
                >
                    Change password
                </Button>
            </Box>

            <ChangePasswordSheet
                visible={passwordOpen}
                onClose={() => setPasswordOpen(false)}
            />
            <UsernameChangeSheet
                visible={usernameOpen}
                onClose={() => setUsernameOpen(false)}
            />
            <EmailChangeSheet
                visible={emailOpen}
                onClose={() => setEmailOpen(false)}
            />
            <EmailVerifySheet
                visible={verifyOpen}
                onClose={() => setVerifyOpen(false)}
            />
        </SettingsScreen>
    );
};

export default observer(MyAccountSettings);
