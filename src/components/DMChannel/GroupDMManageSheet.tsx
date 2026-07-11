import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { HttpException } from "@mutualzz/types";
import { useScaledModalListMaxHeight } from "@utils/accessibilityLayout";
import { Box, InputDefault, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import {
  CameraIcon,
  SignOutIcon,
  TrashIcon,
  UserMinusIcon,
} from "phosphor-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const GroupDMManageSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const { t: tCommon } = useTranslation("common");
    const { navigate } = useAppNavigation();
    const { theme } = useTheme();

    const [name, setName] = useState(channel.name ?? "");
    const [iconUri, setIconUri] = useState<string | null>(
      channel.iconUrl ?? null,
    );
    const [iconMime, setIconMime] = useState("image/png");
    const [removeIcon, setRemoveIcon] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [removingUserId, setRemovingUserId] = useState<string | null>(null);

    const isOwner = !!channel.ownerId && channel.ownerId === app.account?.id;
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
        setError(
          err?.errors?.[0]?.message ?? err?.message ?? t("groupDm.saveFailed"),
        );
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
        setError(e instanceof Error ? e.message : t("groupDm.leaveFailed"));
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
        setError(e instanceof Error ? e.message : t("groupDm.deleteFailed"));
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
          err?.errors?.[0]?.message ??
            err?.message ??
            t("groupDm.removeMemberFailed"),
        );
      } finally {
        setRemovingUserId(null);
      }
    };

    const members = channel.dmRecipientsList;

    return (
      <BottomSheet
        open={visible}
        onClose={onClose}
        title={t("groupDm.manage.title")}
        maxHeight="90%"
        keyboard="lift"
        elevation={app.settings?.preferEmbossed ? 4 : 2}
        sheetStyle={{ gap: 16 }}
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
                  {t("groupDm.manage.icon")}
                </Typography>
              </Box>
            )}
          </Pressable>

          {iconUri && (
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
              {t("groupDm.manage.removeIcon")}
            </Button>
          )}
        </Box>

        <Box style={{ gap: 6 }}>
          <Typography level="body-sm" weight={600}>
            {t("groupDm.manage.groupName")}
          </Typography>
          <InputDefault
            fullWidth
            value={name}
            onChangeText={setName}
            placeholder={t("groupDm.namePlaceholder")}
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-sm" weight={600}>
            {t("groupDm.manage.members")} ({members.length})
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
                    <Typography
                      level="body-sm"
                      style={{ flex: 1 }}
                      truncate="single"
                    >
                      {member.displayName}
                      {isSelf ? ` ${t("groupDm.manage.you")}` : ""}
                    </Typography>
                  </Box>

                  {canRemove && (
                    <Button
                      size="sm"
                      variant="soft"
                      color="danger"
                      disabled={!!removingUserId || saving}
                      startDecorator={<UserMinusIcon size={14} weight="fill" />}
                      onPress={() => void removeMember(member)}
                    >
                      {removingUserId === member.id
                        ? t("groupDm.manage.removing")
                        : t("groupDm.manage.remove")}
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box style={{ gap: 8 }}>
          <Button disabled={!hasChanges || saving} onPress={() => void save()}>
            {t("groupDm.manage.saveChanges")}
          </Button>

          <Button
            variant="plain"
            color="danger"
            horizontalAlign="left"
            startDecorator={<SignOutIcon size={18} weight="fill" />}
            onPress={() => void leave()}
            disabled={saving}
          >
            {t("groupDm.manage.leaveGroup")}
          </Button>

          {isOwner && (
            <Button
              variant="plain"
              color="danger"
              horizontalAlign="left"
              startDecorator={<TrashIcon size={18} weight="fill" />}
              onPress={() => void deleteGroup()}
              disabled={saving}
            >
              {t("groupDm.manage.deleteGroup")}
            </Button>
          )}
        </Box>

        {error && (
          <Typography
            color="danger"
            level="body-sm"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Typography>
        )}

        <Button variant="plain" color="neutral" onPress={onClose}>
          {tCommon("cancel")}
        </Button>
      </BottomSheet>
    );
  },
);
