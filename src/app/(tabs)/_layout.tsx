import { MaterialIcons } from "@expo/vector-icons";
import { IconButton, ThemeProvider } from "@mutualzz/ui-native";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { NavigationWithTheme } from "../../components/NavigationWithTheme";
import { TabBar } from "../../components/TabBar/TabBar";

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
    useEffect(() => {
        SplashScreen.hide();
    }, []);

    return (
        <ThemeProvider>
            <NavigationWithTheme>
                <Tabs
                    options={{
                        backBehavior: "none",
                    }}
                >
                    <TabSlot />
                    <TabList
                        style={{
                            width: "100%",
                            position: "absolute",
                            bottom: 0,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            backgroundColor: "black",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                        }}
                        asChild
                    >
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
            </NavigationWithTheme>
        </ThemeProvider>
    );
};

export default RootLayout;
