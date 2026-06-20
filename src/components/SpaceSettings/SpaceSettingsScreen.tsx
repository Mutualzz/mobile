import { Screen } from "@components/Screen/Screen";
import { SpaceSettingsHeader } from "@components/SpaceSettings/SpaceSettingsHeader";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

type Props = PropsWithChildren<{
    title: string;
    contentStyle?: StyleProp<ViewStyle>;
}>;

export const SpaceSettingsScreen = observer(
    ({ title, contentStyle, children }: Props) => {
        return (
            <Screen style={{ flexDirection: "column", minWidth: 0 }}>
                <SpaceSettingsHeader title={title} showBack />
                <Box style={[{ flex: 1, minWidth: 0 }, contentStyle]}>
                    {children}
                </Box>
            </Screen>
        );
    },
);
