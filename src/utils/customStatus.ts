import type {
  CustomStatusSnapshot,
  PresenceActivity,
  PresenceActivityEmoji,
  PresencePayload,
} from "@mutualzz/types";
import dayjs from "dayjs";
import i18n from "../i18n";

export function getCustomActivity(
  presence?: PresencePayload | null,
): PresenceActivity | null {
  return (
    presence?.activities?.find((activity) => activity.type === "custom") ??
    null
  );
}

export function getNonCustomActivities(
  presence?: PresencePayload | null,
): PresenceActivity[] {
  return (
    presence?.activities?.filter((activity) => activity.type !== "custom") ??
    []
  );
}

export function getCustomStatusSnapshot(
  activities?: PresenceActivity[],
): CustomStatusSnapshot | null {
  const custom = activities?.find((activity) => activity.type === "custom");
  if (!custom) return null;

  const text = custom.state?.trim() || custom.name?.trim() || null;
  const emoji = custom.emoji ?? null;

  if (!text && !emoji) return null;

  return { text, emoji };
}

export function hasCustomStatusContent(
  text?: string | null,
  emoji?: PresenceActivityEmoji | null,
): boolean {
  return Boolean(text?.trim() || hasStatusEmoji(emoji));
}

export function hasStatusEmoji(emoji?: PresenceActivityEmoji | null) {
  return Boolean(emoji?.name?.trim() || emoji?.id);
}

export function formatCustomStatusClearLabel(
  durationMs: number | null,
  now = Date.now(),
) {
  if (durationMs == null) return i18n.t("duration.dontClear");

  const clearAt = dayjs(now + durationMs);
  const time = clearAt.format("h:mm A");

  if (clearAt.isSame(dayjs(now), "day")) {
    return i18n.t("duration.clearTodayAt", { time });
  }

  if (clearAt.isSame(dayjs(now).add(1, "day"), "day")) {
    return i18n.t("duration.clearTomorrowAt", { time });
  }

  return i18n.t("duration.clearOnDateAt", {
    date: clearAt.format("MMM D"),
    time,
  });
}
