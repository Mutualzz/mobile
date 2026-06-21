import { NavigationWithTheme } from "@components/NavigationWithTheme";
import { AppTheme } from "@contexts/AppTheme.context";
import { ModalProvider } from "@contexts/Modal.context";
import { usePushNotifications } from "@hooks/usePushNotifications";
import { useAppStore } from "@hooks/useStores";
import { Logger } from "@mutualzz/logger";
import { GatewayCloseCodes } from "@mutualzz/types";
import { NativeBaseline } from "@mutualzz/ui-native";
import { GatewayStatus } from "@stores/Gateway.store";
import { QueryClientProvider } from "@tanstack/react-query";
import { calendarStrings } from "@utils/i18n";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

dayjs.extend(relativeTime);
dayjs.extend(calendar, calendarStrings);
dayjs.extend(duration);

SplashScreen.preventAutoHideAsync();

const Root = () => {
    const app = useAppStore();
    const logger = new Logger({
        tag: "App",
    });

    usePushNotifications(!!app.token);

    useEffect(() => {
        (async () => {
            try {
                await app.loadSettings();
            } finally {
                app.setAppLoading(false);
                await SplashScreen.hideAsync();
            }
        })();

        const dispose = reaction(
            () => app.token,
            (value) => {
                if (value) {
                    app.rest.setToken(value);
                    if (app.gateway.readyState === GatewayStatus.CLOSED) {
                        app.setGatewayReady(true);
                        app.gateway.connect();
                    } else {
                        logger.debug(
                            "Gateway connect called but socket is not closed",
                        );
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

    if (app.isAppLoading) return null;

    return (
        <QueryClientProvider client={app.queryClient}>
            <AppTheme>
                <NavigationWithTheme>
                    <NativeBaseline>
                        <ModalProvider>
                            <Slot />
                        </ModalProvider>
                    </NativeBaseline>
                </NavigationWithTheme>
            </AppTheme>
        </QueryClientProvider>
    );
};

export default observer(Root);
