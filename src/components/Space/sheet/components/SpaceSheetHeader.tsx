import { SpaceIcon } from "@components/Space/SpaceIcon";
import {
  getSpaceMemberCount,
  getSpaceOnlineCount,
} from "../spaceSheetStats";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
}

function StatusDot({ color }: { color: string }) {
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
      }}
    />
  );
}

export const SpaceSheetHeader = observer(({ space }: Props) => {
  const { t } = useTranslation("space");
  const { theme } = useTheme();
  const memberCount = getSpaceMemberCount(space);
  const onlineCount = getSpaceOnlineCount(space);

  return (
    <Box style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <SpaceIcon space={space} size={56} />
      <Box style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Typography level="title-sm" weight={700} truncate="single">
          {space.name}
        </Typography>
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {onlineCount > 0 ? (
            <Box style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <StatusDot color={theme.colors.success} />
              <Typography level="body-sm" textColor="muted">
                {t("sheet.onlineCount", { count: onlineCount })}
              </Typography>
            </Box>
          ) : null}
          {memberCount > 0 ? (
            <Box style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <StatusDot color={theme.typography.colors.muted} />
              <Typography level="body-sm" textColor="muted">
                {t("sheet.membersCount", { count: memberCount })}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
});
