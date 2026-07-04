import { UserSettingsSidebarProvider } from "@contexts/UserSettingsSidebar.context";
import { Box } from "@mutualzz/ui-native";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SettingsLayout = () => {
  return (
    <UserSettingsSidebarProvider>
      <Box style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Box>
    </UserSettingsSidebarProvider>
  );
};

export default observer(SettingsLayout);
