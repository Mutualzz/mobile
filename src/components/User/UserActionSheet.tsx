import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { useUserRelationshipActions } from "@hooks/useUserRelationshipActions";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { User } from "@stores/objects/User";
import {
  Box,
  ButtonGroup,
  Divider,
  Modal,
  Typography,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import {
  ChatCircleIcon,
  CheckCircleIcon,
  FlagIcon,
  ProhibitIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  XCircleIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  user: User;
  visible: boolean;
  onClose: () => void;
  insideDMs?: boolean;
}

export const UserActionSheet = observer(
  ({ user, visible, onClose, insideDMs = false }: Props) => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const { navigate } = useAppNavigation();
    const { openModal } = useModal();

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

    const { mutate: openDm, isPending: openingDm } = useMutation({
      mutationKey: ["open-dm", user.id],
      mutationFn: () => app.relationships.openDMWith(user.id),
      onSuccess: (channel) => {
        onClose();
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
      onClose();
      openModal(
        `report-user-${user.id}`,
        <ReportContentSheet
          targetType="user"
          targetId={user.id}
          contentLabel="this user"
          modalId={`report-user-${user.id}`}
        />,
      );
    };

    const viewProfile = () => {
      onClose();
      navigate(`/users/${user.username}`);
    };

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
                }}
              >
          <Box style={{ alignItems: "center", paddingVertical: 8, gap: 4 }}>
            <Typography level="body-md" weight={700} truncate="single">
              {user.displayName}
            </Typography>
            <Typography level="body-xs" textColor="muted" truncate="single">
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
            {readState?.isUnread ? (
              <Button
                fullWidth
                padding={12}
                startDecorator={<CheckCircleIcon size={20} weight="fill" />}
                onPress={() => {
                  void readState.ack();
                  onClose();
                }}
              >
                Mark as read
              </Button>
            ) : null}

            <Button
              fullWidth
              padding={12}
              startDecorator={<UserIcon size={20} weight="fill" />}
              onPress={viewProfile}
            >
              View Profile
            </Button>

            {!insideDMs ? (
              <Button
                fullWidth
                padding={12}
                startDecorator={<ChatCircleIcon size={20} weight="fill" />}
                disabled={openingDm || iBlockedThem}
                onPress={() => openDm()}
              >
                Message
              </Button>
            ) : (
              <Button
                fullWidth
                padding={12}
                startDecorator={<XCircleIcon size={20} weight="fill" />}
                disabled={closingDm}
                onPress={() => closeDm()}
              >
                Close DM
              </Button>
            )}

            {!isFriend && !isIncomingRequest && !isOutgoingRequest ? (
              <Button
                fullWidth
                padding={12}
                startDecorator={<UserPlusIcon size={20} weight="fill" />}
                disabled={relationshipPending || iBlockedThem}
                onPress={() => addFriend.mutate()}
              >
                Add Friend
              </Button>
            ) : null}

            {isIncomingRequest ? (
              <>
                <Button
                  fullWidth
                  padding={12}
                  color="success"
                  startDecorator={<UserPlusIcon size={20} weight="fill" />}
                  disabled={relationshipPending || iBlockedThem}
                  onPress={() => acceptFriend.mutate()}
                >
                  Accept Friend Request
                </Button>
                <Button
                  fullWidth
                  padding={12}
                  disabled={relationshipPending || iBlockedThem}
                  onPress={() => declineFriend.mutate()}
                >
                  Decline Friend Request
                </Button>
              </>
            ) : null}

            {isOutgoingRequest ? (
              <Button
                fullWidth
                padding={12}
                disabled={relationshipPending}
                onPress={() => declineFriend.mutate()}
              >
                Cancel Friend Request
              </Button>
            ) : null}

            {isFriend ? (
              <Button
                fullWidth
                padding={12}
                startDecorator={<UserMinusIcon size={20} weight="fill" />}
                disabled={relationshipPending || iBlockedThem}
                onPress={() => removeFriend.mutate()}
              >
                Remove Friend
              </Button>
            ) : null}

            {iBlockedThem ? (
              <Button
                fullWidth
                padding={12}
                startDecorator={<ProhibitIcon size={20} weight="fill" />}
                disabled={relationshipPending}
                onPress={() => unblockUser.mutate()}
              >
                Unblock
              </Button>
            ) : (
              <Button
                fullWidth
                padding={12}
                startDecorator={<ProhibitIcon size={20} weight="fill" />}
                disabled={relationshipPending}
                onPress={() => blockUser.mutate()}
              >
                Block
              </Button>
            )}

            <Button
              fullWidth
              padding={12}
              color="danger"
              startDecorator={<FlagIcon size={20} weight="fill" />}
              onPress={openReport}
            >
              Report User
            </Button>
          </ButtonGroup>
              </Paper>
            </Box>
          </View>
        </View>
      </Modal>
    );
  },
);
