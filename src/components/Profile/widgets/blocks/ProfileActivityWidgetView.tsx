import { CustomStatusDisplay } from "@components/CustomStatus/CustomStatusDisplay";
import { PresenceActivitiesList } from "@components/Presence/PresenceActivitiesList";
import { RecentActivitiesSection } from "@components/Profile/shared/RecentActivitiesSection";
import { useAppStore } from "@hooks/useStores";
import type {
  MobileProfileActivityBlock,
  ProfileBlockSize,
  Snowflake,
} from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { PulseIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { getCustomActivity, getNonCustomActivities } from "@mutualzz/client";

interface Props {
  block: MobileProfileActivityBlock;
  size: ProfileBlockSize;
  userId: Snowflake;
}

export const ProfileActivityWidgetView = observer(
  ({ block, size, userId }: Props) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const isCompact = size === "s";
    const presence = app.presence.get(userId);

    const isActive =
      presence?.status === "online" ||
      presence?.status === "idle" ||
      presence?.status === "dnd";

    const customActivity = presence ? getCustomActivity(presence) : null;
    const otherActivities = presence ? getNonCustomActivities(presence) : [];

    const showCustom =
      Boolean(customActivity) && block.showCustomStatus !== false;
    const showActivities = otherActivities.length > 0;
    const hasLiveContent = isActive && (showCustom || showActivities);
    const tile = isCompact ? 28 : 36;

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
            {t("profile.blocks.activity")}
          </Typography>
        </Stack>

        <Stack
          direction="column"
          style={{ gap: isCompact ? 4 : 6, minWidth: 0, flex: 1 }}
        >
          {hasLiveContent ? (
            <>
              {showCustom && customActivity ? (
                <CustomStatusDisplay
                  activity={customActivity}
                  emojiSize={isCompact ? 14 : 16}
                />
              ) : null}

              {showActivities ? (
                <View style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                  <PresenceActivitiesList
                    activities={otherActivities}
                    iconSize={tile}
                    fetchFallback
                    isCompact={isCompact}
                    scrollWhenExpanded={isCompact}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          <RecentActivitiesSection
            userId={userId}
            liveActivities={isActive ? otherActivities : []}
            isCompact={isCompact}
            showEmpty={!hasLiveContent}
          />
        </Stack>
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
    const presence = app.presence.get(userId);

    const isActive =
      presence?.status === "online" ||
      presence?.status === "idle" ||
      presence?.status === "dnd";

    const customActivity = presence ? getCustomActivity(presence) : null;
    const otherActivities = presence ? getNonCustomActivities(presence) : [];

    const showCustom =
      Boolean(customActivity) && block.showCustomStatus !== false;
    const showActivities = otherActivities.length > 0;
    const hasLiveContent = isActive && (showCustom || showActivities);

    return (
      <Stack direction="column" style={{ gap: 10 }}>
        {hasLiveContent ? (
          <>
            {showCustom && customActivity ? (
              <CustomStatusDisplay
                activity={customActivity}
                truncate={false}
                emojiSize={18}
              />
            ) : null}

            {showActivities ? (
              <PresenceActivitiesList
                activities={otherActivities}
                iconSize={44}
                fetchFallback
              />
            ) : null}
          </>
        ) : null}

        <RecentActivitiesSection
          userId={userId}
          liveActivities={isActive ? otherActivities : []}
          showEmpty={!hasLiveContent}
        />
      </Stack>
    );
  },
);
