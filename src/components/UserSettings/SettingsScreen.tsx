import { Screen } from "@components/Screen/Screen";
import { SettingsHeader } from "@components/UserSettings/SettingsHeader";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

type Props = PropsWithChildren<{
  title: string;
  contentStyle?: StyleProp<ViewStyle>;
  onBack?: () => void;
}>;

export const SettingsScreen = observer(
  ({ title, contentStyle, onBack, children }: Props) => {
    return (
      <Screen
        style={{
          flexDirection: "column",
          minWidth: 0,
          borderBottomWidth: 0,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        <SettingsHeader title={title} showBack onBack={onBack} />
        <Box style={[{ flex: 1, minWidth: 0 }, contentStyle]}>{children}</Box>
      </Screen>
    );
  },
);
