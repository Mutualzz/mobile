import { FeedIcon } from "@components/icons/Feed";
import { GalaxyIcon } from "@components/icons/Galaxy";
import { useAppStore } from "@hooks/useStores";
import { AppMode } from "@mutualzz/types";
import { IconButton, useTheme } from "@mutualzz/ui-native";
import { switchMode } from "@utils/index";
import { usePathname, useRouter } from "expo-router";
import { TabTrigger } from "expo-router/ui";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
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

    const preferredMode = useMemo(
        () => app.settings?.preferredMode,
        [app.settings?.preferredMode],
    );

    const currentMode: AppMode | null = pathname.startsWith("/feed")
        ? "feed"
        : pathname.startsWith("/spaces")
          ? "spaces"
          : null;

    const targetMode = useMemo(
        () =>
            currentMode === null
                ? preferredMode || "spaces"
                : currentMode === "feed"
                  ? "spaces"
                  : currentMode === "spaces"
                    ? "feed"
                    : (preferredMode ?? "spaces"),
        [currentMode, preferredMode],
    );

    const handleClick = () => {
        switchMode(app, router, targetMode);
    };

    const button = (
        <IconButton
            style={{
                position: "absolute",
                bottom: insets.bottom * 4 + 8,
                right: 16,
                borderRadius: 9999,
                zIndex: theme.zIndex.fab,
            }}
            padding={6}
            size={24}
            onPress={handleClick}
        >
            {targetMode === "feed" ? (
                <FeedIcon color={theme.colors.neutral} />
            ) : (
                <GalaxyIcon color={theme.colors.neutral} />
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
