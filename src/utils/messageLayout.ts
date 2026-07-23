import type { MessageDisplay, UiDensity } from "@mutualzz/types";
import {
  getMessageGroupGapMs,
  getMessageLayoutNativeStyles,
  shouldShowMessageAvatar,
  type MessageLayoutNativeStyles,
} from "@mutualzz/client";

export {
  getMessageGroupGapMs,
  shouldShowMessageAvatar,
  type MessageLayoutNativeStyles as MessageLayoutStyles,
};

export function getMessageLayoutStyles(
  messageDisplay: MessageDisplay,
  uiDensity: UiDensity,
) {
  return getMessageLayoutNativeStyles(messageDisplay, uiDensity);
}
