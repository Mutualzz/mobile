import { UserSettingsSidebarProvider } from "@contexts/UserSettingsSidebar.context";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SettingsLayout = () => {
  return (
    <UserSettingsSidebarProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </UserSettingsSidebarProvider>
  );
};

export default observer(SettingsLayout);
