import {
  displayAndroidMessageNotification,
  parseMessagePushData,
} from "@utils/androidMessageNotification";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

export const BACKGROUND_NOTIFICATION_TASK = "mutualzz-background-notification";

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (Platform.OS !== "android" || error || !data) return;

  const payload = data as {
    notification?: {
      request?: {
        content?: {
          data?: Record<string, unknown>;
        };
      };
    };
  };
  const raw = payload.notification?.request?.content?.data;

  if (!raw || typeof raw !== "object") return;

  const messageData = parseMessagePushData(raw as Record<string, unknown>);
  if (!messageData) return;

  await displayAndroidMessageNotification(messageData);
});

export async function registerBackgroundNotificationTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_NOTIFICATION_TASK,
  );

  if (!isRegistered) {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }
}
