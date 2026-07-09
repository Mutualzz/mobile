import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";

export const AppNotificationsSettings = observer(() => {
  const app = useAppStore();

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
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          Push notifications
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Mutualzz sends push notifications to your phone when you are idle or
          offline. This covers direct messages and mentions while you are away
          from the app. For DMs, you can reply directly from the notification
          without opening the app. Permission is requested when you sign in on a
          physical device.
        </Typography>
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          Do Not Disturb
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Set your status to Do Not Disturb or Invisible to suppress push
          notifications. While you are online and active, notifications stay in
          the app instead.
        </Typography>
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          Presence
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Idle detection on desktop automatically marks you as idle after
          inactivity. On mobile, use your status picker to set Online, Idle, Do
          Not Disturb, or Invisible - including timed durations.
        </Typography>
      </Paper>
    </ScrollView>
  );
});
