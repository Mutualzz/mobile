import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { Paper } from "@components/Paper";
import { ReorderableVerticalList } from "@components/Reorder/ReorderableVerticalList";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import {
  flattenChannels,
  getChannelCategoryLabel,
  reorderChannelInList,
} from "@utils/channelReorder";
import { observer } from "mobx-react-lite";
import { FolderIcon } from "phosphor-react-native";
import { useMemo } from "react";

interface Props {
  space: Space;
}

const ChannelRow = observer(
  ({
    channel,
    categoryLabel,
  }: {
    channel: Channel;
    categoryLabel: string | null;
  }) => {
    const { theme } = useTheme();
    const isCategory = channel.type === ChannelType.Category;
    const isChild = !!channel.parent;

    return (
      <Paper
        variant="plain"
        style={{
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          marginLeft: isChild ? 16 : 0,
          borderLeftWidth: isChild ? 2 : 0,
          borderLeftColor: isChild
            ? theme.typography.colors.muted
            : "transparent",
          opacity: isCategory ? 0.95 : 1,
        }}
      >
        {isCategory ? (
          <FolderIcon size={16} weight="fill" />
        ) : (
          <ChannelIcon type={channel.type} />
        )}
        <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography
            level="body-sm"
            weight={isCategory ? 700 : 500}
            truncate="single"
          >
            {channel.name}
          </Typography>
          {!isCategory && (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {categoryLabel ?? "No category"}
            </Typography>
          )}
        </Box>
      </Paper>
    );
  },
);

export const SpaceChannelsSettings = observer(({ space }: Props) => {
  const app = useAppStore();

  const allChannels = space.channels;

  const flatChannels = useMemo(
    () => flattenChannels(allChannels),
    [allChannels],
  );

  const categoryLabels = useMemo(
    () =>
      new Map(
        flatChannels.map((channel, index) => [
          channel.id,
          getChannelCategoryLabel(flatChannels, index),
        ]),
      ),
    [flatChannels],
  );

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const nextOrder = reorderChannelInList(
      flatChannels,
      allChannels,
      fromIndex,
      toIndex,
    );
    if (!nextOrder) return;
    app.channels.setChannelOrder(space.id, nextOrder);
  };

  if (flatChannels.length === 0) {
    return (
      <Box style={{ padding: 16 }}>
        <Typography level="body-sm" textColor="muted">
          No channels to reorder.
        </Typography>
      </Box>
    );
  }

  return (
    <Box style={{ flex: 1 }}>
      <Box style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Typography level="body-sm" textColor="muted">
          Drag channels to reorder them. Place a channel directly under a
          category to add it to that group. Drag above a category to remove it
          from the group.
        </Typography>
      </Box>
      <ReorderableVerticalList
        items={flatChannels}
        onReorder={handleReorder}
        enabled={flatChannels.length > 1}
        dragTarget="handle"
        scrollable
        rowGap={8}
        estimatedRowHeight={56}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 8,
          paddingBottom: 32,
        }}
        renderItem={(channel) => (
          <ChannelRow
            channel={channel}
            categoryLabel={categoryLabels.get(channel.id) ?? null}
          />
        )}
      />
    </Box>
  );
});
