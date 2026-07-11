import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { Typography } from "@mutualzz/ui-native";
import type { MessageLike } from "@stores/objects/Message";
import type { Space } from "@stores/objects/Space";
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

  const member =
    space && author.id ? space.members.get(author.id) : undefined;

  return (
    <UserProfileTrigger user={author} member={member}>
      <Typography truncate="single" style={{ flexShrink: 1 }}>
        {author.displayName}
      </Typography>
    </UserProfileTrigger>
  );
});
