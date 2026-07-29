import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { MessageLike } from "@stores/objects/Message";
import type { Space } from "@stores/objects/Space";
import { getMessageAuthorColor, isSystemMessageType, isSystemUser } from "@mutualzz/client";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  message: MessageLike;
  space?: Space | null;
}

export const MessageAuthor = observer(({ message, space }: Props) => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const { theme } = useTheme();
  const author = message.author;
  if (!author) {
    return <Typography>{t("unknown")}</Typography>;
  }

  if (isSystemUser(author) && !isSystemMessageType(message.type)) {
    return <Typography>{t("unknown")}</Typography>;
  }

  const member =
    space && author.id ? space.members.get(author.id) : undefined;
  const primaryTextColor = theme.typography.colors.primary;
  const nameColor = getMessageAuthorColor({
    showRoleColors: app.settings?.showRoleColorsInMessages ?? false,
    primaryTextColor,
    roleColor: member?.highestRole?.color,
    accentColor: app.users.get(author.id)?.accentColor ?? author.accentColor,
  });
  const displayName = member?.displayName ?? author.displayName;
  const pronouns = author.pronouns;

  return (
    <UserProfileTrigger user={author} member={member}>
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <Typography truncate="single" style={{ flexShrink: 1, color: nameColor }}>
          {displayName}
        </Typography>
        {pronouns ? (
          <>
            <Typography level="body-sm" textColor="muted">
              ·
            </Typography>
            <Typography level="body-sm" textColor="muted" truncate="single">
              {pronouns}
            </Typography>
          </>
        ) : null}
      </Box>
    </UserProfileTrigger>
  );
});
