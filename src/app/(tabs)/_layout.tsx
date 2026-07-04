import { ModeSwitcher } from "@components/ModeSwitcher";
import TabBar from "@components/Tabs/TabBar";
import { UserBar } from "@components/User/UserBar";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { useIsTabBarHidden } from "@utils/layout";
import { Redirect } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { observer } from "mobx-react-lite";

const AppLayout = () => {
  const app = useAppStore();
  const hideTabBar = useIsTabBarHidden();

  if (!app.token) return <Redirect href="/login" />;

  return (
    <Tabs>
      <Box style={{ flex: 1 }}>
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
      </TabList>

      {!hideTabBar && (
        <>
          <TabBar>
            <UserBar />
          </TabBar>
          {!app.hideSwitcher && <ModeSwitcher />}
        </>
      )}
    </Tabs>
  );
};

export default observer(AppLayout);
