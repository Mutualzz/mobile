import { ActivityIcon } from "@components/Presence/ActivityIcon";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { PresenceActivity, PresenceActivityAssets } from "@mutualzz/types";
import { Skeleton, Stack, Typography, useTheme } from "@mutualzz/ui-native";
import {
  formatActivityDuration,
  formatActivityPrimary,
  formatActivitySecondary,
} from "@mutualzz/client";
import { useProfileScrimStyle } from "@components/Profile/shared/ProfileScrim";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CaretDownIcon, CaretUpIcon } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

dayjs.extend(relativeTime);

interface RecentActivityDto {
  type: "playing" | "listening";
  name: string;
  applicationId?: string;
  details?: string;
  state?: string;
  url?: string;
  assets?: PresenceActivityAssets;
  startedAt: number | null;
  endedAt: number;
}

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

function SkeletonRow({
  isCompact,
  index,
}: {
  isCompact: boolean;
  index: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Skeleton variant="rounded" size={isCompact ? 28 : 36} />
      <View style={{ flex: 1 }}>
        <Skeleton width={index === 0 ? "55%" : "45%"} fontSize={13} />
        <Skeleton width="35%" fontSize={11} />
      </View>
    </View>
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
  const scrimStyle = useProfileScrimStyle();
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
    ...scrimStyle,
  };

  if (isPending) {
    if (isCompact) return null;

    return (
      <Paper elevation={1} style={cardStyle}>
        <SkeletonRow isCompact={isCompact} index={0} />
        <SkeletonRow isCompact={isCompact} index={1} />
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
            row.type === "listening" ? "activity.listened" : "activity.played";
          const secondary = formatActivitySecondary(activity);
          const duration = formatActivityDuration(row.startedAt, row.endedAt);
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
