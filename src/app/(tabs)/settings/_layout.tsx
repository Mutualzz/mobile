import { UserSettingsSidebarProvider } from "@contexts/UserSettingsSidebar.context";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SettingsLayout = () => {
    return (
        <UserSettingsSidebarProvider>
            <Stack
                screenOptions={{
                    headerTitle: "Settings",
                    headerTitleAlign: "center",
                }}
            />
        </UserSettingsSidebarProvider>
    );
};

export default observer(SettingsLayout);
