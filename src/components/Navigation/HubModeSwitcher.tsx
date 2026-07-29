import { useBridgeListSync } from "@hooks/useBridgeListSync";
import { useNavigateToModeHub } from "@hooks/useNavigateToModeHub";
import { useAppStore } from "@hooks/useStores";
import {
  isAtMobileSpacesHub,
  resolveActiveModeKey,
  shouldClearPendingMode,
  shouldIgnoreSpacesHubTap,
} from "@mutualzz/client";
import { formatColor } from "@mutualzz/ui-core";
import type { ModeKey } from "@mutualzz/types";
import { Box, useTheme } from "@mutualzz/ui-native";
import {
  PlanetIcon,
  ScribbleIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import { usePathname } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export const HubModeSwitcher = observer(() => {
  const { t: tSpace } = useTranslation("space");
  const { t: tChat } = useTranslation("chat");
  const app = useAppStore();
  useBridgeListSync();
  const { navigateToModeHub, modeKeyToAppMode } = useNavigateToModeHub();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [pending, setPending] = useState<ModeKey | null>(null);

  useEffect(() => {
    if (shouldClearPendingMode(pathname, pending)) {
      setPending(null);
    }
  }, [pathname, pending]);

  if (!app.account) return null;

  const active = resolveActiveModeKey(pathname, pending, app.mode);

  const modes: { key: ModeKey; label: string }[] = [
    { key: "dms", label: tSpace("sidebar.directMessages") },
    { key: "spaces", label: tSpace("sidebar.spaces") },
    { key: "feed", label: tChat("feed.title") },
  ];

  const trackColor = formatColor(theme.colors.neutral, {
    alpha: 12,
    format: "hexa",
  });
  const trackBorder = formatColor(theme.colors.neutral, {
    alpha: 18,
    format: "hexa",
  });
  const activeBg = formatColor(theme.colors.primary, {
    alpha: 18,
    format: "hexa",
  });
  const hoverBg = formatColor(theme.colors.neutral, {
    alpha: 14,
    format: "hexa",
  });

  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        gap: 2,
        padding: 2,
        borderRadius: 999,
        backgroundColor: trackColor,
        borderWidth: 1,
        borderColor: trackBorder,
      }}
    >
      {modes.map((mode) => {
        const isActive = mode.key === active;
        const iconColor = isActive
          ? theme.colors.primary
          : theme.typography.colors.secondary;
        const showBridgeUnread =
          mode.key === "spaces" && app.bridgeChat.hasAnyUnread;

        return (
          <Pressable
            key={mode.key}
            accessibilityRole="button"
            accessibilityLabel={mode.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              const atSpacesHub = isAtMobileSpacesHub(
                pathname,
                app.spacesDrawerOpen,
              );
              if (
                shouldIgnoreSpacesHubTap(
                  mode.key,
                  active,
                  pending,
                  atSpacesHub,
                )
              ) {
                return;
              }
              setPending(mode.key);
              requestAnimationFrame(() => {
                navigateToModeHub(modeKeyToAppMode(mode.key));
              });
            }}
            style={({ pressed }) => ({
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 36,
              borderRadius: 999,
              backgroundColor: isActive
                ? activeBg
                : pressed
                  ? hoverBg
                  : "transparent",
            })}
          >
            {mode.key === "dms" ? (
              <UsersThreeIcon weight="fill" size={22} color={iconColor} />
            ) : mode.key === "spaces" ? (
              <PlanetIcon weight="fill" size={22} color={iconColor} />
            ) : (
              <ScribbleIcon weight="fill" size={22} color={iconColor} />
            )}
            {showBridgeUnread && (
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: theme.colors.primary,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </Box>
  );
});
