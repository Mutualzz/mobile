import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import {
  DM_REPLY_ACTION_ID,
  ensureDmReplyNotificationCategory,
} from "@utils/pushNotificationCategories";
import {
  registerPushToken,
  sendNotificationReply,
  unregisterPushToken,
} from "@utils/pushNotifications";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";
import { useEffect, useRef } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function navigateFromNotificationUrl(
  navigate: ReturnType<typeof useAppNavigation>["navigate"],
  url: string,
) {
  const parsed = Linking.parse(url);
  const path = parsed.path ?? "";

  if (path.startsWith("spaces/channel/")) {
    navigate(`/${path}` as Href);
    return;
  }

  if (path.startsWith("@me/")) {
    navigate(`/${path}` as Href);
    return;
  }

  if (path.startsWith("invite/")) {
    navigate(`/${path}` as Href);
  }
}

function getNotificationData(
  response: Notifications.NotificationResponse,
): Record<string, unknown> {
  const data = response.notification.request.content.data;
  return data && typeof data === "object" ? data : {};
}

async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate: ReturnType<typeof useAppNavigation>["navigate"],
  rest: ReturnType<typeof useAppStore>["rest"],
) {
  const data = getNotificationData(response);

  if (response.actionIdentifier === DM_REPLY_ACTION_ID) {
    const content = response.userText?.trim();
    const channelId = data.channelId;

    if (!content || typeof channelId !== "string") return;

    try {
      await sendNotificationReply(rest, channelId, content);
    } catch (error) {
      console.warn("[push] reply failed", error);
    }
    return;
  }

  const url = data.url;
  if (typeof url === "string") {
    navigateFromNotificationUrl(navigate, url);
  }
}

export function usePushNotifications(enabled: boolean) {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const navigateRef = useRef(navigate);
  const restRef = useRef(app.rest);
  const pushTokenRef = useRef<string | null>(null);
  navigateRef.current = navigate;
  restRef.current = app.rest;

  useEffect(() => {
    void ensureDmReplyNotificationCategory().catch((error) => {
      console.warn("[push] failed to register reply category", error);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !app.token) return;

    let mounted = true;

    (async () => {
      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted" || !mounted) return;

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "eaaf0533-e2e0-469c-98e2-ad69ac469129",
        })
      ).data;

      pushTokenRef.current = token;
      await registerPushToken(app.rest, token);
    })().catch((error) => {
      console.warn("[push] registration failed", error);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleNotificationResponse(
          response,
          navigateRef.current,
          restRef.current,
        );
      },
    );

    return () => {
      mounted = false;
      responseSub.remove();

      const token = pushTokenRef.current;
      pushTokenRef.current = null;
      if (!token) return;

      void unregisterPushToken(app.rest, token).catch(() => undefined);
    };
  }, [app.rest, app.token, enabled]);
}
