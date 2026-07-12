import { Paper } from "@components/Paper";
import { useUserRowStyle } from "@components/userRowStyle";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { BridgeSummary } from "@app-types/bridge";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { useQuery } from "@tanstack/react-query";
import { CubeIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable } from "react-native";

export const BridgeChannelList = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { theme } = useTheme();
  const rowStyle = useUserRowStyle();
  const unreadDotSize = useScaledSquareSize(8);

  const bridgesQuery = useQuery({
    queryKey: ["me", "bridges"],
    queryFn: () => app.rest.get<BridgeSummary[]>("/@me/bridges"),
    refetchInterval: 15_000,
  });

  const bridges = bridgesQuery.data ?? [];

  return (
    <Paper
      style={{
        flex: 1,
        padding: 12,
        marginHorizontal: 12,
        gap: 8,
      }}
      elevation={app.settings?.preferEmbossed ? 2 : 0}
    >
      <Typography level="label-xs" textColor="muted">
        {t("minecraftBridge.sidebarTitle")}
      </Typography>

      {bridges.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 24 }}
        >
          {t("minecraftBridge.sidebarEmpty")}
        </Typography>
      ) : (
        bridges.map((bridge) => {
          const unread =
            app.bridgeChat.unreadFor(bridge.id)?.unread ??
            Boolean(bridge.unread);
          const active = false;

          return (
            <Pressable
              key={bridge.id}
              onPress={() => {
                Keyboard.dismiss();
                navigate(`/@me/bridges/${bridge.id}`);
                app.setDMDrawerOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={bridge.name}
            >
              <Paper
                variant={active ? "soft" : "plain"}
                style={{
                  ...rowStyle,
                  marginBottom: 4,
                }}
              >
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(128,128,128,0.2)",
                  }}
                >
                  <CubeIcon weight="fill" size={22} />
                </Box>
                <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Typography level="body-sm" weight="medium" truncate="single">
                    {bridge.name}
                  </Typography>
                  <Typography
                    level="body-xs"
                    textColor="muted"
                    truncate="single"
                  >
                    {bridge.hubConnected
                      ? t("minecraftBridge.onlineCount", {
                          count: bridge.onlineCount ?? 0,
                        })
                      : t("minecraftBridge.hubDisconnected")}
                  </Typography>
                </Box>
                {unread && (
                  <Box
                    style={{
                      width: unreadDotSize,
                      height: unreadDotSize,
                      borderRadius: 9999,
                      backgroundColor: theme.typography.colors.primary,
                    }}
                  />
                )}
              </Paper>
            </Pressable>
          );
        })
      )}
    </Paper>
  );
});
