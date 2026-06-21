import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

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

export function usePushNotifications(enabled: boolean) {
  const app = useAppStore();
  const { navigate } = useAppNavigation();

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

      await app.rest.post("/@me/push-token", {
        token,
        platform: Platform.OS,
      });
    })().catch(() => undefined);

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          navigateFromNotificationUrl(navigate, url);
        }
      },
    );

    return () => {
      mounted = false;
      responseSub.remove();
    };
  }, [app.rest, app.token, enabled, navigate]);
}
