import type { Space } from "@stores/objects/Space";
import i18n from "../i18n";

export function getSpaceLockdownMessage(_space: Space, isOwner: boolean) {
  return isOwner
    ? i18n.t("lockdown.ownerMessage", { ns: "space" })
    : i18n.t("lockdown.memberMessage", { ns: "space" });
}
