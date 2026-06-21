import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, useTheme } from "@mutualzz/ui-native";
import { type MessageLike } from "@stores/objects/Message";
import { QueuedMessageStatus } from "@stores/objects/QueuedMessage";
import { GIF_ONLY_URL_PATTERN } from "@utils/gifs";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";
import { MessageActionSheet } from "./MessageActionSheet";
import { MessageAuthor } from "./MessageAuthor";
import {
  MessageBase,
  MessageContent,
  MessageContentText,
  MessageDetails,
  MessageInfo,
} from "./MessageBase";
import { MessageEmbed } from "./MessageEmbed";
import { MessageReactions } from "./MessageReactions";
import { MessageSticker } from "./MessageSticker";
import { Message as MessageModel } from "@stores/objects/Message";

interface Props {
  message: MessageLike;
  header?: boolean;
}

export const Message = observer(({ message, header }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const space = message.spaceId ? app.spaces.get(message.spaceId) : null;
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const isSent = message instanceof MessageModel;

  const hasGifEmbed =
    "embeds" in message &&
    message.embeds?.some((embed) => embed.type === "gifv");

  const isOnlyGifUrl =
    hasGifEmbed &&
    !!message.content &&
    GIF_ONLY_URL_PATTERN.test(message.content.trim()) &&
    message.content.trim().split(/\s+/).length === 1;

  const stickerExpressions =
    "expressions" in message
      ? message.expressions.filter(
          (expression) => expression.type === ExpressionType.Sticker,
        )
      : [];

  return (
    <>
      <Pressable
        disabled={!isSent || (isSent && message.editing)}
        onLongPress={() => {
          if (!isSent || message.editing) return;
          setActionSheetOpen(true);
        }}
        delayLongPress={350}
      >
        <MessageBase
          header={header}
          style={
            isSent && message.editing
              ? {
                  borderLeftWidth: 2,
                  borderLeftColor: theme.colors.primary,
                  paddingLeft: 8,
                  marginLeft: -8,
                  opacity: 0.65,
                }
              : undefined
          }
        >
          <MessageInfo>
            {header && message.author ? (
              <UserProfileTrigger
                user={message.author}
                member={
                  space && message.author.id
                    ? space.members.get(message.author.id)
                    : undefined
                }
              >
                <UserAvatar user={message.author} />
              </UserProfileTrigger>
            ) : null}
          </MessageInfo>
          <MessageContent>
            {header && (
              <Box
                style={{
                  flexShrink: 0,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <MessageAuthor message={message} space={space} />
                <MessageDetails message={message} />
              </Box>
            )}

            <MessageContentText
              sending={
                "status" in message &&
                message.status === QueuedMessageStatus.Sending
              }
              failed={
                "status" in message &&
                message.status === QueuedMessageStatus.Failed
              }
            >
              {stickerExpressions.length > 0 && (
                <Box
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  {stickerExpressions.map((sticker) => (
                    <MessageSticker key={sticker.id} sticker={sticker} />
                  ))}
                </Box>
              )}

              {message.content && !isOnlyGifUrl && (
                <MarkdownRenderer
                  variant="plain"
                  textColor="primary"
                  spaceId={message.spaceId}
                  value={message.content}
                />
              )}
            </MessageContentText>

            {"embeds" in message && message.embeds.length > 0 && (
              <Box
                style={{
                  paddingBottom: 4,
                }}
              >
                {message.embeds.map((embed, index) => (
                  <MessageEmbed key={index} embed={embed} />
                ))}
              </Box>
            )}

            {isSent && <MessageReactions message={message} />}
          </MessageContent>
        </MessageBase>
      </Pressable>

      {isSent && (
        <MessageActionSheet
          message={message}
          visible={actionSheetOpen}
          onClose={() => setActionSheetOpen(false)}
        />
      )}
    </>
  );
});
