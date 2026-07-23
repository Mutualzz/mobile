import type { Space } from "@stores/objects/Space";
import { getSpaceLockdownMessage as getSpaceLockdownMessageBase } from "@mutualzz/client";
import i18n from "../i18n";

export function getSpaceLockdownMessage(_space: Space, isOwner: boolean) {
  return getSpaceLockdownMessageBase(i18n.t.bind(i18n), isOwner);
}
