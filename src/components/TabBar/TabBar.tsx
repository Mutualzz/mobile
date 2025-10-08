import { Paper } from "@mutualzz/ui-native";
import { PropsWithChildren } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TabBar = ({ children }: PropsWithChildren) => {
    const insets = useSafeAreaInsets();

    return (
        <Paper
            style={{
                width: "100%",
                flexDirection: "row",
                zIndex: 100,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 30,
                paddingVertical: insets.bottom - 7.5,
            }}
        >
            {children}
        </Paper>
    );
};
