import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@components/ContextMenu/ContextMenu";

import { SpaceIcon } from "@components/Space/SpaceIcon";

import { SpaceQuickActionMenu } from "@components/Space/SpaceQuickActionMenu";

import type { SidebarSpaceProps } from "@components/Space/SidebarSpace.types";

import {
  type PillType,
  SidebarRailSlot,
  SIDEBAR_RAIL_ITEM_SIZE,
} from "@components/SidebarPill";

import { useAppStore } from "@hooks/useStores";

import { observer } from "mobx-react-lite";

import { useTranslation } from "react-i18next";

import { View } from "react-native";

import { Pressable } from "react-native-gesture-handler";

export const SidebarSpace = observer(
  ({ space, active, onSelect, reordering = false }: SidebarSpaceProps) => {
    const { t } = useTranslation("chat");

    const app = useAppStore();

    const pillType: PillType = (() => {
      if (active) return "active";

      if (space.channels.some((ch) => app.readStates.get(ch.id)?.isUnread))
        return "unread";

      if (app.bridgeChat.hasUnreadForSpace(space.id)) return "unread";

      return "none";
    })();

    const icon = (
      <SpaceIcon
        selected={active}
        space={space}
        size={SIDEBAR_RAIL_ITEM_SIZE}
      />
    );

    if (reordering) {
      return (
        <SidebarRailSlot type={pillType}>
          <View
            accessibilityLabel={space.name}
            accessibilityState={{ selected: active }}
            style={{ opacity: active ? 1 : 0.85 }}
          >
            {icon}
          </View>
        </SidebarRailSlot>
      );
    }

    return (
      <SidebarRailSlot type={pillType}>
        <ContextMenu relativeTo="trigger">
          <ContextMenuTrigger asChild>
            <Pressable
              onPress={() => {
                if (active) return;

                onSelect(space.id);
              }}
              delayLongPress={400}
              accessibilityRole="button"
              accessibilityLabel={`${space.name}${
                pillType === "unread" ? `, ${t("a11y.unread")}` : ""
              }`}
              accessibilityState={{ selected: active }}
            >
              {icon}
            </Pressable>
          </ContextMenuTrigger>

          <ContextMenuContent side="bottom" align="start" sideOffset={4}>
            <SpaceQuickActionMenu space={space} />
          </ContextMenuContent>
        </ContextMenu>
      </SidebarRailSlot>
    );
  },
);
