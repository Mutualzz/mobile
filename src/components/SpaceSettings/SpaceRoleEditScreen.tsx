import { Button } from "@components/Button";
import { SpaceRoleEditDisplay } from "@components/SpaceSettings/SpaceRoleEditDisplay";
import type { RoleEditable } from "@components/SpaceSettings/SpaceRoleEditDisplay";
import { SpaceRoleEditPermissions } from "@components/SpaceSettings/SpaceRoleEditPermissions";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIRole } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import { normalizeJSON } from "@utils/JSON";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";

type RoleTab = "display" | "permissions";

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

  const saveRole = async () => {
    if (!dirty || saving) return;

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
        {tab === "display" && !isEveryone ? (
          <SpaceRoleEditDisplay changes={changes} setChanges={setChanges} />
        ) : (
          <SpaceRoleEditPermissions changes={changes} setChanges={setChanges} />
        )}

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
            disabled={!dirty || saving}
            onPress={() => void saveRole()}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Box>
      </ScrollView>
    </SpaceSettingsScreen>
  );
});
