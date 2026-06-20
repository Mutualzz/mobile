import { IconButton } from "@components/IconButton";
import { PlanetIcon, ScribbleIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { type AppMode } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";
import { getFloatingTabBarInset } from "@utils/layout";
import { switchMode } from "@utils/index";
import { usePathname, useRouter } from "expo-router";
import { TabTrigger } from "expo-router/ui";
import { observer } from "mobx-react-lite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  withTrigger?: boolean;
}

export const ModeSwitcher = observer(({ withTrigger = true }: Props) => {
  const app = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const preferredMode = app.settings?.preferredMode;

  const currentMode: AppMode | null = pathname.startsWith("/feed")
    ? "feed"
    : pathname.startsWith("/spaces")
      ? "spaces"
      : null;

  const targetMode =
    currentMode === null
      ? preferredMode || "spaces"
      : currentMode === "feed"
        ? "spaces"
        : currentMode === "spaces"
          ? "feed"
          : (preferredMode ?? "spaces");

  const handleClick = () => {
    switchMode(app, router, targetMode);
  };

  const iconColor = theme.typography.colors.primary;

  const button = (
    <IconButton
      color="primary"
      style={{
        position: "absolute",
        bottom: getFloatingTabBarInset(insets) + 8,
        right: 16,
        borderRadius: 9999,
        zIndex: theme.zIndex.fab,
      }}
      padding={6}
      size={24}
      variant="solid"
      onPress={handleClick}
    >
      {targetMode === "feed" ? (
        <ScribbleIcon color={iconColor} />
      ) : (
        <PlanetIcon weight="fill" color={iconColor} />
      )}
    </IconButton>
  );

  return withTrigger ? (
    <TabTrigger asChild name={targetMode}>
      {button}
    </TabTrigger>
  ) : (
    button
  );
});
