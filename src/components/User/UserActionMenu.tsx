import {
  ActionMenuLabel,
  ActionMenuSeparator,
} from "@components/ActionMenu/ActionMenu";
import { ActionMenuItem } from "@components/ActionMenu/ActionMenuItem";
import { useUserActionMenu } from "@components/User/useUserActionMenu";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";

interface Props {
  user: User;
  insideDMs?: boolean;
  hideMessage?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export const UserActionMenu = observer(
  ({ user, insideDMs, hideMessage, onNavigate, onClose }: Props) => {
    const { items } = useUserActionMenu({
      user,
      insideDMs,
      hideMessage,
      onNavigate,
      onClose,
    });

    return (
      <>
        <ActionMenuLabel>{user.displayName}</ActionMenuLabel>
        <ActionMenuSeparator />
        {items.map((item) => (
          <ActionMenuItem
            key={item.key}
            label={item.label}
            disabled={item.disabled}
            onPress={item.onPress}
            icon={item.icon}
          />
        ))}
      </>
    );
  },
);
