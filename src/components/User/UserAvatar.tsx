import { Paper } from "@components/Paper";
import { StatusBadge } from "@components/StatusBadge";
import { UserIcon } from "phosphor-react-native";
import { type APIUser, type Sizes } from "@mutualzz/types";
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
  return (
    "constructAvatarUrl" in user &&
    typeof user.constructAvatarUrl === "function"
  );
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

const DEFAULT_AVATAR_ELEVATION = 5;

export const UserAvatar = observer(
  ({
    user,
    badge = false,
    showInvisible,
    speaking = false,
    ...props
  }: UserAvatarProps) => {
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

    const hasAvatar = Boolean(resolvedUser?.avatar);

    const avatarBody = !resolvedUser ? (
      <MAvatar
        elevation={DEFAULT_AVATAR_ELEVATION}
        shape="circle"
        variant="elevation"
        {...props}
        size={size}
      >
        <UserIcon />
      </MAvatar>
    ) : (
      <Paper
        // Always elevate default avatars so the paper disc shows everywhere,
        // independent of the global preferEmbossed setting.
        variant={
          hasAvatar
            ? "plain"
            : resolvedUser.defaultAvatar.color
              ? "solid"
              : "elevation"
        }
        elevation={hasAvatar ? 0 : DEFAULT_AVATAR_ELEVATION}
        transparency={0}
        style={{
          width: size,
          height: size,
          flexDirection: "column",
          borderRadius: 9999,
          overflow: "visible",
        }}
        color={
          hasAvatar
            ? undefined
            : ((resolvedUser.defaultAvatar.color as Hex) || "neutral")
        }
      >
        <MAvatar
          src={resolvedUser.constructAvatarUrl(
            hasAvatar,
            version,
            size,
          )}
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
        {speaking && (
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
        )}
        {showBadge && (
          <StatusBadge
            status={status}
            size={size}
            showInvisible={showInvisible}
          />
        )}
      </Box>
    );
  },
);
