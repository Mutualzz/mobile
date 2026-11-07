import { CustomStatusDisplay } from "@components/CustomStatus/CustomStatusDisplay";
import { ActivityIcon } from "@components/Presence/ActivityIcon";
import { useAppStore } from "@hooks/useStores";
import type { PresencePayload } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import {
  activityTypeLabelKey,
  formatActivityPrimary,
  formatActivitySecondary,
} from "@mutualzz/client";
import {
  findLyricsActivity,
  getCustomActivity,
  getNonCustomActivities,
} from "@mutualzz/client";
import { useLyricLine } from "@hooks/useLyricLine";
import { MusicNotesIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  userId?: string;
  presence?: PresencePayload;
  hideCustomStatus?: boolean;
}

export const SmallActivityStatus = observer(
  ({ userId, presence, hideCustomStatus = false }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { t } = useTranslation("common");
    const accent = theme.colors.success;
    const profileRestricted =
      userId != null && app.profiles.isProfileRestricted(userId);
    const lyricLine = useLyricLine(
      profileRestricted ? null : findLyricsActivity(presence),
    );

    if (!presence) return null;

    if (lyricLine && !hideCustomStatus) {
      return (
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            width: "100%",
          }}
        >
          <MusicNotesIcon size={14} weight="fill" color={accent} />
          <Typography
            level="body-xs"
            textColor="accent"
            truncate="single"
            style={{ flex: 1, minWidth: 0 }}
          >
            {lyricLine}
          </Typography>
        </Box>
      );
    }

    const customActivity = getCustomActivity(presence);
    const otherActivities = profileRestricted
      ? []
      : getNonCustomActivities(presence);
    const activity = otherActivities[0] ?? null;

    if (customActivity && !hideCustomStatus) {
      const extraCount = profileRestricted ? 0 : otherActivities.length;
      return (
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            width: "100%",
          }}
        >
          <Box style={{ flex: 1, minWidth: 0 }}>
            <CustomStatusDisplay
              activity={customActivity}
              level="body-xs"
              textColor="accent"
              emojiSize={14}
            />
          </Box>
          {extraCount > 0 && (
            <Typography
              level="body-xs"
              textColor="accent"
              style={{ opacity: 0.85 }}
            >
              +{extraCount}
            </Typography>
          )}
        </Box>
      );
    }

    if (!activity) return null;

    const typeKey = activityTypeLabelKey(activity.type);
    const typeLabel = typeKey ? t(typeKey) : null;
    const title = formatActivityPrimary(activity);
    const secondary = formatActivitySecondary(activity);
    const line = typeLabel
      ? secondary
        ? `${typeLabel} ${title} · ${secondary}`
        : `${typeLabel} ${title}`
      : secondary
        ? `${title} · ${secondary}`
        : title;
    const extraCount = Math.max(0, otherActivities.length - 1);

    return (
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          width: "100%",
        }}
      >
        <ActivityIcon activity={activity} size={14} color={accent} />
        <Typography
          level="body-xs"
          textColor="accent"
          truncate="single"
          style={{ flex: 1, minWidth: 0 }}
        >
          {line}
        </Typography>
        {extraCount > 0 && (
          <Typography
            level="body-xs"
            textColor="accent"
            style={{ opacity: 0.85 }}
          >
            +{extraCount}
          </Typography>
        )}
      </Box>
    );
  },
);
