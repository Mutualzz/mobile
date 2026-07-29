import { useAppStore } from "@hooks/useStores";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import {
  GithubLogoIcon,
  SpotifyLogoIcon,
  SteamLogoIcon,
  TwitchLogoIcon,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, View } from "react-native";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";

const CONNECTION_NAME_KEYS = {
  github: "connections.github.name",
  twitch: "connections.twitch.name",
  steam: "connections.steam.name",
  spotify: "connections.spotify.name",
} as const;

const PROVIDER_ICONS: Record<string, ComponentType<IconProps>> = {
  github: GithubLogoIcon,
  twitch: TwitchLogoIcon,
  steam: SteamLogoIcon,
  spotify: SpotifyLogoIcon,
};

interface Props {
  userId: string;
  showEmpty?: boolean;
}

export const ProfileConnectionsRow = ({
  userId,
  showEmpty = false,
}: Props) => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { theme } = useTheme();

  const { data: spotifyConnection, isPending: spotifyPending } = useQuery({
    queryKey: ["user-spotify", userId],
    queryFn: async () => {
      try {
        return await app.rest.get<{
          displayName: string | null;
          externalUrl: string | null;
        }>(`/users/${userId}/spotify`);
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const { data: userConnections, isPending: connectionsPending } = useQuery({
    queryKey: ["user-connections-public", userId],
    queryFn: async () => {
      try {
        return await app.rest.get<{
          connections: {
            provider: string;
            displayName: string | null;
            externalUrl: string | null;
          }[];
        }>(`/users/${userId}/connections`);
      } catch {
        return { connections: [] };
      }
    },
    staleTime: 60_000,
  });

  const items = [
    ...(spotifyConnection?.externalUrl
      ? [
          {
            provider: "spotify",
            displayName: spotifyConnection.displayName,
            externalUrl: spotifyConnection.externalUrl,
          },
        ]
      : []),
    ...(userConnections?.connections ?? []).filter((c) => c.externalUrl),
  ];

  if (spotifyPending || connectionsPending) {
    return null;
  }

  if (items.length === 0) {
    if (!showEmpty) return null;
    return (
      <Typography level="body-sm" textColor="muted">
        {t("profile.blocks.noConnectionsToShow")}
      </Typography>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((connection) => {
        const nameKey =
          CONNECTION_NAME_KEYS[
            connection.provider as keyof typeof CONNECTION_NAME_KEYS
          ];
        const label = nameKey ? t(nameKey) : connection.provider;
        const Icon = PROVIDER_ICONS[connection.provider];
        return (
          <Pressable
            key={connection.provider}
            onPress={() =>
              connection.externalUrl &&
              void Linking.openURL(connection.externalUrl)
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(127,127,127,0.35)",
              backgroundColor: theme.colors.surface,
            }}
          >
            {Icon ? <Icon size={14} weight="fill" /> : null}
            <Typography level="body-xs">
              {connection.displayName || label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
};
