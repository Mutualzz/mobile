import { ActivityIcon } from "@components/Presence/ActivityIcon";
import { useNow } from "@hooks/useNow";
import type { PresenceActivity } from "@mutualzz/types";
import { formatColor } from "@mutualzz/ui-core";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretUpIcon,
  MusicNotesIcon,
} from "phosphor-react-native";
import { useLyricLine } from "@hooks/useLyricLine";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  activityLinkHost,
  activityTypeLabelKey,
  formatActivityElapsedClock,
  formatActivityPrimary,
  formatTrackClock,
  getActivityProgress,
} from "@mutualzz/client";

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

const typeLabelStyle = {
  textTransform: "uppercase" as const,
  letterSpacing: 0.4,
  fontWeight: "700" as const,
  fontSize: 10,
};

const trackTimeStyle = {
  fontSize: 10,
  fontVariant: ["tabular-nums" as const],
};

function activityKey(activities: PresenceActivity[]) {
  return activities
    .map((activity) => `${activity.type}:${activity.name}`)
    .join("|");
}

function useActivityCardStyle() {
  const { theme } = useTheme();
  return useMemo(
    () => ({
      gap: 8,
      minWidth: 0,
      padding: 10,
      borderRadius: 10,
      backgroundColor: formatColor(theme.typography.colors.primary, {
        format: "hexa",
        alpha: 6,
      }),
    }),
    [theme.typography.colors.primary],
  );
}

function CompactActivityRow({
  activity,
  accent,
  iconSize,
  fetchFallback,
  t,
}: {
  activity: PresenceActivity;
  accent: string;
  iconSize: number;
  fetchFallback: boolean;
  t: TranslateFn;
}) {
  const typeKey = activityTypeLabelKey(activity.type);
  const typeLabel = typeKey ? t(typeKey) : null;

  return (
    <Stack direction="row" alignItems="center" style={{ gap: 8, minWidth: 0 }}>
      <ActivityIcon
        activity={activity}
        size={iconSize}
        color={accent}
        fetchFallback={fetchFallback}
        borderRadius={8}
      />
      <Typography
        level="body-xs"
        textColor="accent"
        weight="bold"
        truncate="double"
        style={{ flex: 1, minWidth: 0 }}
      >
        {typeLabel
          ? `${typeLabel} ${formatActivityPrimary(activity)}`
          : formatActivityPrimary(activity)}
      </Typography>
    </Stack>
  );
}

function GameActivityCard({
  activity,
  accent,
  now,
  iconSize,
  fetchFallback,
  t,
}: {
  activity: PresenceActivity;
  accent: string;
  now: number;
  iconSize: number;
  fetchFallback: boolean;
  t: TranslateFn;
}) {
  const cardStyle = useActivityCardStyle();
  const typeKey = activityTypeLabelKey(activity.type);
  const typeLabel = typeKey ? t(typeKey) : null;
  const details = activity.details?.trim();
  const state = activity.state?.trim();
  const elapsed = formatActivityElapsedClock(activity.timestamps?.start, now);
  const activityUrl = activity.url;
  const linkHost = activityLinkHost(activityUrl);
  const smallImageUrl = activity.assets?.smallImageUrl;
  const badgeSize = Math.round(iconSize * 0.42);

  return (
    <Stack direction="column" style={cardStyle}>
      {typeLabel ? (
        <Typography level="body-xs" textColor="muted" style={typeLabelStyle}>
          {typeLabel}
        </Typography>
      ) : null}
      <Stack
        direction="row"
        alignItems="center"
        style={{ gap: 10, minWidth: 0 }}
      >
        <View>
          <ActivityIcon
            activity={activity}
            size={iconSize}
            color={accent}
            fetchFallback={fetchFallback}
            borderRadius={8}
          />
          {smallImageUrl ? (
            <Image
              source={{ uri: smallImageUrl }}
              style={{
                position: "absolute",
                right: -4,
                bottom: -4,
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
              }}
            />
          ) : null}
        </View>
        <Stack direction="column" style={{ gap: 3, minWidth: 0, flex: 1 }}>
          <Typography
            level="body-sm"
            textColor="accent"
            weight="bold"
            truncate="single"
          >
            {activity.name}
          </Typography>
          {details ? (
            <Typography level="body-xs" truncate="single">
              {details}
            </Typography>
          ) : null}
          {state && state !== details ? (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {state}
            </Typography>
          ) : null}
          {elapsed ? (
            <Typography
              level="body-xs"
              textColor="muted"
              style={trackTimeStyle}
            >
              {t("activity.elapsed", { time: elapsed })}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
      {activityUrl && linkHost ? (
        <Pressable
          onPress={() =>
            Linking.openURL(activityUrl).catch(() => {
              return;
            })
          }
          style={{ alignSelf: "flex-start" }}
        >
          <Stack direction="row" alignItems="center" style={{ gap: 4 }}>
            <Typography
              level="body-xs"
              style={{ textDecorationLine: "underline", opacity: 0.85 }}
            >
              {linkHost}
            </Typography>
            <ArrowSquareOutIcon size={12} weight="bold" color={accent} />
          </Stack>
        </Pressable>
      ) : null}
    </Stack>
  );
}

function ListeningActivityRow({
  activity,
  accent,
  now,
  iconSize,
  t,
}: {
  activity: PresenceActivity;
  accent: string;
  now: number;
  iconSize: number;
  t: TranslateFn;
}) {
  const cardStyle = useActivityCardStyle();
  const typeKey = activityTypeLabelKey(activity.type);
  const typeLabel = typeKey ? t(typeKey) : null;
  const title = activity.details?.trim() || activity.name;
  const artist = activity.state?.trim();
  const progress = getActivityProgress(activity, now);
  const lyricLine = useLyricLine(activity);

  return (
    <Stack direction="column" style={cardStyle}>
      <Typography level="body-xs" textColor="muted" style={typeLabelStyle}>
        {typeLabel ? `${typeLabel} · ${activity.name}` : activity.name}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        style={{ gap: 10, minWidth: 0 }}
      >
        <ActivityIcon
          activity={activity}
          size={iconSize}
          color={accent}
          borderRadius={8}
        />
        <Stack direction="column" style={{ gap: 3, minWidth: 0, flex: 1 }}>
          <Typography
            level="body-sm"
            textColor="accent"
            weight="bold"
            truncate="single"
          >
            {title}
          </Typography>
          {artist ? (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {artist}
            </Typography>
          ) : null}
          {lyricLine ? (
            <Stack
              direction="row"
              alignItems="center"
              style={{ gap: 4, minWidth: 0 }}
            >
              <MusicNotesIcon size={12} weight="fill" color={accent} />
              <Typography
                level="body-xs"
                truncate="single"
                style={{ fontStyle: "italic", flex: 1, minWidth: 0 }}
              >
                {lyricLine}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </Stack>
      {progress ? (
        <Stack direction="column" style={{ gap: 3 }}>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: `${accent}33`,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progress.fraction * 100}%`,
                borderRadius: 2,
                backgroundColor: accent,
              }}
            />
          </View>
          <Stack direction="row" justifyContent="space-between">
            <Typography
              level="body-xs"
              textColor="muted"
              style={trackTimeStyle}
            >
              {formatTrackClock(progress.elapsedMs)}
            </Typography>
            <Typography
              level="body-xs"
              textColor="muted"
              style={trackTimeStyle}
            >
              {formatTrackClock(progress.durationMs)}
            </Typography>
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}

export const PresenceActivitiesList = observer(function PresenceActivitiesList({
  activities,
  iconSize = 48,
  fetchFallback = false,
  collapsible = true,
  isCompact = false,
  scrollWhenExpanded = false,
}: {
  activities: PresenceActivity[];
  iconSize?: number;
  fetchFallback?: boolean;
  collapsible?: boolean;
  isCompact?: boolean;
  scrollWhenExpanded?: boolean;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation("common");
  const now = useNow(1000);
  const [expanded, setExpanded] = useState(false);

  const activitiesSignature = useMemo(
    () => activityKey(activities),
    [activities],
  );

  useEffect(() => {
    setExpanded(false);
  }, [activitiesSignature]);

  if (!activities.length) return null;

  const firstListening = activities.find(
    (activity) => activity.type === "listening",
  );
  const collapsedActivities =
    firstListening && firstListening !== activities[0]
      ? [activities[0], firstListening]
      : activities.slice(0, 1);
  const canCollapse =
    collapsible && activities.length > collapsedActivities.length;
  const visibleActivities =
    canCollapse && !expanded ? collapsedActivities : activities;
  const hiddenCount = activities.length - collapsedActivities.length;
  const accent = theme.colors.success;
  const useScroll = scrollWhenExpanded && expanded && canCollapse;

  const toggle = () => setExpanded((open) => !open);

  const rowGap = isCompact ? 6 : 10;

  const activityRows = visibleActivities.map((activity, index) => {
    const key = `${activity.type}-${activity.name}-${index}`;
    if (isCompact) {
      return (
        <CompactActivityRow
          key={key}
          activity={activity}
          accent={accent}
          iconSize={iconSize}
          fetchFallback={fetchFallback}
          t={t}
        />
      );
    }
    if (activity.type === "listening") {
      return (
        <ListeningActivityRow
          key={key}
          activity={activity}
          accent={accent}
          now={now}
          iconSize={iconSize}
          t={t}
        />
      );
    }
    return (
      <GameActivityCard
        key={key}
        activity={activity}
        accent={accent}
        now={now}
        iconSize={iconSize}
        fetchFallback={fetchFallback}
        t={t}
      />
    );
  });

  const collapseControl = canCollapse ? (
    <Pressable onPress={expanded ? toggle : undefined}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        style={{ gap: 4, opacity: 0.65 }}
      >
        {!expanded ? (
          <>
            <Typography level="body-xs">+{hiddenCount}</Typography>
            <CaretDownIcon size={12} weight="bold" color={accent} />
          </>
        ) : (
          <>
            <Typography level="body-xs">{t("activity.showLess")}</Typography>
            <CaretUpIcon size={12} weight="bold" color={accent} />
          </>
        )}
      </Stack>
    </Pressable>
  ) : null;

  const rowsContainer = useScroll ? (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      contentContainerStyle={{ gap: rowGap }}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      {activityRows}
    </ScrollView>
  ) : (
    <Stack direction="column" style={{ gap: rowGap, minWidth: 0 }}>
      {activityRows}
    </Stack>
  );

  if (!canCollapse) {
    return (
      <Stack direction="column" style={{ gap: rowGap, minWidth: 0 }}>
        {activityRows}
      </Stack>
    );
  }

  if (!expanded) {
    return (
      <Pressable onPress={toggle}>
        <Stack direction="column" style={{ gap: rowGap, minWidth: 0 }}>
          {activityRows}
          {collapseControl}
        </Stack>
      </Pressable>
    );
  }

  return (
    <Stack
      direction="column"
      style={{
        gap: rowGap,
        minWidth: 0,
        flex: scrollWhenExpanded ? 1 : undefined,
        minHeight: scrollWhenExpanded ? 0 : undefined,
        overflow: "hidden",
      }}
    >
      {rowsContainer}
      {collapseControl}
    </Stack>
  );
});
