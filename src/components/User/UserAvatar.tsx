import { Paper } from "@components/Paper";
import { StatusBadge } from "@components/StatusBadge";
import { UserIcon } from "phosphor-react-native";
import { type APIUser, Sizes } from "@mutualzz/types";
import {
  createColor,
  resolveSize,
  type ColorLike,
  type Hex,
  type Size,
} from "@mutualzz/ui-core";
import {
  Avatar as MAvatar,
  Box,
  useTheme,
  type AvatarProps,
} from "@mutualzz/ui-native";
import { useAppStore } from "@hooks/useStores";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

type UserLike = AccountStore | User | APIUser;

function isStoreUser(user: UserLike): user is AccountStore | User {
  return "constructAvatarUrl" in user && typeof user.constructAvatarUrl === "function";
}

interface UserAvatarProps extends AvatarProps {
  user?: UserLike | null;
  badge?: boolean;
  showInvisible?: boolean;
  speaking?: boolean;
}

const baseSizeMap: Record<Size, number> = {
  sm: 28,
  md: 36,
  lg: 48,
};

export const UserAvatar = observer(
  ({ user, badge = false, showInvisible, speaking = false, ...props }: UserAvatarProps) => {
    const app = useAppStore();
    const { theme } = useTheme();

    const resolvedUser = user
      ? isStoreUser(user)
        ? user
        : app.users.add(user)
      : null;

    const version = useMemo(() => {
      if (!resolvedUser) return theme.type === "light" ? "dark" : "light";

      return resolvedUser.defaultAvatar.color
        ? createColor(resolvedUser.defaultAvatar.color as ColorLike).isLight()
          ? "dark"
          : "light"
        : theme.type === "light"
          ? "dark"
          : "light";
    }, [theme.type, resolvedUser]);

    const size = resolveSize(theme, props.size || "md", baseSizeMap) as Sizes;
    const status = resolvedUser
      ? app.presence.get(resolvedUser.id)?.status
      : null;

    const hasAvatar = useMemo(
      () => resolvedUser && resolvedUser.avatar != null,
      [resolvedUser]
    );

    const avatarBody = !resolvedUser ? (
      <MAvatar
        elevation={5}
        shape="circle"
        variant="elevation"
        {...props}
        size={size}
      >
        <UserIcon />
      </MAvatar>
    ) : hasAvatar ? (
      <MAvatar
        src={resolvedUser.constructAvatarUrl(true, version, size)}
        {...props}
        size={size}
      />
    ) : (
      <Paper
        variant={resolvedUser.defaultAvatar.color ? "solid" : "elevation"}
        elevation={5}
        transparency={0}
        style={{
          width: size,
          height: size,
          flexDirection: "column",
          borderRadius: 9999,
        }}
        color={(resolvedUser.defaultAvatar.color as Hex) || "neutral"}
      >
        <MAvatar
          src={resolvedUser.constructAvatarUrl(false, version, size)}
          {...props}
          size={size}
        />
      </Paper>
    );

    const showBadge = badge && !!status;

    if (!showBadge && !speaking) return avatarBody;

    return (
      <Box style={{ position: "relative", width: size, height: size }}>
        {avatarBody}
        {speaking ? (
          <Box
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -2,
              left: -2,
              width: size + 4,
              height: size + 4,
              borderRadius: 9999,
              borderWidth: 2,
              borderColor: theme.colors.success,
            }}
          />
        ) : null}
        {showBadge ? (
          <StatusBadge
            status={status}
            size={size}
            showInvisible={showInvisible}
          />
        ) : null}
      </Box>
    );
  },
);
