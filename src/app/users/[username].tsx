import { ProfileWidgetGrid } from "@components/Profile/widgets/ProfileWidgetGrid";
import { ProfileWidgetsEmptyViewer } from "@components/Profile/widgets/ProfileWidgetsEmptyViewer";
import { ProfileNotFoundState } from "@components/Profile/ProfileNotFoundState";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { IconButton } from "@components/IconButton";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView } from "react-native";
import { ArrowLeftIcon } from "phosphor-react-native";

const PublicProfileScreen = () => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    data: user,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ["public-profile", username, app.account?.id],
    enabled: !!username,
    queryFn: () => app.users.resolveByIdentifier(username, true),
    retry: false,
  });

  const isSelf =
    !!user &&
    app.account?.id != null &&
    String(app.account.id) === String(user.id);

  const { data: profile, isFetched: profileFetched } = useQuery({
    queryKey: ["public-profile-data", user?.id, app.account?.id],
    enabled: !!user?.id && (!isSelf || !!app.account),
    queryFn: () => app.profiles.resolve(user!.id, true),
    retry: false,
  });

  useEffect(() => {
    if (!user?.id) return;
    app.gateway.subscribeUser(user.id);
    return () => app.gateway.unsubscribeUser(user.id);
  }, [app.gateway, user?.id]);

  if (!username) return <Redirect href="/" />;

  if (isLoading) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!user && isFetched) {
    return (
      <Screen
        style={{
          flexDirection: "column",
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderTopWidth: 0,
        }}
      >
        <ScreenHeader
          style={{
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
          }}
        >
          <IconButton padding={8} onPress={() => router.back()}>
            <ArrowLeftIcon size={20} />
          </IconButton>
          <Typography level="body-md" weight="bold" style={{ flex: 1 }}>
            {t("profile.viewer.title")}
          </Typography>
        </ScreenHeader>
        <ProfileNotFoundState onBack={() => router.back()} />
      </Screen>
    );
  }

  if (!user) return null;

  const resolvedProfile = profile ?? app.profiles.get(user.id);

  return (
    <Screen
      style={{
        flexDirection: "column",
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
      }}
    >
      <ScreenHeader
        style={{
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        <IconButton padding={8} onPress={() => router.back()}>
          <ArrowLeftIcon size={20} />
        </IconButton>
        <Typography level="body-md" weight="bold" style={{ flex: 1 }}>
          {isSelf ? t("profile.viewer.yourProfile") : t("profile.viewer.title")}
        </Typography>
      </ScreenHeader>
      {!profileFetched ? (
        <Box
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <ActivityIndicator />
        </Box>
      ) : !resolvedProfile && !isSelf ? (
        <ProfileNotFoundState onBack={() => router.back()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, alignItems: "center" }}
        >
          <Box style={{ width: "100%" }}>
            {resolvedProfile && resolvedProfile.mobileBlocks.length > 0 ? (
              <ProfileWidgetGrid profile={resolvedProfile} user={user} />
            ) : (
              <ProfileWidgetsEmptyViewer />
            )}
          </Box>
        </ScrollView>
      )}
    </Screen>
  );
};

export default observer(PublicProfileScreen);
