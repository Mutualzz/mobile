import { SheetHostBootstrap } from "@components/SheetHost/SheetHostBootstrap";
import { UserSettingsSidebarProvider } from "@contexts/UserSettingsSidebar.context";
import { Box } from "@mutualzz/ui-native";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SettingsLayout = () => {
  return (
    <SheetHostBootstrap id="settings" priority={1}>
      <UserSettingsSidebarProvider>
        <Box style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="my-account" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="appearance" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="voice_and_video" />
            <Stack.Screen name="connections" />
            <Stack.Screen name="expressions" />
            <Stack.Screen name="minecraft-bridge" />
            <Stack.Screen name="support" />
            <Stack.Screen name="support/[ticketId]" />
            <Stack.Screen name="avatar-editor" />
            <Stack.Screen name="profile-editor" />
            <Stack.Screen name="profile-widgets" />
          </Stack>
        </Box>
      </UserSettingsSidebarProvider>
    </SheetHostBootstrap>
  );
};

export default observer(SettingsLayout);
