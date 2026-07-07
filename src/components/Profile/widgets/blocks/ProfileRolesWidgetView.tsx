import {
  findMemberForUser,
  getMemberRoles,
} from "@components/Profile/canvas/profileBlockData.utils";
import { useAppStore } from "@hooks/useStores";
import type {
  MobileProfileRolesBlock,
  ProfileBlockSize,
  Snowflake,
} from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ShieldCheckIcon } from "phosphor-react-native";
import { View } from "react-native";

const VISIBLE_COUNT: Record<ProfileBlockSize, number> = { s: 3, m: 6, l: 10 };

const RoleChip = ({ name, color }: { name: string; color?: string | null }) => (
  <View
    style={{
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: color || "rgba(128,128,128,0.3)",
    }}
  >
    <Typography level="body-xs" weight="bold" style={{ color: color || undefined }}>
      {name}
    </Typography>
  </View>
);

interface Props {
  block: MobileProfileRolesBlock;
  size: ProfileBlockSize;
  userId: Snowflake;
}

export const ProfileRolesWidgetView = observer(({ block, size, userId }: Props) => {
  const app = useAppStore();
  const member = findMemberForUser(app, userId);
  const roles = getMemberRoles(member, block.maxRoles ?? 6);
  const visible = roles.slice(0, VISIBLE_COUNT[size]);

  return (
    <View style={{ width: "100%", height: "100%", padding: 12, gap: 8 }}>
      <Stack direction="row" alignItems="center" style={{ gap: 6 }}>
        <ShieldCheckIcon size={16} weight="fill" />
        <Typography level="body-sm" weight="bold">
          Roles
        </Typography>
      </Stack>

      {visible.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          {member ? "No roles to show" : "Join a shared space to display roles"}
        </Typography>
      ) : (
        <Stack direction="row" style={{ gap: 6, flexWrap: "wrap" }}>
          {visible.map((role) => (
            <RoleChip key={role.id} name={role.name} color={role.color} />
          ))}
        </Stack>
      )}
    </View>
  );
});

export const ProfileRolesWidgetExpandedContent = observer(
  ({ block, userId }: { block: MobileProfileRolesBlock; userId: Snowflake }) => {
    const app = useAppStore();
    const member = findMemberForUser(app, userId);
    const roles = getMemberRoles(member, block.maxRoles ?? 6);

    if (roles.length === 0) {
      return (
        <Typography level="body-sm" textColor="muted">
          {member ? "No roles to show" : "Join a shared space to display roles"}
        </Typography>
      );
    }

    return (
      <Stack direction="row" style={{ gap: 6, flexWrap: "wrap" }}>
        {roles.map((role) => (
          <RoleChip key={role.id} name={role.name} color={role.color} />
        ))}
      </Stack>
    );
  },
);
