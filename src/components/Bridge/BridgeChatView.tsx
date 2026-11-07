import {
  type ActivityFamily,
  BridgeActivityGroup,
  BridgeMessage,
  shouldStartBridgeGroup,
} from "@components/Bridge/BridgeMessage";
import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { MessageDateSeparator } from "@components/Message/MessageDateSeparator";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import type { BridgeDetail } from "@app-types/bridge";
import type { BridgeFeedEntry } from "@stores/BridgeChat.store";
import { Box, InputDefault, Typography, useTheme } from "@mutualzz/ui-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BridgePlayersSheet,
  PLAYERS_SHEET_ID,
} from "@components/Bridge/BridgePlayersSheet";
import {
  INVENTORY_SHEET_ID,
  MyInventorySheet,
} from "@components/Minecraft/inventory/InventorySheet";
import { useSheet } from "@hooks/useSheet";
import { FULL_SHEET_PROPS } from "@utils/sheet";
import { BackpackIcon, CaretLeftIcon, UsersIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

interface Props {
  bridgeId: string;
  returnToSpaceId?: string;
}

type FeedRow =
  | {
      type: "message";
      key: string;
      entry: BridgeFeedEntry;
      header: boolean;
      showDate: boolean;
    }
  | {
      type: "activity";
      key: string;
      family: ActivityFamily;
      entries: BridgeFeedEntry[];
      showDate: boolean;
    };

const activityFamilyOf = (entry: BridgeFeedEntry): ActivityFamily | null => {
  if (entry.kind === "join" || entry.kind === "leave") return "server";
  if (entry.kind === "voice_join" || entry.kind === "voice_leave")
    return "voice";
  return null;
};

const buildFeedRows = (entries: BridgeFeedEntry[]): FeedRow[] => {
  const rows: FeedRow[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const prev = entries[i - 1];
    const showDate =
      !prev ||
      new Date(prev.at).toDateString() !== new Date(entry.at).toDateString();

    const family = activityFamilyOf(entry);
    if (family) {
      const lastRow = rows[rows.length - 1];
      if (
        lastRow?.type === "activity" &&
        lastRow.family === family &&
        !showDate
      ) {
        lastRow.entries.push(entry);
      } else {
        rows.push({
          type: "activity",
          key: `activity:${entry.id}`,
          family,
          entries: [entry],
          showDate,
        });
      }
      continue;
    }

    rows.push({
      type: "message",
      key: entry.id,
      entry,
      header: shouldStartBridgeGroup(prev, entry),
      showDate,
    });
  }
  return rows;
};

const rowDate = (row: FeedRow) =>
  new Date(row.type === "message" ? row.entry.at : row.entries[0].at);

export const BridgeChatView = observer(
  ({ bridgeId, returnToSpaceId }: Props) => {
    const { t } = useTranslation("settings");
    const { theme } = useTheme();
    const app = useAppStore();
    const queryClient = useQueryClient();
    const { openSheet } = useSheet();
    const tabBarInset = useKeyboardChromeInset();
    const [message, setMessage] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
      () => new Set(),
    );
    const sendingRef = useRef(false);

    const toggleGroup = (groupKey: string) =>
      setExpandedGroups((current) => {
        const next = new Set(current);
        if (next.has(groupKey)) next.delete(groupKey);
        else next.add(groupKey);
        return next;
      });
    const loadingOlderRef = useRef(false);

    const bridgesQuery = useQuery({
      queryKey: ["me", "bridges", bridgeId],
      queryFn: () => app.rest.get<BridgeDetail>(`/@me/bridges/${bridgeId}`),
      refetchInterval: 15_000,
    });

    const historyQuery = useQuery({
      queryKey: ["me", "bridges", bridgeId, "messages"],
      queryFn: () =>
        app.rest.get<BridgeFeedEntry[]>(
          `/@me/bridges/${bridgeId}/messages?limit=100`,
        ),
    });

    const bridge = bridgesQuery.data;
    const hubConnected = bridge?.hubConnected === true;
    const entries = app.bridgeChat.entriesFor(bridgeId);
    const feedRows = buildFeedRows(entries);
    const players = app.bridgeChat.playersFor(bridgeId);

    useEffect(() => {
      if (!historyQuery.data) return;
      app.bridgeChat.hydrate(bridgeId, historyQuery.data);
    }, [bridgeId, historyQuery.data, app.bridgeChat]);

    useEffect(() => {
      if (!bridge?.onlinePlayers) return;
      app.bridgeChat.setPlayers(bridgeId, bridge.onlinePlayers);
    }, [bridgeId, bridge?.onlinePlayers, app.bridgeChat]);

    useEffect(() => {
      if (!bridge) return;
      app.bridgeChat.setUnread(bridgeId, {
        lastMessageId: bridge.lastMessageId ?? null,
        lastAckedId: bridge.lastAckedId ?? null,
        unread: Boolean(bridge.unread),
      });
    }, [bridge, bridgeId, app.bridgeChat]);

    useEffect(() => {
      const last = entries.filter((e) => !e.pending && !e.failed).at(-1);
      if (!last) return;
      const state = app.bridgeChat.unreadFor(bridgeId);
      if (state?.lastAckedId === last.id) return;
      app.bridgeChat.markAcked(bridgeId, last.id);
      void app.rest
        .post(`/@me/bridges/${bridgeId}/ack`, { lastAckedId: last.id })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["me", "bridges"] });
        })
        .catch(() => {
          return;
        });
    }, [bridgeId, entries.length, app, queryClient]);

    const sendMutation = useMutation({
      mutationFn: (content: string) =>
        app.rest.post<BridgeFeedEntry>(`/@me/bridges/${bridgeId}/chat`, {
          content,
        }),
    });

    const flushQueue = useCallback(async () => {
      if (!hubConnected) return;
      const queued = app.bridgeChat.takeQueueFor(bridgeId);
      for (const item of queued) {
        try {
          const payload = await app.rest.post<BridgeFeedEntry>(
            `/@me/bridges/${bridgeId}/chat`,
            { content: item.content },
          );
          app.bridgeChat.resolvePending(item.localId, bridgeId, {
            ...payload,
            kind: "chat",
          });
        } catch {
          app.bridgeChat.requeue(item);
        }
      }
    }, [app, bridgeId, hubConnected]);

    useEffect(() => {
      if (hubConnected) void flushQueue();
    }, [hubConnected, flushQueue]);

    const loadOlder = useCallback(async () => {
      if (
        loadingOlderRef.current ||
        !historyQuery.isSuccess ||
        !app.bridgeChat.hasMore(bridgeId)
      ) {
        return;
      }
      const oldest = entries[0];
      if (!oldest) return;
      loadingOlderRef.current = true;
      try {
        const older = await app.rest.get<BridgeFeedEntry[]>(
          `/@me/bridges/${bridgeId}/messages?limit=50&before=${encodeURIComponent(oldest.id)}`,
        );
        app.bridgeChat.prepend(bridgeId, older);
      } catch {
        // ignore
      } finally {
        loadingOlderRef.current = false;
      }
    }, [app, bridgeId, entries, historyQuery.isSuccess]);

    const send = () => {
      const content = message.trim();
      if (!content || sendingRef.current || sendMutation.isPending) return;

      if (!hubConnected) {
        app.bridgeChat.enqueueSend(bridgeId, content);
        setMessage("");
        return;
      }

      sendingRef.current = true;
      sendMutation.mutate(content, {
        onSuccess: (payload) => {
          app.bridgeChat.add({ ...payload, kind: "chat" });
          setMessage("");
        },
        onError: () => {
          app.bridgeChat.enqueueSend(bridgeId, content);
          setMessage("");
        },
        onSettled: () => {
          sendingRef.current = false;
        },
      });
    };

    return (
      <Screen
        style={{
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
          borderTopWidth: 0,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          paddingBottom: tabBarInset,
        }}
      >
        <Paper
          variant="plain"
          style={{
            paddingHorizontal: 8,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.typography.colors.muted,
          }}
          elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
          <IconButton
            accessibilityLabel="Back"
            onPress={() => {
              const spaceId =
                returnToSpaceId ?? bridgesQuery.data?.spaceId ?? undefined;
              if (spaceId) {
                app.spaces.setActive(spaceId);
                app.spaces.setSidebarTab(spaceId, "bridges");
                app.setSpacesDrawerOpen(true);
                return;
              }
              app.setDMDrawerOpen(true);
            }}
          >
            <CaretLeftIcon weight="bold" />
          </IconButton>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-md" weight="bold" truncate="single">
              {bridge?.name ?? t("minecraftBridge.liveTitle")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {hubConnected
                ? t("minecraftBridge.onlineCount", { count: players.length })
                : t("minecraftBridge.hubDisconnected")}
            </Typography>
          </Box>
          <IconButton
            accessibilityLabel={t("minecraftBridge.inventoryButton")}
            onPress={() =>
              openSheet(
                INVENTORY_SHEET_ID,
                <MyInventorySheet bridgeId={bridgeId} />,
                FULL_SHEET_PROPS,
              )
            }
          >
            <BackpackIcon />
          </IconButton>
          <IconButton
            accessibilityLabel={t("minecraftBridge.playersTitle")}
            onPress={() =>
              openSheet(
                PLAYERS_SHEET_ID,
                <BridgePlayersSheet bridgeId={bridgeId} />,
                FULL_SHEET_PROPS,
              )
            }
          >
            <UsersIcon />
          </IconButton>
        </Paper>

        {!hubConnected && (
          <Paper
            variant="soft"
            color="warning"
            style={{ margin: 12, padding: 10, borderRadius: 8 }}
          >
            <Typography level="body-sm">
              {t("minecraftBridge.hubWaitingBanner")}
            </Typography>
          </Paper>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <FlatList
              data={feedRows}
              keyExtractor={(row) => row.key}
              extraData={expandedGroups}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingVertical: 8,
                paddingHorizontal: 8,
                flexGrow: 1,
              }}
              showsHorizontalScrollIndicator={false}
              onStartReached={() => void loadOlder()}
              onStartReachedThreshold={0.2}
              ListEmptyComponent={
                <Box style={{ padding: 16, gap: 6 }}>
                  <Typography level="title-md" weight="bold">
                    {t("minecraftBridge.liveWelcomeTitle", {
                      name: bridge?.name ?? "bridge",
                    })}
                  </Typography>
                  <Typography level="body-sm" textColor="muted">
                    {t("minecraftBridge.liveEmpty")}
                  </Typography>
                </Box>
              }
              renderItem={({ item: row }) => (
                <Fragment>
                  {row.showDate && <MessageDateSeparator date={rowDate(row)} />}
                  {row.type === "activity" ? (
                    <BridgeActivityGroup
                      family={row.family}
                      entries={row.entries}
                      expanded={expandedGroups.has(row.key)}
                      onToggle={() => toggleGroup(row.key)}
                    />
                  ) : (
                    <BridgeMessage entry={row.entry} header={row.header} />
                  )}
                </Fragment>
              )}
            />
          </Box>

          <Box
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              padding: 10,
              minWidth: 0,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.typography.colors.muted,
              backgroundColor: theme.colors.surface,
            }}
          >
            <InputDefault
              style={{ flex: 1, minWidth: 0 }}
              value={message}
              onChangeText={setMessage}
              placeholder={
                hubConnected
                  ? t("minecraftBridge.liveSendPlaceholder")
                  : t("minecraftBridge.queueSendPlaceholder")
              }
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Button
              size="sm"
              disabled={!message.trim() || sendMutation.isPending}
              onPress={send}
            >
              {sendMutation.isPending
                ? t("minecraftBridge.liveSending")
                : t("minecraftBridge.liveSend")}
            </Button>
          </Box>
        </KeyboardAvoidingView>
      </Screen>
    );
  },
);
