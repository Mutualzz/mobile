import { ProfileConnectionsRow } from "@components/Profile/shared/ProfileConnectionsRow";
import type {
  MobileProfileConnectionsBlock,
  ProfileBlockSize,
  Snowflake,
} from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { LinkSimpleIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  block: MobileProfileConnectionsBlock;
  size: ProfileBlockSize;
  userId: Snowflake;
}

export const ProfileConnectionsWidgetView = ({
  size,
  userId,
}: Props) => {
  const { t } = useTranslation("settings");
  const isCompact = size === "s";

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        padding: isCompact ? 10 : 12,
        gap: isCompact ? 6 : 8,
      }}
    >
      <Stack direction="row" alignItems="center" style={{ gap: 6 }}>
        <LinkSimpleIcon size={isCompact ? 14 : 16} weight="fill" />
        <Typography level={isCompact ? "body-xs" : "body-sm"} weight="bold">
          {t("profile.blocks.connections")}
        </Typography>
      </Stack>
      <ProfileConnectionsRow userId={userId} showEmpty />
    </View>
  );
};
