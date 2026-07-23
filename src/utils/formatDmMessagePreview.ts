import { MessageType } from "@mutualzz/types";
import { isCallNoticeMessage } from "@mutualzz/client";
import { isSystemMessageType, isSystemUser } from "@mutualzz/client";

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

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function formatDmMessagePreview(
  message: PreviewMessage,
  t: Translate,
): string | null {
  if (isCallNoticeMessage(message)) {
    const content = message.content?.trim();
    if (content) return content;
    const type = Number(message.type);
    return type === MessageType.CallEnded ? t("call.ended") : t("call.missed");
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
    const label = t("feed.embed.attachments", { count: attachmentCount });
    return authorName ? `${authorName}: ${label}` : label;
  }

  const expressionCount = message.expressions?.length ?? 0;
  if (expressionCount > 0) {
    const label = t("stickers.sticker");
    return authorName ? `${authorName}: ${label}` : label;
  }

  return null;
}
