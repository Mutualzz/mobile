import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { useUserRelationshipActions } from "@hooks/useUserRelationshipActions";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { User } from "@stores/objects/User";
import { useMutation } from "@tanstack/react-query";
import {
  ChatCircleIcon,
  CheckCircleIcon,
  FlagIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  XCircleIcon,
} from "phosphor-react-native";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface UserActionMenuItem {
  key: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

interface Options {
  user: User;
  insideDMs?: boolean;
  hideMessage?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function useUserActionMenu({
  user,
  insideDMs = false,
  hideMessage = false,
  onNavigate,
  onClose,
}: Options) {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const iconColor = useSettingsIconColor("info");
  const { navigate } = useAppNavigation();
  const { openSheet } = useSheet();
  const isViewerStaff = app.account?.isStaff ?? false;
  const isSelf = app.account?.id === user.id;
  const cannotDm = user.viewerCanDm === false;

  useEffect(() => {
    if (isSelf) return;
    void app.users.resolve(user.id);
  }, [app.users, isSelf, user.id]);

  const {
    isFriend,
    isIncomingRequest,
    isOutgoingRequest,
    iBlockedThem,
    relationshipPending,
    addFriend,
    acceptFriend,
    declineFriend,
    removeFriend,
    blockUser,
    unblockUser,
  } = useUserRelationshipActions(user.id, { onComplete: onClose });

  const dmChannel =
    insideDMs && app.account
      ? app.channels.getDMChannel(app.account.id, user.id)
      : null;
  const readState = dmChannel ? app.readStates.get(dmChannel.id) : null;

  const voiceState = app.voiceStates.get(user.id);
  const inSameVoiceChannel =
    Boolean(voiceState?.channelId) &&
    voiceState?.channelId === app.voice.currentChannelId;
  const userVoiceMuted = app.voice.isUserVoiceMuted(user.id);

  const finish = () => onClose?.();

  const leaveTo = (action: () => void) => {
    finish();
    onNavigate?.();
    action();
  };

  const { mutate: openDm, isPending: openingDm } = useMutation({
    mutationKey: ["open-dm", user.id],
    mutationFn: () => app.relationships.openDMWith(user.id),
    onSuccess: (channel) => {
      finish();
      onNavigate?.();
      app.setDMDrawerOpen(false);
      navigate(`/@me/${channel.id}`);
    },
  });

  const { mutate: closeDm, isPending: closingDm } = useMutation({
    mutationKey: ["close-dm", user.id],
    mutationFn: async () => {
      if (!app.account) return;
      const channel = app.channels.getDMChannel(app.account.id, user.id);
      if (!channel) return;
      await app.channels.closeDM(channel.id);
      if (app.channels.activeId === channel.id) {
        navigate("/@me", { replace: true });
      }
    },
    onSuccess: finish,
  });

  const openReport = () => {
    leaveTo(() => {
      openSheet(
        `report-user-${user.id}`,
        <ReportContentSheet
          targetType="user"
          targetId={user.id}
          contentLabel={t("contextMenu.reportAccount")}
          sheetId={`report-user-${user.id}`}
        />,
      );
    });
  };

  const items: UserActionMenuItem[] = (() => {
    const menuItems: UserActionMenuItem[] = [];
    const iconSize = 16;

    if (readState?.isUnread) {
      menuItems.push({
        key: "mark-as-read",
        label: t("contextMenu.markAsRead"),
        icon: <CheckCircleIcon size={iconSize} weight="fill" color={iconColor} />,
        onPress: () => {
          void readState.ack();
          finish();
        },
      });
    }

    if (readState) {
      menuItems.push({
        key: "mute-notifications",
        label: readState.isMuted
          ? t("contextMenu.unmuteNotifications")
          : t("contextMenu.muteNotifications"),
        onPress: () => {
          void readState.setMuted(!readState.isMuted);
          finish();
        },
      });
    }

    menuItems.push({
      key: "view-profile",
      label: t("contextMenu.viewProfile"),
      icon: <UserIcon size={iconSize} weight="fill" color={iconColor} />,
      onPress: () => leaveTo(() => navigate(`/users/${user.username}`)),
    });

    if (!hideMessage) {
      if (!insideDMs) {
        menuItems.push({
          key: "message",
          label: t("contextMenu.message"),
          icon: <ChatCircleIcon size={iconSize} weight="fill" color={iconColor} />,
          disabled: openingDm || iBlockedThem || cannotDm,
          onPress: () => openDm(),
        });
      } else {
        menuItems.push({
          key: "close-dm",
          label: t("contextMenu.closeDm"),
          icon: <XCircleIcon size={iconSize} weight="fill" color={iconColor} />,
          disabled: closingDm,
          onPress: () => closeDm(),
        });
      }
    }

    if (!hideMessage && inSameVoiceChannel) {
      menuItems.push({
        key: "voice-mute",
        label: userVoiceMuted
          ? t("voice.controls.unmuteUser")
          : t("voice.controls.muteUser"),
        onPress: () => {
          app.voice.toggleUserVoiceMuted(user.id);
          finish();
        },
      });
    }

    if (!isFriend && !isIncomingRequest && !isOutgoingRequest) {
      menuItems.push({
        key: "add-friend",
        label: t("contextMenu.addFriend"),
        icon: <UserPlusIcon size={iconSize} weight="fill" color={iconColor} />,
        disabled: relationshipPending || iBlockedThem,
        onPress: () => addFriend.mutate(),
      });
    }

    if (isIncomingRequest) {
      menuItems.push(
        {
          key: "accept-friend",
          label: t("contextMenu.acceptFriendRequest"),
          icon: <UserPlusIcon size={iconSize} weight="fill" color={iconColor} />,
          disabled: relationshipPending || iBlockedThem,
          onPress: () => acceptFriend.mutate(),
        },
        {
          key: "decline-friend",
          label: t("contextMenu.declineFriendRequest"),
          disabled: relationshipPending || iBlockedThem,
          onPress: () => declineFriend.mutate(),
        },
      );
    }

    if (isOutgoingRequest) {
      menuItems.push({
        key: "cancel-friend",
        label: t("contextMenu.cancelFriendRequest"),
        disabled: relationshipPending,
        onPress: () => declineFriend.mutate(),
      });
    }

    if (isFriend) {
      menuItems.push({
        key: "remove-friend",
        label: t("contextMenu.removeFriend"),
        icon: <UserMinusIcon size={iconSize} weight="fill" color={iconColor} />,
        disabled: relationshipPending || iBlockedThem,
        onPress: () => removeFriend.mutate(),
      });
    }

    if (iBlockedThem) {
      menuItems.push({
        key: "unblock",
        label: t("contextMenu.unblock"),
        icon: <ProhibitIcon size={iconSize} weight="fill" color={iconColor} />,
        disabled: relationshipPending,
        onPress: () => unblockUser.mutate(),
      });
    } else {
      menuItems.push({
        key: "block",
        label: t("contextMenu.block"),
        icon: <ProhibitIcon size={iconSize} weight="fill" color={iconColor} />,
        disabled: relationshipPending,
        onPress: () => blockUser.mutate(),
      });
    }

    if (isViewerStaff) {
      menuItems.push({
        key: "staff-panel",
        label: t("contextMenu.openInStaffPanel"),
        icon: <ShieldCheckIcon size={iconSize} weight="fill" color={iconColor} />,
        onPress: () => leaveTo(() => navigate(`/staff/users/${user.id}`)),
      });
    }

    menuItems.push({
      key: "report",
      label: t("contextMenu.reportUser"),
      icon: <FlagIcon size={iconSize} weight="fill" color={iconColor} />,
      onPress: openReport,
    });

    return menuItems;
  })();

  return {
    user,
    items,
    inSameVoiceChannel,
    userVoiceMuted,
    userVoiceVolume: app.voice.getUserVoiceVolume(user.id),
    toggleUserVoiceMuted: () => app.voice.toggleUserVoiceMuted(user.id),
    setUserVoiceVolume: (value: number) =>
      app.voice.setUserVoiceVolume(user.id, value),
  };
}
