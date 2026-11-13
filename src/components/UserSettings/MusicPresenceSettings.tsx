import {
  SettingsActionRow,
  SettingsSection,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { useAppStore } from "@hooks/useStores";
import { Button, Checkbox, Divider, Typography } from "@mutualzz/ui-native";
import { MEDIA_APPS } from "@presence/mediaApps";
import {
  isMediaAccessGranted,
  isMediaSessionSupported,
  openMediaAccessSettings,
} from "media-session";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Platform, View } from "react-native";

export const MusicPresenceSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const musicPresence = app.musicPresence;
  const [accessGranted, setAccessGranted] = useState(isMediaAccessGranted);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") setAccessGranted(isMediaAccessGranted());
    });
    return () => subscription.remove();
  }, []);

  if (Platform.OS !== "android" || !isMediaSessionSupported) return null;

  const refreshPresence = () => app.gateway.refreshPresenceActivities();

  return (
    <SettingsSection
      title={t("notifications.musicTitle")}
      description={t("notifications.musicDescription")}
    >
      {!accessGranted && (
        <>
          <SettingsActionRow
            title={t("notifications.musicAccess")}
            description={t("notifications.musicAccessDescription")}
            actionLabel={t("notifications.musicAccessAction")}
            onPress={openMediaAccessSettings}
          />
          <Divider />
        </>
      )}

      <SettingsToggleRow
        title={t("notifications.shareMusicActivity")}
        description={t("notifications.shareMusicActivityDescription")}
        checked={musicPresence.shareMusicActivity}
        disabled={!accessGranted}
        onChange={(checked) => {
          musicPresence.setShareMusicActivity(checked);
          refreshPresence();
        }}
      />

      {accessGranted && musicPresence.shareMusicActivity && (
        <>
          <Divider />

          <SettingsToggleRow
            title={tCommon("customStatus.syncLyrics")}
            checked={musicPresence.syncLyrics}
            onChange={(checked) => {
              musicPresence.setSyncLyrics(checked);
              refreshPresence();
            }}
          />

          <Divider />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography level="body-sm" textColor="muted">
              {t("notifications.musicAppsSelected", {
                selected: musicPresence.enabledMusicAppCount,
                total: MEDIA_APPS.length,
              })}
            </Typography>
            <Button
              variant="plain"
              size="sm"
              onPress={() => {
                musicPresence.setAllMusicAppsEnabled(
                  !musicPresence.allMusicAppsEnabled,
                );
                refreshPresence();
              }}
            >
              {musicPresence.allMusicAppsEnabled
                ? t("notifications.selectNone")
                : t("notifications.selectAll")}
            </Button>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12 }}>
            {MEDIA_APPS.map((mediaApp) => {
              const isEnabled = musicPresence.isMusicAppEnabled(
                mediaApp.applicationId,
              );
              return (
                <View key={mediaApp.applicationId} style={{ width: "50%" }}>
                  <Checkbox
                    size="sm"
                    label={mediaApp.name}
                    checked={isEnabled}
                    onChange={() => {
                      musicPresence.setMusicAppEnabled(
                        mediaApp.applicationId,
                        !isEnabled,
                      );
                      refreshPresence();
                    }}
                  />
                </View>
              );
            })}
          </View>
        </>
      )}
    </SettingsSection>
  );
});
