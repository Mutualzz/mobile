import { dynamicElevation } from "@mutualzz/ui-core";
import { useTheme } from "@mutualzz/ui-native";
import { PropsWithChildren } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TabBar = ({ children }: PropsWithChildren) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                backgroundColor: dynamicElevation(theme.colors.surface, 2),
                width: "100%",
                flexDirection: "row",
                zIndex: 100,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: insets.bottom - 10,
            }}
        >
            {children}
        </View>
    );
};
