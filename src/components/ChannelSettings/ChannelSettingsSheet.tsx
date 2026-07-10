import { ChannelInvitesSection } from "@components/ChannelSettings/ChannelInvitesSection";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SPACE_PERMISSION_GROUPS } from "@components/SpaceSettings/permissionGroups";
import { useAppStore } from "@hooks/useStores";
import {
  BitField,
  permissionFlags,
  type PermissionFlag,
} from "@mutualzz/bitfield";
import { ChannelType, type APIChannel } from "@mutualzz/types";
import {
  Box,
  InputDefault,
  Modal,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import {
  useScaledFeedPreviewSizes,
  useScaledSquareSize,
} from "@utils/accessibilityLayout";
import type { ChannelPermissionOverwrite } from "@stores/objects/ChannelPermissionOverwrite";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  CheckIcon,
  MinusIcon,
  PlusIcon,
  ShieldIcon,
  UserIcon,
  XIcon,
} from "phosphor-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

type OverwriteState = "allow" | "deny" | "neutral";

interface OverwriteDraft {
  allow: bigint;
  deny: bigint;
}

interface TargetEntry {
  key: string;
  id: string;
  kind: "role" | "member";
  label: string;
  color?: string;
}

function overwriteKey(ow: ChannelPermissionOverwrite): string {
  if (ow.roleId) return `r:${ow.roleId}`;
  if (ow.userId) return `u:${ow.userId}`;
  return "x";
}

function makeKey(id: string, kind: "role" | "member") {
  return kind === "role" ? `r:${id}` : `u:${id}`;
}

function parseKey(key: string): { id: string; kind: "role" | "member" } {
  const [prefix, id] = key.split(":");
  return { id, kind: prefix === "r" ? "role" : "member" };
}

function draftsEqual(a: OverwriteDraft, b: OverwriteDraft) {
  return a.allow === b.allow && a.deny === b.deny;
}

function getOverwriteState(
  draft: OverwriteDraft,
  flag: PermissionFlag,
): OverwriteState {
  const allow = BitField.fromString(permissionFlags, draft.allow.toString());
  const deny = BitField.fromString(permissionFlags, draft.deny.toString());
  if (allow.has(flag)) return "allow";
  if (deny.has(flag)) return "deny";
  return "neutral";
}

function applyOverwriteState(
  draft: OverwriteDraft,
  flag: PermissionFlag,
  next: OverwriteState,
): OverwriteDraft {
  let allow = BitField.fromString(permissionFlags, draft.allow.toString());
  let deny = BitField.fromString(permissionFlags, draft.deny.toString());
  allow = allow.remove(flag);
  deny = deny.remove(flag);
  if (next === "allow") allow = allow.add(flag);
  if (next === "deny") deny = deny.add(flag);
  return { allow: allow.bits, deny: deny.bits };
}

function getChannelPermissionGroups(type: ChannelType) {
  return SPACE_PERMISSION_GROUPS.filter((group) => {
    if (group.title === "Advanced Permissions") return false;
    if (group.title === "General Space Permissions") {
      return (
        group.items.filter((item) =>
          ["ViewChannel", "ManageChannels", "ManageRoles"].includes(item.flag),
        ).length > 0
      );
    }
    if (group.title === "Membership Permissions") return false;
    if (group.title === "Text Channel Permissions") {
      return type === ChannelType.Text || type === ChannelType.Category;
    }
    if (group.title === "Voice Channel Permissions") {
      return type === ChannelType.Voice || type === ChannelType.Category;
    }
    return false;
  }).map((group) => {
    if (group.title !== "General Space Permissions") return group;
    return {
      ...group,
      title: "General Channel Permissions",
      items: group.items.filter((item) =>
        ["ViewChannel", "ManageChannels", "ManageRoles"].includes(item.flag),
      ),
    };
  });
}

export const ChannelSettingsSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const feedSizes = useScaledFeedPreviewSizes();
    const dirtyIndicatorSize = useScaledSquareSize(6);
    const permissionToggleSize = useScaledSquareSize(28);
    const [name, setName] = useState(channel.name);
    const [topic, setTopic] = useState(channel.topic ?? "");
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [overwritePickerOpen, setOverwritePickerOpen] = useState(false);
    const [overwriteSearch, setOverwriteSearch] = useState("");

    const space = channel.space;
    const me = space?.members.me;
    const canManagePermissions = !!me?.hasPermission("ManageRoles", channel);

    const buildDrafts = () => {
      const map = new Map<string, OverwriteDraft>();
      for (const ow of channel.overwrites) {
        map.set(overwriteKey(ow), {
          allow: ow.allow.bits,
          deny: ow.deny.bits,
        });
      }
      return map;
    };

    const [drafts, setDrafts] =
      useState<Map<string, OverwriteDraft>>(buildDrafts);
    const [bases, setBases] =
      useState<Map<string, OverwriteDraft>>(buildDrafts);
    const [selectedKey, setSelectedKey] = useState<string | null>(() => {
      const first = channel.overwrites[0];
      return first ? overwriteKey(first) : null;
    });

    useEffect(() => {
      const nextDrafts = buildDrafts();
      setDrafts(nextDrafts);
      setBases(nextDrafts);
      const first = channel.overwrites[0];
      setSelectedKey(first ? overwriteKey(first) : null);
    }, [channel.id, channel.updatedAt, channel.overwrites.length]);

    const dirtyKeys = useMemo(() => {
      const set = new Set<string>();
      for (const [key, draft] of drafts.entries()) {
        const base = bases.get(key);
        if (!base || !draftsEqual(draft, base)) set.add(key);
      }
      return set;
    }, [bases, drafts]);

    const targetEntries: TargetEntry[] = [...drafts.keys()].map((key) => {
      const { id, kind } = parseKey(key);
      if (kind === "role") {
        const role = space?.roles.get(id);
        return {
          key,
          id,
          kind,
          label: role?.name ?? id,
          color: role?.color,
        };
      }
      const member = space?.members.get(id);
      return {
        key,
        id,
        kind,
        label: member?.displayName ?? id,
      };
    });

    const selectedDraft = selectedKey ? drafts.get(selectedKey) : null;
    const selectedEntry = selectedKey
      ? targetEntries.find((entry) => entry.key === selectedKey)
      : null;
    const permissionGroups = getChannelPermissionGroups(channel.type);
    const filteredPermissionGroups = permissionGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const q = overwriteSearch.trim().toLowerCase();
          if (!q) return true;
          return (
            item.label.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((group) => group.items.length > 0);

    const existingKeys = new Set(drafts.keys());
    const addableRoles =
      space?.roles.assignable.filter(
        (role) => !existingKeys.has(`r:${role.id}`),
      ) ?? [];
    const addableMembers =
      space?.members.all.filter(
        (member) => !existingKeys.has(`u:${member.id}`),
      ) ?? [];

    const filteredRoles = addableRoles.filter((role) => {
      const q = overwriteSearch.trim().toLowerCase();
      if (!q) return true;
      return role.name.toLowerCase().includes(q);
    });
    const filteredMembers = addableMembers.filter((member) => {
      const q = overwriteSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        member.displayName.toLowerCase().includes(q) ||
        member.user?.username.toLowerCase().includes(q)
      );
    });

    const { mutate: save, isPending } = useMutation({
      mutationKey: ["channel-settings", channel.id],
      mutationFn: () =>
        app.rest.patch<APIChannel>(`/channels/${channel.id}`, {
          name: name?.trim(),
          topic,
        }),
      onSuccess: (data) => {
        space?.updateChannel(data);
        onClose();
      },
    });

    const { mutate: deleteChannel, isPending: deleting } = useMutation({
      mutationKey: ["delete-channel", channel.id],
      mutationFn: () => channel.delete(false),
      onSuccess: onClose,
    });

    const { mutate: saveOverwrite, isPending: savingOverwrite } = useMutation({
      mutationKey: ["save-channel-overwrite", channel.id, selectedKey],
      mutationFn: async () => {
        if (!selectedKey) return null;
        const draft = drafts.get(selectedKey);
        if (!draft) return null;
        const { id, kind } = parseKey(selectedKey);
        return app.rest.put<APIChannel>(
          `/channels/${channel.id}/permissions/${id}?type=${kind}`,
          {
            allow: draft.allow.toString(),
            deny: draft.deny.toString(),
          },
        );
      },
      onSuccess: (data) => {
        if (!data || !selectedKey) return;
        space?.updateChannel(data);
        const draft = drafts.get(selectedKey);
        if (!draft) return;
        setBases((prev) => {
          const next = new Map(prev);
          next.set(selectedKey, { ...draft });
          return next;
        });
        space?.members.me?.invalidateChannelPermCache?.();
      },
    });

    const { mutate: deleteOverwrite, isPending: deletingOverwrite } =
      useMutation({
        mutationKey: ["delete-channel-overwrite", channel.id],
        mutationFn: async (key: string) => {
          if (!bases.has(key)) return null;
          const { id, kind } = parseKey(key);
          return app.rest.delete<APIChannel>(
            `/channels/${channel.id}/permissions/${id}?type=${kind}`,
          );
        },
        onSuccess: (data, key) => {
          if (data) space?.updateChannel(data);
          setDrafts((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          setBases((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          setSelectedKey((prev) => {
            if (prev !== key) return prev;
            const remaining = targetEntries.filter(
              (entry) => entry.key !== key,
            );
            return remaining[0]?.key ?? null;
          });
          space?.members.me?.invalidateChannelPermCache?.();
        },
      });

    const updateDraft = (key: string, next: OverwriteDraft) => {
      setDrafts((prev) => {
        const map = new Map(prev);
        map.set(key, next);
        return map;
      });
    };

    const addOverwrite = (id: string, kind: "role" | "member") => {
      const key = makeKey(id, kind);
      setDrafts((prev) => {
        if (prev.has(key)) return prev;
        const map = new Map(prev);
        map.set(key, { allow: 0n, deny: 0n });
        return map;
      });
      setSelectedKey(key);
      setOverwritePickerOpen(false);
      setOverwriteSearch("");
    };

    const resetSelected = () => {
      if (!selectedKey) return;
      const base = bases.get(selectedKey);
      updateDraft(selectedKey, base ? { ...base } : { allow: 0n, deny: 0n });
    };

    return (
      <>
        <Modal
          open={visible}
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
            style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
          >
            <Paper
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 20,
                gap: 12,
                maxHeight: "85%",
              }}
              elevation={app.settings?.preferEmbossed ? 4 : 2}
            >
              <Typography level="body-lg" weight="bold">
                Channel Settings
              </Typography>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Box style={{ gap: 12 }}>
                  <InputDefault
                    fullWidth
                    value={name ?? ""}
                    onChangeText={setName}
                    placeholder="Channel name"
                  />
                  <MarkdownInput
                    value={topic}
                    onChange={setTopic}
                    selection={selection}
                    onChangeSelection={setSelection}
                    channelId={channel.id}
                    placeholder="Topic"
                    style={{ minHeight: feedSizes.composerMinHeight }}
                  />

                  {canManagePermissions && (
                    <Box style={{ gap: 12, paddingTop: 8 }}>
                      <Typography level="body-md" weight="bold">
                        Permission overwrites
                      </Typography>

                      <Box
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {targetEntries.map((entry) => {
                          const selected = entry.key === selectedKey;
                          const dirty = dirtyKeys.has(entry.key);
                          return (
                            <Pressable
                              key={entry.key}
                              onPress={() => setSelectedKey(entry.key)}
                              accessibilityRole="button"
                              accessibilityLabel={entry.label}
                            >
                              <Paper
                                variant={selected ? "soft" : "plain"}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                  borderRadius: 999,
                                }}
                              >
                                {entry.kind === "role" ? (
                                  <ShieldIcon
                                    size={14}
                                    weight="fill"
                                    color={entry.color || theme.colors.info}
                                  />
                                ) : (
                                  <UserIcon size={14} weight="fill" />
                                )}
                                <Typography level="body-xs">
                                  {entry.label}
                                </Typography>
                                {dirty && (
                                  <Box
                                    style={{
                                      width: dirtyIndicatorSize,
                                      height: dirtyIndicatorSize,
                                      borderRadius: dirtyIndicatorSize / 2,
                                      backgroundColor: theme.colors.warning,
                                    }}
                                  />
                                )}
                              </Paper>
                            </Pressable>
                          );
                        })}

                        <Pressable
                          onPress={() => {
                            setOverwritePickerOpen(true);
                            setOverwriteSearch("");
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Add permission overwrite"
                        >
                          <Paper
                            variant="plain"
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderRadius: 999,
                            }}
                          >
                            <PlusIcon size={14} weight="bold" />
                            <Typography level="body-xs">Add</Typography>
                          </Paper>
                        </Pressable>
                      </Box>

                      {!selectedDraft || !selectedKey ? (
                        <Typography level="body-sm" textColor="muted">
                          Select an overwrite target to edit channel-specific
                          permissions.
                        </Typography>
                      ) : (
                        <Box style={{ gap: 10 }}>
                          <Box
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <Typography level="body-sm" weight={700}>
                              {selectedEntry?.label}
                            </Typography>
                            <Button
                              size="sm"
                              color="danger"
                              variant="plain"
                              disabled={deletingOverwrite}
                              onPress={() => deleteOverwrite(selectedKey)}
                            >
                              Remove
                            </Button>
                          </Box>

                          <InputDefault
                            fullWidth
                            value={overwriteSearch}
                            onChangeText={setOverwriteSearch}
                            placeholder="Search permissions"
                          />

                          {filteredPermissionGroups.length === 0 ? (
                            <Typography level="body-sm" textColor="muted">
                              No permissions match your search.
                            </Typography>
                          ) : (
                            filteredPermissionGroups.map((group) => (
                              <Paper
                                key={group.title}
                                style={{
                                  padding: 12,
                                  borderRadius: 12,
                                  gap: 10,
                                }}
                                elevation={app.settings?.preferEmbossed ? 2 : 0}
                              >
                                <Typography level="body-sm" weight={700}>
                                  {group.title}
                                </Typography>
                                <Box style={{ gap: 8 }}>
                                  {group.items.map((item) => {
                                    const current = getOverwriteState(
                                      selectedDraft,
                                      item.flag,
                                    );

                                    const toggleState = (
                                      next: OverwriteState,
                                    ) => {
                                      updateDraft(
                                        selectedKey,
                                        applyOverwriteState(
                                          selectedDraft,
                                          item.flag,
                                          current === next ? "neutral" : next,
                                        ),
                                      );
                                    };

                                    const stateStyle = (
                                      state: OverwriteState,
                                      active: boolean,
                                    ) => {
                                      const color =
                                        state === "allow"
                                          ? theme.colors.success
                                          : state === "deny"
                                            ? theme.colors.danger
                                            : theme.typography.colors.muted;
                                      return {
                                        width: permissionToggleSize,
                                        height: permissionToggleSize,
                                        borderRadius: 8,
                                        alignItems: "center" as const,
                                        justifyContent: "center" as const,
                                        borderWidth: 2,
                                        borderColor: active
                                          ? color
                                          : `${color}55`,
                                        backgroundColor: active
                                          ? `${color}22`
                                          : "transparent",
                                      };
                                    };

                                    return (
                                      <Box
                                        key={item.flag}
                                        style={{
                                          gap: 8,
                                          paddingVertical: 4,
                                        }}
                                      >
                                        <Box style={{ gap: 2 }}>
                                          <Typography
                                            level="body-sm"
                                            weight={600}
                                          >
                                            {item.label}
                                          </Typography>
                                          {item.description && (
                                            <Typography
                                              level="body-xs"
                                              textColor="muted"
                                            >
                                              {item.description}
                                            </Typography>
                                          )}
                                        </Box>
                                        <Box
                                          style={{
                                            flexDirection: "row",
                                            gap: 8,
                                          }}
                                        >
                                          <Pressable
                                            onPress={() => toggleState("allow")}
                                            accessibilityLabel={`Allow ${item.label}`}
                                          >
                                            <Box
                                              style={stateStyle(
                                                "allow",
                                                current === "allow",
                                              )}
                                            >
                                              <CheckIcon
                                                size={14}
                                                weight="bold"
                                              />
                                            </Box>
                                          </Pressable>
                                          <Pressable
                                            onPress={() =>
                                              toggleState("neutral")
                                            }
                                            accessibilityLabel={`Neutral ${item.label}`}
                                          >
                                            <Box
                                              style={stateStyle(
                                                "neutral",
                                                current === "neutral",
                                              )}
                                            >
                                              <MinusIcon
                                                size={14}
                                                weight="bold"
                                              />
                                            </Box>
                                          </Pressable>
                                          <Pressable
                                            onPress={() => toggleState("deny")}
                                            accessibilityLabel={`Deny ${item.label}`}
                                          >
                                            <Box
                                              style={stateStyle(
                                                "deny",
                                                current === "deny",
                                              )}
                                            >
                                              <XIcon size={14} weight="bold" />
                                            </Box>
                                          </Pressable>
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Paper>
                            ))
                          )}

                          {dirtyKeys.has(selectedKey) && (
                            <Box style={{ flexDirection: "row", gap: 8 }}>
                              <Button
                                color="danger"
                                variant="plain"
                                disabled={savingOverwrite}
                                onPress={resetSelected}
                              >
                                Reset
                              </Button>
                              <Button
                                disabled={savingOverwrite}
                                onPress={() => saveOverwrite()}
                              >
                                Save overwrite
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  {space && (
                    <ChannelInvitesSection space={space} channel={channel} />
                  )}
                </Box>
              </ScrollView>
              <Button
                disabled={isPending || !name?.trim()}
                onPress={() => save()}
              >
                Save
              </Button>
              <Button
                color="danger"
                variant="soft"
                disabled={deleting}
                onPress={() => deleteChannel()}
              >
                Delete channel
              </Button>
              <Button variant="plain" onPress={onClose}>
                Close
              </Button>
            </Paper>
          </View>
        </Modal>

        <Modal
          open={overwritePickerOpen}
          onClose={() => setOverwritePickerOpen(false)}
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
            style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
          >
            <Paper
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 20,
                gap: 12,
                maxHeight: "80%",
              }}
              elevation={app.settings?.preferEmbossed ? 4 : 2}
            >
              <Typography level="body-lg" weight="bold">
                Add permission overwrite
              </Typography>
              <InputDefault
                fullWidth
                value={overwriteSearch}
                onChangeText={setOverwriteSearch}
                placeholder="Search roles or members"
              />

              <ScrollView keyboardShouldPersistTaps="handled">
                <Box style={{ gap: 12 }}>
                  {filteredRoles.length > 0 && (
                    <Box style={{ gap: 8 }}>
                      <Typography level="body-xs" textColor="muted">
                        Roles
                      </Typography>
                      {filteredRoles.map((role) => (
                        <Pressable
                          key={role.id}
                          onPress={() => addOverwrite(role.id, "role")}
                        >
                          <Paper
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              padding: 10,
                              borderRadius: 10,
                            }}
                          >
                            <ShieldIcon
                              size={14}
                              weight="fill"
                              color={role.color || theme.colors.info}
                            />
                            <Typography level="body-sm">{role.name}</Typography>
                          </Paper>
                        </Pressable>
                      ))}
                    </Box>
                  )}

                  {filteredMembers.length > 0 && (
                    <Box style={{ gap: 8 }}>
                      <Typography level="body-xs" textColor="muted">
                        Members
                      </Typography>
                      {filteredMembers.map((member) => (
                        <Pressable
                          key={member.id}
                          onPress={() => addOverwrite(member.id, "member")}
                        >
                          <Paper
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              padding: 10,
                              borderRadius: 10,
                            }}
                          >
                            <UserIcon size={14} weight="fill" />
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Typography level="body-sm" truncate="single">
                                {member.displayName}
                              </Typography>
                              <Typography level="body-xs" textColor="muted">
                                @{member.user?.username}
                              </Typography>
                            </Box>
                          </Paper>
                        </Pressable>
                      ))}
                    </Box>
                  )}

                  {filteredRoles.length === 0 &&
                    filteredMembers.length === 0 && (
                      <Typography level="body-sm" textColor="muted">
                        No results
                      </Typography>
                    )}
                </Box>
              </ScrollView>

              <Button
                variant="plain"
                color="neutral"
                onPress={() => setOverwritePickerOpen(false)}
              >
                Cancel
              </Button>
            </Paper>
          </View>
        </Modal>
      </>
    );
  },
);
