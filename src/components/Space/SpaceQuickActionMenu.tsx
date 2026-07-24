import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@components/ContextMenu/ContextMenu";
import { useSpaceQuickActions } from "@components/Space/useSpaceQuickActions";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import type { Space } from "@stores/objects/Space";
import {
  BellIcon,
  CheckCircleIcon,
  DotsThreeIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";

interface Props {
  space: Space;
}

export const SpaceQuickActionMenu = observer(({ space }: Props) => {
  const navIconColor = useSettingsIconColor("info");
  const actions = useSpaceQuickActions(space);

  return (
    <>
      <ContextMenuLabel>{space.name}</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem
        label={actions.markAsReadLabel}
        disabled={!actions.hasUnread}
        onPress={actions.markAsRead}
        icon={<CheckCircleIcon size={16} weight="fill" color={navIconColor} />}
      />
      <ContextMenuItem
        label={actions.notificationsLabel}
        onPress={actions.openNotifications}
        icon={<BellIcon size={16} weight="fill" color={navIconColor} />}
      />
      <ContextMenuItem
        label={actions.moreOptionsLabel}
        onPress={actions.openMoreOptions}
        icon={<DotsThreeIcon size={16} weight="fill" color={navIconColor} />}
      />
    </>
  );
});
