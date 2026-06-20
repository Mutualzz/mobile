import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { CrownSimpleIcon } from "phosphor-react-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import { observer } from "mobx-react-lite";

interface Props {
    member: SpaceMember;
    isOwner?: boolean;
}

export const MemberListItem = observer(({ member, isOwner }: Props) => {
    const { theme } = useTheme();
    const user = member.user;
    const nameColor =
        member.highestRole?.color ?? theme.typography.colors.muted;

    if (!user) return null;

    return (
        <UserProfileTrigger user={user} member={member}>
            <Paper
                variant="plain"
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                }}
            >
                <UserAvatar user={user} size="md" />
                <Box
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 0,
                    }}
                >
                    <Typography
                        level="body-sm"
                        numberOfLines={1}
                        style={{ flex: 1, color: nameColor }}
                    >
                        {member.displayName}
                    </Typography>
                    {isOwner && (
                        <CrownSimpleIcon
                            size={14}
                            color={theme.colors.warning}
                            weight="fill"
                        />
                    )}
                </Box>
            </Paper>
        </UserProfileTrigger>
    );
});
