import { Button } from "@components/Button";
import { SettingsToggleRow } from "@components/UserSettings/SettingsField";
import { filterPermissionGroups } from "@mutualzz/client";
import { spacePermissionGroups } from "@components/SpaceSettings/permissionGroups";
import type {
  RoleEditable,
  SetRoleEditable,
} from "@components/SpaceSettings/SpaceRoleEditDisplay";
import {
  BitField,
  permissionFlags,
  type PermissionFlag,
  type PermissionFlags,
} from "@mutualzz/bitfield";
import { Box, Divider, Input, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  changes: RoleEditable;
  setChanges: SetRoleEditable;
}

export const SpaceRoleEditPermissions = observer(
  ({ changes, setChanges }: Props) => {
    const { t } = useTranslation("space");
    const [search, setSearch] = useState("");

    const permissions: BitField<PermissionFlags> = changes.allow
      ? BitField.fromString(permissionFlags, changes.allow.toString())
      : BitField.fromString(permissionFlags, "0");

    const groups = useMemo(
      () =>
        spacePermissionGroups.map((group) => ({
          id: group.id,
          title: t(group.titleKey),
          items: group.items.map((item) => ({
            flag: item.flag as PermissionFlag,
            label: t(item.labelKey),
            description: t(item.descriptionKey),
          })),
        })),
      [t],
    );

    const visibleGroups = useMemo(
      () => filterPermissionGroups(groups, search),
      [groups, search],
    );

    const togglePermission = (flag: PermissionFlag) => {
      const next = permissions.has(flag)
        ? permissions.remove(flag)
        : permissions.add(flag);

      setChanges((prev) => ({
        ...prev,
        allow: next.bits,
      }));
    };

    return (
      <Box style={{ gap: 16 }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t("roles.permissions.searchPlaceholder")}
        />

        <Button
          size="sm"
          color="danger"
          variant="soft"
          style={{ alignSelf: "flex-start" }}
          disabled={permissions.toArray().length === 0}
          onPress={() =>
            setChanges((prev) => ({
              ...prev,
              allow: 0n,
            }))
          }
        >
          {t("roles.permissions.clear")}
        </Button>

        {visibleGroups.length === 0 ? (
          <Typography
            level="body-sm"
            textColor="muted"
            style={{ textAlign: "center", paddingVertical: 24 }}
          >
            {t("roles.permissions.emptySearch")}
          </Typography>
        ) : (
          visibleGroups.map((group, groupIndex) => (
            <Box key={group.id} style={{ gap: 12 }}>
              <Typography level="body-md" weight={700}>
                {group.title}
              </Typography>
              {group.items.map((item, itemIndex) => (
                <Box key={item.flag} style={{ gap: 12 }}>
                  <SettingsToggleRow
                    title={item.label}
                    description={item.description}
                    checked={permissions.has(item.flag)}
                    onChange={() => togglePermission(item.flag)}
                  />
                  {itemIndex < group.items.length - 1 && (
                    <Divider lineColor="muted" style={{ opacity: 0.25 }} />
                  )}
                </Box>
              ))}
              {groupIndex < visibleGroups.length - 1 && (
                <Divider lineColor="muted" style={{ opacity: 0.35 }} />
              )}
            </Box>
          ))
        )}
      </Box>
    );
  },
);
