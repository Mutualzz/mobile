import notifee, {
  AndroidImportance,
  AndroidStyle,
} from "@notifee/react-native";
import { DM_REPLY_ACTION_ID } from "@utils/pushNotificationCategories";
import {
  ANDROID_MESSAGE_CHANNEL_ID,
  MESSAGE_PUSH_DISPLAY_MODE,
} from "@utils/messageNotification.constants";

export interface MessagePushData {
  url: string;
  channelId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  authorAvatarUrl?: string;
  title: string;
  body: string;
  subtitle?: string;
  pushType: "dm" | "mention";
}

function readString(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseMessagePushData(
  data: Record<string, unknown>,
): MessagePushData | null {
  if (data.displayMode !== MESSAGE_PUSH_DISPLAY_MODE) return null;

  const url = readString(data, "url");
  const channelId = readString(data, "channelId");
  const conversationId = readString(data, "conversationId");
  const senderId = readString(data, "senderId");
  const senderName = readString(data, "senderName");
  const body = readString(data, "body");
  const title = readString(data, "title") ?? senderName;
  const pushType = data.pushType === "mention" ? "mention" : "dm";

  if (!url || !channelId || !conversationId || !senderId || !senderName || !body) {
    return null;
  }

  return {
    url,
    channelId,
    conversationId,
    senderId,
    senderName,
    authorAvatarUrl: readString(data, "authorAvatarUrl"),
    title: title ?? senderName,
    body,
    subtitle: readString(data, "subtitle"),
    pushType,
  };
}

let channelReady: Promise<void> | null = null;

export function ensureAndroidMessageChannel() {
  channelReady ??= notifee
    .createChannel({
      id: ANDROID_MESSAGE_CHANNEL_ID,
      name: "Messages",
      importance: AndroidImportance.HIGH,
      sound: "default",
    })
    .then(() => undefined);

  return channelReady;
}

export async function displayAndroidMessageNotification(
  data: MessagePushData,
) {
  await ensureAndroidMessageChannel();

  const person = {
    name: data.senderName,
    ...(data.authorAvatarUrl ? { icon: data.authorAvatarUrl } : {}),
  };

  const isDm = data.pushType === "dm";

  await notifee.displayNotification({
    id: `${data.conversationId}-${Date.now()}`,
    title: data.senderName,
    ...(data.subtitle ? { subtitle: data.subtitle } : {}),
    body: data.body,
    data: {
      displayMode: MESSAGE_PUSH_DISPLAY_MODE,
      url: data.url,
      channelId: data.channelId,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: data.senderName,
      pushType: data.pushType,
    },
    android: {
      channelId: ANDROID_MESSAGE_CHANNEL_ID,
      tag: data.conversationId,
      groupId: data.conversationId,
      pressAction: { id: "default" },
      style: {
        type: AndroidStyle.MESSAGING,
        person,
        messages: [
          {
            text: data.body,
            timestamp: Date.now(),
            person,
          },
        ],
      },
      ...(isDm
        ? {
            actions: [
              {
                title: "Reply",
                pressAction: { id: DM_REPLY_ACTION_ID },
                input: {
                  placeholder: "Message",
                  allowFreeFormInput: true,
                },
              },
            ],
          }
        : {}),
    },
  });
}
