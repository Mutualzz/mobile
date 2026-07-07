import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { AccountStore } from "@stores/Account.store";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { User } from "@stores/objects/User";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { FlagIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { ActivityIndicator, Image, View } from "react-native";

interface Props {
  user: User | AccountStore;
  member?: SpaceMember;
  modalId: string;
}

export const UserProfileSheet = observer(({ user, member, modalId }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { closeModal, openModal } = useModal();
  const { navigate } = useAppNavigation();

  useEffect(() => {
    app.gateway.subscribeUser(user.id);
    return () => app.gateway.unsubscribeUser(user.id);
  }, [app.gateway, user.id]);

  const { data: fetchedProfile, isLoading } = useQuery({
    queryKey: ["profile-popout", user.id],
    queryFn: () => app.profiles.resolve(user.id),
  });

  const profile = app.profiles.get(user.id) ?? fetchedProfile;
  void profile?.updatedAt;

  const isSelf = app.account?.id === user.id;
  const isViewerStaff = app.account?.isStaff ?? false;
  const bannerUrl = profile?.constructBannerUrl();
  const backgroundUrl = profile?.constructBackgroundUrl();
  const displayName = member?.displayName ?? user.displayName;

  const openDM = async () => {
    closeModal(modalId);
    const channel = await app.relationships.openDMWith(user.id);
    navigate(`/@me/${channel.id}`);
  };

  const openSettings = () => {
    closeModal(modalId);
    navigate("/settings/profile");
  };

  const openFullProfile = () => {
    closeModal(modalId);
    navigate(`/users/${user.username}`);
  };

  const openStaffPanel = () => {
    closeModal(modalId);
    navigate(`/staff/users/${user.id}` as Href);
  };

  const openReport = () => {
    closeModal(modalId);
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

  return (
    <Paper
      style={{
        width: 320,
        maxWidth: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      {backgroundUrl && (
        <Image
          source={{ uri: backgroundUrl }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.35,
          }}
          resizeMode="cover"
        />
      )}

      <View style={{ position: "relative", zIndex: 1 }}>
        <View style={{ marginBottom: 36 }}>
          {bannerUrl ? (
            <Image
              source={{ uri: bannerUrl }}
              style={{
                width: "100%",
                height: 96,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 96,
                backgroundColor: user.accentColor,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            />
          )}

          <View
            style={{
              position: "absolute",
              left: 10,
              bottom: 0,
              transform: [{ translateY: 24 }],
            }}
          >
            <UserAvatar user={user} size="lg" />
          </View>
        </View>

        <Box style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
          {isLoading && !profile ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <>
              <Box style={{ gap: 2 }}>
                <Typography level="title-md">{displayName}</Typography>
                <Typography level="body-sm" textColor="muted">
                  @{user.username}
                </Typography>
              </Box>

              {profile?.bio ? (
                <ProfileMarkdownContent value={profile.bio} lineClamp={3} />
              ) : null}

              <Box
                style={{
                  flexDirection: "row",
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                {isSelf ? (
                  <Button size="sm" color="neutral" onPress={openSettings}>
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => void openDM()}
                  >
                    Message
                  </Button>
                )}
                <Button
                  size="sm"
                  color="neutral"
                  variant="soft"
                  onPress={openFullProfile}
                >
                  View Profile
                </Button>
                {isViewerStaff && !isSelf && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    onPress={openStaffPanel}
                  >
                    Staff Panel
                  </Button>
                )}
                {!isSelf && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    startDecorator={<FlagIcon size={16} weight="fill" />}
                    onPress={openReport}
                  >
                    Report
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </View>
    </Paper>
  );
});
