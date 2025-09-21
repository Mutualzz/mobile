import { Paper, useTheme } from "@mutualzz/ui/native";
import { PropsWithChildren } from "react";

export const TabBar = ({ children }: PropsWithChildren) => {
    const { theme } = useTheme();

    return (
        <Paper
            elevation={2}
            style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                flexDirection: "row",
                zIndex: 100,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                justifyContent: "space-between",
                alignItems: "center",
                flex: 0,
                paddingHorizontal: 20,
                paddingVertical: 10,
            }}
        >
            {children}
        </Paper>
    );
};
