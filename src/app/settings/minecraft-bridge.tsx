import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { MinecraftBridgeSettings } from "@components/UserSettings/MinecraftBridgeSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const MinecraftBridgeSettingsPage = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.minecraftBridge")}>
      <MinecraftBridgeSettings />
    </SettingsScreen>
  );
};

export default observer(MinecraftBridgeSettingsPage);
