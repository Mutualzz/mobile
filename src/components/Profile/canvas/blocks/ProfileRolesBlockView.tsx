import {
  findMemberForUser,
  getMemberRoles,
} from "@components/Profile/canvas/profileBlockData.utils";
import { useAppStore } from "@hooks/useStores";
import type { ProfileRolesBlock, Snowflake } from "@mutualzz/types";
import { Paper, Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ShieldCheckIcon } from "phosphor-react-native";
import { View } from "react-native";

interface Props {
  block: ProfileRolesBlock;
  userId: Snowflake;
}

export const ProfileRolesBlockView = observer(({ block, userId }: Props) => {
  const app = useAppStore();
  const member = findMemberForUser(app, userId);
  const roles = getMemberRoles(member, block.maxRoles ?? 6);

  return (
    <Paper
      elevation={1}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        padding: 14,
        gap: 10,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <ShieldCheckIcon size={18} weight="fill" />
        <Typography level="body-sm" weight="bold">
          Roles
        </Typography>
      </Stack>

      {roles.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          {member ? "No roles to show" : "Join a shared space to display roles"}
        </Typography>
      ) : (
        <Stack direction="row" spacing={0.75} style={{ flexWrap: "wrap" }}>
          {roles.map((role) => (
            <View
              key={role.id}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: role.color || "rgba(128,128,128,0.3)",
              }}
            >
              <Typography
                level="body-xs"
                weight="bold"
                style={{ color: role.color || undefined }}
              >
                {role.name}
              </Typography>
            </View>
          ))}
        </Stack>
      )}
    </Paper>
  );
});
