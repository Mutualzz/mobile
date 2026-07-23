import { Paper } from "@components/Paper";
import { Button } from "@components/Button";
import { useUserRowStyle } from "@components/userRowStyle";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { BridgeSummary } from "@app-types/bridge";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { CubeIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

const ESTIMATED_BRIDGE_ROW_HEIGHT = 64;

type ListRow =
  | { type: "header"; key: string; title: string }
  | { type: "bridge"; key: string; bridge: BridgeSummary };

interface BridgeChannelListProps {
  spaceId?: string;
}

export const BridgeChannelList = observer(
  ({ spaceId }: BridgeChannelListProps) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const { theme } = useTheme();
    const rowStyle = useUserRowStyle();
    const unreadDotSize = useScaledSquareSize(8);
    const { bridgeId: activeBridgeId } = useLocalSearchParams<{
      bridgeId?: string;
    }>();

    const bridgesQuery = useQuery({
      queryKey: ["me", "bridges"],
      queryFn: () => app.rest.get<BridgeSummary[]>("/@me/bridges"),
      refetchInterval: 15_000,
    });

    useEffect(() => {
      if (!bridgesQuery.data) return;
      app.bridgeChat.setUnreadFromList(bridgesQuery.data);
    }, [bridgesQuery.data, app.bridgeChat]);

    const bridges = useMemo(() => {
      const all = bridgesQuery.data ?? [];
      if (!spaceId) return all;
      return all.filter((bridge) => bridge.spaceId === spaceId);
    }, [bridgesQuery.data, spaceId]);

    const rows = useMemo<ListRow[]>(() => {
      if (spaceId) {
        return bridges.map((bridge) => ({
          type: "bridge" as const,
          key: bridge.id,
          bridge,
        }));
      }
      const groups = new Map<string, BridgeSummary[]>();
      for (const bridge of bridges) {
        const key = bridge.spaceId ?? "";
        const list = groups.get(key) ?? [];
        list.push(bridge);
        groups.set(key, list);
      }
      const ordered = [...groups.entries()].sort(([a], [b]) => {
        const aName = app.spaces.get(a)?.name ?? a;
        const bName = app.spaces.get(b)?.name ?? b;
        return aName.localeCompare(bName);
      });
      const next: ListRow[] = [];
      for (const [groupSpaceId, groupBridges] of ordered) {
        next.push({
          type: "header",
          key: `h-${groupSpaceId || "unknown"}`,
          title:
            app.spaces.get(groupSpaceId)?.name ??
            t("minecraftBridge.unknownSpace"),
        });
        for (const bridge of groupBridges) {
          next.push({ type: "bridge", key: bridge.id, bridge });
        }
      }
      return next;
    }, [app.spaces, bridges, spaceId, t]);

    const space = spaceId ? app.spaces.get(spaceId) : null;
    const canManageBridge = !!space?.members.me?.hasPermission("ManageSpace");

    const openBridge = useCallback(
      (bridge: BridgeSummary) => {
        Keyboard.dismiss();
        const targetSpaceId = spaceId ?? bridge.spaceId;
        if (targetSpaceId) {
          app.spaces.setActive(targetSpaceId);
          app.spaces.setSidebarTab(targetSpaceId, "bridges");
          app.setSpacesDrawerOpen(false);
          app.setDMDrawerOpen(false);
          navigate(`/spaces/bridges/${bridge.id}`);
        }
      },
      [app, navigate, spaceId],
    );

    const renderItem = useCallback(
      ({ item }: { item: ListRow }) => {
        if (item.type === "header") {
          return (
            <Typography
              level="label-xs"
              textColor="muted"
              style={{ marginTop: 8, marginBottom: 4, marginHorizontal: 4 }}
            >
              {item.title}
            </Typography>
          );
        }

        const bridge = item.bridge;
        const unread =
          app.bridgeChat.unreadFor(bridge.id)?.unread ?? Boolean(bridge.unread);
        const active = activeBridgeId === bridge.id;
        const stored = app.bridgeChat.playersByBridge.get(bridge.id);
        const onlineCount =
          stored !== undefined ? stored.length : (bridge.onlineCount ?? 0);
        const statusLabel = !bridge.hubConnected
          ? t("minecraftBridge.hubDisconnected")
          : onlineCount === 0
            ? t("minecraftBridge.onlineNone")
            : t("minecraftBridge.onlineCount", { count: onlineCount });

        return (
          <Pressable
            onPress={() => openBridge(bridge)}
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
                <CubeIcon weight={active ? "fill" : "regular"} size={22} />
              </Box>
              <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Typography
                  level="body-sm"
                  weight={active || unread ? "bold" : "medium"}
                  truncate="single"
                >
                  {bridge.name}
                  {bridge.role === "member"
                    ? ` · ${t("minecraftBridge.roleMember")}`
                    : ""}
                </Typography>
                <Typography level="body-xs" textColor="muted" truncate="single">
                  {statusLabel}
                </Typography>
              </Box>
              {unread && !active && (
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
      },
      [
        activeBridgeId,
        app.bridgeChat,
        openBridge,
        rowStyle,
        t,
        theme.typography.colors.primary,
        unreadDotSize,
      ],
    );

    return (
      <Paper
        style={{
          flex: 1,
          padding: 12,
          marginHorizontal: spaceId ? 8 : 12,
          borderWidth: 0,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        {!spaceId && (
          <Typography
            level="label-xs"
            textColor="muted"
            style={{ marginBottom: 8 }}
          >
            {t("minecraftBridge.sidebarTitle")}
          </Typography>
        )}

        {bridges.length === 0 ? (
          <View style={{ paddingVertical: 24, gap: 12, alignItems: "center" }}>
            <Typography
              level="body-sm"
              textColor="muted"
              style={{ textAlign: "center" }}
            >
              {spaceId
                ? canManageBridge
                  ? t("minecraftBridge.noBridgesAdmin")
                  : t("minecraftBridge.noBridgesMember")
                : t("minecraftBridge.sidebarEmpty")}
            </Typography>
            {spaceId && canManageBridge && (
              <Button
                size="sm"
                variant="soft"
                onPress={() =>
                  navigate(
                    `/(tabs)/spaces/${spaceId}/settings/minecraft-bridge`,
                  )
                }
              >
                {t("minecraftBridge.openSpaceSettings")}
              </Button>
            )}
          </View>
        ) : (
          <View style={{ flex: 1, minHeight: 0 }}>
            <FlashList
              data={rows}
              keyExtractor={(row) => row.key}
              renderItem={renderItem}
              drawDistance={250}
              overrideItemLayout={(
                layout: { span?: number; size?: number },
                item: ListRow,
              ) => {
                layout.size =
                  item.type === "header" ? 28 : ESTIMATED_BRIDGE_ROW_HEIGHT;
              }}
              extraData={`${app.bridgeChat.hasAnyUnread}:${activeBridgeId ?? ""}`}
            />
          </View>
        )}
      </Paper>
    );
  },
);
