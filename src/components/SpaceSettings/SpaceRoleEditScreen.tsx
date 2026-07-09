import { Button } from "@components/Button";
import { SpaceRoleEditDisplay } from "@components/SpaceSettings/SpaceRoleEditDisplay";
import { SpaceRoleEditManageMembers } from "@components/SpaceSettings/SpaceRoleEditManageMembers";
import type { RoleEditable } from "@components/SpaceSettings/SpaceRoleEditDisplay";
import { SpaceRoleEditPermissions } from "@components/SpaceSettings/SpaceRoleEditPermissions";
import { RoleHierarchyAssignLock } from "@components/SpaceSettings/RoleHierarchyLock";
import {
  canAssignRole,
  getHierarchyContext,
} from "@components/SpaceSettings/roleHierarchy.utils";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIRole } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import { normalizeJSON } from "@utils/JSON";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";

type RoleTab = "display" | "permissions" | "members";

interface Props {
  space: Space;
  role: Role;
}

const pickEditable = (role: Role): RoleEditable => {
  const json = role.toJSON();
  return {
    name: json.name,
    color: json.color ?? "#ffffff",
    position: json.position,
    allow: json.allow ?? 0n,
    hoist: json.hoist,
    mentionable: json.mentionable,
  };
};

export const SpaceRoleEditScreen = observer(({ space, role }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { back } = useAppNavigation();
  const isEveryone = role.id === space.id;
  const [tab, setTab] = useState<RoleTab>(
    isEveryone ? "permissions" : "display",
  );
  const [base, setBase] = useState<RoleEditable>(() => pickEditable(role));
  const [changes, setChanges] = useState<RoleEditable>(() =>
    pickEditable(role),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = pickEditable(role);
    setBase(next);
    setChanges(next);
    setTab(isEveryone ? "permissions" : "display");
  }, [role.id, role.updatedAt, isEveryone]);

  const dirty = useMemo(() => {
    return (
      JSON.stringify(normalizeJSON(base)) !==
      JSON.stringify(normalizeJSON(changes))
    );
  }, [base, changes]);

  const hierarchyContext = getHierarchyContext(space, space.members.me);
  const canEditRole = isEveryone
    ? hierarchyContext.canManageRoles
    : canAssignRole(hierarchyContext, role);

  const saveRole = async () => {
    if (!canEditRole || !dirty || saving) return;

    setSaving(true);
    setError(null);

    try {
      const patch: Partial<Omit<APIRole, "id">> = {};
      if (changes.name !== base.name) patch.name = changes.name;
      if (changes.color !== base.color) patch.color = changes.color;
      if (changes.hoist !== base.hoist) patch.hoist = changes.hoist;
      if (changes.mentionable !== base.mentionable) {
        patch.mentionable = changes.mentionable;
      }
      if (changes.allow !== base.allow) patch.allow = changes.allow;

      if (Object.keys(patch).length === 0) return;

      const updated = await app.rest.patch<APIRole>(
        `/spaces/${space.id}/roles/${role.id}`,
        patch,
      );

      if (updated) {
        space.roles.update(updated);
        const next = pickEditable(space.roles.get(role.id) ?? role);
        setBase(next);
        setChanges(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SpaceSettingsScreen title={role.name} contentStyle={{ flex: 1 }}>
      <Box
        style={{
          flexDirection: "row",
          gap: 16,
          paddingHorizontal: 16,
          paddingTop: 12,
        }}
      >
        {!isEveryone ? (
          <Pressable onPress={() => setTab("display")}>
            <Typography
              level="body-sm"
              weight={tab === "display" ? 700 : 400}
              textColor={tab === "display" ? undefined : "muted"}
            >
              Display
            </Typography>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setTab("permissions")}>
          <Typography
            level="body-sm"
            weight={tab === "permissions" ? 700 : 400}
            textColor={tab === "permissions" ? undefined : "muted"}
          >
            Permissions
          </Typography>
        </Pressable>
        {!isEveryone ? (
          <Pressable onPress={() => setTab("members")}>
            <Typography
              level="body-sm"
              weight={tab === "members" ? 700 : 400}
              textColor={tab === "members" ? undefined : "muted"}
            >
              Members
            </Typography>
          </Pressable>
        ) : null}
      </Box>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {!canEditRole ? (
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 10,
              backgroundColor: `${theme.colors.neutral}14`,
            }}
          >
            <RoleHierarchyAssignLock />
            <Typography level="body-sm" textColor="muted" style={{ flex: 1 }}>
              You can't edit this role because it's at or above your highest
              role.
            </Typography>
          </Box>
        ) : null}

        {tab === "display" && !isEveryone ? (
          <SpaceRoleEditDisplay changes={changes} setChanges={setChanges} />
        ) : null}
        {tab === "permissions" && (
          <SpaceRoleEditPermissions changes={changes} setChanges={setChanges} />
        )}
        {tab === "members" && !isEveryone ? (
          <SpaceRoleEditManageMembers role={role} />
        ) : null}

        {error ? (
          <Typography level="body-sm" color="danger" variant="plain">
            {error}
          </Typography>
        ) : null}

        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Button color="neutral" variant="soft" expand onPress={() => back()}>
            Back
          </Button>
          <Button
            expand
            disabled={!dirty || saving || !canEditRole}
            onPress={() => void saveRole()}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Box>
      </ScrollView>
    </SpaceSettingsScreen>
  );
});
