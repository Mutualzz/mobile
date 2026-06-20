import { ModeSwitcher } from "@components/ModeSwitcher";
import TabBar from "@components/Tabs/TabBar";
import { UserBar } from "@components/User/UserBar";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { getFloatingTabBarInset, useIsTabBarHidden } from "@utils/layout";
import { Redirect } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { observer } from "mobx-react-lite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AppLayout = () => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const hideTabBar = useIsTabBarHidden();
    const tabBarInset = hideTabBar ? 0 : getFloatingTabBarInset(insets);

    if (!app.token) return <Redirect href="/login" />;

    return (
        <Tabs>
            <Box style={{ flex: 1, paddingBottom: tabBarInset }}>
                <TabSlot style={{ flex: 1 }} />
            </Box>

            <TabList
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    opacity: 0,
                }}
            >
                <TabTrigger name="spaces" href="/spaces" />
                <TabTrigger name="feed" href="/feed" />
                <TabTrigger name="@me" href="/@me" />
                <TabTrigger name="settings" href="/settings" />
            </TabList>

            <TabBar>
                <UserBar />
            </TabBar>
            {!app.hideSwitcher && !hideTabBar && <ModeSwitcher />}
        </Tabs>
    );
};

export default observer(AppLayout);
