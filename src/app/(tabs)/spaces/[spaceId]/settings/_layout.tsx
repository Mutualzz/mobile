import { SheetHostBootstrap } from "@components/SheetHost/SheetHostBootstrap";
import { Stack } from "expo-router";

export default function SpaceSettingsLayout() {
  return (
    <SheetHostBootstrap id="space-settings" priority={2}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </SheetHostBootstrap>
  );
}
