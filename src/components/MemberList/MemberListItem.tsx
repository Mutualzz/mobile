import { MemberActionSheet } from "@components/MemberList/MemberActionSheet";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useUserRowStyle } from "@components/userRowStyle";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { CrownSimpleIcon } from "phosphor-react-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

interface Props {
  member: SpaceMember;
  space?: Space | null;
  isOwner?: boolean;
}

export const MemberListItem = observer(({ member, space, isOwner }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const rowStyle = useUserRowStyle();
  const user = member.user;
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const nameColor =
    member.highestRole?.color ?? theme.typography.colors.muted;

  if (!user) return null;

  const me = space?.members.me;
  const isSelf = app.account?.id === user.id;
  const canKick =
    !!space &&
    !!me &&
    !isSelf &&
    me.canManageMember(member, "KickMembers");
  const canBan =
    !!space &&
    !!me &&
    !isSelf &&
    me.canManageMember(member, "BanMembers");
  const canManageRoles =
    !!space &&
    !!me &&
    !isSelf &&
    me.canManageMember(member, "ManageRoles");
  const hasAssignedRoles = member.roles.size > 0;
  const canOpenActions =
    !!space && (canKick || canBan || canManageRoles || hasAssignedRoles);

  return (
    <>
      <UserProfileTrigger user={user} member={member}>
        <Pressable
          onLongPress={
            canOpenActions ? () => setActionSheetOpen(true) : undefined
          }
        >
          <Paper variant="plain" style={rowStyle}>
            <UserAvatar user={user} size="md" badge />
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
                truncate="single"
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
        </Pressable>
      </UserProfileTrigger>

      {space && canOpenActions ? (
        <MemberActionSheet
          member={member}
          space={space}
          visible={actionSheetOpen}
          onClose={() => setActionSheetOpen(false)}
        />
      ) : null}
    </>
  );
});
