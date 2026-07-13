import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppStore } from "@hooks/useStores";
import { Divider, Switch, Typography } from "@mutualzz/ui-native";
import {
  GithubLogoIcon,
  LinkSimpleIcon,
  SpotifyLogoIcon,
  SteamLogoIcon,
  TwitchLogoIcon,
} from "phosphor-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Alert, Linking, ScrollView, View } from "react-native";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";

type ConnectionProvider = "github" | "twitch" | "steam";

type ProviderConnectionDto = {
  provider: ConnectionProvider;
  available: boolean;
  connected: boolean;
  displayName: string | null;
  externalUrl: string | null;
  shareOnProfile: boolean;
  expired?: boolean;
};

type SpotifyConnectionDto =
  | { connected: false; available: boolean }
  | {
      connected: true;
      displayName: string | null;
      externalUrl: string | null;
      shareSpotify: boolean;
      available: boolean;
      expired?: boolean;
    };

const PROVIDER_ICONS: Record<
  ConnectionProvider | "spotify",
  ComponentType<IconProps>
> = {
  github: GithubLogoIcon,
  twitch: TwitchLogoIcon,
  steam: SteamLogoIcon,
  spotify: SpotifyLogoIcon,
};

export const AppConnectionsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const queryClient = useQueryClient();

  const connectionQuery = useQuery({
    queryKey: ["spotify-connection"],
    queryFn: () => app.rest.get<SpotifyConnectionDto>("/@me/spotify"),
    staleTime: 60_000,
  });

  const providersQuery = useQuery({
    queryKey: ["user-connections"],
    queryFn: () =>
      app.rest.get<{ providers: ProviderConnectionDto[] }>("/@me/connections"),
    staleTime: 30_000,
  });

  const connectProviderMutation = useMutation({
    mutationFn: async (provider: ConnectionProvider) => {
      const returnTo = "mutualzz://connections/connected";
      const { url } = await app.rest.post<
        { url: string },
        { returnTo: string }
      >(`/@me/connections/${provider}/oauth`, { returnTo });
      await Linking.openURL(url);
    },
    onError: () => {
      Alert.alert(t("connections.connectFailed"), t("connections.connectError"));
    },
  });

  const disconnectProviderMutation = useMutation({
    mutationFn: (provider: ConnectionProvider) =>
      app.rest.delete(`/@me/connections/${provider}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-connections"] });
    },
  });

  const shareProviderMutation = useMutation({
    mutationFn: (opts: {
      provider: ConnectionProvider;
      shareOnProfile: boolean;
    }) =>
      app.rest.patch(`/@me/connections/${opts.provider}`, {
        shareOnProfile: opts.shareOnProfile,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-connections"] });
    },
  });

  const connectSpotifyMutation = useMutation({
    mutationFn: async () => {
      const { url } = await app.rest.post<
        { url: string },
        { returnTo: string }
      >("/@me/spotify/oauth", {
        returnTo: "mutualzz://spotify/connected",
      });
      await Linking.openURL(url);
    },
    onError: () => {
      Alert.alert(
        t("connections.connectFailed"),
        t("connections.spotify.connectError"),
      );
    },
  });

  const disconnectSpotifyMutation = useMutation({
    mutationFn: () => app.rest.delete("/@me/spotify"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spotify-connection"] });
    },
  });

  const shareSpotifyMutation = useMutation({
    mutationFn: (shareSpotify: boolean) =>
      app.rest.patch("/@me/spotify", { shareSpotify }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spotify-connection"] });
    },
  });

  const confirmDisconnect = (name: string, onConfirm: () => void) => {
    Alert.alert(
      t("connections.disconnectConfirm.title", { name }),
      t("connections.disconnectConfirm.body", { name }),
      [
        {
          text: t("connections.disconnectConfirm.confirm"),
          style: "destructive",
          onPress: onConfirm,
        },
        { text: tCommon("cancel"), style: "cancel" },
      ],
    );
  };

  const spotify = connectionQuery.data;
  const providers = providersQuery.data?.providers ?? [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
    >
      <Typography level="body-sm" textColor="muted">
        {t("connections.title")}
      </Typography>

      <Paper
        style={{
          borderRadius: 12,
          padding: 14,
          flexDirection: "column",
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <SpotifyLogoIcon size={24} weight="fill" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-md" weight="bold">
                {t("connections.spotify.name")}
              </Typography>
              <Typography level="body-sm" textColor="muted">
                {spotify?.connected
                  ? spotify.displayName || t("connections.spotify.connected")
                  : spotify?.available
                    ? t("connections.spotify.disconnected")
                    : t("connections.spotify.unavailable")}
              </Typography>
            </View>
          </View>
          {spotify?.connected ? (
            <Button
              size="sm"
              color="danger"
              variant="outlined"
              onPress={() =>
                confirmDisconnect(t("connections.spotify.name"), () =>
                  disconnectSpotifyMutation.mutate(),
                )
              }
            >
              {t("connections.spotify.disconnect")}
            </Button>
          ) : spotify?.available ? (
            <Button
              size="sm"
              loading={connectSpotifyMutation.isPending}
              onPress={() => connectSpotifyMutation.mutate()}
            >
              {t("connections.spotify.connect")}
            </Button>
          ) : null}
        </View>

        {spotify?.connected && (
          <>
            <Divider />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Typography level="body-md" weight="bold">
                  {t("connections.spotify.showActivity")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                  {t("connections.spotify.showActivityDescription")}
                </Typography>
              </View>
              <Switch
                checked={spotify.shareSpotify}
                onChange={(checked) => shareSpotifyMutation.mutate(checked)}
              />
            </View>
            {spotify.externalUrl ? (
              <Button
                size="sm"
                variant="plain"
                startDecorator={<LinkSimpleIcon size={16} />}
                onPress={() => Linking.openURL(spotify.externalUrl!)}
              >
                {t("connections.openProfile")}
              </Button>
            ) : null}
          </>
        )}
      </Paper>

      {providers.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.provider];
        return (
          <Paper
            key={provider.provider}
            style={{
              borderRadius: 12,
              padding: 14,
              flexDirection: "column",
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <Icon size={24} weight="fill" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography level="body-md" weight="bold">
                    {t(`connections.${provider.provider}.name`)}
                  </Typography>
                  <Typography level="body-sm" textColor="muted">
                    {provider.connected
                      ? provider.displayName ||
                        t(`connections.${provider.provider}.connected`)
                      : provider.available
                        ? t(`connections.${provider.provider}.disconnected`)
                        : t("connections.notConfigured")}
                  </Typography>
                </View>
              </View>
              {provider.connected ? (
                <Button
                  size="sm"
                  color="danger"
                  variant="outlined"
                  onPress={() =>
                    confirmDisconnect(
                      t(`connections.${provider.provider}.name`),
                      () =>
                        disconnectProviderMutation.mutate(provider.provider),
                    )
                  }
                >
                  {t(`connections.${provider.provider}.disconnect`)}
                </Button>
              ) : provider.available ? (
                <Button
                  size="sm"
                  loading={
                    connectProviderMutation.isPending &&
                    connectProviderMutation.variables === provider.provider
                  }
                  onPress={() =>
                    connectProviderMutation.mutate(provider.provider)
                  }
                >
                  {t(`connections.${provider.provider}.connect`)}
                </Button>
              ) : (
                <Typography level="body-sm" textColor="muted">
                  {t("connections.unavailable")}
                </Typography>
              )}
            </View>

            {provider.connected && (
              <>
                <Divider />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Typography level="body-md" weight="bold">
                      {t("connections.showOnProfile")}
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                      {t("connections.showOnProfileDescription")}
                    </Typography>
                  </View>
                  <Switch
                    checked={provider.shareOnProfile}
                    onChange={(checked) =>
                      shareProviderMutation.mutate({
                        provider: provider.provider,
                        shareOnProfile: checked,
                      })
                    }
                  />
                </View>
                {provider.externalUrl ? (
                  <Button
                    size="sm"
                    variant="plain"
                    startDecorator={<LinkSimpleIcon size={16} />}
                    onPress={() => Linking.openURL(provider.externalUrl!)}
                  >
                    {t("connections.openProfile")}
                  </Button>
                ) : null}
              </>
            )}
          </Paper>
        );
      })}
    </ScrollView>
  );
});

export const AppConnectionsSettingsScreen = observer(() => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.connections")} contentStyle={{ flex: 1 }}>
      <AppConnectionsSettings />
    </SettingsScreen>
  );
});
