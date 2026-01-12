import TabButton from "@components/Tabs/TabButton";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppStore } from "@hooks/useStores";
import { Box, useTheme } from "@mutualzz/ui-native";
import { TabTrigger } from "expo-router/ui";
import { useMemo } from "react";

export const HomeContextual = () => {
    const app = useAppStore();
    const { theme } = useTheme();

    const determineContext = useMemo(
        () => (!app.mode ? app.settings?.preferredMode || "spaces" : "unknown"),
        [app.mode, app.settings?.preferredMode],
    );

    return (
        <Box
            style={{
                flex: 1,
                flexDirection: "column",
            }}
        >
            <TabTrigger asChild name={determineContext}>
                <TabButton
                    icon={
                        <MaterialIcons
                            size={30}
                            color={theme.colors.neutral}
                            name="home"
                        />
                    }
                >
                    Home
                </TabButton>
            </TabTrigger>
        </Box>
    );
};
