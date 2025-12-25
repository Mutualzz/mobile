import { useAppStore } from "@hooks/useStores";
import { Box, CircularProgress } from "@mutualzz/ui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const IndexRoute = () => {
    const app = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (!app.token) {
            router.replace("/login");
            return;
        }

        if (!app.settings || app.isAppLoading) return;

        router.replace(
            app.settings.preferredMode === "feed" ? "/feed" : "/spaces",
        );
    }, [app.isAppLoading, app.settings, app.token]);

    return (
        <Box
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <CircularProgress />
        </Box>
    );
};

export default observer(IndexRoute);
