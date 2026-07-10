import type { Space } from "@stores/objects/Space";

export function getSpaceLockdownMessage(space: Space, isOwner: boolean) {
  return isOwner
    ? "Messaging and changes are disabled. Check your email for an appeal link if you believe this was a mistake."
    : "Messaging and changes are disabled while staff review this space.";
}
