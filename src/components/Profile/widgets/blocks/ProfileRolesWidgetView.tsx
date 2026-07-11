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
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const VISIBLE_COUNT: Record<ProfileBlockSize, number> = { s: 3, m: 6, l: 10 };

const RoleChip = ({ name, color }: { name: string; color?: string | null }) => (
  <View
    style={{
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: color || "rgba(255,255,255,0.14)",
    }}
  >
    <Typography
      level="body-xs"
      weight="bold"
      style={{ color: color || undefined }}
    >
      {name}
    </Typography>
  </View>
);

interface Props {
  block: MobileProfileRolesBlock;
  size: ProfileBlockSize;
  userId: Snowflake;
}

export const ProfileRolesWidgetView = observer(
  ({ block, size, userId }: Props) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const member = findMemberForUser(app, userId);
    const roles = getMemberRoles(member, block.maxRoles ?? 6);
    const visible = roles.slice(0, VISIBLE_COUNT[size]);
    const isCompact = size === "s";

    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          padding: isCompact ? 10 : 12,
          gap: isCompact ? 6 : 8,
        }}
      >
        <Stack direction="row" alignItems="center" style={{ gap: 6 }}>
          <ShieldCheckIcon size={isCompact ? 14 : 16} weight="fill" />
          <Typography level={isCompact ? "body-xs" : "body-sm"} weight="bold">
            {t("profile.blocks.roles")}
          </Typography>
        </Stack>

        {visible.length === 0 ? (
          <Typography level="body-sm" textColor="muted">
            {member
              ? t("profile.blocks.noRolesToShow")
              : t("profile.blocks.rolesNeedSharedSpace")}
          </Typography>
        ) : (
          <>
            <Stack direction="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {visible.map((role) => (
                <RoleChip key={role.id} name={role.name} color={role.color} />
              ))}
            </Stack>
            {roles.length > visible.length && (
              <Typography level="body-xs" textColor="muted">
                {t("profile.blocks.moreCount", {
                  value: roles.length - visible.length,
                })}
              </Typography>
            )}
          </>
        )}
      </View>
    );
  },
);

export const ProfileRolesWidgetExpandedContent = observer(
  ({
    block,
    userId,
  }: {
    block: MobileProfileRolesBlock;
    userId: Snowflake;
  }) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const member = findMemberForUser(app, userId);
    const roles = getMemberRoles(member, block.maxRoles ?? 6);

    if (roles.length === 0) {
      return (
        <Typography level="body-sm" textColor="muted">
          {member
            ? t("profile.blocks.noRolesToShow")
            : t("profile.blocks.rolesNeedSharedSpace")}
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
