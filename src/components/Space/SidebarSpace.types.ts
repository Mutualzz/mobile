import type { Space } from "@stores/objects/Space";

export interface SidebarSpaceProps {
  space: Space;
  active: boolean;
  onSelect: (spaceId: string) => void;
  reordering?: boolean;
}
