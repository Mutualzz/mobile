import { Redirect } from "expo-router";

export default function LegacyTextChatSettingsRedirect() {
  return <Redirect href="/settings/messages" />;
}
