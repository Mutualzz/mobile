import { AppTheme } from "@contexts/AppTheme.context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppStore } from "@hooks/useStores";
import { Logger } from "@logger";
import { IconButton, NativeBaseline } from "@mutualzz/ui-native";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { NavigationWithTheme } from "../../components/NavigationWithTheme";
import { TabBar } from "../../components/TabBar/TabBar";

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
    const app = useAppStore();
    const logger = new Logger({
        tag: "App",
    });

    useEffect(() => {
        SplashScreen.hide();
    }, []);

    useEffect(() => {
        app.loadSettings();

        logger.debug("Loading complete");
        app.setAppLoading(false);
    }, []);

    return (
        <AppTheme>
            <NavigationWithTheme>
                <NativeBaseline>
                    <Tabs
                        options={{
                            backBehavior: "none",
                        }}
                    >
                        <TabSlot />
                        <TabList asChild>
                            <TabBar>
                                <TabTrigger asChild name="index" href="/">
                                    <IconButton
                                        color="neutral"
                                        variant="plain"
                                        aria-label="Home"
                                        size="lg"
                                    >
                                        <MaterialIcons name="home" size={24} />
                                    </IconButton>
                                </TabTrigger>
                                <TabTrigger asChild name="login" href="/login">
                                    <IconButton
                                        color="neutral"
                                        variant="plain"
                                        aria-label="Login"
                                        size="lg"
                                    >
                                        <MaterialIcons name="login" size={24} />
                                    </IconButton>
                                </TabTrigger>
                            </TabBar>
                        </TabList>
                    </Tabs>
                </NativeBaseline>
            </NavigationWithTheme>
        </AppTheme>
    );
};

export default RootLayout;
