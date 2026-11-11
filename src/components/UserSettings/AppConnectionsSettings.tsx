import { Button } from "@components/Button";
import {
  SettingsActionRow,
  SettingsScroll,
  SettingsSection,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import {
  USER_CONNECTIONS_QUERY_KEY,
  type ConnectionProvider,
  type ProviderConnectionDto,
} from "@mutualzz/client";
import {
  DiscordLogoIcon,
  GithubLogoIcon,
  LinkSimpleIcon,
  SteamLogoIcon,
  TwitchLogoIcon,
} from "phosphor-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Alert, Linking, View } from "react-native";
import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "phosphor-react-native";

const PROVIDER_ICONS: Record<ConnectionProvider, ComponentType<IconProps>> = {
  github: GithubLogoIcon,
  twitch: TwitchLogoIcon,
  steam: SteamLogoIcon,
};

function ConnectionCard({
  icon,
  name,
  status,
  action,
  connected,
  shareTitle,
  shareDescription,
  shareChecked,
  onShareChange,
  sharePending,
  externalUrl,
  openProfileLabel,
}: {
  icon: ReactNode;
  name: string;
  status: string;
  action: ReactNode;
  connected: boolean;
  shareTitle: string;
  shareDescription: string;
  shareChecked: boolean;
  onShareChange: (checked: boolean) => void;
  sharePending?: boolean;
  externalUrl?: string | null;
  openProfileLabel: string;
}) {
  return (
    <SettingsSection>
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
          {icon}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-md" weight="bold">
              {name}
            </Typography>
            <Typography level="body-sm" textColor="muted">
              {status}
            </Typography>
          </View>
        </View>
        {action}
      </View>

      {connected ? (
        <>
          <Divider />
          <SettingsToggleRow
            title={shareTitle}
            description={shareDescription}
            checked={shareChecked}
            disabled={sharePending}
            onChange={onShareChange}
          />
          {externalUrl ? (
            <Button
              size="sm"
              variant="plain"
              startDecorator={<LinkSimpleIcon size={16} />}
              onPress={() => Linking.openURL(externalUrl)}
            >
              {openProfileLabel}
            </Button>
          ) : null}
        </>
      ) : null}
    </SettingsSection>
  );
}

export const AppConnectionsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: USER_CONNECTIONS_QUERY_KEY,
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
      Alert.alert(
        t("connections.connectFailed"),
        t("connections.connectError"),
      );
    },
  });

  const disconnectProviderMutation = useMutation({
    mutationFn: (provider: ConnectionProvider) =>
      app.rest.delete(`/@me/connections/${provider}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_CONNECTIONS_QUERY_KEY,
      });
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
      await queryClient.invalidateQueries({
        queryKey: USER_CONNECTIONS_QUERY_KEY,
      });
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

  const providers = providersQuery.data?.providers ?? [];
  const isDiscordLinked = Boolean(app.account?.discordId);

  const toggleDiscordLink = () => {
    const account = app.account;
    if (!account) return;

    if (account.discordId) {
      confirmDisconnect("Discord", () => {
        void app.rest.delete("/@me/discord").then(() => {
          account.discordId = null;
        });
      });
      return;
    }

    void app.rest
      .get<{ url: string }>("/@me/discord/link?client=mobile")
      .then(({ url }) => Linking.openURL(url));
  };

  return (
    <SettingsScroll>
      <SettingsSection>
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <DiscordLogoIcon size={24} weight="fill" />
          <Box style={{ flex: 1 }}>
            <SettingsActionRow
              title="Discord"
              description={
                isDiscordLinked
                  ? t("connections.discord.linked")
                  : t("connections.discord.unlinked")
              }
              actionLabel={
                isDiscordLinked
                  ? t("discord.unlinkDiscord")
                  : t("discord.linkDiscord")
              }
              actionColor={isDiscordLinked ? "danger" : "primary"}
              onPress={toggleDiscordLink}
            />
          </Box>
        </Box>
      </SettingsSection>
      {providers.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.provider];
        const status = provider.connected
          ? provider.displayName ||
            t(`connections.${provider.provider}.connected`)
          : provider.available
            ? t(`connections.${provider.provider}.disconnected`)
            : t("connections.notConfigured");

        return (
          <ConnectionCard
            key={provider.provider}
            icon={<Icon size={24} weight="fill" />}
            name={t(`connections.${provider.provider}.name`)}
            status={status}
            connected={provider.connected}
            shareTitle={t("connections.showOnProfile")}
            shareDescription={t("connections.showOnProfileDescription")}
            shareChecked={provider.shareOnProfile}
            sharePending={shareProviderMutation.isPending}
            onShareChange={(checked) =>
              shareProviderMutation.mutate({
                provider: provider.provider,
                shareOnProfile: checked,
              })
            }
            externalUrl={provider.externalUrl}
            openProfileLabel={t("connections.openProfile")}
            action={
              provider.connected ? (
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
              )
            }
          />
        );
      })}
    </SettingsScroll>
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
