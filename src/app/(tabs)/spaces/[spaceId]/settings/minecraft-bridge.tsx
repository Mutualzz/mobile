import { MinecraftBridgeSettings } from "@components/UserSettings/MinecraftBridgeSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SpaceMinecraftBridgeSettingsPage = () => {
  const { t } = useTranslation("space");
  const { space } = useRequireSpaceSettingsAccess();
  if (!space) return null;

  return (
    <SpaceSettingsScreen
      title={t("nav.pages.minecraftBridge")}
      contentStyle={{ flex: 1 }}
    >
      <MinecraftBridgeSettings spaceId={space.id} />
    </SpaceSettingsScreen>
  );
};

export default observer(SpaceMinecraftBridgeSettingsPage);
