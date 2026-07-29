import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import notifee, { EventType } from "@notifee/react-native";
import {
  dismissCallNotification,
  displayAndroidMessageNotification,
  ensureAndroidMessageChannel,
  parseMessagePushData,
} from "@utils/androidMessageNotification";
import {
  DM_REPLY_ACTION_ID,
  ensureDmReplyNotificationCategory,
} from "@utils/pushNotificationCategories";
import { resolveNotificationHref } from "@utils/pushNotificationNavigation";
import {
  consumePendingNavigation,
  setPendingNavigation,
} from "@utils/pendingNavigation";
import {
  registerPushToken,
  sendNotificationReply,
  unregisterPushToken,
} from "@utils/pushNotifications";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    if (data && typeof data === "object") {
      const payload = data;
      if (
        payload.pushType === "call_end" &&
        typeof payload.channelId === "string"
      ) {
        void dismissCallNotification(payload.channelId);
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
    }

    if (
      Platform.OS === "android" &&
      data &&
      typeof data === "object" &&
      parseMessagePushData(data)
    ) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

function getNotificationData(
  response: Notifications.NotificationResponse,
): Record<string, unknown> {
  const data = response.notification.request.content.data;
  return data && typeof data === "object" ? data : {};
}

async function navigateToNotificationTarget(
  data: Record<string, unknown>,
  navigate: ReturnType<typeof useAppNavigation>["navigate"],
  app: ReturnType<typeof useAppStore>,
) {
  const href = resolveNotificationHref(data);
  if (!href) return;

  const channelId = data.channelId;
  if (typeof channelId === "string") {
    try {
      await app.channels.resolve(channelId);
    } catch {
    // ignore
}
  }

  if (!app.isReady) {
    setPendingNavigation(href);
    return;
  }

  navigate(href);
}

async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate: ReturnType<typeof useAppNavigation>["navigate"],
  rest: ReturnType<typeof useAppStore>["rest"],
  app: ReturnType<typeof useAppStore>,
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

  await navigateToNotificationTarget(data, navigate, app);
}

async function handleNotifeePress(
  data: Record<string, unknown> | undefined,
  navigate: ReturnType<typeof useAppNavigation>["navigate"],
  rest: ReturnType<typeof useAppStore>["rest"],
  app: ReturnType<typeof useAppStore>,
  actionId?: string,
  input?: string,
) {
  if (!data) return;

  if (actionId === DM_REPLY_ACTION_ID) {
    const content = input?.trim();
    const channelId = data.channelId;
    if (!content || typeof channelId !== "string") return;

    try {
      await sendNotificationReply(rest, channelId, content);
    } catch (error) {
      console.warn("[push] notifee reply failed", error);
    }
    return;
  }

  await navigateToNotificationTarget(data, navigate, app);
}

export function usePushNotifications(enabled: boolean) {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const navigateRef = useRef(navigate);
  const restRef = useRef(app.rest);
  const appRef = useRef(app);
  const pushTokenRef = useRef<string | null>(null);
  navigateRef.current = navigate;
  restRef.current = app.rest;
  appRef.current = app;

  useEffect(() => {
    void ensureDmReplyNotificationCategory().catch((error) => {
      console.warn("[push] failed to register reply category", error);
    });

    if (Platform.OS === "android") {
      void ensureAndroidMessageChannel().catch((error) => {
        console.warn("[push] failed to create Android channel", error);
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    return notifee.onForegroundEvent(({ type, detail }) => {
      if (
        type !== EventType.PRESS &&
        type !== EventType.ACTION_PRESS
      ) {
        return;
      }

      void handleNotifeePress(
        detail.notification?.data,
        navigateRef.current,
        restRef.current,
        appRef.current,
        detail.pressAction?.id,
        detail.input,
      );
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const openInitialNotification = async () => {
      const initial = await notifee.getInitialNotification();
      const initialData = initial?.notification?.data;
      if (initialData && typeof initialData === "object") {
        await navigateToNotificationTarget(
          initialData,
          navigateRef.current,
          appRef.current,
        );
        return;
      }

      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response) return;

      const data = getNotificationData(response);
      if (response.actionIdentifier === DM_REPLY_ACTION_ID) return;

      await navigateToNotificationTarget(
        data,
        navigateRef.current,
        appRef.current,
      );
      await Notifications.clearLastNotificationResponseAsync();
    };

    void openInitialNotification();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !app.isReady) return;

    const href = consumePendingNavigation();
    if (href) navigateRef.current(href);
  }, [enabled, app.isReady]);

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

    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        if (!data || typeof data !== "object") return;

        const payload = data;
        if (
          payload.pushType === "call_end" &&
          typeof payload.channelId === "string"
        ) {
          void dismissCallNotification(payload.channelId);
          return;
        }

        if (Platform.OS !== "android") return;

        const parsed = parseMessagePushData(payload);
        if (!parsed) return;

        void displayAndroidMessageNotification(parsed);
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleNotificationResponse(
          response,
          navigateRef.current,
          restRef.current,
          appRef.current,
        );
      },
    );

    return () => {
      mounted = false;
      receivedSub.remove();
      responseSub.remove();

      const token = pushTokenRef.current;
      pushTokenRef.current = null;
      if (!token) return;

      void unregisterPushToken(app.rest, token).catch(() => { return; });
    };
  }, [app.rest, app.token, enabled]);
}
