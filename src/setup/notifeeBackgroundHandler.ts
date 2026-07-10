import notifee, { EventType } from "@notifee/react-native";
import { DM_REPLY_ACTION_ID } from "@utils/pushNotificationCategories";
import { openNotificationDeepLink } from "@utils/pushNotificationNavigation";
import { sendBackgroundNotificationReply } from "@utils/pushNotifications";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail.notification?.data;
  if (!data || typeof data !== "object") return;

  if (type === EventType.PRESS) {
    await openNotificationDeepLink(data);
    return;
  }

  if (
    type !== EventType.ACTION_PRESS ||
    detail.pressAction?.id !== DM_REPLY_ACTION_ID
  ) {
    return;
  }

  const content = detail.input?.trim();
  const channelId = data.channelId;

  if (!content || typeof channelId !== "string") return;

  try {
    await sendBackgroundNotificationReply(channelId, content);
  } catch (error) {
    console.warn("[push] background reply failed", error);
  }
});
