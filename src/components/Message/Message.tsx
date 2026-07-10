import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType, MessageType } from "@mutualzz/types";
import { formatColor } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { type MessageLike } from "@stores/objects/Message";
import { QueuedMessageStatus } from "@stores/objects/QueuedMessage";
import { GIF_ONLY_URL_PATTERN } from "@utils/gifs";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";
import { MessageActionSheet } from "./MessageActionSheet";
import { QueuedMessageActionSheet } from "./QueuedMessageActionSheet";
import { MessageAuthor } from "./MessageAuthor";
import {
  EditedIndicator,
  MessageBase,
  MessageContent,
  MessageContentText,
  MessageDetails,
  MessageInfo,
  MessageRow,
  ReplyAuthorName,
  ReplyConnectorArea,
  ReplyConnectorLine,
  ReplyContent,
  ReplyContentText,
  ReplySection,
} from "./MessageBase";
import { MessageEmbed } from "./MessageEmbed";
import { CodedLinkPreview } from "@components/Space/CodedLinkPreview";
import { shouldHideInviteUrlContent } from "@utils/inviteLinks";
import { MessageReactions } from "./MessageReactions";
import { MessageSticker } from "./MessageSticker";
import { MessageAttachment } from "./MessageAttachment";
import { Message as MessageModel } from "@stores/objects/Message";
import { QueuedMessage } from "@stores/objects/QueuedMessage";

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
  const isQueued = message instanceof QueuedMessage;
  const isEdited = isSent && message.edited;

  const hasGifEmbed =
    "embeds" in message &&
    message.embeds?.some((embed) => embed.type === "gifv");

  const isOnlyGifUrl =
    hasGifEmbed &&
    !!message.content &&
    GIF_ONLY_URL_PATTERN.test(message.content.trim()) &&
    message.content.trim().split(/\s+/).length === 1;

  const hideInviteUrl =
    "codedLinks" in message &&
    shouldHideInviteUrlContent(
      message.content,
      message.codedLinks?.length ?? 0,
    );

  const stickerExpressions =
    "expressions" in message
      ? message.expressions.filter(
          (expression) => expression.type === ExpressionType.Sticker,
        )
      : [];

  const repliedMessage =
    message.type === MessageType.Reply ? (message.repliedTo ?? null) : null;

  const isHighlighted = isSent && app.highlightedMessageId === message.id;

  const handleJumpToReplied = () => {
    if (!repliedMessage?.id || !message.channelId) return;
    app.requestJumpToMessage(message.channelId, repliedMessage.id);
  };

  return (
    <>
      <Pressable
        disabled={
          (!isSent &&
            !(isQueued && message.status === QueuedMessageStatus.Failed)) ||
          (isSent && message.editing)
        }
        onLongPress={() => {
          if (isSent && !message.editing) setActionSheetOpen(true);
          else if (isQueued && message.status === QueuedMessageStatus.Failed)
            setActionSheetOpen(true);
        }}
        delayLongPress={350}
      >
        <MessageBase
          header={header}
          style={
            isHighlighted
              ? {
                  borderLeftWidth: 2,
                  borderLeftColor: theme.colors.info,
                  paddingLeft: 8,
                  marginLeft: -8,
                  backgroundColor: formatColor(theme.colors.info, {
                    alpha: 50,
                    format: "hexa",
                  }),
                }
              : isSent && message.editing
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
          {header && message.type === MessageType.Reply ? (
            <Pressable
              disabled={!repliedMessage}
              onPress={handleJumpToReplied}
              style={{ opacity: repliedMessage ? 1 : 0.85 }}
            >
              <ReplySection>
                <ReplyConnectorArea>
                  <ReplyConnectorLine />
                </ReplyConnectorArea>
                <ReplyContent>
                  {repliedMessage ? (
                    <>
                      <UserAvatar user={repliedMessage.author} size="sm" />
                      <ReplyAuthorName>
                        <Typography level="body-xs" textColor="muted">
                          {repliedMessage.author?.displayName ?? "Unknown"}
                        </Typography>
                      </ReplyAuthorName>
                      <ReplyContentText>
                        <Typography
                          level="body-xs"
                          textColor="muted"
                          truncate="single"
                        >
                          {(repliedMessage.content ?? "").replace(/\n/g, " ")}
                        </Typography>
                      </ReplyContentText>
                    </>
                  ) : (
                    <Typography
                      level="body-xs"
                      textColor="muted"
                      style={{ fontStyle: "italic" }}
                    >
                      Could not find the replied message
                    </Typography>
                  )}
                </ReplyContent>
              </ReplySection>
            </Pressable>
          ) : null}

          <MessageRow header={header}>
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
                    flexShrink: 1,
                    minWidth: 0,
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

              {message.content && !isOnlyGifUrl && !hideInviteUrl ? (
                !header && isEdited ? (
                  <Box
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <MarkdownRenderer
                      variant="plain"
                      textColor="primary"
                      spaceId={message.spaceId}
                      value={message.content}
                    />
                    <EditedIndicator />
                  </Box>
                ) : (
                  <MarkdownRenderer
                    variant="plain"
                    textColor="primary"
                    spaceId={message.spaceId}
                    value={message.content}
                  />
                )
              ) : null}
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

            {"codedLinks" in message && message.codedLinks.length > 0 && (
              <Box style={{ gap: 8, paddingBottom: 4 }}>
                {message.codedLinks.map((link) => (
                  <CodedLinkPreview key={link.code} link={link} />
                ))}
              </Box>
            )}

            {isSent &&
              "attachments" in message &&
              (message.attachments?.length ?? 0) > 0 && (
                <Box style={{ gap: 8, paddingBottom: 4 }}>
                  {message.attachments.map((attachment) => (
                    <MessageAttachment
                      key={attachment.id}
                      attachment={attachment}
                    />
                  ))}
                </Box>
              )}

            {isSent && <MessageReactions message={message} />}
            </MessageContent>
          </MessageRow>
        </MessageBase>
      </Pressable>

      {isSent && (
        <MessageActionSheet
          message={message}
          visible={actionSheetOpen}
          onClose={() => setActionSheetOpen(false)}
        />
      )}

      {isQueued && (
        <QueuedMessageActionSheet
          message={message}
          visible={actionSheetOpen}
          onClose={() => setActionSheetOpen(false)}
        />
      )}
    </>
  );
});
