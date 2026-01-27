import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { PaperProps, useTheme } from "@mutualzz/ui-native";
import { useSegments } from "expo-router";
import { observer } from "mobx-react-lite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabsProps } from "react-native-screens";

type Props = PaperProps & BottomTabsProps;

const TabBar = ({ children, ...props }: Props) => {
    const insets = useSafeAreaInsets();
    const app = useAppStore();
    const { theme } = useTheme();
    const segments: string[] = useSegments();

    const inChannel = segments[1] === "spaces" && segments.length >= 4;

    return (
        <Paper
            style={{
                position: "relative",
                width: "100%",
                flexDirection: "row",
                zIndex: theme.zIndex.appBar,
                justifyContent: "space-around",
                alignItems: "center",
                paddingLeft: insets.left + 16,
                overflow: "visible",
                paddingRight: insets.right + 16,
                paddingTop: 10,
                paddingBottom: Math.max(insets.bottom, 10),
                display: inChannel ? "none" : "flex",
            }}
            elevation={app.settings?.preferEmbossed ? 1 : 0}
            {...props}
        >
            {children}
        </Paper>
    );
};

export default observer(TabBar);
