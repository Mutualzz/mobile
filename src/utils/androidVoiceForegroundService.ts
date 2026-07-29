import notifee, {
  AndroidCategory,
  AndroidForegroundServiceType,
  AndroidImportance,
  EventType,
} from "@notifee/react-native";
import { Platform } from "react-native";

export const ANDROID_VOICE_CHANNEL_ID = "voice_channel";
export const ANDROID_VOICE_NOTIFICATION_ID = "mutualzz-voice-channel";

let channelReady: Promise<void> | null = null;
let foregroundServiceRegistered = false;
let eventListenerBound = false;

type VoiceActionHandler = (action: "mute" | "deafen" | "disconnect") => void;

let voiceActionHandler: VoiceActionHandler | null = null;

export function setAndroidVoiceNotificationActionHandler(
  handler: VoiceActionHandler | null,
) {
  voiceActionHandler = handler;
}

export function registerAndroidVoiceForegroundService() {
  if (Platform.OS !== "android" || foregroundServiceRegistered) return;

  notifee.registerForegroundService(() => {
    return new Promise<void>(() => {
      return;
    });
  });
  foregroundServiceRegistered = true;
  bindAndroidNotificationEvents();
}

function bindAndroidNotificationEvents() {
  if (eventListenerBound || Platform.OS !== "android") return;
  eventListenerBound = true;

  notifee.onForegroundEvent(({ type, detail }) => {
    if (type !== EventType.ACTION_PRESS) return;
    const id = detail.pressAction?.id;
    if (id === "mute" || id === "deafen" || id === "disconnect") {
      voiceActionHandler?.(id);
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.ACTION_PRESS) return;
    const id = detail.pressAction?.id;
    if (id === "mute" || id === "deafen" || id === "disconnect") {
      voiceActionHandler?.(id);
    }
  });
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
      actions: [
        {
          title: options.muted ? "Unmute" : "Mute",
          pressAction: { id: "mute" },
        },
        {
          title: options.deafened ? "Undeafen" : "Deafen",
          pressAction: { id: "deafen" },
        },
        {
          title: "Disconnect",
          pressAction: { id: "disconnect" },
        },
      ],
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
    // ignore
}

  try {
    await notifee.cancelNotification(ANDROID_VOICE_NOTIFICATION_ID);
  } catch {
    // ignore
}
}
