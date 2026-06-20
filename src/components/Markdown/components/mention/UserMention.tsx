import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { Snowflake } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

interface Props {
    userId: Snowflake;
    spaceId?: Snowflake | null;
}

export const UserMention = observer(({ userId, spaceId }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();

    const space = spaceId
        ? app.spaces.get(spaceId)
        : (app.spaces.active ?? null);
    const user = app.users.get(userId);
    const member = space?.members.get(userId);

    if (!user) {
        return (
            <Typography level="body-sm" textColor="muted">
                @{userId}
            </Typography>
        );
    }

    return (
        <Box
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${theme.colors.info}22`,
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 1,
            }}
        >
            <UserAvatar user={user} size="sm" style={{ width: 16, height: 16 }} />
            <Typography
                level="body-sm"
                style={{ color: theme.colors.info }}
            >
                @{member?.displayName || user.displayName}
            </Typography>
        </Box>
    );
});
