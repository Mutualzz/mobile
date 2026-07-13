import { Paper } from "@components/Paper";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const AppNotificationsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const settings = app.settings;
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  if (!settings) return null;

  const sync = () => {
    void settings.sync();
  };

  const clearHistory = () => {
    Alert.alert(
      t("notifications.clearRecentActivity"),
      t("notifications.clearRecentActivityDescription"),
      [
        {
          text: t("notifications.clearRecentActivityAction"),
          style: "destructive",
          onPress: () => void runClear(),
        },
        { text: tCommon("cancel"), style: "cancel" },
      ],
    );
  };

  const runClear = async () => {
    setClearing(true);
    try {
      await app.rest.delete("/@me/activity-history");
      await queryClient.invalidateQueries({
        queryKey: ["user-recent-activities"],
      });
      Alert.alert(t("notifications.clearRecentActivityDone"));
    } catch {
      Alert.alert(t("notifications.clearRecentActivityError"));
    } finally {
      setClearing(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Typography level="body-md" weight={700}>
        {t("notifications.pushTitle")}
      </Typography>
      <Paper
        style={{ padding: 16, borderRadius: 12, gap: 12, minWidth: 0 }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-xs" textColor="muted">
          {t("notifications.pushDescriptionMobile")}
        </Typography>

        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Typography level="body-sm" weight={700} style={{ flex: 1 }}>
            {t("notifications.enablePush")}
          </Typography>
          <Switch
            checked={settings.pushEnabled}
            onChange={(checked) => {
              settings.setPushEnabled(checked);
              sync();
            }}
          />
        </Box>

        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Box style={{ flex: 1, gap: 2 }}>
            <Typography level="body-sm" weight={700}>
              {t("notifications.directMessages")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {t("notifications.directMessagesDescription")}
            </Typography>
          </Box>
          <Switch
            checked={settings.pushDirectMessages}
            disabled={!settings.pushEnabled}
            onChange={(checked) => {
              settings.setPushDirectMessages(checked);
              sync();
            }}
          />
        </Box>

        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Box style={{ flex: 1, gap: 2 }}>
            <Typography level="body-sm" weight={700}>
              {t("notifications.mentions")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {t("notifications.mentionsDescription")}
            </Typography>
          </Box>
          <Switch
            checked={settings.pushMentions}
            disabled={!settings.pushEnabled}
            onChange={(checked) => {
              settings.setPushMentions(checked);
              sync();
            }}
          />
        </Box>
      </Paper>

      <Divider lineColor="muted" style={{ opacity: 0.5 }} />

      <Typography level="body-md" weight={700}>
        {t("notifications.presenceTitle")}
      </Typography>
      <Paper
        style={{ padding: 16, borderRadius: 12, gap: 12, minWidth: 0 }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Box style={{ flex: 1, gap: 2 }}>
            <Typography level="body-sm" weight={700}>
              {t("notifications.shareActivity")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {t("notifications.shareActivityDescription")}
            </Typography>
          </Box>
          <Switch
            checked={settings.shareActivity}
            onChange={(checked) => {
              settings.setShareActivity(checked);
              sync();
            }}
          />
        </Box>
        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Box style={{ flex: 1, gap: 2 }}>
            <Typography level="body-sm" weight={700}>
              {t("notifications.shareRecentActivity")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {t("notifications.shareRecentActivityDescription")}
            </Typography>
          </Box>
          <Switch
            checked={settings.shareRecentActivity}
            onChange={(checked) => {
              settings.setShareRecentActivity(checked);
              sync();
              void queryClient.invalidateQueries({
                queryKey: ["user-recent-activities"],
              });
            }}
          />
        </Box>
        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Box style={{ flex: 1, gap: 2 }}>
            <Typography level="body-sm" weight={700}>
              {t("notifications.clearRecentActivity")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {t("notifications.clearRecentActivityDescription")}
            </Typography>
          </Box>
          <Button
            size="sm"
            color="danger"
            variant="outlined"
            loading={clearing}
            onPress={clearHistory}
          >
            {t("notifications.clearRecentActivityAction")}
          </Button>
        </Box>
        <Typography level="body-xs" textColor="muted">
          {t("notifications.presenceDescriptionMobile")}
        </Typography>
      </Paper>
    </ScrollView>
  );
});
