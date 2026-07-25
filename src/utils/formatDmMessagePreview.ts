import { MessageType } from "@mutualzz/types";
import { isCallNoticeMessage } from "@mutualzz/client";
import { isSystemMessageType, isSystemUser } from "@mutualzz/client";
import i18n from "../i18n";

interface PreviewMessage {
  type?: MessageType | number | string;
  content?: string | null;
  author?: {
    id?: string;
    username?: string | null;
    displayName?: string | null;
  } | null;
  attachments?: unknown[] | null;
  expressions?: unknown[] | null;
}

export function formatDmMessagePreview(
  message: PreviewMessage,
): string | null {
  if (isCallNoticeMessage(message)) {
    const content = message.content?.trim();
    if (content) return content;
    const type = Number(message.type);
    return type === MessageType.CallEnded
      ? i18n.t("call.ended", { ns: "chat" })
      : i18n.t("call.missed", { ns: "chat" });
  }

  const type = Number(message.type);
  const content = message.content?.trim() ?? "";
  const authorName =
    isSystemMessageType(type) || isSystemUser(message.author)
      ? null
      : message.author?.displayName?.trim() || null;

  if (isSystemMessageType(type)) {
    return content || null;
  }

  if (content) {
    return authorName ? `${authorName}: ${content}` : content;
  }

  const attachmentCount = message.attachments?.length ?? 0;
  if (attachmentCount > 0) {
    const label = i18n.t("feed.embed.attachments", {
      ns: "chat",
      count: attachmentCount
    });
    return authorName ? `${authorName}: ${label}` : label;
  }

  const expressionCount = message.expressions?.length ?? 0;
  if (expressionCount > 0) {
    const label = i18n.t("stickers.sticker", { ns: "chat" });
    return authorName ? `${authorName}: ${label}` : label;
  }

  return null;
}
