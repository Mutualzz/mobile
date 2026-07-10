import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
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
            Push notifications
          </Typography>
          <Typography level="body-sm" textColor="muted">
            Sent to your phone when you are idle or offline. DMs support quick
            reply from the notification shade.
          </Typography>
        </Box>

        <NotificationToggle
          label="Enable push notifications"
          checked={settings.pushEnabled}
          onChange={(value) => {
            settings.setPushEnabled(value);
            sync();
          }}
        />
        <NotificationToggle
          label="Direct messages"
          description="Includes group direct messages"
          checked={settings.pushDirectMessages}
          disabled={!settings.pushEnabled}
          onChange={(value) => {
            settings.setPushDirectMessages(value);
            sync();
          }}
        />
        <NotificationToggle
          label="Mentions"
          description="Includes @user, @role, @everyone, and @here"
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
          Do Not Disturb
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Set your status to Do Not Disturb or Invisible to suppress push
          notifications regardless of these toggles. While you are online and
          active, notifications stay in the app instead.
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
