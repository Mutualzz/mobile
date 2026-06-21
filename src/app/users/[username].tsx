import { UserProfileSheet } from "@components/Profile/UserProfileSheet";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { IconButton } from "@components/IconButton";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { ArrowLeftIcon } from "phosphor-react-native";

const PublicProfileScreen = () => {
  const app = useAppStore();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-profile", username],
    enabled: !!username,
    queryFn: () => app.users.resolveByIdentifier(username, true),
  });

  useEffect(() => {
    if (!user?.id) return;
    app.gateway.subscribeUser(user.id);
    void app.profiles.resolve(user.id, true);
    return () => app.gateway.unsubscribeUser(user.id);
  }, [app.gateway, app.profiles, user?.id]);

  if (!username) return <Redirect href="/" />;

  if (isLoading) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!user || error) {
    return (
      <Screen style={{ justifyContent: "center", padding: 24 }}>
        <Typography style={{ textAlign: "center" }}>User not found</Typography>
      </Screen>
    );
  }

  return (
    <Screen style={{ flexDirection: "column" }}>
      <ScreenHeader safeTop>
        <IconButton padding={8} onPress={() => router.back()}>
          <ArrowLeftIcon size={20} />
        </IconButton>
        <Typography level="body-md" weight="bold" style={{ flex: 1 }}>
          Profile
        </Typography>
      </ScreenHeader>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: "center",
        }}
      >
        <UserProfileSheet user={user} modalId="public-profile" />
      </ScrollView>
    </Screen>
  );
};

export default observer(PublicProfileScreen);
