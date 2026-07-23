import { ActiveSessionsSettings } from "@components/UserSettings/ActiveSessionsSettings";
import {
  SettingsScroll,
  SettingsSection,
} from "@components/UserSettings/SettingsField";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

export const UserSessionsSettingsScreen = observer(() => {
  const { t } = useTranslation("settings");

  return (
    <SettingsScreen title={t("pages.sessions")} contentStyle={{ flex: 1 }}>
      <SettingsScroll>
        <SettingsSection description={t("account.activeSessionsDescription")}>
          <ActiveSessionsSettings />
        </SettingsSection>
      </SettingsScroll>
    </SettingsScreen>
  );
});
