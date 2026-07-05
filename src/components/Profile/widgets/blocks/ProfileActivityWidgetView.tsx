import { useAppStore } from "@hooks/useStores";
import type {
  MobileProfileActivityBlock,
  PresenceActivityType,
  ProfileBlockSize,
  Snowflake,
} from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import {
  GameControllerIcon,
  HeadphonesIcon,
  NotepadIcon,
  PulseIcon,
} from "phosphor-react-native";
import { View } from "react-native";

interface Props {
  block: MobileProfileActivityBlock;
  size: ProfileBlockSize;
  userId: Snowflake;
}

function ActivityTypeIcon({
  type,
  color,
}: {
  type: PresenceActivityType;
  color: string;
}) {
  switch (type) {
    case "playing":
      return <GameControllerIcon size={12} weight="fill" color={color} />;
    case "listening":
      return <HeadphonesIcon size={12} weight="fill" color={color} />;
    default:
      return <NotepadIcon size={12} weight="fill" color={color} />;
  }
}

export const ProfileActivityWidgetView = observer(
  ({ block, size, userId }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const presence = app.presence.get(userId);
    const customActivity = presence?.activities.find((a) => a.type === "custom");
    const otherActivities = presence?.activities.filter((a) => a.type !== "custom");

    return (
      <View style={{ width: "100%", height: "100%", padding: 12, gap: 6 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PulseIcon size={16} weight="fill" />
          <Typography level="body-sm" weight="bold">
            Activity
          </Typography>
        </Stack>

        {presence?.status ? (
          <Stack direction="row" spacing={0.75} alignItems="center" style={{ flexWrap: "wrap" }}>
            <Typography
              level="body-xs"
              textColor="muted"
              style={{ textTransform: "capitalize" }}
            >
              {presence.status}
            </Typography>
            {size === "m" && customActivity?.state && block.showCustomStatus ? (
              <>
                <Typography level="body-xs" textColor="muted">
                  —
                </Typography>
                <Typography level="body-xs" textColor="primary" numberOfLines={1}>
                  {customActivity.state}
                </Typography>
              </>
            ) : null}
            {size === "m" && otherActivities && otherActivities.length > 0
              ? otherActivities.slice(0, 2).map((activity, index) => (
                  <Stack
                    key={`${activity.type}-${activity.name}-${index}`}
                    direction="row"
                    spacing={0.4}
                    alignItems="center"
                  >
                    <ActivityTypeIcon type={activity.type} color={theme.colors.success} />
                    <Typography level="body-xs" textColor="accent" numberOfLines={1}>
                      {activity.name}
                    </Typography>
                  </Stack>
                ))
              : null}
          </Stack>
        ) : (
          <Typography level="body-xs" textColor="muted">
            Offline
          </Typography>
        )}
      </View>
    );
  },
);
