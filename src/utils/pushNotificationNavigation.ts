import * as Linking from "expo-linking";
import type { Href } from "expo-router";

export interface NotificationNavigationData {
  url?: unknown;
  channelId?: unknown;
  pushType?: unknown;
}

export function resolveNotificationHref(
  data: NotificationNavigationData,
): Href | null {
  const channelId =
    typeof data.channelId === "string" && data.channelId.length > 0
      ? data.channelId
      : undefined;
  const pushType = data.pushType === "dm" ? "dm" : "mention";

  const url = typeof data.url === "string" ? data.url : undefined;
  if (url) {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? "";
    const hostname = parsed.hostname ?? "";

    if (path.startsWith("spaces/channel/")) {
      return `/${path}` as Href;
    }

    // com.mutualzz.app://spaces/channel/{id} — hostname is "spaces".
    if (hostname === "spaces" && path.startsWith("channel/")) {
      return `/spaces/${path}` as Href;
    }

    if (path.startsWith("@me/")) {
      return `/${path}` as Href;
    }

    // com.mutualzz.app://@me/{id} — URL parser treats "@me" as userinfo@host.
    if (hostname === "me" && path) {
      return `/@me/${path}` as Href;
    }

    if (path.startsWith("me/")) {
      return `/@me/${path.slice("me/".length)}` as Href;
    }

    if (path.startsWith("invite/")) {
      return `/${path}` as Href;
    }

    if (path.startsWith("support/tickets/")) {
      return `/${path}` as Href;
    }
  }

  if (channelId) {
    if (pushType === "dm") {
      return `/@me/${channelId}` as Href;
    }

    return `/spaces/channel/${channelId}` as Href;
  }

  return null;
}

export function buildMessageNotificationUrl(
  channelId: string,
  isDm: boolean,
  scheme = "com.mutualzz.app",
): string {
  if (isDm) {
    return `${scheme}:///me/${channelId}`;
  }

  return `${scheme}:///spaces/channel/${channelId}`;
}

export async function openNotificationDeepLink(
  data: NotificationNavigationData,
) {
  const url = typeof data.url === "string" ? data.url : undefined;
  if (url) {
    await Linking.openURL(url);
    return;
  }

  const href = resolveNotificationHref(data);
  if (!href) return;

  const path = typeof href === "string" ? href : href.pathname;
  await Linking.openURL(Linking.createURL(path));
}
