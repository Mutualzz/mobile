import { dynamicElevation, useTheme } from "@mutualzz/ui";
import { PropsWithChildren } from "react";
import { View } from "react-native";

export const TabBar = ({ children }: PropsWithChildren) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                backgroundColor: dynamicElevation(theme.colors.surface, 2),
                position: "absolute",
                bottom: 0,
                width: "100%",
                flexDirection: "row",
                zIndex: 100,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 10,
            }}
        >
            {children}
        </View>
    );
};
