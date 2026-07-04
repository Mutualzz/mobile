import type { AppStore } from "@stores/App.store";
import type { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Snowflake } from "@mutualzz/types";

export const findMemberForUser = (
  app: AppStore,
  userId: Snowflake,
): SpaceMember | undefined => {
  const active = app.spaces.active;
  if (active) {
    const activeMember = active.members.get(userId);
    if (activeMember) return activeMember;
  }

  for (const space of app.spaces.all) {
    const member = space.members.get(userId);
    if (member) return member;
  }

  return undefined;
};

export const getMemberRoles = (
  member: SpaceMember | undefined,
  maxRoles = 6,
): Role[] => {
  const space = member?.space;
  if (!space || !member) return [];

  const roles = Array.from(member.roles)
    .map((roleId) => space.roles.get(roleId))
    .filter((role): role is Role => !!role && role.id !== space.id)
    .sort((a, b) => b.position - a.position);

  return roles.slice(0, maxRoles);
};

export const getMutualSpaces = (
  app: AppStore,
  userId: Snowflake,
  maxItems = 6,
): Space[] => {
  const spaces = app.spaces.all.filter((space) => space.members.has(userId));
  return spaces.slice(0, maxItems);
};

export const isProfileFriend = (app: AppStore, userId: Snowflake) =>
  app.relationships.isFriend(userId);
