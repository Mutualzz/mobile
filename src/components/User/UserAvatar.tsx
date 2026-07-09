import { Paper } from "@components/Paper";
import { StatusBadge } from "@components/StatusBadge";
import { UserIcon } from "phosphor-react-native";
import { Sizes } from "@mutualzz/types";
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

interface UserAvatarProps extends AvatarProps {
  user?: AccountStore | User | null;
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

    const version = useMemo(() => {
      if (!user) return theme.type === "light" ? "dark" : "light";

      return user.defaultAvatar.color
        ? createColor(user.defaultAvatar.color as ColorLike).isLight()
          ? "dark"
          : "light"
        : theme.type === "light"
          ? "dark"
          : "light";
    }, [theme.type, user]);

    const size = resolveSize(theme, props.size || "md", baseSizeMap) as Sizes;
    const status = user ? app.presence.get(user.id)?.status : null;

    const hasAvatar = useMemo(() => user && user.avatar != null, [user]);

    const avatarBody = !user ? (
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
        src={user.constructAvatarUrl(true, version, size)}
        {...props}
        size={size}
      />
    ) : (
      <Paper
        variant={user.defaultAvatar.color ? "solid" : "elevation"}
        elevation={5}
        transparency={0}
        style={{
          width: size,
          height: size,
          flexDirection: "column",
          borderRadius: 9999,
        }}
        color={(user.defaultAvatar.color as Hex) || "neutral"}
      >
        <MAvatar
          src={user.constructAvatarUrl(false, version, size)}
          {...props}
          size={size}
        />
      </Paper>
    );

    const avatarContent = (
      <Box
        style={
          speaking
            ? {
                borderRadius: 9999,
                padding: 2,
                borderWidth: 2,
                borderColor: theme.colors.success,
              }
            : undefined
        }
      >
        {avatarBody}
      </Box>
    );

    if (!badge || !status) return avatarContent;

    return (
      <Box style={{ position: "relative", width: size, height: size }}>
        {avatarContent}
        <StatusBadge
          status={status}
          size={size}
          showInvisible={showInvisible}
        />
      </Box>
    );
  },
);
