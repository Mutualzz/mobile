import type { PresenceActivity, PresenceActivityType } from "@mutualzz/types";

export function activityTypeLabelKey(
  type: PresenceActivityType,
): "activity.playing" | "activity.listening" | null {
  if (type === "playing") return "activity.playing";
  if (type === "listening") return "activity.listening";
  return null;
}

export function formatActivityPrimary(activity: PresenceActivity): string {
  return activity.name;
}

export function formatActivitySecondary(
  activity: PresenceActivity,
): string | null {
  const details = activity.details?.trim();
  const state = activity.state?.trim();
  if (details && state && details !== state) return `${details} · ${state}`;
  return details || state || null;
}

export function formatActivityCompact(activity: PresenceActivity): string {
  const secondary = formatActivitySecondary(activity);
  if (secondary) return `${activity.name} · ${secondary}`;
  return activity.name;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatActivityElapsedClock(
  start: number | undefined,
  now: number,
): string | null {
  if (start == null || !Number.isFinite(start) || start > now) return null;
  const totalSec = Math.max(0, Math.floor((now - start) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
