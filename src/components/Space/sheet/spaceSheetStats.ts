import type { Space } from "@stores/objects/Space";

export function getSpaceMemberCount(space: Space): number {
  const rawCount = space.raw.memberCount;
  if (typeof rawCount === "number" && rawCount > 0) return rawCount;

  const listCount =
    space.memberListWindow?.groups.reduce(
      (total, group) => total + group.count,
      0,
    ) ?? 0;
  if (listCount > 0) return listCount;

  return space.members.size;
}

export function getSpaceOnlineCount(space: Space): number {
  return space.memberListWindow?.onlineCount ?? 0;
}
