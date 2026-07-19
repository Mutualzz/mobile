import { Button } from "@components/Button";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { useUserRelationshipActions } from "@hooks/useUserRelationshipActions";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { User } from "@stores/objects/User";
import { Box, ButtonGroup, Divider, Sheet, Typography } from "@mutualzz/ui-native";
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
                      disabled={openingDm || iBlockedThem}
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
