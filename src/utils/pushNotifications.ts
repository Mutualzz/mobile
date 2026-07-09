import type { REST } from "@stores/REST.store";
import type { APIMessage } from "@mutualzz/types";
import Snowflake from "@utils/Snowflake";
import { Platform } from "react-native";

export async function registerPushToken(rest: REST, token: string) {
  await rest.post("/@me/push-token", {
    token,
    platform: Platform.OS,
  });
}

export async function unregisterPushToken(rest: REST, token?: string) {
  await rest.delete("/@me/push-token", {}, token ? { token } : undefined);
}

export async function clearRegisteredPushTokens(rest: REST) {
  await unregisterPushToken(rest);
}

export async function sendNotificationReply(
  rest: REST,
  channelId: string,
  content: string,
) {
  await rest.post<APIMessage, { content: string; nonce: string }>(
    `/channels/${channelId}/messages`,
    {
      content,
      nonce: Snowflake.generate(),
    },
  );
}
