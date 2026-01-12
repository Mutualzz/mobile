import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MeLayout = () => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (app.mode === "spaces" || app.mode === "feed") app.resetMode();
    }, []);

    return (
        <Box style={{ flexDirection: "column", flex: 1 }}>
            <Paper
                style={{
                    flexDirection: "row",
                    paddingTop: insets.top,
                    paddingLeft: insets.left + 12,
                    paddingBottom: 8,
                }}
            >
                <Typography level="h4" weight="condensedBold">
                    Mutuals
                </Typography>
            </Paper>
            <Slot />
        </Box>
    );
};

export default MeLayout;
