import { HomeContextual } from "@components/HomeContextual";
import { ModeSwitcher } from "@components/ModeSwitcher";
import TabBar from "@components/Tabs/TabBar";
import TabButton from "@components/Tabs/TabButton";
import { UserAvatar } from "@components/User/UserAvatar";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppStore } from "@hooks/useStores";
import { Box, useTheme } from "@mutualzz/ui-native";
import { Redirect } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { observer } from "mobx-react-lite";

const AppLayout = () => {
    const app = useAppStore();
    const { theme } = useTheme();

    if (!app.token) return <Redirect href="/login" />;

    return (
        <Tabs>
            <TabSlot style={{ flex: 1 }} />

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
                <HomeContextual />
                <Box
                    style={{
                        flex: 1,
                        flexDirection: "column",
                    }}
                >
                    <TabTrigger asChild name="@me" href="/@me">
                        <TabButton
                            icon={
                                <MaterialIcons
                                    size={30}
                                    color={theme.colors.neutral}
                                    name="people"
                                />
                            }
                        >
                            Mutuals
                        </TabButton>
                    </TabTrigger>
                </Box>
                <Box
                    style={{
                        flex: 1,
                        flexDirection: "column",
                    }}
                >
                    <TabTrigger asChild name="settings">
                        <TabButton
                            icon={<UserAvatar size={36} user={app.account} />}
                        >
                            You
                        </TabButton>
                    </TabTrigger>
                </Box>
                {!app.hideSwitcher && <ModeSwitcher />}
            </TabBar>
        </Tabs>
    );
};

export default observer(AppLayout);
