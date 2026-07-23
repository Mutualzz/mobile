import { Button } from "@components/Button";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { useUserRelationshipActions } from "@hooks/useUserRelationshipActions";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { User } from "@stores/objects/User";
import { Box, ButtonGroup, Divider, Sheet, Slider, Switch, Typography } from "@mutualzz/ui-native";
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
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  user: User;
  visible?: boolean;
  onClose: () => void;
  insideDMs?: boolean;
  hideMessage?: boolean;
  onNavigate?: () => void;
  embedded?: boolean;
}

export const UserActionSheet = observer(
  ({
    user,
    visible = true,
    onClose,
    insideDMs = false,
    hideMessage = false,
    onNavigate,
    embedded = false,
  }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
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
    const userVoiceVolume = app.voice.getUserVoiceVolume(user.id);
    const userVoiceMuted = app.voice.isUserVoiceMuted(user.id);

    const leaveTo = (action: () => void) => {
      onClose();
      onNavigate?.();
      action();
    };

    const { mutate: openDm, isPending: openingDm } = useMutation({
      mutationKey: ["open-dm", user.id],
      mutationFn: () => app.relationships.openDMWith(user.id),
      onSuccess: (channel) => {
        onClose();
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
      onSuccess: onClose,
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

    const viewProfile = () => {
      leaveTo(() => navigate(`/users/${user.username}`));
    };

    const openStaffPanel = () => {
      leaveTo(() => navigate(`/staff/users/${user.id}`));
    };

    const content = (
      <View style={{ width: "100%" }}>
        <View onStartShouldSetResponder={() => true}>
          <Box
            style={{
              width: "100%",
              padding: 16,
              gap: 8,
            }}
          >
            <Box style={{ gap: 8 }}>
              <Box
                style={{ alignItems: "center", paddingVertical: 8, gap: 4 }}
              >
                <Typography level="body-md" weight={700} truncate="single">
                  {user.displayName}
                </Typography>
                <Typography
                  level="body-xs"
                  textColor="muted"
                  truncate="single"
                >
                  @{user.username}
                </Typography>
              </Box>

              <Divider lineColor="muted" />

              <ButtonGroup
                orientation="vertical"
                variant="plain"
                fullWidth
                horizontalAlign="left"
                spacing={0.5}
              >
                {readState?.isUnread && (
                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={
                      <CheckCircleIcon size={20} weight="fill" />
                    }
                    onPress={() => {
                      void readState.ack();
                      onClose();
                    }}
                  >
                    {t("contextMenu.markAsRead")}
                  </Button>
                )}

                {readState && (
                  <Button
                    fullWidth
                    padding={12}
                    onPress={() => {
                      void readState.setMuted(!readState.isMuted);
                      onClose();
                    }}
                  >
                    {readState.isMuted
                      ? t("contextMenu.unmuteNotifications")
                      : t("contextMenu.muteNotifications")}
                  </Button>
                )}

                <Button
                  fullWidth
                  padding={12}
                  startDecorator={<UserIcon size={20} weight="fill" />}
                  onPress={viewProfile}
                >
                  {t("contextMenu.viewProfile")}
                </Button>

                {!hideMessage &&
                  (!insideDMs ? (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <ChatCircleIcon size={20} weight="fill" />
                      }
                      disabled={openingDm || iBlockedThem || cannotDm}
                      onPress={() => openDm()}
                    >
                      {t("contextMenu.message")}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <XCircleIcon size={20} weight="fill" />
                      }
                      disabled={closingDm}
                      onPress={() => closeDm()}
                    >
                      {t("contextMenu.closeDm")}
                    </Button>
                  ))}

                {!hideMessage && inSameVoiceChannel && (
                  <>
                    <Divider lineColor="muted" />
                    <Box style={{ gap: 8, paddingHorizontal: 4 }}>
                      <Box
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography level="body-sm">
                          {t("voice.controls.muteUser")}
                        </Typography>
                        <Switch
                          checked={userVoiceMuted}
                          onChange={() =>
                            app.voice.toggleUserVoiceMuted(user.id)
                          }
                        />
                      </Box>
                      <Box style={{ gap: 6 }}>
                        <Box
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography level="body-sm">
                            {t("voice.controls.userVolume")}
                          </Typography>
                          <Typography level="body-xs" textColor="muted">
                            {userVoiceVolume}%
                          </Typography>
                        </Box>
                        <Slider
                          min={0}
                          max={200}
                          value={userVoiceVolume}
                          disabled={userVoiceMuted}
                          onChange={(value) =>
                            app.voice.setUserVoiceVolume(
                              user.id,
                              Array.isArray(value) ? (value[0] ?? 0) : value,
                            )
                          }
                        />
                      </Box>
                    </Box>
                  </>
                )}

                {!isFriend && !isIncomingRequest && !isOutgoingRequest && (
                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={<UserPlusIcon size={20} weight="fill" />}
                    disabled={relationshipPending || iBlockedThem}
                    onPress={() => addFriend.mutate()}
                  >
                    {t("contextMenu.addFriend")}
                  </Button>
                )}

                {isIncomingRequest && (
                  <>
                    <Button
                      fullWidth
                      padding={12}
                      color="success"
                      startDecorator={
                        <UserPlusIcon size={20} weight="fill" />
                      }
                      disabled={relationshipPending || iBlockedThem}
                      onPress={() => acceptFriend.mutate()}
                    >
                      {t("contextMenu.acceptFriendRequest")}
                    </Button>
                    <Button
                      fullWidth
                      padding={12}
                      disabled={relationshipPending || iBlockedThem}
                      onPress={() => declineFriend.mutate()}
                    >
                      {t("contextMenu.declineFriendRequest")}
                    </Button>
                  </>
                )}

                {isOutgoingRequest && (
                  <Button
                    fullWidth
                    padding={12}
                    disabled={relationshipPending}
                    onPress={() => declineFriend.mutate()}
                  >
                    {t("contextMenu.cancelFriendRequest")}
                  </Button>
                )}

                {isFriend && (
                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={
                      <UserMinusIcon size={20} weight="fill" />
                    }
                    disabled={relationshipPending || iBlockedThem}
                    onPress={() => removeFriend.mutate()}
                  >
                    {t("contextMenu.removeFriend")}
                  </Button>
                )}

                {iBlockedThem ? (
                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={<ProhibitIcon size={20} weight="fill" />}
                    disabled={relationshipPending}
                    onPress={() => unblockUser.mutate()}
                  >
                    {t("contextMenu.unblock")}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={<ProhibitIcon size={20} weight="fill" />}
                    disabled={relationshipPending}
                    onPress={() => blockUser.mutate()}
                  >
                    {t("contextMenu.block")}
                  </Button>
                )}

                {isViewerStaff && (
                  <Button
                    fullWidth
                    padding={12}
                    color="danger"
                    startDecorator={
                      <ShieldCheckIcon size={20} weight="fill" />
                    }
                    onPress={openStaffPanel}
                  >
                    {t("contextMenu.openInStaffPanel")}
                  </Button>
                )}

                <Button
                  fullWidth
                  padding={12}
                  color="danger"
                  startDecorator={<FlagIcon size={20} weight="fill" />}
                  onPress={openReport}
                >
                  {t("contextMenu.reportUser")}
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        </View>
      </View>
    );

    if (embedded) return content;

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
        enableDynamicSizing
      >
        {content}
      </Sheet>
    );
  },
);
