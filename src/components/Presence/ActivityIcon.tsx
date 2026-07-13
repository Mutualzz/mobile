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
} from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Image, View } from "react-native";

type GameIconResponse = {
  iconImageId: string;
  iconUrl: string;
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

  const catalogUrl = useMemo(() => {
    if (activity.type !== "playing" || broken) return null;
    return resolvePlayingActivityIconUrl(
      activity.name,
      Math.max(size, 32),
      activity.applicationId
    );
  }, [activity.applicationId, activity.name, activity.type, broken, size]);

  const { data } = useQuery({
    queryKey: ["activity-icon", activity.applicationId ?? activity.name],
    enabled:
      fetchFallback &&
      activity.type === "playing" &&
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

  const url =
    activity.type === "playing" && !broken
      ? catalogUrl ?? data?.iconUrl ?? null
      : null;

  if (url) {
    return (
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
