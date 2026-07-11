import type { PermissionFlag } from "@mutualzz/bitfield";
import {
  spacePermissionGroups,
  type PermissionGroupDef as SharedPermissionGroupDef,
} from "@mutualzz/i18n";

export interface PermissionGroupDef {
  id: string;
  title: string;
  items: {
    flag: PermissionFlag;
    label: string;
    description?: string;
  }[];
}

export { spacePermissionGroups };

export type { SharedPermissionGroupDef };

export function filterPermissionGroups(
  groups: PermissionGroupDef[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.label.toLowerCase().includes(q)) return true;
        if (item.description?.toLowerCase().includes(q)) return true;
        return false;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
