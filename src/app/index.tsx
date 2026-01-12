import { useAppStore } from "@hooks/useStores";
import {
    Box,
    Button,
    ButtonGroup,
    CircularProgress,
} from "@mutualzz/ui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IndexRoute = () => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    useEffect(() => {
        if (!app.settings || app.isAppLoading) return;

        router.replace(
            app.settings.preferredMode === "feed" ? "/feed" : "/spaces",
        );
    }, [app.isAppLoading, app.settings, app.token]);

    return (
        <Box
            style={{
                flex: 1,
                justifyContent: !app.token ? "flex-end" : "center",
                alignItems: "center",
                flexDirection: "column",
            }}
        >
            {app.token && <CircularProgress />}
            {!app.token && (
                <Box
                    style={{
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: insets.bottom + 10,
                    }}
                >
                    <ButtonGroup spacing={10} size="lg">
                        <Button onPress={() => router.replace("/login")}>
                            Login
                        </Button>
                        <Button>Privacy Policy</Button>
                        <Button onPress={() => router.replace("/register")}>
                            Register
                        </Button>
                    </ButtonGroup>
                </Box>
            )}
        </Box>
    );
};

export default observer(IndexRoute);
