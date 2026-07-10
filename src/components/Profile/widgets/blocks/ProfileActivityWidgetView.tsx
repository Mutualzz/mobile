import { CustomStatusDisplay } from "@components/CustomStatus/CustomStatusDisplay";
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
  iconSize = 12,
}: {
  type: PresenceActivityType;
  color: string;
  iconSize?: number;
}) {
  switch (type) {
    case "playing":
      return <GameControllerIcon size={iconSize} weight="fill" color={color} />;
    case "listening":
      return <HeadphonesIcon size={iconSize} weight="fill" color={color} />;
    default:
      return <NotepadIcon size={iconSize} weight="fill" color={color} />;
  }
}

const ACTIVITY_LIMIT: Record<ProfileBlockSize, number> = { s: 1, m: 2, l: 2 };

export const ProfileActivityWidgetView = observer(
  ({ block, size, userId }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const isCompact = size === "s";
    const presence = app.presence.get(userId);
    const customActivity = presence?.activities.find(
      (a) => a.type === "custom",
    );
    const otherActivities =
      presence?.activities.filter((a) => a.type !== "custom") ?? [];
    const visibleActivities = otherActivities.slice(0, ACTIVITY_LIMIT[size]);

    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          padding: isCompact ? 10 : 12,
          gap: isCompact ? 4 : 6,
        }}
      >
        <Stack direction="row" alignItems="center" style={{ gap: 6 }}>
          <PulseIcon size={isCompact ? 14 : 16} weight="fill" />
          <Typography level={isCompact ? "body-xs" : "body-sm"} weight="bold">
            Activity
          </Typography>
        </Stack>

        {presence?.status ? (
          <Stack direction="column" style={{ gap: isCompact ? 4 : 6, minWidth: 0, flex: 1 }}>
            <Typography
              level="body-xs"
              textColor="muted"
              style={{ textTransform: "capitalize" }}
            >
              {presence.status}
            </Typography>

            {customActivity && block.showCustomStatus !== false ? (
              <CustomStatusDisplay
                activity={customActivity}
                emojiSize={isCompact ? 14 : 16}
              />
            ) : null}

            {visibleActivities.length > 0 ? (
              <Stack direction="column" style={{ gap: isCompact ? 3 : 4 }}>
                {visibleActivities.map((activity, index) => (
                  <Stack
                    key={`${activity.type}-${activity.name}-${index}`}
                    direction="row"
                    alignItems="center"
                    style={{ gap: 6, minWidth: 0 }}
                  >
                    <ActivityTypeIcon
                      type={activity.type}
                      color={theme.colors.success}
                      iconSize={isCompact ? 11 : 12}
                    />
                    <Typography
                      level="body-xs"
                      textColor="accent"
                      truncate="double"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {activity.name}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : null}
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

export const ProfileActivityWidgetExpandedContent = observer(
  ({
    block,
    userId,
  }: {
    block: MobileProfileActivityBlock;
    userId: Snowflake;
  }) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const presence = app.presence.get(userId);
    const customActivity = presence?.activities.find(
      (a) => a.type === "custom",
    );
    const otherActivities =
      presence?.activities.filter((a) => a.type !== "custom") ?? [];

    if (!presence?.status) {
      return (
        <Typography level="body-sm" textColor="muted">
          Offline
        </Typography>
      );
    }

    return (
      <Stack direction="column" style={{ gap: 10 }}>
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textTransform: "capitalize" }}
        >
          {presence.status}
        </Typography>

        {customActivity && block.showCustomStatus !== false ? (
          <CustomStatusDisplay
            activity={customActivity}
            truncate={false}
            emojiSize={18}
          />
        ) : null}

        {otherActivities.length > 0 ? (
          <Stack direction="column" style={{ gap: 8 }}>
            {otherActivities.map((activity, index) => (
              <Stack
                key={`${activity.type}-${activity.name}-${index}`}
                direction="row"
                alignItems="center"
                style={{ gap: 8 }}
              >
                <ActivityTypeIcon
                  type={activity.type}
                  color={theme.colors.success}
                  iconSize={14}
                />
                <Typography level="body-sm" textColor="accent">
                  {activity.name}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Stack>
    );
  },
);
