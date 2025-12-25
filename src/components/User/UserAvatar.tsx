import { Paper } from "@components/Paper";
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
    useTheme,
    type AvatarProps,
} from "@mutualzz/ui-native";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { FaUser } from "react-icons/fa";

interface UserAvatarProps extends AvatarProps {
    user?: AccountStore | User | null;
}

const baseSizeMap: Record<Size, number> = {
    sm: 28,
    md: 36,
    lg: 48,
};

// NOTE: add a feature later where it detects if the image has transparent background to apply elevation variant
export const UserAvatar = observer(({ user, ...props }: UserAvatarProps) => {
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

    const hasAvatar = useMemo(() => user && user.avatar != null, [user]);

    if (!user)
        return (
            <MAvatar
                elevation={5}
                shape="circle"
                variant="elevation"
                size={size}
                {...props}
            >
                <FaUser />
            </MAvatar>
        );

    if (hasAvatar)
        return (
            <MAvatar
                src={user.constructAvatarUrl(true, version, size)}
                {...props}
            />
        );

    return (
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
                size={size}
                src={user.constructAvatarUrl(false, version, size)}
                {...props}
            />
        </Paper>
    );
});
