import "react-native-get-random-values";
import "@setup/webrtc";
import "@setup/notifeeBackgroundHandler";
import "@setup/backgroundNotificationTask";
import "@setup/voiceForegroundService";
import "../i18n";

import { AppCrashFallback } from "@components/ErrorBoundary/AppCrashFallback";
import { BootSplash } from "@components/BootSplash";
import { IncomingCallOverlay } from "@components/Call/IncomingCallOverlay";
import { ChangelogPrompt } from "@components/Changelog/ChangelogPrompt";
import { NativeBaseline } from "@components/NativeBaseline/NativeBaseline";
import { NavigationWithTheme } from "@components/NavigationWithTheme";
import { AppTheme } from "@contexts/AppTheme.context";
import { SheetProvider } from "@contexts/Sheet.context";
import { usePushNotifications } from "@hooks/usePushNotifications";
import { useAppStore } from "@hooks/useStores";
import { Logger } from "@mutualzz/logger";
import { GatewayCloseCodes } from "@mutualzz/types";
import { GatewayStatus } from "@stores/Gateway.store";
import { QueryClientProvider } from "@tanstack/react-query";
import { calendarStrings } from "@mutualzz/client";
import { BottomSheetModalProvider } from "@expo/ui/community/bottom-sheet";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

dayjs.extend(relativeTime);
dayjs.extend(calendar, calendarStrings);
dayjs.extend(duration);

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const errorLogger = new Logger({ tag: "ErrorBoundary" });

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const app = useAppStore();

  useEffect(() => {
    errorLogger.error("Uncaught render error", error);
  }, [error]);

  return (
    <AppCrashFallback
      onReload={() => {
        retry();
      }}
      onLogout={() => {
        void app.logout().finally(() => retry());
      }}
    />
  );
}

const Root = () => {
  const app = useAppStore();
  const logger = new Logger({
    tag: "App",
  });
  const [showBootSplash, setShowBootSplash] = useState(true);
  const reducedMotion = app.settings?.extendedSettings.reducedMotion ?? false;
  const modalAnimation = reducedMotion ? "none" : "slide_from_bottom";

  usePushNotifications(!!app.token);

  useEffect(() => {
    const onUnauthorized = () => {
      if (!app.token) return;
      void app.logout();
    };
    app.rest.on("unauthorized", onUnauthorized);
    return () => {
      app.rest.off("unauthorized", onUnauthorized);
    };
  }, [app]);

  useEffect(() => {
    (async () => {
      try {
        await app.loadSettings();
      } finally {
        app.setAppLoading(false);
      }
    })();

    const dispose = reaction(
      () => app.token,
      (value) => {
        if (value) {
          app.rest.setToken(value);
          if (app.gateway.readyState === GatewayStatus.CLOSED) {
            app.setGatewayReady(false);
            void app.gateway.connect().catch((error) => {
              logger.error("Gateway connect failed", error);
              app.gateway.startReconnect();
            });
          } else {
            logger.debug("Gateway connect called but socket is not closed");
          }
        } else {
          logger.debug("user no longer authenticated");
          if (app.gateway.readyState === WebSocket.OPEN) {
            app.gateway.disconnect(
              GatewayCloseCodes.NotAuthenticated,
              "user is no longer authenticated",
            );
          }
        }
      },
      { fireImmediately: true },
    );

    return dispose;
  }, []);

  useEffect(() => {
    if (!app.isReady) return;

    const timer = setTimeout(() => {
      setShowBootSplash(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [app.isReady]);

  return (
    <AppTheme>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {app.isReady ? (
            <QueryClientProvider client={app.queryClient}>
              <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                <NavigationWithTheme>
                  <NativeBaseline>
                    <SheetProvider>
                      <BottomSheetModalProvider>
                        <ChangelogPrompt />
                        <IncomingCallOverlay />
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen
                            name="settings"
                            options={{
                              presentation: "modal",
                              animation: modalAnimation,
                            }}
                          />
                          <Stack.Screen
                            name="staff"
                            options={{
                              presentation: "modal",
                              animation: modalAnimation,
                            }}
                          />
                        </Stack>
                      </BottomSheetModalProvider>
                    </SheetProvider>
                  </NativeBaseline>
                </NavigationWithTheme>
              </KeyboardProvider>
            </QueryClientProvider>
          ) : null}
        </View>
        {showBootSplash ? <BootSplash key="boot-splash" /> : null}
      </View>
    </AppTheme>
  );
};

export default observer(Root);
