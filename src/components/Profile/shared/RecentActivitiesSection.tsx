import { useAppStore } from "@hooks/useStores";
import type { PresenceActivity, PresenceActivityAssets } from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  GameControllerIcon,
  MusicNotesIcon,
  SpotifyLogoIcon,
} from "phosphor-react-native";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, View } from "react-native";

dayjs.extend(relativeTime);

type RecentActivityDto = {
  type: "playing" | "listening";
  name: string;
  applicationId?: string;
  details?: string;
  state?: string;
  url?: string;
  assets?: PresenceActivityAssets;
  startedAt: number | null;
  endedAt: number;
};

function activityIdentity(activity: {
  type: string;
  name: string;
  applicationId?: string;
}) {
  return `${activity.type}|${activity.applicationId ?? ""}|${activity.name}`;
}

function formatDuration(startedAt: number | null, endedAt: number) {
  if (startedAt == null || startedAt > endedAt) return null;
  const totalSec = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function SkeletonRow({
  isCompact,
  surface,
}: {
  isCompact: boolean;
  surface: string;
}) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        opacity,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          width: isCompact ? 18 : 22,
          height: isCompact ? 18 : 22,
          borderRadius: 6,
          backgroundColor: surface,
        }}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <View
          style={{
            height: 10,
            width: "55%",
            borderRadius: 4,
            backgroundColor: surface,
          }}
        />
        <View
          style={{
            height: 8,
            width: "35%",
            borderRadius: 4,
            backgroundColor: surface,
          }}
        />
      </View>
    </Animated.View>
  );
}

interface Props {
  userId: string;
  liveActivities?: PresenceActivity[];
  isCompact?: boolean;
  showEmpty?: boolean;
}

export const RecentActivitiesSection = ({
  userId,
  liveActivities = [],
  isCompact = false,
  showEmpty = false,
}: Props) => {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const app = useAppStore();

  const { data, isPending } = useQuery({
    queryKey: ["user-recent-activities", userId],
    queryFn: async () => {
      try {
        return await app.rest.get<{ activities: RecentActivityDto[] }>(
          `/users/${userId}/recent-activities`,
        );
      } catch {
        return { activities: [] as RecentActivityDto[] };
      }
    },
    staleTime: 60_000,
  });

  const liveKeys = useMemo(
    () => new Set(liveActivities.map(activityIdentity)),
    [liveActivities],
  );

  const recent = useMemo(
    () =>
      (data?.activities ?? []).filter(
        (row) => !liveKeys.has(activityIdentity(row)),
      ),
    [data?.activities, liveKeys],
  );

  const header = (
    <Typography
      level="body-xs"
      weight="bold"
      style={{ opacity: 0.65, textTransform: "uppercase" }}
    >
      {t("profile.blocks.recentActivity")}
    </Typography>
  );

  if (isPending) {
    return (
      <View style={{ gap: isCompact ? 4 : 6 }}>
        {header}
        <SkeletonRow isCompact={isCompact} surface={theme.colors.surface} />
        <SkeletonRow isCompact={isCompact} surface={theme.colors.surface} />
      </View>
    );
  }

  if (recent.length === 0) {
    if (!showEmpty) return null;
    return (
      <View style={{ gap: 4 }}>
        {header}
        <Typography level="body-xs" textColor="muted">
          {t("profile.blocks.noRecentActivity")}
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ gap: isCompact ? 4 : 6 }}>
      {header}
      {recent.map((row) => {
        const Icon =
          row.type === "listening"
            ? row.name.toLowerCase().includes("spotify")
              ? SpotifyLogoIcon
              : MusicNotesIcon
            : GameControllerIcon;
        const secondary = [row.details, row.state].filter(Boolean).join(" · ");
        const duration = formatDuration(row.startedAt, row.endedAt);
        const durationKey =
          row.type === "listening"
            ? "profile.blocks.listenedForEnded"
            : "profile.blocks.playedForEnded";
        return (
          <Stack
            key={`${activityIdentity(row)}-${row.endedAt}`}
            direction="row"
            alignItems="center"
            style={{ gap: 8 }}
          >
            <Icon
              size={isCompact ? 18 : 22}
              weight="fill"
              color={theme.colors.primary}
            />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Typography
                level={isCompact ? "body-xs" : "body-sm"}
                weight="bold"
              >
                {row.name}
              </Typography>
              {secondary ? (
                <Typography level="body-xs" textColor="muted" truncate="single">
                  {secondary}
                </Typography>
              ) : null}
              <Typography level="body-xs" textColor="muted">
                {duration
                  ? t(durationKey, {
                      duration,
                      time: dayjs(row.endedAt).fromNow(),
                    })
                  : t("profile.blocks.endedAgo", {
                      time: dayjs(row.endedAt).fromNow(),
                    })}
              </Typography>
            </View>
          </Stack>
        );
      })}
    </View>
  );
};
