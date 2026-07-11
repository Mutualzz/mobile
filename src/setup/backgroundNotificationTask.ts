import {
  displayAndroidMessageNotification,
  parseMessagePushData,
} from "@utils/androidMessageNotification";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

export const BACKGROUND_NOTIFICATION_TASK = "mutualzz-background-notification";

function tryParseJsonObject(
  value: unknown,
): Record<string, unknown> | null {
  if (typeof value !== "string" || value.length === 0) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not JSON — fall through.
  }

  return null;
}

/**
 * Expo background tasks receive either:
 * - RemoteMessageSerializer shape: `{ data: { dataString?, ...flatFields }, notification }`
 * - NotificationResponse / Notification shape with nested `request.content.data`
 *
 * Expo Push Service packs custom `data` as a JSON string in FCM's `body` field,
 * which surfaces here as `data.dataString`.
 */
export function extractBackgroundPushData(
  payload: unknown,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;

  const nestedContent =
    root.notification &&
    typeof root.notification === "object" &&
    "request" in root.notification
      ? (
          root.notification as {
            request?: { content?: Record<string, unknown> };
          }
        ).request?.content
      : undefined;

  if (nestedContent) {
    if (nestedContent.data && typeof nestedContent.data === "object") {
      return nestedContent.data as Record<string, unknown>;
    }

    const fromDataString = tryParseJsonObject(nestedContent.dataString);
    if (fromDataString) return fromDataString;
  }

  if (root.data && typeof root.data === "object") {
    const remoteData = root.data as Record<string, unknown>;
    const fromDataString = tryParseJsonObject(remoteData.dataString);
    if (fromDataString) return fromDataString;

    const fromBody = tryParseJsonObject(remoteData.body);
    if (fromBody) return fromBody;

    if (typeof remoteData.displayMode === "string") {
      return remoteData;
    }
  }

  return null;
}

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (Platform.OS !== "android" || error || !data) return;

  const raw = extractBackgroundPushData(data);
  if (!raw) return;

  const messageData = parseMessagePushData(raw);
  if (!messageData) return;

  await displayAndroidMessageNotification(messageData);
});

export async function registerBackgroundNotificationTask() {
  if (Platform.OS !== "android") return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_NOTIFICATION_TASK,
  );

  if (!isRegistered) {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }
}

// Register at module scope so headless JS (killed app) can run the task.
if (Platform.OS === "android") {
  void registerBackgroundNotificationTask().catch((error) => {
    console.warn("[push] failed to register background task", error);
  });
}
