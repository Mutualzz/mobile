import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { UserAvatar } from "@components/User/UserAvatar";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { Message as MessageObject, type MessageLike } from "@stores/objects/Message";
import { isCallNoticeMessage, isChannelPinnedMessage } from "@mutualzz/client";
import { observer } from "mobx-react-lite";
import { PhoneSlashIcon, PushPinIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { MessageAuthor } from "./MessageAuthor";
import {
  MessageBase,
  MessageContent,
  MessageContentText,
  MessageInfo,
} from "./MessageBase";
import { MessageEmbed } from "./MessageEmbed";
import { MessageActionSheet } from "./MessageActionSheet";
import { useState } from "react";
import { Pressable } from "react-native";
import { useAppStore } from "@hooks/useStores";

interface Props {
  message: MessageLike;
}

export const SystemMessage = observer(({ message }: Props) => {
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  const me = message.space?.members.me;
  const canDeletePinnedNotice =
    message instanceof MessageObject &&
    isChannelPinnedMessage(message) &&
    (message.author?.id === app.account?.id ||
      !!me?.hasPermission("ManageMessages", message.channel));

  if (isCallNoticeMessage(message)) {
    return (
      <MessageBase header system>
        <MessageInfo>
          <PhoneSlashIcon
            size={18}
            color={theme.typography.colors.primary}
            weight="fill"
          />
        </MessageInfo>
        <MessageContent>
          <Typography level="body-sm" textColor="secondary">
            {message.content}
          </Typography>
        </MessageContent>
      </MessageBase>
    );
  }

  if (isChannelPinnedMessage(message)) {
    const name =
      message.member?.displayName ??
      message.author?.displayName ??
      message.author?.username ??
      t("unknown");

    return (
      <>
        <Pressable
          disabled={!canDeletePinnedNotice}
          onLongPress={() => {
            if (canDeletePinnedNotice) setActionSheetOpen(true);
          }}
          delayLongPress={350}
        >
          <MessageBase header system>
            <MessageInfo>
              <PushPinIcon
                size={18}
                color={theme.typography.colors.primary}
                weight="fill"
              />
            </MessageInfo>
            <MessageContent>
              <Typography level="body-sm" textColor="secondary">
                {t("system.pinnedMessage", { name })}
              </Typography>
            </MessageContent>
          </MessageBase>
        </Pressable>
        {message instanceof MessageObject && (
          <MessageActionSheet
            message={message}
            visible={actionSheetOpen}
            onClose={() => setActionSheetOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <MessageBase header system>
      <MessageInfo>
        <UserAvatar user={message.author} size="lg" />
      </MessageInfo>
      <MessageContent>
        <MessageAuthor message={message} />
        {message.content && (
          <MessageContentText>
            <MarkdownRenderer
              variant="plain"
              textColor="primary"
              spaceId={message.spaceId}
              value={message.content}
            />
          </MessageContentText>
        )}
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
      </MessageContent>
    </MessageBase>
  );
});
