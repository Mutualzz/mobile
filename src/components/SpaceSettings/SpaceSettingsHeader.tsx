import { ScreenHeader } from "@components/Screen/Screen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { ArrowLeftIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

interface Props {
  title: string;
  showBack?: boolean;
  onClose?: () => void;
}

export const SpaceSettingsHeader = observer(
  ({ title, showBack = false, onClose }: Props) => {
    const { back } = useAppNavigation();
    const { theme } = useTheme();
    const iconColor = theme.typography.colors.primary;

    return (
      <ScreenHeader
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
          <Pressable
            hitSlop={11}
            onPress={() => back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
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
        {onClose && (
          <Pressable
            hitSlop={11}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={22} weight="bold" color={iconColor} />
          </Pressable>
        )}
      </ScreenHeader>
    );
  },
);
