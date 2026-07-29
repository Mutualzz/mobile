import * as Notifications from "expo-notifications";
import i18n from "../i18n";

export const DM_REPLY_CATEGORY_ID = "dm_reply";
export const DM_REPLY_ACTION_ID = "dm_reply";

let categoryReady: Promise<void> | null = null;

export function ensureDmReplyNotificationCategory() {
  categoryReady ??= Notifications.setNotificationCategoryAsync(
    DM_REPLY_CATEGORY_ID,
    [
      {
        identifier: DM_REPLY_ACTION_ID,
        buttonTitle: i18n.t("notifications.reply", { ns: "common" }),
        textInput: {
          placeholder: i18n.t("notifications.messagePlaceholder", {
            ns: "common",
          }),
          submitButtonTitle: i18n.t("notifications.send", { ns: "common" }),
        },
        options: {
          opensAppToForeground: false,
        },
      },
    ],
  ).then(() => undefined);

  return categoryReady;
}
