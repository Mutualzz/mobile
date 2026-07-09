import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { HttpException } from "@mutualzz/types";
import {
  MODAL_SHEET_KEYBOARD_STYLE,
  MODAL_SHEET_WRAPPER_STYLE,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
import { useScaledModalListMaxHeight } from "@utils/accessibilityLayout";
import { Box, InputDefault, Modal, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { CameraIcon, SignOutIcon, TrashIcon, UserMinusIcon } from "phosphor-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const GroupDMManageSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const { theme } = useTheme();

    const [name, setName] = useState(channel.name ?? "");
    const [iconUri, setIconUri] = useState<string | null>(channel.iconUrl ?? null);
    const [iconMime, setIconMime] = useState("image/png");
    const [removeIcon, setRemoveIcon] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [removingUserId, setRemovingUserId] = useState<string | null>(null);

    const isOwner = !!channel.ownerId && channel.ownerId === app.account?.id;
    const maxSheetHeight = useModalSheetMaxHeight(0.9);
    const membersListMaxHeight = useScaledModalListMaxHeight(240);
    const hasChanges =
      name.trim() !== (channel.name ?? "") ||
      removeIcon ||
      (iconUri !== null && iconUri !== channel.iconUrl);

    const handlePickIcon = () => {
      ImagePicker.openPicker({
        mediaType: "photo",
        cropping: true,
      })
        .then((image) => {
          setIconUri(image.path);
          setIconMime(image.mime ?? "image/png");
          setRemoveIcon(false);
          setError(null);
        })
        .catch(() => undefined)
        .finally(() => {
          void ImagePicker.clean();
        });
    };

    const save = async () => {
      if (!hasChanges || saving) return;
      setSaving(true);
      setError(null);
      try {
        const formData = new FormData();
        if (name.trim()) formData.append("name", name.trim());

        if (removeIcon) {
          formData.append("removeIcon", "true");
        } else if (iconUri && !iconUri.startsWith("http")) {
          formData.append("icon", {
            uri: iconUri,
            type: iconMime,
            name: "group-icon.png",
          } as unknown as Blob);
        }

        await app.channels.updateGroupDM(channel.id, formData);
        onClose();
      } catch (e) {
        const err = e as HttpException;
        setError(err?.errors?.[0]?.message ?? err?.message ?? "Failed to save group");
      } finally {
        setSaving(false);
      }
    };

    const leave = async () => {
      if (saving) return;
      setSaving(true);
      setError(null);
      try {
        await app.channels.leaveGroupDM(channel.id);
        onClose();
        navigate("/@me", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to leave group");
      } finally {
        setSaving(false);
      }
    };

    const deleteGroup = async () => {
      if (!isOwner || saving) return;
      setSaving(true);
      setError(null);
      try {
        await app.channels.deleteGroupDM(channel.id);
        onClose();
        navigate("/@me", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete group");
      } finally {
        setSaving(false);
      }
    };

    const removeMember = async (user: User) => {
      if (!isOwner || saving || removingUserId) return;
      if (user.id === app.account?.id) return;

      setRemovingUserId(user.id);
      setError(null);
      try {
        await app.channels.removeGroupDMRecipient(channel.id, user.id);
      } catch (e) {
        const err = e as HttpException;
        setError(
          err?.errors?.[0]?.message ?? err?.message ?? "Failed to remove member",
        );
      } finally {
        setRemovingUserId(null);
      }
    };

    const members = channel.dmRecipientsList;

    return (
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
        <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
          <AppKeyboardAvoidingView style={MODAL_SHEET_KEYBOARD_STYLE}>
            <Paper
              elevation={app.settings?.preferEmbossed ? 4 : 2}
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 20,
                gap: 16,
                maxHeight: maxSheetHeight,
              }}
            >
              <Typography level="body-lg" weight="bold">
                Manage Group
              </Typography>

              <ScrollView
                contentContainerStyle={{ gap: 16 }}
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0 }}
              >
              <Box style={{ alignItems: "center", gap: 8 }}>
                <Pressable onPress={handlePickIcon}>
                  {iconUri ? (
                    <Image
                      source={{ uri: iconUri }}
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: channel.flags.has("RoundedIcon") ? 44 : 12,
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: theme.colors.neutral,
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <CameraIcon size={18} color={theme.typography.colors.muted} />
                      <Typography level="body-xs" textColor="muted">
                        Icon
                      </Typography>
                    </Box>
                  )}
                </Pressable>

                {iconUri ? (
                  <Button
                    size="sm"
                    variant="soft"
                    color="danger"
                    startDecorator={<TrashIcon size={14} weight="fill" />}
                    onPress={() => {
                      setIconUri(null);
                      setRemoveIcon(true);
                    }}
                  >
                    Remove icon
                  </Button>
                ) : null}
              </Box>

              <Box style={{ gap: 6 }}>
                <Typography level="body-sm" weight={600}>
                  Group name
                </Typography>
                <InputDefault
                  fullWidth
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Game Night"
                />
              </Box>

              <Box style={{ gap: 8 }}>
                <Typography level="body-sm" weight={600}>
                  Members ({members.length})
                </Typography>

                <Box style={{ gap: 8, maxHeight: membersListMaxHeight }}>
                  {members.map((member) => {
                    const isSelf = member.id === app.account?.id;
                    const canRemove = isOwner && !isSelf;

                    return (
                      <Box
                        key={member.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <Box
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                          }}
                        >
                          <UserAvatar user={member} size="sm" />
                          <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
                            {member.displayName}
                            {isSelf ? " (you)" : ""}
                          </Typography>
                        </Box>

                        {canRemove ? (
                          <Button
                            size="sm"
                            variant="soft"
                            color="danger"
                            disabled={!!removingUserId || saving}
                            startDecorator={<UserMinusIcon size={14} weight="fill" />}
                            onPress={() => void removeMember(member)}
                          >
                            {removingUserId === member.id ? "Removing…" : "Remove"}
                          </Button>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box style={{ gap: 8 }}>
                <Button disabled={!hasChanges || saving} onPress={() => void save()}>
                  Save changes
                </Button>

                <Button
                  variant="plain"
                  color="danger"
                  horizontalAlign="left"
                  startDecorator={<SignOutIcon size={18} weight="fill" />}
                  onPress={() => void leave()}
                  disabled={saving}
                >
                  Leave group
                </Button>

                {isOwner ? (
                  <Button
                    variant="plain"
                    color="danger"
                    horizontalAlign="left"
                    startDecorator={<TrashIcon size={18} weight="fill" />}
                    onPress={() => void deleteGroup()}
                    disabled={saving}
                  >
                    Delete group
                  </Button>
                ) : null}
              </Box>
              </ScrollView>

              {error ? (
                <Typography
                  color="danger"
                  level="body-sm"
                  accessibilityLiveRegion="polite"
                >
                  {error}
                </Typography>
              ) : null}

              <Button variant="plain" color="neutral" onPress={onClose}>
                Cancel
              </Button>
            </Paper>
          </AppKeyboardAvoidingView>
        </View>
      </Modal>
    );
  },
);

