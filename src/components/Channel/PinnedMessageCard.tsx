import { Button } from "@components/Button";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageAttachment } from "@components/Message/MessageAttachment";
import { MessageEmbed } from "@components/Message/MessageEmbed";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { APIMessage, APIUser } from "@mutualzz/types";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { Expression } from "@stores/objects/Expression";
import { shouldHideInviteUrlContent } from "@mutualzz/client";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";

interface Props {
  message: APIMessage;
  space?: Space | null;
  onJump: () => void;
}

function authorName(user: APIUser, space: Space | null | undefined) {
  const member = space?.members.get(user.id);
  return member?.displayName ?? user.globalName ?? user.username;
}

export const PinnedMessageCard = observer(({ message, space, onJump }: Props) => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const showLinkEmbeds = app.settings?.showLinkEmbeds ?? true;
  const author = message.author;
  const stickers =
    message.expressions?.filter((item) => item.type === ExpressionType.Sticker) ??
    [];

  const hideInviteUrl = shouldHideInviteUrlContent(
    message.content ?? "",
    message.codedLinks?.length ?? 0,
  );

  const displayName = author ? authorName(author, space) : t("unknownUser");
  const showUsername =
    author &&
    displayName.toLowerCase() !== author.username.toLowerCase();

  return (
    <Box
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <Box style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Button padding={8} onPress={onJump}>
          {t("pins.jump")}
        </Button>
      </Box>

      <Box style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <UserAvatar user={author ?? undefined} size="md" />
        <Box style={{ flex: 1, gap: 8, minWidth: 0, overflow: "hidden" }}>
          <Box
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, flex: 1 }}>
              <Typography level="body-sm" weight={700}>
                {displayName}
              </Typography>
              {showUsername && author && (
                <Typography level="body-xs" textColor="muted">
                  ({author.username})
                </Typography>
              )}
            </Box>
            <Typography textColor="muted" level="body-xs">
              {dayjs(message.createdAt).format("M/D/YYYY h:mm A")}
            </Typography>
          </Box>

          {stickers.length > 0 && (
            <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {stickers.map((sticker) => (
                <Image
                  key={sticker.id}
                  source={{
                    uri: Expression.constructUrl(
                      sticker.id,
                      sticker.animated,
                      sticker.assetHash,
                      128,
                    ),
                  }}
                  style={{ width: 140, height: 140 }}
                  resizeMode="contain"
                />
              ))}
            </Box>
          )}

          {message.content && !hideInviteUrl && (
            <MarkdownRenderer
              variant="plain"
              textColor="primary"
              spaceId={message.spaceId}
              value={message.content}
            />
          )}

          {message.attachments && message.attachments.length > 0 && (
            <Box style={{ gap: 8 }}>
              {message.attachments.map((attachment) => (
                <MessageAttachment key={attachment.id} attachment={attachment} />
              ))}
            </Box>
          )}

          {showLinkEmbeds && message.embeds && message.embeds.length > 0 && (
            <Box style={{ gap: 8 }}>
              {message.embeds.map((embed, index) => (
                <MessageEmbed key={index} embed={embed} compact />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});
