import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

const NotificationToggle = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) => (
  <Pressable
    accessibilityRole="switch"
    accessibilityState={{ checked, disabled }}
    disabled={disabled}
    onPress={() => onChange(!checked)}
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <Box style={{ flex: 1, gap: 2 }}>
      <Typography level="body-sm" weight={600}>
        {label}
      </Typography>
      {description && (
        <Typography level="body-xs" textColor="muted">
          {description}
        </Typography>
      )}
    </Box>
    <Switch checked={checked} disabled={disabled} onChange={onChange} />
  </Pressable>
);

export const AppNotificationsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const settings = app.settings;

  if (!settings) return null;

  const sync = () => {
    void settings.sync();
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
    >
      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 16,
        }}
        elevation={settings.preferEmbossed ? 2 : 0}
      >
        <Box style={{ gap: 4 }}>
          <Typography level="body-md" weight={700}>
            {t("notifications.pushTitle")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("notifications.pushDescriptionMobile")}
          </Typography>
        </Box>

        <NotificationToggle
          label={t("notifications.enablePush")}
          checked={settings.pushEnabled}
          onChange={(value) => {
            settings.setPushEnabled(value);
            sync();
          }}
        />
        <NotificationToggle
          label={t("notifications.directMessages")}
          description={t("notifications.directMessagesDescription")}
          checked={settings.pushDirectMessages}
          disabled={!settings.pushEnabled}
          onChange={(value) => {
            settings.setPushDirectMessages(value);
            sync();
          }}
        />
        <NotificationToggle
          label={t("notifications.mentions")}
          description={t("notifications.mentionsDescription")}
          checked={settings.pushMentions}
          disabled={!settings.pushEnabled}
          onChange={(value) => {
            settings.setPushMentions(value);
            sync();
          }}
        />
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={settings.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("notifications.dndTitle")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("notifications.dndDescriptionMobile")}
        </Typography>
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={settings.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("notifications.presenceTitle")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("notifications.presenceDescriptionMobile")}
        </Typography>
      </Paper>
    </ScrollView>
  );
});
