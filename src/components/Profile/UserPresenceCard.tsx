import { Paper } from "@components/Paper";
import { PresenceActivitiesList } from "@components/Presence/PresenceActivitiesList";
import type { PresencePayload } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { getNonCustomActivities } from "@utils/customStatus";

interface Props {
  presence: PresencePayload;
  isCompact?: boolean;
}

export const UserPresenceCard = observer(
  ({ presence, isCompact = false }: Props) => {
    const { theme } = useTheme();

    const otherActivities = useMemo(
      () => getNonCustomActivities(presence),
      [presence],
    );

    const isVisible =
      (presence.status === "online" ||
        presence.status === "idle" ||
        presence.status === "dnd") &&
      otherActivities.length > 0;

    if (!isVisible) return null;

    return (
      <Paper
        elevation={1}
        style={{
          padding: 10,
          borderRadius: 8,
          gap: 8,
          backgroundColor: `${theme.colors.surface}cc`,
          borderWidth: 1,
          borderColor: `${theme.colors.neutral}22`,
        }}
      >
        <PresenceActivitiesList
          activities={otherActivities}
          iconSize={isCompact ? 28 : 36}
          fetchFallback
          isCompact={isCompact}
        />
      </Paper>
    );
  },
);
