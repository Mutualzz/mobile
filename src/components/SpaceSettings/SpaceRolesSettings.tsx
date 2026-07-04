import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIRole } from "@mutualzz/types";
import { Box, Input, Stack, Typography } from "@mutualzz/ui-native";
import type { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { ArrowRightIcon, TrashIcon } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";

interface Props {
  space: Space;
}

const RoleRow = observer(({ role, space }: { role: Role; space: Space }) => {
  const { navigate } = useAppNavigation();
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
        <Box
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            backgroundColor: role.color,
            flexShrink: 0,
          }}
        />
        <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography level="body-sm" weight={700} numberOfLines={1}>
            {role.name}
            {isEveryone ? " (@everyone)" : ""}
          </Typography>
          <Typography level="body-xs" textColor="muted">
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </Typography>
        </Box>
        <ArrowRightIcon size={18} weight="bold" />
      </Pressable>
      {!isEveryone ? (
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
      ) : null}
    </Paper>
  );
});

export const SpaceRolesSettings = observer(({ space }: Props) => {
  const app = useAppStore();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { navigate } = useAppNavigation();

  const roles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = space.roles.sorted;
    if (!query) return list;
    return list.filter((role) => role.name.toLowerCase().includes(query));
  }, [space.roles.sorted, search]);

  const createRole = async () => {
    setCreating(true);
    try {
      const created = await space.roles.create();
      if (!created) return;
      const role = space.roles.add(created as APIRole);
      navigate(`/(tabs)/spaces/${space.id}/settings/roles/${role.id}`);
    } finally {
      setCreating(false);
    }
  };

  if (!app.account) return null;

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

      <Stack style={{ gap: 8, flexDirection: "column-reverse" }}>
        {roles.map((role) => (
          <RoleRow key={role.id} role={role} space={space} />
        ))}
      </Stack>
    </ScrollView>
  );
});
