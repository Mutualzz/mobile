import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { RoleHierarchyAssignLock } from "@components/SpaceSettings/RoleHierarchyLock";
import {
  canAssignRole,
  getHierarchyContext,
} from "@components/SpaceSettings/roleHierarchy.utils";
import { UserAvatar } from "@components/User/UserAvatar";
import { useSheet } from "@hooks/useSheet";
import type { Role } from "@stores/objects/Role";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import {
  useScaledSheetListMaxHeight,
  useScaledSquareSize,
} from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";
import { PlusIcon, XIcon } from "phosphor-react-native";

interface Props {
  role: Role;
}

export const SpaceRoleEditManageMembers = observer(({ role }: Props) => {
  const { t } = useTranslation("space");
  const { t: tCommon } = useTranslation("common");
  const { theme } = useTheme();
  const removeButtonSize = useScaledSquareSize(26);
  const { openSheet } = useSheet();
  const [search, setSearch] = useState("");
  const space = role.space;
  const hierarchyContext = space
    ? getHierarchyContext(space, space.members.me)
    : null;
  const canManageRole = hierarchyContext
    ? canAssignRole(hierarchyContext, role)
    : false;

  const members = useMemo(
    () =>
      (role.members ?? []).filter((member) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          member.displayName.toLowerCase().includes(q) ||
          member.user?.username.toLowerCase().includes(q)
        );
      }),
    [role.members, search],
  );

  const emptyLabel = (() => {
    if (!role.members?.length && !search.trim()) {
      return t("roles.members.emptyAssigned");
    }
    if (!members.length && search.trim()) {
      return t("roles.members.emptySearch");
    }
    return null;
  })();

  const openAddMembersSheet = () => {
    const space = role.space;
    if (!space || !canManageRole) return;

    const sheetId = `add-role-members-${role.id}`;

    const eligible = space.members.all.filter((member) => {
      if (member.roles.has(role.id)) return false;
      const me = space.members.me;
      return me?.canManageMember?.(member, "ManageRoles") ?? false;
    });

    openSheet(
      sheetId,
      <AddMembersSheet
        sheetId={sheetId}
        role={role}
        eligibleMemberIds={eligible.map((m) => m.userId)}
      />,
    );
  };

  return (
    <Box style={{ gap: 16 }}>
      <Paper
        style={{
          padding: 12,
          borderRadius: 12,
          gap: 8,
          minWidth: 0,
        }}
      >
        <Typography level="body-md" weight={700}>
          {t("roles.members.title")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("roles.members.description")}
        </Typography>
        {!canManageRole && (
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <RoleHierarchyAssignLock />
            <Typography level="body-sm" textColor="muted" style={{ flex: 1 }}>
              {t("roles.hierarchy.cantManageMembers")}
            </Typography>
          </Box>
        )}
      </Paper>

      <Box style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Box style={{ flex: 1 }}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t("roles.members.searchPlaceholder")}
            autoCapitalize="none"
          />
        </Box>
        {canManageRole ? (
          <Button
            size="sm"
            startDecorator={<PlusIcon size={18} weight="bold" />}
            onPress={openAddMembersSheet}
          >
            {t("roles.members.addTitle")}
          </Button>
        ) : null}
      </Box>

      {emptyLabel ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 24 }}
        >
          {emptyLabel}
        </Typography>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(member) => member.id}
          ItemSeparatorComponent={() => <Box style={{ height: 8 }} />}
          renderItem={({ item: member }) => {
            const canRemove =
              canManageRole &&
              (member.space?.members.me?.canManageMember?.(
                member,
                "ManageRoles",
              ) ??
                false);

            return (
              <Paper
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <UserAvatar user={member.user ?? null} size={32} />
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Typography truncate="single">
                      {member.displayName}
                    </Typography>
                    <Typography level="body-xs" textColor="muted">
                      @{member.user?.username}
                    </Typography>
                  </Box>
                </Box>

                {canRemove && (
                  <Pressable
                    onPress={() => void member.removeRole(role)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon("a11y.removeMemberFromRole", {
                      member: member.displayName,
                      role: role.name,
                    })}
                  >
                    <Box
                      style={{
                        width: removeButtonSize,
                        height: removeButtonSize,
                        borderRadius: removeButtonSize / 2,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${theme.colors.neutral}22`,
                      }}
                    >
                      <XIcon size={16} weight="bold" />
                    </Box>
                  </Pressable>
                )}
              </Paper>
            );
          }}
        />
      )}
    </Box>
  );
});

interface AddMembersSheetProps {
  sheetId: string;
  role: Role;
  eligibleMemberIds: string[];
}

const AddMembersSheet = observer(
  ({ sheetId, role, eligibleMemberIds }: AddMembersSheetProps) => {
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const { t: tChat } = useTranslation("chat");
    const { closeSheet } = useSheet();
    const listMaxHeight = useScaledSheetListMaxHeight();
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const space = role.space;
    const members = useMemo(() => {
      if (!space) return [];
      const all = eligibleMemberIds
        .map((id) => space.members.get(id))
        .filter(Boolean);

      if (!search.trim()) return all;
      const q = search.trim().toLowerCase();
      return all.filter(
        (member) =>
          member!.displayName.toLowerCase().includes(q) ||
          member!.user?.username.toLowerCase().includes(q),
      );
    }, [eligibleMemberIds, search, space]);

    const toggle = (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
      );
    };

    const addMembers = async () => {
      if (!selectedIds.length || saving) return;
      setSaving(true);
      setError(null);
      try {
        await role.addMembers(selectedIds);
        closeSheet(sheetId);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : t("roles.members.addFailed"),
        );
      } finally {
        setSaving(false);
      }
    };

    return (
      <Box
        style={{
          padding: 16,
          gap: 12,
          maxHeight: "90%",
        }}
      >
        <Typography level="body-md" weight={700}>
          {t("roles.members.addTitle")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("roles.members.addDescription", {
            max: 30,
            roleName: role.name,
          })}
        </Typography>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t("roles.members.searchPlaceholder")}
          autoCapitalize="none"
        />

        {members.length === 0 ? (
          <Typography
            level="body-sm"
            textColor="muted"
            style={{ paddingVertical: 16 }}
          >
            {eligibleMemberIds.length === 0
              ? t("roles.members.noEligible")
              : t("roles.members.emptySearch")}
          </Typography>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(member) => member!.id}
            style={{ maxHeight: listMaxHeight }}
            ItemSeparatorComponent={() => <Box style={{ height: 8 }} />}
            renderItem={({ item: member }) => {
              const isSelected = selectedIds.includes(member!.id);
              return (
                <Pressable
                  onPress={() => toggle(member!.id)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={member!.displayName}
                  accessibilityState={{ checked: isSelected }}
                >
                  <Paper
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 10,
                      borderRadius: 10,
                      opacity: isSelected ? 1 : 0.95,
                    }}
                  >
                    <UserAvatar user={member!.user ?? null} size={32} />
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Typography truncate="single">
                        {member!.displayName}
                      </Typography>
                      <Typography level="body-xs" textColor="muted">
                        @{member!.user?.username}
                      </Typography>
                    </Box>
                    <Typography color="primary">
                      {isSelected ? tChat("dm.selected") : ""}
                    </Typography>
                  </Paper>
                </Pressable>
              );
            }}
          />
        )}

        {error && (
          <Typography
            level="body-sm"
            color="danger"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Typography>
        )}

        <Box
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 8,
          }}
        >
          <Button
            expand
            disabled={!selectedIds.length || saving}
            onPress={() => void addMembers()}
          >
            {selectedIds.length
              ? t("actions.addMembersCount", { count: selectedIds.length })
              : tCommon("add")}
          </Button>
        </Box>
      </Box>
    );
  },
);
