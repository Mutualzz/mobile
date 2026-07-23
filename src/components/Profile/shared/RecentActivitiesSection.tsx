import { ActivityIcon } from "@components/Presence/ActivityIcon";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { PresenceActivity, PresenceActivityAssets } from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import {
  formatActivityPrimary,
  formatActivitySecondary,
} from "@mutualzz/client";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CaretDownIcon, CaretUpIcon } from "phosphor-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, View } from "react-native";

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

function dedupeRecent(rows: RecentActivityDto[]) {
  const seen = new Set<string>();
  const out: RecentActivityDto[] = [];
  for (const row of rows) {
    const key = activityIdentity(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
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
          width: isCompact ? 28 : 36,
          height: isCompact ? 28 : 36,
          borderRadius: 8,
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
  const [expanded, setExpanded] = useState(false);
  const iconSize = isCompact ? 28 : 36;
  const accent = theme.colors.success;

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
      dedupeRecent(
        (data?.activities ?? []).filter(
          (row) => !liveKeys.has(activityIdentity(row)),
        ),
      ),
    [data?.activities, liveKeys],
  );

  const activitiesSignature = useMemo(
    () => recent.map(activityIdentity).join("|"),
    [recent],
  );

  useEffect(() => {
    setExpanded(false);
  }, [activitiesSignature]);

  const canCollapse = recent.length > 1;
  const visible = canCollapse && !expanded ? recent.slice(0, 1) : recent;
  const hiddenCount = recent.length - 1;

  const cardStyle = {
    padding: 10,
    borderRadius: 8,
    gap: 8,
    backgroundColor: `${theme.colors.surface}cc`,
    borderWidth: 1,
    borderColor: `${theme.colors.neutral}22`,
  } as const;

  if (isPending) {
    if (isCompact) return null;

    return (
      <Paper elevation={1} style={cardStyle}>
        <SkeletonRow isCompact={isCompact} surface={theme.colors.surface} />
        <SkeletonRow isCompact={isCompact} surface={theme.colors.surface} />
      </Paper>
    );
  }

  if (recent.length === 0) {
    if (!showEmpty) return null;
    return (
      <Paper elevation={1} style={cardStyle}>
        <Typography level="body-xs" textColor="muted">
          {t("profile.blocks.noRecentActivity")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Pressable
      disabled={!canCollapse || expanded}
      onPress={() => setExpanded(true)}
    >
      <Paper elevation={1} style={cardStyle}>
        {visible.map((row) => {
          const activity = toPresenceActivity(row);
          const typeKey =
            row.type === "listening"
              ? "activity.listened"
              : "activity.played";
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
              style={{ gap: 8, minWidth: 0 }}
            >
              <ActivityIcon
                activity={activity}
                size={iconSize}
                color={accent}
                fetchFallback
                borderRadius={8}
              />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                {!isCompact ? (
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
                  level="body-xs"
                  textColor="accent"
                  weight="bold"
                  truncate="double"
                >
                  {isCompact
                    ? `${tCommon(typeKey)} ${formatActivityPrimary(activity)}`
                    : formatActivityPrimary(activity)}
                </Typography>
                {!isCompact && secondary ? (
                  <Typography
                    level="body-xs"
                    textColor="muted"
                    truncate="single"
                  >
                    {secondary}
                  </Typography>
                ) : null}
                <Typography
                  level="body-xs"
                  textColor="muted"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
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

        {canCollapse ? (
          <Pressable
            disabled={!expanded}
            onPress={() => setExpanded(false)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              opacity: 0.65,
            }}
          >
            {!expanded ? (
              <>
                <Typography level="body-xs">+{hiddenCount}</Typography>
                <CaretDownIcon size={12} weight="bold" color={accent} />
              </>
            ) : (
              <>
                <Typography level="body-xs">
                  {tCommon("activity.showLess")}
                </Typography>
                <CaretUpIcon size={12} weight="bold" color={accent} />
              </>
            )}
          </Pressable>
        ) : null}
      </Paper>
    </Pressable>
  );
};
