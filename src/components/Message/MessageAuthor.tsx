import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { Box, Typography } from "@mutualzz/ui-native";
import type { MessageLike } from "@stores/objects/Message";
import type { Space } from "@stores/objects/Space";
import { isSystemMessageType, isSystemUser } from "@mutualzz/client";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  message: MessageLike;
  space?: Space | null;
}

export const MessageAuthor = observer(({ message, space }: Props) => {
  const { t } = useTranslation("chat");
  const author = message.author;
  if (!author) {
    return <Typography>{t("unknown")}</Typography>;
  }

  if (isSystemUser(author) && !isSystemMessageType(message.type)) {
    return <Typography>{t("unknown")}</Typography>;
  }

  const member =
    space && author.id ? space.members.get(author.id) : undefined;
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
        <Typography truncate="single" style={{ flexShrink: 1 }}>
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
