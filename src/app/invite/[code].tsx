import { Paper } from "@components/Paper";
import { Button } from "@components/Button";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIInvite } from "@mutualzz/types";
import { InviteType } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

const InviteScreen = () => {
  const { t } = useTranslation("auth");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();

  const {
    data: invite,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invite", code],
    queryFn: () => app.rest.get<APIInvite>(`/invites/${code}`),
    retry: 1,
    enabled: !!code,
  });

  const isFriendInvite =
    invite != null && Number(invite.type) === InviteType.Friend;
  const inviteUser = invite?.user ?? invite?.inviter;
  const inviteUserId = invite?.userId ?? invite?.inviterId;
  const relationship = inviteUserId
    ? app.relationships.getForMe(inviteUserId)
    : undefined;
  const isSelf = inviteUserId === app.account?.id;

  useEffect(() => {
    if (!invite) return;

    if (isFriendInvite) {
      app.setJoining(code ?? null, null);
      return;
    }

    app.setJoining(code ?? null, invite.space);
  }, [app, code, invite, isFriendInvite]);

  const isInSpace =
    !!invite?.space?.members &&
    !!app.account?.id &&
    invite.space.members.some((m) => m.userId === app.account?.id);

  const goToSpace = () => {
    if (!invite?.spaceId || !invite.channelId) return;
    app.setJoining(null, null);
    app.spaces.setActive(invite.spaceId);
    app.channels.setActive(invite.channelId);
    app.setSpacesDrawerOpen(false);
    navigate(`/spaces/channel/${invite.channelId}`, { replace: true });
  };

  const { mutate: acceptInvite, isPending: isJoining } = useMutation({
    mutationKey: ["accept-invite", code],
    mutationFn: () =>
      app.rest.put(`/spaces/${invite?.spaceId}/members`, {
        channelId: invite?.channelId,
        code: invite?.code,
      }),
    onSuccess: goToSpace,
  });

  const { mutate: acceptFriendInvite, isPending: isAddingFriend } = useMutation(
    {
      mutationKey: ["accept-friend-invite", code],
      mutationFn: () => app.relationships.acceptFriendInvite(code),
      onSuccess: () => {
        app.setJoining(null, null);
        navigate("/");
      },
    },
  );

  const friendActionLabel = relationship?.isFriend
    ? t("invite.friends")
    : relationship?.isOutgoingRequest
      ? t("invite.pending")
      : t("invite.addFriend");

  if (!code) return <Redirect href="/" />;

  if (!app.token) return <Redirect href="/login" />;

  if (!invite && error) {
    return (
      <Box
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Paper style={{ padding: 24, borderRadius: 12, gap: 12 }}>
          <Typography level="body-lg" weight="bold">
            {t("invite.invalidTitle")}
          </Typography>
          <Typography textColor="muted">
            {t("invite.invalidDescription")}
          </Typography>
          <Button onPress={() => navigate("/")}>{t("actions.continue")}</Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Paper
        style={{
          padding: 24,
          borderRadius: 12,
          gap: 16,
          alignItems: "center",
        }}
      >
        {isLoading && <ActivityIndicator />}

        {!isLoading && invite && isFriendInvite && (
          <>
            {inviteUser && <UserAvatar user={inviteUser} size={64} />}
            <Typography style={{ textAlign: "center" }}>
              {inviteUser?.globalName ??
                inviteUser?.username ??
                t("invite.friendInvite")}
            </Typography>
            <Typography textColor="muted" style={{ textAlign: "center" }}>
              {t("invite.wantsToBeFriend")}
            </Typography>
            <Button
              fullWidth
              disabled={
                isAddingFriend ||
                isSelf ||
                relationship?.isFriend ||
                relationship?.isOutgoingRequest
              }
              onPress={() => acceptFriendInvite()}
            >
              {isSelf ? t("invite.thisIsYourInviteLink") : friendActionLabel}
            </Button>
          </>
        )}

        {!isLoading && invite?.space && !isFriendInvite && (
          <>
            <SpaceIcon space={invite.space} size={64} />
            <Typography style={{ textAlign: "center" }}>
              {t("invite.invitedYouToJoin", {
                name:
                  invite.inviter?.globalName ?? invite.inviter?.username ?? "",
              })}
            </Typography>
            <Typography level="title-md" weight="bold">
              {invite.space.name}
            </Typography>
            <Button
              fullWidth
              disabled={isJoining}
              onPress={() => (isInSpace ? goToSpace() : acceptInvite())}
            >
              {isInSpace ? t("invite.goToSpace") : t("invite.acceptInvite")}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default observer(InviteScreen);
