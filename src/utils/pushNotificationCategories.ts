import * as Notifications from "expo-notifications";

export const DM_REPLY_CATEGORY_ID = "dm_reply";
export const DM_REPLY_ACTION_ID = "dm_reply";

let categoryReady: Promise<void> | null = null;

export function ensureDmReplyNotificationCategory() {
  categoryReady ??= Notifications.setNotificationCategoryAsync(
    DM_REPLY_CATEGORY_ID,
    [
      {
        identifier: DM_REPLY_ACTION_ID,
        buttonTitle: "Reply",
        textInput: {
          placeholder: "Message",
          submitButtonTitle: "Send",
        },
        options: {
          opensAppToForeground: false,
        },
      },
    ],
  ).then(() => undefined);

  return categoryReady;
}
