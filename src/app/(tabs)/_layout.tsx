import { SheetHostBootstrap } from "@components/SheetHost/SheetHostBootstrap";
import TabBar from "@components/Tabs/TabBar";
import { UserBar } from "@components/User/UserBar";
import { useTrackLastRoute } from "@hooks/useTrackLastRoute";
import { useKeyboardOpen } from "@hooks/useKeyboardOffset";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { useIsTabBarHidden } from "@utils/layout";
import { Redirect } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { observer } from "mobx-react-lite";

const AppLayout = () => {
  const app = useAppStore();
  const hideTabBar = useIsTabBarHidden();
  const keyboardOpen = useKeyboardOpen();
  const hideChrome = hideTabBar || keyboardOpen;
  useTrackLastRoute();

  if (!app.token) return <Redirect href="/login" />;

  return (
    <SheetHostBootstrap id="tabs" priority={0}>
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

        <Box
          pointerEvents={hideChrome ? "none" : "box-none"}
          style={
            hideChrome
              ? {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  transform: [{ translateY: 24 }],
                }
              : undefined
          }
        >
          <TabBar>
            <UserBar />
          </TabBar>
        </Box>
      </Tabs>
    </SheetHostBootstrap>
  );
};

export default observer(AppLayout);
