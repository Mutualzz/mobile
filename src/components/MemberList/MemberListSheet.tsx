import { MemberListItem } from "@components/MemberList/MemberListItem";
import { Paper } from "@components/Paper";
import { ScreenHeader } from "@components/Screen/Screen";
import { IconButton } from "@components/IconButton";
import { MemberRowSkeleton, SkeletonGroup } from "@components/Skeletons";
import { useAppStore } from "@hooks/useStores";
import {
  Box,
  Sheet,
  Skeleton,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import {
  MAX_MEMBER_LIST_WINDOW_CHUNKS,
  MEMBER_LIST_CHUNK_SIZE,
} from "@mutualzz/validators";
import { FlashList, type ViewToken } from "@shopify/flash-list";
import type { Channel } from "@stores/objects/Channel";
import type {
  MemberListGroupSummary,
  MemberListWindowRow,
} from "@stores/SpaceMemberWindow.store";
import { observer } from "mobx-react-lite";
import { CaretDownIcon, CaretRightIcon, XIcon } from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

const WINDOW_DEBOUNCE_MS = 100;

type VisibleRow =
  | { kind: "header"; group: MemberListGroupSummary; open: boolean }
  | { kind: "member"; absoluteIndex: number };

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
}

function buildVisibleRows(
  groups: MemberListGroupSummary[],
  collapsedGroupIds: Set<string>,
) {
  const visibleRows: VisibleRow[] = [];
  let absoluteStart = 0;

  for (const group of groups) {
    const open = !collapsedGroupIds.has(group.id);
    visibleRows.push({ kind: "header", group, open });
    if (open)
      for (let offset = 1; offset <= group.count; offset++)
        visibleRows.push({
          kind: "member",
          absoluteIndex: absoluteStart + offset,
        });
    absoluteStart += 1 + group.count;
  }

  return { visibleRows, absoluteTotal: absoluteStart };
}

function chunksForViewable(
  viewableItems: ViewToken<VisibleRow>[],
  absoluteTotal: number,
) {
  const visibleChunks = new Set<number>();
  for (const viewable of viewableItems)
    if (viewable.item.kind === "member")
      visibleChunks.add(
        Math.floor(viewable.item.absoluteIndex / MEMBER_LIST_CHUNK_SIZE),
      );

  if (!visibleChunks.size) return [0];

  const sortedChunks = [...visibleChunks].sort((left, right) => left - right);
  const chunks = new Set(sortedChunks);
  const firstChunk = sortedChunks[0];
  const lastChunk = sortedChunks[sortedChunks.length - 1];
  const lastAvailableChunk = Math.max(
    0,
    Math.ceil(absoluteTotal / MEMBER_LIST_CHUNK_SIZE) - 1,
  );

  if (chunks.size < MAX_MEMBER_LIST_WINDOW_CHUNKS && firstChunk > 0)
    chunks.add(firstChunk - 1);
  if (
    chunks.size < MAX_MEMBER_LIST_WINDOW_CHUNKS &&
    lastChunk < lastAvailableChunk
  )
    chunks.add(lastChunk + 1);

  return [...chunks]
    .sort((left, right) => left - right)
    .slice(0, MAX_MEMBER_LIST_WINDOW_CHUNKS);
}

export const MemberListSheet = observer(
  ({ channel, visible, onClose }: Props) => {
    const { t } = useTranslation("chat");
    const app = useAppStore();
    const { theme } = useTheme();
    const hasWallpaper = Boolean(theme.backgroundImageUrl);
    const spaceId = channel.spaceId ?? null;
    const space = spaceId ? app.spaces.get(spaceId) : null;
    const store = space?.memberListWindow ?? null;
    const groups = store?.groups;
    const rows = store?.rows;
    const iconColor = theme.typography.colors.primary;

    const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
      () => new Set(),
    );
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { visibleRows, absoluteTotal } = useMemo(
      () => buildVisibleRows(groups ?? [], collapsedGroupIds),
      [groups, collapsedGroupIds],
    );

    const memberCount = (groups ?? []).reduce(
      (total, group) => total + group.count,
      0,
    );

    useEffect(() => {
      if (!visible || !spaceId) return;
      app.gateway.ensureMemberList(spaceId, channel.id);
    }, [visible, spaceId, channel.id, app.gateway]);

    useEffect(
      () => () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      },
      [],
    );

    const toggleGroup = useCallback((groupId: string) => {
      setCollapsedGroupIds((previous) => {
        const next = new Set(previous);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        return next;
      });
    }, []);

    const latestViewChangeRef = useRef<
      (viewableItems: ViewToken<VisibleRow>[]) => void
    >(() => undefined);

    latestViewChangeRef.current = (viewableItems) => {
      if (!spaceId) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        app.gateway.subscribeMemberList(
          spaceId,
          channel.id,
          chunksForViewable(viewableItems, absoluteTotal),
        );
      }, WINDOW_DEBOUNCE_MS);
    };

    const handleViewableItemsChanged = useCallback(
      ({ viewableItems }: { viewableItems: ViewToken<VisibleRow>[] }) => {
        latestViewChangeRef.current(viewableItems);
      },
      [],
    );

    const renderItem = useCallback(
      ({
        item,
        extraData,
      }: {
        item: VisibleRow;
        extraData?: (MemberListWindowRow | undefined)[];
      }) => {
        if (item.kind === "header") {
          const name = store?.groupName(item.group) ?? item.group.name;
          return (
            <Pressable
              onPress={() => toggleGroup(item.group.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 16,
                paddingBottom: 8,
                paddingHorizontal: 8,
              }}
            >
              <Typography level="label-xs" textColor="secondary">
                {`${name} - ${item.group.count}`}
              </Typography>
              {item.open ? (
                <CaretDownIcon weight="bold" size={12} color={iconColor} />
              ) : (
                <CaretRightIcon weight="bold" size={12} color={iconColor} />
              )}
            </Pressable>
          );
        }

        const listRow = extraData?.[item.absoluteIndex];

        return (
          <Box style={{ paddingHorizontal: 8, paddingBottom: 4 }}>
            {listRow?.type === "member" ? (
              <MemberListItem
                member={listRow.member}
                space={space}
                channelId={channel.id}
                isOwner={listRow.member.userId === space?.ownerId}
              />
            ) : (
              <MemberRowSkeleton index={item.absoluteIndex} />
            )}
          </Box>
        );
      },
      [store, space, channel.id, iconColor, toggleGroup],
    );

    const isInitialLoading = visible && !store?.received;

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
        snapPoints={["95%"]}
        enableDynamicSizing={false}
      >
        <View style={{ flex: 1, width: "100%", minHeight: 0 }}>
          <Paper
            surfaceRole={hasWallpaper ? "chrome" : undefined}
            elevation={hasWallpaper ? 0 : undefined}
            style={{ flex: 1, width: "100%", minHeight: 0 }}
          >
            <ScreenHeader elevation={hasWallpaper ? 0 : undefined}>
              <Typography level="body-md" weight="bold" style={{ flex: 1 }}>
                {t("groupDm.membersCount", { value: memberCount })}
              </Typography>
              <IconButton padding={8} onPress={onClose}>
                <XIcon size={20} />
              </IconButton>
            </ScreenHeader>

            {isInitialLoading ? (
              <View style={{ flex: 1, paddingHorizontal: 8, paddingTop: 16 }}>
                <Skeleton
                  width={120}
                  fontSize={12}
                  style={{ marginLeft: 8, marginBottom: 8 }}
                />
                <SkeletonGroup
                  label={t("loadingMembersEllipsis")}
                  count={12}
                  gap={4}
                  render={(index) => <MemberRowSkeleton index={index} />}
                />
              </View>
            ) : visibleRows.length === 0 ? (
              <Typography
                level="body-sm"
                textColor="muted"
                style={{ textAlign: "center", padding: 24, flex: 1 }}
              >
                {t("noMembersToShow")}
              </Typography>
            ) : (
              <View style={{ flex: 1, minHeight: 0 }}>
                <FlashList
                  key={channel.id}
                  data={visibleRows}
                  extraData={rows}
                  renderItem={renderItem}
                  keyExtractor={(row) =>
                    row.kind === "header"
                      ? `header-${row.group.id}`
                      : `row-${row.absoluteIndex}`
                  }
                  getItemType={(row) => row.kind}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  drawDistance={400}
                  contentContainerStyle={{ paddingBottom: 24 }}
                />
              </View>
            )}
          </Paper>
        </View>
      </Sheet>
    );
  },
);
