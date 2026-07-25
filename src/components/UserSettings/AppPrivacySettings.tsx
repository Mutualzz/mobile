import { Button } from "@components/Button";
import {
  SettingsSection,
  SettingsSelectRow,
  SettingsScroll,
} from "@components/UserSettings/SettingsField";
import { UserAvatar } from "@components/User/UserAvatar";
import { useSettingsOptionSheet } from "@hooks/useSettingsOptionSheet";
import { useAppStore } from "@hooks/useStores";
import { privacyLabelKey } from "@mutualzz/client";
import {
  DM_PRIVACY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  type DmPrivacy,
  type ProfileVisibility,
} from "@mutualzz/types";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const AppPrivacySettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const settings = app.settings;
  const openPrivacyPicker = useSettingsOptionSheet();
  const blocked = app.relationships.blocked;

  useEffect(() => {
    void app.relationships.resolveAll(true);
  }, [app.relationships]);

  useEffect(() => {
    for (const relationship of blocked) {
      const userId = relationship.otherUserIdForMe;
      if (userId) void app.users.resolve(userId);
    }
  }, [app.users, blocked]);

  if (!settings) return null;

  const extended = settings.extendedSettings;

  const patch = (next: Partial<typeof extended>) => {
    settings.patchExtendedSettings(next);
  };

  const privacyLabel = (value: DmPrivacy | ProfileVisibility) =>
    t(privacyLabelKey(value));

  const privacyOptions = (values: readonly string[]) =>
    values.map((value) => ({
      value,
      label: privacyLabel(value as DmPrivacy | ProfileVisibility),
    }));

  return (
    <SettingsScroll>
      <SettingsSection title={t("privacy.title")}>
        <SettingsSelectRow
          title={t("privacy.whoCanDm")}
          description={t("privacy.whoCanDmDescription")}
          value={privacyLabel(extended.whoCanDm)}
          onPress={() =>
            openPrivacyPicker(
              "privacy-who-can-dm",
              t("privacy.whoCanDm"),
              privacyOptions(DM_PRIVACY_OPTIONS),
              extended.whoCanDm,
              (value) => patch({ whoCanDm: value as DmPrivacy }),
            )
          }
        />

        <Divider />

        <SettingsSelectRow
          title={t("privacy.profileVisibility")}
          description={t("privacy.profileVisibilityDescription")}
          value={privacyLabel(extended.profileVisibility)}
          onPress={() =>
            openPrivacyPicker(
              "privacy-profile-visibility",
              t("privacy.profileVisibility"),
              privacyOptions(PROFILE_VISIBILITY_OPTIONS),
              extended.profileVisibility,
              (value) =>
                patch({ profileVisibility: value as ProfileVisibility }),
            )
          }
        />
      </SettingsSection>

      <SettingsSection title={t("privacy.blockedUsers")}>
        {blocked.length === 0 ? (
          <Typography level="body-sm" textColor="muted">
            {t("privacy.blockedUsersEmpty")}
          </Typography>
        ) : (
          blocked.map((relationship, index) => {
            const userId = relationship.otherUserIdForMe;
            const user = userId ? app.users.get(userId) : null;
            if (!userId) return null;

            return (
              <Box key={relationship.id}>
                {index > 0 ? <Divider /> : null}
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Box
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {user ? <UserAvatar user={user} size="sm" /> : null}
                    <Typography level="body-sm" truncate="single">
                      {user?.displayName ?? userId}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="sm"
                    onPress={() => void app.relationships.unblockUser(userId)}
                  >
                    {t("chat:contextMenu.unblock")}
                  </Button>
                </Box>
              </Box>
            );
          })
        )}
      </SettingsSection>
    </SettingsScroll>
  );
});
