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
