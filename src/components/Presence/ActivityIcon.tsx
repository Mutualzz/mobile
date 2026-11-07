import { useAppStore } from "@hooks/useStores";
import { resolvePlayingActivityIconUrl } from "@presence/gameIcon";
import type { PresenceActivity, PresenceActivityType } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import {
  GameControllerIcon,
  HeadphonesIcon,
  NotepadIcon,
  SpotifyLogoIcon,
  AmazonLogoIcon,
  AppleLogoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Image, View } from "react-native";

interface GameIconResponse {
  iconImageId: string;
  iconUrl: string;
}

const MEDIA_APP_ICONS: Record<string, { icon: Icon; color: string }> = {
  spotify: { icon: SpotifyLogoIcon, color: "#1DB954" },
  "apple-music": { icon: AppleLogoIcon, color: "#FA2D48" },
  "amazon-music": { icon: AmazonLogoIcon, color: "#25D1DA" },
  "youtube-music": { icon: YoutubeLogoIcon, color: "#FF0033" },
};

function ActivityTypeIcon({
  type,
  color,
  size,
}: {
  type: PresenceActivityType;
  color: string;
  size: number;
}) {
  switch (type) {
    case "playing":
      return <GameControllerIcon size={size} weight="fill" color={color} />;
    case "listening":
      return <HeadphonesIcon size={size} weight="fill" color={color} />;
    default:
      return <NotepadIcon size={size} weight="fill" color={color} />;
  }
}

export const ActivityIcon = observer(function ActivityIcon({
  activity,
  size = 16,
  color,
  borderRadius = 8,
  fetchFallback = false,
}: {
  activity: PresenceActivity;
  size?: number;
  color?: string;
  borderRadius?: number;
  fetchFallback?: boolean;
}) {
  const app = useAppStore();
  const { theme } = useTheme();
  const [broken, setBroken] = useState(false);
  const iconColor = color ?? theme.colors.success;

  const assetUrl = useMemo(() => {
    if (broken) return null;
    return activity.assets?.largeImageUrl?.trim() || null;
  }, [activity.assets?.largeImageUrl, broken]);

  const catalogUrl = useMemo(() => {
    if (assetUrl || activity.type !== "playing" || broken) return null;
    return resolvePlayingActivityIconUrl(
      activity.name,
      Math.max(size, 32),
      activity.applicationId,
    );
  }, [
    activity.applicationId,
    activity.name,
    activity.type,
    assetUrl,
    broken,
    size,
  ]);

  const { data } = useQuery({
    queryKey: ["activity-icon", activity.applicationId ?? activity.name],
    enabled:
      fetchFallback &&
      activity.type === "playing" &&
      !assetUrl &&
      !catalogUrl &&
      !broken,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: async () => {
      try {
        return await app.rest.get<GameIconResponse>("/games/icon", {
          q: activity.name,
        });
      } catch {
        return null;
      }
    },
  });

  const url = useMemo(() => {
    if (broken) return null;
    if (assetUrl) return assetUrl;
    if (activity.type !== "playing") return null;
    return catalogUrl ?? data?.iconUrl ?? null;
  }, [activity.type, assetUrl, broken, catalogUrl, data?.iconUrl]);

  const mediaApp =
    activity.type === "listening" && activity.applicationId
      ? MEDIA_APP_ICONS[activity.applicationId]
      : undefined;

  if (url) {
    const image = (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        onError={() => setBroken(true)}
      />
    );

    if (!mediaApp || size < 32) return image;

    const BadgeIcon = mediaApp.icon;
    const badgeSize = Math.round(size * 0.36);
    return (
      <View>
        {image}
        <View
          style={{
            position: "absolute",
            right: -3,
            bottom: -3,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: "#000",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BadgeIcon
            size={Math.round(badgeSize * 0.9)}
            weight="fill"
            color={mediaApp.color}
          />
        </View>
      </View>
    );
  }

  if (mediaApp) {
    const BrandIcon = mediaApp.icon;
    return <BrandIcon size={size} weight="fill" color={mediaApp.color} />;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${iconColor}22`,
      }}
    >
      <ActivityTypeIcon
        type={activity.type}
        color={iconColor}
        size={Math.max(12, Math.round(size * 0.55))}
      />
    </View>
  );
});
