import { ActivityIcon } from "@components/Presence/ActivityIcon";
import { useNow } from "@hooks/useNow";
import type { PresenceActivity } from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { CaretDownIcon, CaretUpIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import {
  activityTypeLabelKey,
  formatActivityElapsedClock,
  formatActivityPrimary,
  formatActivitySecondary,
} from "@utils/activityDisplay";

function activityKey(activities: PresenceActivity[]) {
  return activities.map((a) => `${a.type}:${a.name}`).join("|");
}

function ActivityRow({
  activity,
  accent,
  now,
  iconSize,
  fetchFallback,
  t,
  isCompact,
}: {
  activity: PresenceActivity;
  accent: string;
  now: number;
  iconSize: number;
  fetchFallback: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
  isCompact: boolean;
}) {
  const typeKey = activityTypeLabelKey(activity.type);
  const typeLabel = typeKey ? t(typeKey) : null;
  const secondary = formatActivitySecondary(activity);
  const elapsed = formatActivityElapsedClock(activity.timestamps?.start, now);

  return (
    <Stack direction="row" alignItems="center" style={{ gap: 8, minWidth: 0 }}>
      <ActivityIcon
        activity={activity}
        size={iconSize}
        color={accent}
        fetchFallback={fetchFallback}
        borderRadius={8}
      />
      <Stack direction="column" style={{ gap: 1, minWidth: 0, flex: 1 }}>
        {typeLabel && !isCompact ? (
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
            {typeLabel}
          </Typography>
        ) : null}
        <Typography
          level="body-xs"
          textColor="accent"
          weight="bold"
          truncate="double"
        >
          {isCompact && typeLabel
            ? `${typeLabel} ${formatActivityPrimary(activity)}`
            : formatActivityPrimary(activity)}
        </Typography>
        {!isCompact && secondary ? (
          <Typography level="body-xs" textColor="muted" truncate="double">
            {secondary}
          </Typography>
        ) : null}
        {!isCompact && elapsed ? (
          <Typography
            level="body-xs"
            textColor="muted"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {t("activity.elapsed", { time: elapsed })}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

export const PresenceActivitiesList = observer(function PresenceActivitiesList({
  activities,
  iconSize = 36,
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

  const canCollapse = collapsible && activities.length > 1;
  const visibleActivities =
    canCollapse && !expanded ? activities.slice(0, 1) : activities;
  const hiddenCount = activities.length - 1;
  const accent = theme.colors.success;
  const useScroll = scrollWhenExpanded && expanded && canCollapse;

  const toggle = () => setExpanded((open) => !open);

  const activityRows = visibleActivities.map((activity, index) => (
    <ActivityRow
      key={`${activity.type}-${activity.name}-${index}`}
      activity={activity}
      accent={accent}
      now={now}
      iconSize={iconSize}
      fetchFallback={fetchFallback}
      t={t}
      isCompact={isCompact}
    />
  ));

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
      contentContainerStyle={{ gap: isCompact ? 6 : 8 }}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      {activityRows}
    </ScrollView>
  ) : (
    <Stack direction="column" style={{ gap: isCompact ? 6 : 8, minWidth: 0 }}>
      {activityRows}
    </Stack>
  );

  if (!canCollapse) {
    return (
      <Stack direction="column" style={{ gap: isCompact ? 6 : 8, minWidth: 0 }}>
        {activityRows}
      </Stack>
    );
  }

  if (!expanded) {
    return (
      <Pressable onPress={toggle}>
        <Stack direction="column" style={{ gap: isCompact ? 6 : 8, minWidth: 0 }}>
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
        gap: isCompact ? 6 : 8,
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
