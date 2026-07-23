import {
  SettingsActionRow,
  SettingsScroll,
  SettingsSection,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { useAppStore } from "@hooks/useStores";
import { Divider, Typography } from "@mutualzz/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const AppNotificationsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const settings = app.settings;
  const queryClient = useQueryClient();

  if (!settings) return null;

  const sync = () => {
    void settings.sync();
  };

  const clearHistory = async () => {
    try {
      await app.rest.delete("/@me/activity-history");
      await queryClient.invalidateQueries({
        queryKey: ["user-recent-activities"],
      });
      Alert.alert(t("notifications.clearRecentActivityDone"));
    } catch {
      Alert.alert(t("notifications.clearRecentActivityError"));
    }
  };

  const confirmClearHistory = () => {
    Alert.alert(
      t("notifications.clearRecentActivity"),
      t("notifications.clearRecentActivityDescription"),
      [
        { text: tCommon("cancel"), style: "cancel" },
        {
          text: t("notifications.clearRecentActivityAction"),
          style: "destructive",
          onPress: () => void clearHistory(),
        },
      ],
    );
  };

  return (
    <SettingsScroll>
      <SettingsSection
        title={t("notifications.pushTitle")}
        description={t("notifications.pushDescriptionMobile")}
      >
        <SettingsToggleRow
          title={t("notifications.enablePush")}
          checked={settings.pushEnabled}
          onChange={(checked) => {
            settings.setPushEnabled(checked);
            sync();
          }}
        />

        <Divider />

        <SettingsToggleRow
          title={t("notifications.directMessages")}
          description={t("notifications.directMessagesDescription")}
          checked={settings.pushDirectMessages}
          disabled={!settings.pushEnabled}
          onChange={(checked) => {
            settings.setPushDirectMessages(checked);
            sync();
          }}
        />

        <Divider />

        <SettingsToggleRow
          title={t("notifications.mentions")}
          description={t("notifications.mentionsDescription")}
          checked={settings.pushMentions}
          disabled={!settings.pushEnabled}
          onChange={(checked) => {
            settings.setPushMentions(checked);
            sync();
          }}
        />
      </SettingsSection>

      <SettingsSection title={t("notifications.presenceTitle")}>
        <SettingsToggleRow
          title={t("notifications.shareActivity")}
          description={t("notifications.shareActivityDescription")}
          checked={settings.shareActivity}
          onChange={(checked) => {
            settings.setShareActivity(checked);
            sync();
          }}
        />

        <Divider />

        <SettingsToggleRow
          title={t("notifications.shareRecentActivity")}
          description={t("notifications.shareRecentActivityDescription")}
          checked={settings.shareRecentActivity}
          onChange={(checked) => {
            settings.setShareRecentActivity(checked);
            sync();
            void queryClient.invalidateQueries({
              queryKey: ["user-recent-activities"],
            });
          }}
        />

        <Divider />

        <SettingsActionRow
          title={t("notifications.clearRecentActivity")}
          description={t("notifications.clearRecentActivityDescription")}
          actionLabel={t("notifications.clearRecentActivityAction")}
          actionColor="danger"
          onPress={confirmClearHistory}
        />

        <Typography level="body-xs" textColor="muted" style={{ paddingTop: 4 }}>
          {t("notifications.dndSuppressNote")}
        </Typography>
      </SettingsSection>
    </SettingsScroll>
  );
});
