import { PlayerModerationSheet } from "@components/Bridge/PlayerModerationSheet";
import { ListSkeleton } from "@components/Skeletons";
import { Button } from "@components/Button";
import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import { useBridgeServerLabel } from "@hooks/useBridgeInventory";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import type { ModerationResult } from "@mutualzz/client";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

const MEMBERS_PAGE_SIZE = 30;
const MODERATION_SHEET_ID = "bridge-settings-moderation";

interface BridgeMemberRow {
  userId: string;
  username: string;
  globalName: string | null;
  online: boolean;
  minecraftUuid: string | null;
  minecraftName: string | null;
}

interface BridgeBanRow {
  minecraftUuid: string;
  minecraftName: string;
  reason: string | null;
  createdAt: string;
  bannedBy: { username: string | null; globalName: string | null } | null;
}

export const BridgeMembersSection = observer(
  ({ spaceId, bridgeId }: { spaceId: string; bridgeId: string }) => {
    const { t } = useTranslation("settings");
    const { t: tChat } = useTranslation("chat");
    const app = useAppStore();
    const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
      const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
      return () => clearTimeout(timer);
    }, [searchInput]);

    const membersQuery = useInfiniteQuery({
      queryKey: ["space", spaceId, "bridge", "members", search],
      queryFn: ({ pageParam }) =>
        app.rest.get<{ members: BridgeMemberRow[]; hasMore: boolean }>(
          `/spaces/${spaceId}/bridge/members`,
          {
            offset: pageParam,
            limit: MEMBERS_PAGE_SIZE,
            ...(search ? { q: search } : {}),
          },
        ),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        lastPage.hasMore ? pages.length * MEMBERS_PAGE_SIZE : undefined,
      refetchInterval: 60_000,
    });

    const members =
      membersQuery.data?.pages.flatMap((page) => page.members) ?? [];

    const openBan = (minecraftUuid: string, minecraftName: string) =>
      openBottomSheet(
        MODERATION_SHEET_ID,
        <PlayerModerationSheet
          spaceId={spaceId}
          bridgeId={bridgeId}
          action="ban"
          minecraftUuid={minecraftUuid}
          minecraftName={minecraftName}
          onClose={() => closeBottomSheet(MODERATION_SHEET_ID)}
        />,
      );

    return (
      <Box style={{ gap: 8 }}>
        <Typography level="label-sm" weight="bold">
          {t("minecraftBridge.membersTitle")}
        </Typography>
        <Typography level="body-xs" textColor="muted">
          {t("minecraftBridge.membersHint")}
        </Typography>
        <InputDefault
          fullWidth
          value={searchInput}
          onChangeText={setSearchInput}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t("minecraftBridge.membersSearch")}
        />
        {membersQuery.isLoading ? (
          <ListSkeleton label={tChat("loading")} count={4} leading="avatar" />
        ) : members.length === 0 ? (
          <Typography level="body-xs" textColor="muted">
            {search
              ? t("minecraftBridge.membersNoResults")
              : t("minecraftBridge.membersEmpty")}
          </Typography>
        ) : (
          members.map((member) => {
            const displayName =
              member.globalName?.trim() ||
              member.username ||
              member.minecraftName ||
              member.userId;
            const { minecraftUuid, minecraftName } = member;

            return (
              <Box
                key={member.userId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Box style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Typography level="body-sm" weight="bold" truncate="single">
                    {displayName}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {member.online
                      ? t("minecraftBridge.membersOnline")
                      : t("minecraftBridge.membersOffline")}
                    {minecraftName ? ` · ${minecraftName}` : ""}
                  </Typography>
                </Box>
                {minecraftUuid && minecraftName && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    onPress={() => openBan(minecraftUuid, minecraftName)}
                  >
                    {t("minecraftBridge.ban")}
                  </Button>
                )}
              </Box>
            );
          })
        )}
        {membersQuery.hasNextPage && (
          <Button
            size="sm"
            variant="plain"
            disabled={membersQuery.isFetchingNextPage}
            onPress={() => void membersQuery.fetchNextPage()}
          >
            {t("minecraftBridge.membersLoadMore")}
          </Button>
        )}
      </Box>
    );
  },
);

export const BridgeBansSection = observer(
  ({ spaceId, bridgeId }: { spaceId: string; bridgeId: string }) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const queryClient = useQueryClient();
    const labelFor = useBridgeServerLabel(bridgeId);
    const bansKey = ["space", spaceId, "bridge", "bans"];

    const bansQuery = useQuery({
      queryKey: bansKey,
      queryFn: () =>
        app.rest.get<{ bans: BridgeBanRow[] }>(
          `/spaces/${spaceId}/bridge/bans`,
        ),
    });

    const unbanMutation = useMutation({
      mutationFn: (minecraftUuid: string) =>
        app.rest.delete<{ results: ModerationResult[] }>(
          `/spaces/${spaceId}/bridge/players/${minecraftUuid}/ban`,
        ),
      onSuccess: ({ results }) => {
        const failed = results.filter((result) => !result.ok);
        Alert.alert(
          failed.length === 0
            ? t("minecraftBridge.unbanDone")
            : t("minecraftBridge.unbanPartial", {
                servers: failed
                  .map((result) => labelFor(result.serverId))
                  .join(", "),
              }),
        );
        void queryClient.invalidateQueries({ queryKey: bansKey });
      },
      onError: (error: Error) => Alert.alert(error.message),
    });

    const bans = bansQuery.data?.bans ?? [];

    return (
      <Box style={{ gap: 8 }}>
        <Typography level="label-sm" weight="bold">
          {t("minecraftBridge.bansTitle")}
        </Typography>
        <Typography level="body-xs" textColor="muted">
          {t("minecraftBridge.bansHint")}
        </Typography>
        {bans.length === 0 ? (
          <Typography level="body-xs" textColor="muted">
            {t("minecraftBridge.bansEmpty")}
          </Typography>
        ) : (
          bans.map((ban) => (
            <Box
              key={ban.minecraftUuid}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Box
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <MinecraftAvatar
                  uuid={ban.minecraftUuid}
                  name={ban.minecraftName}
                  size={28}
                />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Typography level="body-sm" truncate="single">
                    {ban.minecraftName}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {t("minecraftBridge.bannedBy", {
                      name:
                        ban.bannedBy?.globalName ||
                        ban.bannedBy?.username ||
                        t("minecraftBridge.unknownAdmin"),
                      date: new Date(ban.createdAt).toLocaleDateString(),
                    })}
                    {ban.reason ? ` · ${ban.reason}` : ""}
                  </Typography>
                </Box>
              </Box>
              <Button
                size="sm"
                variant="soft"
                disabled={
                  unbanMutation.isPending &&
                  unbanMutation.variables === ban.minecraftUuid
                }
                onPress={() => unbanMutation.mutate(ban.minecraftUuid)}
              >
                {t("minecraftBridge.unban")}
              </Button>
            </Box>
          ))
        )}
      </Box>
    );
  },
);
