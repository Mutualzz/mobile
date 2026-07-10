import { ScreenHeader } from "@components/Screen/Screen";
import { useCloseSettings } from "@hooks/useCloseSettings";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { ArrowLeftIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

interface Props {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const SettingsHeader = observer(
  ({ title, showBack = false, onBack }: Props) => {
    const { back } = useAppNavigation();
    const closeSettings = useCloseSettings();
    const { theme } = useTheme();

    const iconColor = theme.typography.colors.primary;

    return (
      <ScreenHeader
        safeTop={false}
        safeHorizontal={false}
        style={{
          paddingHorizontal: 12,
          gap: 10,
          borderTopWidth: 0,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        {showBack && (
          <Pressable hitSlop={8} onPress={() => (onBack ? onBack() : back())}>
            <ArrowLeftIcon size={22} weight="bold" color={iconColor} />
          </Pressable>
        )}
        <Typography
          level="body-lg"
          weight="bold"
          truncate="single"
          style={{ flex: 1 }}
        >
          {title}
        </Typography>
        <Pressable hitSlop={8} onPress={closeSettings}>
          <XIcon size={22} weight="bold" color={iconColor} />
        </Pressable>
      </ScreenHeader>
    );
  },
);
