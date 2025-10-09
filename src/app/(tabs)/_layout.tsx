import { NavigationWithTheme } from "@components/NavigationWithTheme";
import { TabBar } from "@components/TabBar/TabBar";
import { AppTheme } from "@contexts/AppTheme.context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppStore } from "@hooks/useStores";
import { Logger } from "@logger";
import { IconButton, NativeBaseline } from "@mutualzz/ui-native";
import * as Font from "expo-font";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
    const app = useAppStore();
    const logger = new Logger({
        tag: "App",
    });

    const insets = useSafeAreaInsets();

    useEffect(() => {
        async function loadFonts() {
            try {
                await Font.loadAsync({
                    ...MaterialIcons.font,
                });
            } catch (err) {
                logger.warn("Error loading fonts", err);
            }
        }

        loadFonts();
        app.loadSettings();

        logger.debug("Loading complete");
        app.setAppLoading(false);
        SplashScreen.hide();
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
                        <TabSlot style={{ flex: 1, marginTop: insets.top }} />
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
