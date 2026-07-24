import type { PatchSpaceNotificationSettings } from "@mutualzz/validators";

type MuteDuration = NonNullable<PatchSpaceNotificationSettings["muteDuration"]>;

export const SPACE_MUTE_DURATIONS: ReadonlyArray<{
  duration: Exclude<MuteDuration, "off">;
  labelKey:
    | "contextMenu.muteDuration1h"
    | "contextMenu.muteDuration8h"
    | "contextMenu.muteDuration24h"
    | "contextMenu.muteDuration1w"
    | "contextMenu.muteUntilTurnBackOn";
}> = [
  { duration: "1h", labelKey: "contextMenu.muteDuration1h" },
  { duration: "8h", labelKey: "contextMenu.muteDuration8h" },
  { duration: "24h", labelKey: "contextMenu.muteDuration24h" },
  { duration: "1w", labelKey: "contextMenu.muteDuration1w" },
  { duration: "forever", labelKey: "contextMenu.muteUntilTurnBackOn" },
];

export const SPACE_MUTE_TIMED_DURATIONS = SPACE_MUTE_DURATIONS.filter(
  (entry) => entry.duration !== "forever",
);
