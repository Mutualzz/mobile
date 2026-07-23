import { Redirect } from "expo-router";

export default function LegacyAccessibilitySettingsRedirect() {
  return <Redirect href="/settings/appearance" />;
}
