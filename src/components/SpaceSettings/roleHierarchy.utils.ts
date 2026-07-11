import type { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import { arrayMove } from "@utils/arrayMove";

export interface HierarchyContext {
  canManageRoles: boolean;
  actorIsOwner: boolean;
  actorIsAdmin: boolean;
  actorTopPos: number;
  canReorder: boolean;
}

export function getHierarchyContext(
  space: Space,
  me: SpaceMember | null | undefined,
): HierarchyContext {
  const actorIsOwner = space.ownerId === me?.userId;
  const actorIsAdmin = me?.hasPermission("Administrator") ?? false;
  const actorTopPos = me?.highestRole?.position ?? -1;
  const canManageRoles = me?.hasPermission("ManageRoles") ?? false;

  return {
    canManageRoles,
    actorIsOwner,
    actorIsAdmin,
    actorTopPos,
    canReorder:
      canManageRoles && (actorIsOwner || actorIsAdmin || actorTopPos > 0),
  };
}

export function canAssignRole(
  hierarchyContext: HierarchyContext,
  role: Role,
): boolean {
  if (hierarchyContext.actorIsOwner || hierarchyContext.actorIsAdmin) {
    return true;
  }

  return role.position < hierarchyContext.actorTopPos;
}

export function isRoleHierarchyLocked(
  hierarchyContext: HierarchyContext,
  role: Role,
): boolean {
  if (hierarchyContext.actorIsOwner || hierarchyContext.actorIsAdmin) {
    return false;
  }

  return role.position >= hierarchyContext.actorTopPos;
}

export function splitRolesByHierarchy(
  all: Role[],
  hierarchyContext: HierarchyContext,
) {
  if (hierarchyContext.actorIsOwner || hierarchyContext.actorIsAdmin) {
    return { fixedRoles: [] as Role[], reorderableRoles: all };
  }

  return {
    fixedRoles: all.filter((r) => r.position >= hierarchyContext.actorTopPos),
    reorderableRoles: all.filter(
      (r) => r.position < hierarchyContext.actorTopPos,
    ),
  };
}

export function getPositionCeiling(fixedRoles: Role[], reorderableCount: number) {
  if (fixedRoles.length === 0) return reorderableCount;

  return Math.min(...fixedRoles.map((r) => r.position)) - 1;
}

export async function moveRoleInHierarchy(
  space: Space,
  roleId: string,
  direction: -1 | 1,
) {
  const hierarchyContext = getHierarchyContext(space, space.members.me);
  if (!hierarchyContext.canReorder) return;

  const all = space.roles.byHierarchy.filter((role) => role.id !== space.id);
  const { fixedRoles, reorderableRoles } = splitRolesByHierarchy(
    all,
    hierarchyContext,
  );
  const positionCeiling = getPositionCeiling(
    fixedRoles,
    reorderableRoles.length,
  );

  const oldIndex = reorderableRoles.findIndex((role) => role.id === roleId);
  if (oldIndex === -1) return;

  const newIndex = oldIndex + direction;
  if (newIndex < 0 || newIndex >= reorderableRoles.length) return;

  const newOrder = arrayMove(reorderableRoles, oldIndex, newIndex);
  const movedPosition = positionCeiling - newIndex;

  if (
    !hierarchyContext.actorIsOwner &&
    !hierarchyContext.actorIsAdmin &&
    movedPosition >= hierarchyContext.actorTopPos
  ) {
    return;
  }

  await space.roles.reorderRoles(newOrder, positionCeiling);
}

export async function reorderRoleInHierarchy(
  space: Space,
  fromIndex: number,
  toIndex: number,
) {
  if (fromIndex === toIndex) return;

  const hierarchyContext = getHierarchyContext(space, space.members.me);
  if (!hierarchyContext.canReorder) return;

  const all = space.roles.byHierarchy.filter((role) => role.id !== space.id);
  const { fixedRoles, reorderableRoles } = splitRolesByHierarchy(
    all,
    hierarchyContext,
  );
  const positionCeiling = getPositionCeiling(
    fixedRoles,
    reorderableRoles.length,
  );

  if (fromIndex < 0 || fromIndex >= reorderableRoles.length) return;
  if (toIndex < 0 || toIndex >= reorderableRoles.length) return;

  const newOrder = arrayMove(reorderableRoles, fromIndex, toIndex);
  const movedPosition = positionCeiling - toIndex;

  if (
    !hierarchyContext.actorIsOwner &&
    !hierarchyContext.actorIsAdmin &&
    movedPosition >= hierarchyContext.actorTopPos
  ) {
    return;
  }

  await space.roles.reorderRoles(newOrder, positionCeiling);
}
