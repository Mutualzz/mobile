import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { ReorderableVerticalList } from "@components/Reorder/ReorderableVerticalList";
import { RoleHierarchyLock } from "@components/SpaceSettings/RoleHierarchyLock";
import {
  getHierarchyContext,
  isRoleHierarchyLocked,
  reorderRoleInHierarchy,
  splitRolesByHierarchy,
} from "@components/SpaceSettings/roleHierarchy.utils";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Input, Stack, Typography } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import type { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { ArrowRightIcon, TrashIcon } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";

interface Props {
  space: Space;
}

const RoleRow = observer(
  ({
    role,
    space,
    hierarchyLocked,
    showDelete,
  }: {
    role: Role;
    space: Space;
    hierarchyLocked: boolean;
    showDelete: boolean;
  }) => {
    const { navigate } = useAppNavigation();
    const roleColorSize = useScaledSquareSize(14);
    const memberCount = role.members?.length ?? 0;
    const isEveryone = role.id === space.id;

    const openRole = () => {
      navigate(`/(tabs)/spaces/${space.id}/settings/roles/${role.id}`);
    };

    return (
      <Paper
        variant="plain"
        style={{
          padding: 12,
          borderRadius: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
        }}
      >
        <Pressable
          onPress={openRole}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          {hierarchyLocked ? <RoleHierarchyLock /> : null}
          <Box
            style={{
              width: roleColorSize,
              height: roleColorSize,
              borderRadius: roleColorSize / 2,
              backgroundColor: role.color,
              flexShrink: 0,
            }}
          />
          <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography level="body-sm" weight={700} truncate="single">
              {role.name}
              {isEveryone ? " (@everyone)" : ""}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </Typography>
          </Box>
          <ArrowRightIcon size={18} weight="bold" />
        </Pressable>
        {showDelete && (
          <IconButton
            padding={6}
            size={16}
            color="danger"
            variant="soft"
            onPress={() => void role.delete()}
            accessibilityLabel={`Delete ${role.name}`}
          >
            <TrashIcon weight="fill" />
          </IconButton>
        )}
      </Paper>
    );
  },
);

export const SpaceRolesSettings = observer(({ space }: Props) => {
  const app = useAppStore();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { navigate } = useAppNavigation();

  const hierarchyContext = getHierarchyContext(space, space.members.me);
  const isSearching = search.trim().length > 0;

  const roles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = space.roles.sorted;
    if (!query) return list;
    return list.filter((role) => role.name.toLowerCase().includes(query));
  }, [space.roles.sorted, search]);

  const displayRoles = useMemo(() => roles.slice().reverse(), [roles]);

  const { fixedRoles, reorderableRoles } = useMemo(() => {
    if (!hierarchyContext.canReorder || isSearching) {
      return { fixedRoles: [] as Role[], reorderableRoles: [] as Role[] };
    }

    const all = space.roles.byHierarchy.filter((role) => role.id !== space.id);
    return splitRolesByHierarchy(all, hierarchyContext);
  }, [hierarchyContext, isSearching, space.id, space.roles.byHierarchy]);

  const everyone = space.roles.everyone;

  const createRole = async () => {
    setCreating(true);
    try {
      const created = await space.roles.create();
      if (!created) return;
      const role = space.roles.add(created);
      navigate(`/(tabs)/spaces/${space.id}/settings/roles/${role.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleReorderRoles = (fromIndex: number, toIndex: number) => {
    void reorderRoleInHierarchy(space, fromIndex, toIndex);
  };

  if (!app.account) return null;

  const renderRoleRow = (role: Role, showDelete: boolean) => (
    <RoleRow
      role={role}
      space={space}
      hierarchyLocked={isRoleHierarchyLocked(hierarchyContext, role)}
      showDelete={showDelete}
    />
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
    >
      <Box style={{ gap: 12 }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search roles..."
        />
        <Button
          style={{ alignSelf: "flex-start" }}
          disabled={creating}
          onPress={() => void createRole()}
        >
          {creating ? "Creating..." : "Create role"}
        </Button>
      </Box>

      {isSearching || !hierarchyContext.canReorder ? (
        <Stack style={{ gap: 8 }}>
          {displayRoles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              space={space}
              hierarchyLocked={isRoleHierarchyLocked(hierarchyContext, role)}
              showDelete={role.id !== space.id}
            />
          ))}
        </Stack>
      ) : (
        <Stack style={{ gap: 8 }}>
          {fixedRoles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              space={space}
              hierarchyLocked
              showDelete={false}
            />
          ))}

          {reorderableRoles.length > 0 && (
            <ReorderableVerticalList
              items={reorderableRoles}
              onReorder={handleReorderRoles}
              enabled={reorderableRoles.length > 1}
              dragTarget="handle"
              rowGap={8}
              estimatedRowHeight={64}
              renderItem={(role) =>
                renderRoleRow(
                  role,
                  !isRoleHierarchyLocked(hierarchyContext, role),
                )
              }
            />
          )}

          {everyone && (
            <RoleRow
              role={everyone}
              space={space}
              hierarchyLocked={false}
              showDelete={false}
            />
          )}
        </Stack>
      )}
    </ScrollView>
  );
});
