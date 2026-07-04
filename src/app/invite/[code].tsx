import { Paper } from "@components/Paper";
import { Button } from "@components/Button";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIInvite } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

const InviteScreen = () => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();

  const {
    data: invite,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["space-invite", code],
    queryFn: () => app.rest.get<APIInvite>(`/invites/${code}`),
    retry: 1,
    enabled: !!code,
  });

  useEffect(() => {
    if (!invite) return;
    app.setJoining(code ?? null, invite.space);
  }, [app, code, invite]);

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
            Invite Invalid
          </Typography>
          <Typography textColor="muted">
            This invite may be expired, or you might not have permission to join
            it.
          </Typography>
          <Button onPress={() => navigate("/")}>Continue</Button>
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
        {!isLoading && invite?.space && (
          <>
            <SpaceIcon space={invite.space} size={64} />
            <Typography style={{ textAlign: "center" }}>
              {(invite.inviter?.globalName ?? invite.inviter?.username) +
                " invited you to join"}
            </Typography>
            <Typography level="title-md" weight="bold">
              {invite.space.name}
            </Typography>
            <Button
              fullWidth
              disabled={isJoining}
              onPress={() => (isInSpace ? goToSpace() : acceptInvite())}
            >
              {isInSpace ? "Go to space" : "Accept invite"}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default observer(InviteScreen);
