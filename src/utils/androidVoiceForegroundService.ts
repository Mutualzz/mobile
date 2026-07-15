import notifee, {
  AndroidCategory,
  AndroidForegroundServiceType,
  AndroidImportance,
} from "@notifee/react-native";
import { Platform } from "react-native";

export const ANDROID_VOICE_CHANNEL_ID = "voice_channel";
export const ANDROID_VOICE_NOTIFICATION_ID = "mutualzz-voice-channel";

let channelReady: Promise<void> | null = null;
let foregroundServiceRegistered = false;

export function registerAndroidVoiceForegroundService() {
  if (Platform.OS !== "android" || foregroundServiceRegistered) return;

  notifee.registerForegroundService(() => {
    return new Promise(() => {});
  });
  foregroundServiceRegistered = true;
}

function ensureVoiceChannel() {
  channelReady ??= (async () => {
    await notifee.createChannel({
      id: ANDROID_VOICE_CHANNEL_ID,
      name: "Voice channels",
      importance: AndroidImportance.LOW,
      vibration: false,
    });
  })();
  return channelReady;
}

export async function startAndroidVoiceForegroundService(options: {
  channelName: string;
  spaceName: string;
  muted: boolean;
  deafened: boolean;
}) {
  if (Platform.OS !== "android") return;

  registerAndroidVoiceForegroundService();
  await ensureVoiceChannel();

  const status = options.deafened
    ? "Deafened"
    : options.muted
      ? "Muted"
      : "Connected";
  const body =
    options.spaceName.length > 0
      ? `${options.channelName} / ${options.spaceName} · ${status}`
      : `${options.channelName} · ${status}`;

  await notifee.displayNotification({
    id: ANDROID_VOICE_NOTIFICATION_ID,
    title: "In a voice channel",
    body,
    android: {
      channelId: ANDROID_VOICE_CHANNEL_ID,
      asForegroundService: true,
      category: AndroidCategory.CALL,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      pressAction: {
        id: "default",
      },
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      ],
    },
  });
}

export async function stopAndroidVoiceForegroundService() {
  if (Platform.OS !== "android") return;

  try {
    await notifee.stopForegroundService();
  } catch {
  }

  try {
    await notifee.cancelNotification(ANDROID_VOICE_NOTIFICATION_ID);
  } catch {
  }
}
