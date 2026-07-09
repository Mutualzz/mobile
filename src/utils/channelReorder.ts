import { ChannelType } from "@mutualzz/types";
import type { Channel } from "@stores/objects/Channel";
import { arrayMove } from "@utils/arrayMove";

export function flattenChannels(channels: Channel[]) {
  const childIds = new Set(channels.filter((c) => c.parent).map((c) => c.id));

  const result: Channel[] = [];
  for (const channel of channels) {
    if (childIds.has(channel.id)) continue;

    result.push(channel);

    if (channel.type === ChannelType.Category) {
      const children = channels.filter((c) => c.parent?.id === channel.id);
      children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      result.push(...children);
    }
  }

  return result;
}

function getAllCategoryChildren(
  allChannels: Channel[],
  categoryId: string,
): Channel[] {
  const category = allChannels.find((c) => c.id === categoryId);
  if (!category) return [];

  const children = allChannels.filter((c) => c.parent?.id === categoryId);
  return [category, ...children];
}

function buildCompleteOrder(newOrder: Channel[]): Channel[] {
  const completeOrder: Channel[] = [];
  let currentCategory: Channel | null = null;
  const siblingPositions = new Map<string | null, number>();

  for (const channel of newOrder) {
    if (channel.type === ChannelType.Category) {
      currentCategory = channel;
      channel.setParent(null);
    } else {
      channel.setParent(currentCategory);
    }

    const parentKey = channel.parent?.id ?? null;
    const nextPosition = siblingPositions.get(parentKey) ?? 0;
    channel.position = nextPosition;
    siblingPositions.set(parentKey, nextPosition + 1);

    completeOrder.push(channel);
  }

  return completeOrder;
}

function reorderFlatChannelList(
  flatChannels: Channel[],
  visibleChannels: Channel[],
  fromIndex: number,
  toIndex: number,
): Channel[] | null {
  if (fromIndex === toIndex) return null;
  if (fromIndex < 0 || fromIndex >= flatChannels.length) return null;
  if (toIndex < 0 || toIndex >= flatChannels.length) return null;

  const movingChannel = flatChannels[fromIndex];
  let newOrder: Channel[];

  if (movingChannel.type === ChannelType.Category) {
    const group = getAllCategoryChildren(visibleChannels, movingChannel.id);
    newOrder = flatChannels.filter((c) => !group.includes(c));

    let insertAt = toIndex;
    if (toIndex > fromIndex) {
      const visibleGroupSize = group.filter((c) =>
        flatChannels.includes(c),
      ).length;
      insertAt = toIndex - visibleGroupSize + 1;
    }

    const visibleGroup = group.filter((c) => flatChannels.includes(c));
    newOrder.splice(insertAt, 0, ...visibleGroup);
  } else {
    newOrder = arrayMove(flatChannels, fromIndex, toIndex);
  }

  return buildCompleteOrder(newOrder);
}

export function reorderChannelInList(
  flatChannels: Channel[],
  visibleChannels: Channel[],
  fromIndex: number,
  toIndex: number,
): Channel[] | null {
  return reorderFlatChannelList(
    flatChannels,
    visibleChannels,
    fromIndex,
    toIndex,
  );
}

export function moveChannelInList(
  flatChannels: Channel[],
  visibleChannels: Channel[],
  channelId: string,
  direction: -1 | 1,
): Channel[] | null {
  const oldIndex = flatChannels.findIndex((c) => c.id === channelId);
  if (oldIndex === -1) return null;

  const newIndex = oldIndex + direction;
  if (newIndex < 0 || newIndex >= flatChannels.length) return null;

  return reorderFlatChannelList(
    flatChannels,
    visibleChannels,
    oldIndex,
    newIndex,
  );
}

export function getChannelMoveState(flatChannels: Channel[], channelId: string) {
  const index = flatChannels.findIndex((c) => c.id === channelId);
  return {
    index,
    canMoveUp: index > 0,
    canMoveDown: index >= 0 && index < flatChannels.length - 1,
  };
}

export function getChannelCategoryLabel(
  flatChannels: Channel[],
  index: number,
): string | null {
  const channel = flatChannels[index];
  if (!channel || channel.type === ChannelType.Category) return null;

  for (let i = index - 1; i >= 0; i--) {
    const candidate = flatChannels[i];
    if (candidate.type === ChannelType.Category) {
      return candidate.name ?? null;
    }
  }

  return null;
}
