import type { Space } from "@stores/objects/Space";

export function getSpaceMemberCount(space: Space): number {
  const rawCount = space.raw.memberCount;
  if (typeof rawCount === "number" && rawCount > 0) return rawCount;

  let listCount = 0;
  for (const store of space.memberLists.values()) {
    if (store.memberCount > listCount) listCount = store.memberCount;
  }
  if (listCount > 0) return listCount;

  return space.members.size;
}

export function getSpaceOnlineCount(space: Space): number {
  let onlineCount = 0;

  for (const store of space.memberLists.values()) {
    for (const group of store.list) {
      if (!group.name.toLowerCase().startsWith("online")) continue;
      onlineCount = Math.max(onlineCount, group.items.length);
    }
  }

  return onlineCount;
}
