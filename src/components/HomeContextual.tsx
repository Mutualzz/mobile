import TabButton from "@components/TabButton";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, useTheme } from "@mutualzz/ui-native";
import { TabTrigger } from "expo-router/ui";

export const HomeContextual = () => {
    const { theme } = useTheme();

    return (
        <Box
            style={{
                flex: 1,
                flexDirection: "column",
            }}
        >
            <TabTrigger asChild name="unknown">
                <TabButton
                    startDecorator={
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
