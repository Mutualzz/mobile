import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { MemberBanSheet } from "@components/SpaceSettings/MemberBanSheet";
import { MemberKickSheet } from "@components/SpaceSettings/MemberKickSheet";
import { RoleHierarchyAssignLock } from "@components/SpaceSettings/RoleHierarchyLock";
import {
  canAssignRole,
  getHierarchyContext,
} from "@components/SpaceSettings/roleHierarchy.utils";
import { useAppStore } from "@hooks/useStores";
import type { Role } from "@stores/objects/Role";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import {
  Box,
  ButtonGroup,
  Divider,
  Modal,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, ShieldIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  member: SpaceMember;
  space: Space;
  visible: boolean;
  onClose: () => void;
}

export const MemberActionSheet = observer(
  ({ member, space, visible, onClose }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [kickOpen, setKickOpen] = useState(false);
    const [banOpen, setBanOpen] = useState(false);

    const me = space.members.me;
    const isSelf = app.account?.id === member.userId;
    const canManageRoles =
      !!me && !isSelf && me.canManageMember(member, "ManageRoles");
    const canKick =
      !!me && !isSelf && me.canManageMember(member, "KickMembers");
    const canBan = !!me && !isSelf && me.canManageMember(member, "BanMembers");

    const hierarchyContext = getHierarchyContext(space, me);
    const allRoles = space.roles.byHierarchy;

    const manageableRoles = canManageRoles
      ? allRoles.filter((role) => canAssignRole(hierarchyContext, role))
      : [];

    const lockedAssignedRoles =
      canManageRoles && member
        ? allRoles.filter(
            (role) =>
              member.roles.has(role.id) &&
              !canAssignRole(hierarchyContext, role),
          )
        : [];

    const assignedRoles = allRoles.filter((role) => member.roles.has(role.id));
    const showRoles =
      canManageRoles || assignedRoles.length > 0 || manageableRoles.length > 0;

    const { mutate: toggleRole, isPending: togglingRole } = useMutation({
      mutationKey: ["toggle-member-role", member.id],
      mutationFn: async (role: Role) => {
        if (!canManageRoles) {
          throw new Error("You don't have permission to manage this member");
        }
        if (!canAssignRole(hierarchyContext, role)) {
          throw new Error("Role hierarchy prevents modifying this role");
        }
        if (member.roles.has(role.id)) return member.removeRole(role);
        return member.addRole(role);
      },
    });

    const renderRoleRow = (role: Role, locked: boolean) => {
      const hasRole = member.roles.has(role.id);
      const interactive = canManageRoles && !locked;

      return (
        <Pressable
          key={role.id}
          disabled={!interactive || togglingRole}
          onPress={() => interactive && toggleRole(role)}
        >
          <Paper
            variant="plain"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 10,
              borderRadius: 10,
              opacity: interactive ? 1 : 0.85,
            }}
          >
            <ShieldIcon
              size={16}
              weight="fill"
              color={role.color || theme.colors.info}
            />
            <Typography level="body-sm" style={{ flex: 1 }}>
              {role.name}
            </Typography>
            {locked ? (
              <RoleHierarchyAssignLock size={14} />
            ) : interactive ? (
              <Box
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: hasRole
                    ? theme.colors.primary
                    : theme.typography.colors.muted,
                  backgroundColor: hasRole
                    ? `${theme.colors.primary}22`
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasRole ? (
                  <CheckIcon
                    size={12}
                    weight="bold"
                    color={theme.colors.primary}
                  />
                ) : null}
              </Box>
            ) : hasRole ? (
              <CheckIcon
                size={14}
                weight="bold"
                color={theme.typography.colors.muted}
              />
            ) : null}
          </Paper>
        </Pressable>
      );
    };

    return (
      <>
        <Modal
          open={visible && !kickOpen && !banOpen}
          onClose={onClose}
          layout="fullscreen"
          showCloseButton={false}
          style={{
            justifyContent: "flex-end",
            alignItems: "stretch",
            backgroundColor: "transparent",
            paddingVertical: 0,
          }}
        >
          <View
            pointerEvents="box-none"
            style={{
              flex: 1,
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <View onStartShouldSetResponder={() => true}>
              <Box
                style={{
                  marginHorizontal: 12,
                  marginBottom: insets.bottom + 12,
                }}
              >
                <Paper
                  elevation={app.settings?.preferEmbossed ? 4 : 2}
                  style={{
                    borderRadius: 16,
                    padding: 12,
                    gap: 8,
                    maxHeight: "70%",
                  }}
                >
                  <Box style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}>
                    <Typography level="body-md" weight={700}>
                      {member.displayName}
                    </Typography>
                    {member.user ? (
                      <Typography level="body-xs" textColor="muted">
                        @{member.user.username}
                      </Typography>
                    ) : null}
                  </Box>

                  <Divider lineColor="muted" />

                  <ScrollView keyboardShouldPersistTaps="handled">
                    {showRoles ? (
                      <Box style={{ gap: 8, paddingBottom: 8 }}>
                        <Typography level="body-sm" weight={700}>
                          Roles
                        </Typography>
                        {!canManageRoles && assignedRoles.length === 0 ? (
                          <Typography level="body-sm" textColor="muted">
                            No roles assigned.
                          </Typography>
                        ) : null}
                        {canManageRoles
                          ? manageableRoles.map((role) =>
                              renderRoleRow(role, false),
                            )
                          : assignedRoles.map((role) =>
                              renderRoleRow(role, true),
                            )}
                        {lockedAssignedRoles.map((role) =>
                          renderRoleRow(role, true),
                        )}
                      </Box>
                    ) : null}

                    {canKick || canBan ? (
                      <ButtonGroup
                        orientation="vertical"
                        variant="plain"
                        fullWidth
                        horizontalAlign="left"
                        spacing={0.5}
                      >
                        {canKick ? (
                          <Button
                            fullWidth
                            padding={12}
                            onPress={() => setKickOpen(true)}
                          >
                            Kick member
                          </Button>
                        ) : null}
                        {canBan ? (
                          <Button
                            fullWidth
                            padding={12}
                            color="danger"
                            onPress={() => setBanOpen(true)}
                          >
                            Ban member
                          </Button>
                        ) : null}
                      </ButtonGroup>
                    ) : null}
                  </ScrollView>
                </Paper>
              </Box>
            </View>
          </View>
        </Modal>

        {kickOpen ? (
          <MemberKickSheet
            visible
            space={space}
            member={member}
            onClose={() => {
              setKickOpen(false);
              onClose();
            }}
          />
        ) : null}

        {banOpen ? (
          <MemberBanSheet
            visible
            space={space}
            member={member}
            onClose={() => {
              setBanOpen(false);
              onClose();
            }}
          />
        ) : null}
      </>
    );
  },
);
