import { AppLogo } from "@components/Logo/AppLogo";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import { PaintBrushIcon, UserIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";

export const FeedSidebar = observer(() => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const account = app.account;

    return (
        <Box
            style={{
                width: 72,
                alignItems: "center",
                paddingVertical: 16,
                gap: 16,
            }}
        >
            <AppLogo size={40} />
            {account && (
                <>
                    <Button
                        variant="plain"
                        onPress={() => navigate(`/users/${account.username}`)}
                        startDecorator={<UserIcon size={22} weight="fill" />}
                    />
                    <Button
                        variant="plain"
                        onPress={() => navigate("/(tabs)/settings/profile-editor")}
                        startDecorator={<PaintBrushIcon size={22} weight="fill" />}
                    />
                </>
            )}
            <Typography level="body-xs" textColor="muted" style={{ textAlign: "center", paddingHorizontal: 4 }}>
                Feed coming soon
            </Typography>
        </Box>
    );
});
