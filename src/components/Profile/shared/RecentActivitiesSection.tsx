import { ActivityIcon } from "@components/Presence/ActivityIcon";
import { useAppStore } from "@hooks/useStores";
import type { PresenceActivity, PresenceActivityAssets } from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import {
  activityTypeLabelKey,
  formatActivityPrimary,
  formatActivitySecondary,
} from "@utils/activityDisplay";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
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

function toPresenceActivity(row: RecentActivityDto): PresenceActivity {
  return {
    type: row.type,
    name: row.name,
    ...(row.applicationId ? { applicationId: row.applicationId } : {}),
    ...(row.details ? { details: row.details } : {}),
    ...(row.state ? { state: row.state } : {}),
    ...(row.url ? { url: row.url } : {}),
    ...(row.assets ? { assets: row.assets } : {}),
  };
}

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
  const { t: tCommon } = useTranslation("common");
  const { theme } = useTheme();
  const app = useAppStore();
  const iconSize = isCompact ? 18 : 22;

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
        const activity = toPresenceActivity(row);
        const typeKey = activityTypeLabelKey(activity.type);
        const secondary = formatActivitySecondary(activity);
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
            <ActivityIcon
              activity={activity}
              size={iconSize}
              color={theme.colors.primary}
              fetchFallback
              borderRadius={6}
            />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              {typeKey ? (
                <Typography
                  level="body-xs"
                  textColor="muted"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    fontWeight: "700",
                    fontSize: 10,
                  }}
                >
                  {tCommon(typeKey)}
                </Typography>
              ) : null}
              <Typography
                level={isCompact ? "body-xs" : "body-sm"}
                weight="bold"
              >
                {formatActivityPrimary(activity)}
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
