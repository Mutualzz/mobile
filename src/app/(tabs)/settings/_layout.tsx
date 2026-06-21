import { UserSettingsSidebarProvider } from "@contexts/UserSettingsSidebar.context";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { Box } from "@mutualzz/ui-native";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SettingsLayout = () => {
  const tabBarInset = useTabBarContentInset();

  return (
    <UserSettingsSidebarProvider>
      <Box style={{ flex: 1, paddingBottom: tabBarInset }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </Box>
    </UserSettingsSidebarProvider>
  );
};

export default observer(SettingsLayout);
