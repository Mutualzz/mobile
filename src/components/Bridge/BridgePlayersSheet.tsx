import { IconButton } from "@components/IconButton";
import {
  INVENTORY_SHEET_ID,
  PlayerInventorySheet,
} from "@components/Minecraft/inventory/InventorySheet";
import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import { UserAvatar } from "@components/User/UserAvatar";
import { useBridgeDetail } from "@hooks/useBridgeInventory";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { type BridgeKnownPlayer, knownPlayersQueryKey } from "@mutualzz/client";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import type { BridgeOnlinePlayer } from "@stores/BridgeChat.store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FULL_SHEET_PROPS } from "@utils/sheet";
import { observer } from "mobx-react-lite";
import { MagnifyingGlassIcon, XIcon } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";
import { BridgeServerCard } from "./BridgeServerCard";
import { PlayerActionsSheet } from "./PlayerActionsSheet";
import { PlayerModerationSheet } from "./PlayerModerationSheet";

export const PLAYERS_SHEET_ID = "bridge-players";
const ACTIONS_SHEET_ID = "bridge-player-actions";
const MODERATION_SHEET_ID = "bridge-player-moderation";
const KNOWN_PAGE_SIZE = 50;

type PlayerListRow =
  | { type: "heading"; key: string; label: string }
  | { type: "empty"; key: string; label: string }
  | { type: "player"; key: string; player: BridgeOnlinePlayer }
  | { type: "offline"; key: string; known: BridgeKnownPlayer };

const PlayerRow = observer(
  ({
    player,
    dimmed,
    onPress,
  }: {
    player: BridgeOnlinePlayer;
    dimmed?: boolean;
    onPress: () => void;
  }) => {
    const app = useAppStore();
    const linked =
      player.linkedUser?.id != null
        ? app.users.get(player.linkedUser.id)
        : null;

    return (
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 6,
          paddingHorizontal: 4,
          opacity: dimmed ? 0.5 : 1,
        }}
      >
        {linked ? (
          <UserAvatar user={linked} size="sm" />
        ) : (
          <MinecraftAvatar uuid={player.uuid} name={player.name} size={28} />
        )}
        <Typography
          level="body-sm"
          truncate="single"
          style={{ flex: 1, minWidth: 0 }}
        >
          {player.name}
        </Typography>
      </Pressable>
    );
  },
);

export const BridgePlayersSheet = observer(
  ({ bridgeId }: { bridgeId: string }) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const { closeSheet, openSheet } = useSheet();
    const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
    const { data: bridge } = useBridgeDetail(bridgeId);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const spaceId = bridge?.spaceId;
    const isAdmin = bridge?.role === "admin" && Boolean(spaceId);
    const rawPlayers = app.bridgeChat.playersFor(bridgeId);

    useEffect(() => {
      const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
      return () => clearTimeout(timer);
    }, [searchInput]);

    const visiblePlayers = useMemo(() => {
      const needle = search.toLowerCase();
      const sorted = [...rawPlayers].sort((first, second) =>
        first.name.localeCompare(second.name),
      );
      return needle
        ? sorted.filter((player) => player.name.toLowerCase().includes(needle))
        : sorted;
    }, [rawPlayers, search]);

    const knownQuery = useInfiniteQuery({
      queryKey: [...knownPlayersQueryKey(bridgeId), search],
      queryFn: ({ pageParam }) =>
        app.rest.get<{
          players: BridgeKnownPlayer[];
          hasMore: boolean;
          total: number;
        }>(`/spaces/${spaceId}/bridge/inventories`, {
          offline: "true",
          limit: KNOWN_PAGE_SIZE,
          offset: pageParam,
          ...(search ? { q: search } : {}),
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        lastPage.hasMore ? pages.length * KNOWN_PAGE_SIZE : undefined,
      enabled: isAdmin,
    });

    const offlineTotal = knownQuery.data?.pages[0]?.total ?? 0;

    const offlinePlayers = useMemo(() => {
      const onlineUuids = new Set(
        rawPlayers.map((player) => player.uuid.toLowerCase()),
      );
      return (knownQuery.data?.pages ?? [])
        .flatMap((page) => page.players)
        .filter((known) => !onlineUuids.has(known.minecraftUuid.toLowerCase()));
    }, [knownQuery.data, rawPlayers]);

    const rows = useMemo<PlayerListRow[]>(() => {
      const list: PlayerListRow[] = [
        {
          type: "heading",
          key: "online-heading",
          label: t("minecraftBridge.onlineCount", {
            count: visiblePlayers.length,
          }),
        },
      ];
      if (visiblePlayers.length === 0) {
        list.push({
          type: "empty",
          key: "online-empty",
          label: search
            ? t("minecraftBridge.playersNoResults")
            : t("minecraftBridge.onlineNone"),
        });
      }
      for (const player of visiblePlayers) {
        list.push({ type: "player", key: player.uuid, player });
      }
      if (offlinePlayers.length > 0) {
        list.push({
          type: "heading",
          key: "offline-heading",
          label: t("minecraftBridge.offlineCount", { count: offlineTotal }),
        });
        for (const known of offlinePlayers) {
          list.push({
            type: "offline",
            key: `offline:${known.minecraftUuid}`,
            known,
          });
        }
      }
      return list;
    }, [t, visiblePlayers, offlinePlayers, search, offlineTotal]);

    const openInventory = (minecraftUuid: string, minecraftName: string) => {
      if (!spaceId) return;
      closeBottomSheet(ACTIONS_SHEET_ID);
      openSheet(
        INVENTORY_SHEET_ID,
        <PlayerInventorySheet
          bridgeId={bridgeId}
          spaceId={spaceId}
          minecraftUuid={minecraftUuid}
          minecraftName={minecraftName}
        />,
        FULL_SHEET_PROPS,
      );
    };

    const openModeration = (
      action: "kick" | "ban",
      minecraftUuid: string,
      minecraftName: string,
    ) => {
      if (!spaceId) return;
      closeBottomSheet(ACTIONS_SHEET_ID);
      openBottomSheet(
        MODERATION_SHEET_ID,
        <PlayerModerationSheet
          spaceId={spaceId}
          bridgeId={bridgeId}
          action={action}
          minecraftUuid={minecraftUuid}
          minecraftName={minecraftName}
          onClose={() => closeBottomSheet(MODERATION_SHEET_ID)}
        />,
      );
    };

    const openActions = (
      player: BridgeOnlinePlayer,
      options: { lastSeenAt?: string; canKick: boolean },
    ) => {
      openBottomSheet(
        ACTIONS_SHEET_ID,
        <PlayerActionsSheet
          player={player}
          lastSeenAt={options.lastSeenAt}
          onClose={() => closeBottomSheet(ACTIONS_SHEET_ID)}
          onViewInventory={
            isAdmin ? () => openInventory(player.uuid, player.name) : undefined
          }
          onKick={
            isAdmin && options.canKick
              ? () => openModeration("kick", player.uuid, player.name)
              : undefined
          }
          onBan={
            isAdmin
              ? () => openModeration("ban", player.uuid, player.name)
              : undefined
          }
        />,
      );
    };

    const renderRow = (row: PlayerListRow) => {
      switch (row.type) {
        case "heading":
          return (
            <Typography
              level="label-sm"
              textColor="muted"
              style={{ marginTop: row.key === "offline-heading" ? 12 : 4 }}
            >
              {row.label}
            </Typography>
          );
        case "empty":
          return (
            <Typography level="body-sm" textColor="muted">
              {row.label}
            </Typography>
          );
        case "player":
          return (
            <PlayerRow
              player={row.player}
              onPress={() =>
                openActions(row.player, {
                  canKick:
                    bridge?.moderationServers?.includes(row.player.serverId) ??
                    false,
                })
              }
            />
          );
        case "offline": {
          const player: BridgeOnlinePlayer = {
            uuid: row.known.minecraftUuid,
            name: row.known.minecraftName,
            serverId: row.known.servers[0] ?? "",
            linkedUser: null,
          };
          return (
            <PlayerRow
              player={player}
              dimmed
              onPress={() =>
                openActions(player, {
                  lastSeenAt: row.known.lastSeenAt,
                  canKick: false,
                })
              }
            />
          );
        }
      }
    };

    return (
      <Box style={{ flex: 1, width: "100%", minHeight: 0 }}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
            gap: 8,
          }}
        >
          <Typography level="body-lg" weight="bold" style={{ flex: 1 }}>
            {t("minecraftBridge.playersTitle")}
          </Typography>
          <IconButton padding={8} onPress={() => closeSheet(PLAYERS_SHEET_ID)}>
            <XIcon size={20} />
          </IconButton>
        </Box>
        <Box style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <InputDefault
            fullWidth
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t("minecraftBridge.playersSearch")}
            startDecorator={<MagnifyingGlassIcon size={16} />}
          />
        </Box>
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            gap: 2,
          }}
          data={rows}
          keyExtractor={(row) => row.key}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Box style={{ marginBottom: 8 }}>
              <BridgeServerCard
                bridgeId={bridgeId}
                statuses={bridge?.serverStatuses ?? []}
              />
            </Box>
          }
          onEndReached={() => {
            if (knownQuery.hasNextPage && !knownQuery.isFetchingNextPage) {
              void knownQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => renderRow(item)}
        />
      </Box>
    );
  },
);
