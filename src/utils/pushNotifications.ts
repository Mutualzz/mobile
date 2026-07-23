import { REST, type REST as RESTType } from "@stores/REST.store";
import type { APIMessage } from "@mutualzz/types";
import { Snowflake } from "@mutualzz/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PERSISTED_APP_STORE_KEY = "AppStoreSecure";

async function getPersistedAuthToken(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(PERSISTED_APP_STORE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token?: unknown };
    return typeof parsed.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

export async function registerPushToken(rest: RESTType, token: string) {
  await rest.post("/@me/push-token", {
    token,
    platform: Platform.OS,
  });
}

export async function unregisterPushToken(rest: RESTType, token?: string) {
  await rest.delete("/@me/push-token", {}, token ? { token } : undefined);
}

export async function clearRegisteredPushTokens(rest: RESTType) {
  await unregisterPushToken(rest);
}

export async function sendNotificationReply(
  rest: RESTType,
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

export async function sendBackgroundNotificationReply(
  channelId: string,
  content: string,
) {
  const token = await getPersistedAuthToken();
  if (!token) throw new Error("Not authenticated");

  const url = REST.makeAPIUrl(`/channels/${channelId}/messages`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "User-Agent": "Mutualzz-Client/1.0",
      type: "Mobile",
      os: Platform.OS,
      client: "Mutualzz Mobile",
    },
    body: JSON.stringify({
      content,
      nonce: Snowflake.generate(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send notification reply (${response.status})`);
  }
}
