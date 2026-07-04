import { useAppStore } from "@hooks/useStores";
import type { ProfileActivityBlock, Snowflake } from "@mutualzz/types";
import { Paper, Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { PulseIcon } from "phosphor-react-native";

interface Props {
  block: ProfileActivityBlock;
  userId: Snowflake;
}

export const ProfileActivityBlockView = observer(({ block, userId }: Props) => {
  const app = useAppStore();
  const presence = app.presence.get(userId);
  const customActivity = presence?.activities.find((a) => a.type === "custom");

  return (
    <Paper
      elevation={2}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        padding: 12,
        gap: 8,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <PulseIcon size={18} weight="fill" />
        <Typography level="body-sm" weight="bold">
          Activity
        </Typography>
      </Stack>

      {presence?.status ? (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography
            level="body-xs"
            textColor="muted"
            style={{ textTransform: "capitalize" }}
          >
            {presence.status}
          </Typography>
          {customActivity?.state && block.showCustomStatus ? (
            <>
              <Typography level="body-xs" textColor="muted">
                —
              </Typography>
              <Typography level="body-xs" textColor="primary">
                {customActivity.state}
              </Typography>
            </>
          ) : null}
        </Stack>
      ) : (
        <Typography level="body-xs" textColor="muted">
          Offline
        </Typography>
      )}
    </Paper>
  );
});
