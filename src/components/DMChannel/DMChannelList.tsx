import { DMChannelItem } from "@components/DMChannel/DMChannelItem";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const EMPTY_DM_MESSAGE =
  'You have no direct messages yet. Start a conversation by clicking "Message" on a user\'s profile or by creating a new group DM!';

export const DMChannelList = observer(() => {
  const app = useAppStore();
  const dms = app.channels.dms;

  return (
    <Paper
      style={{
        flex: 1,
        padding: 12,
        marginHorizontal: 12,
        gap: 8,
      }}
      elevation={app.settings?.preferEmbossed ? 2 : 0}
    >
      <Typography level="label-xs" textColor="muted">
        Direct Messages
      </Typography>

      {dms.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 24 }}
        >
          {EMPTY_DM_MESSAGE}
        </Typography>
      ) : (
        dms.map((dm) => <DMChannelItem key={dm.id} channel={dm} />)
      )}
    </Paper>
  );
});
