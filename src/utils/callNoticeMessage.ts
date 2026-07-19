import { MessageType } from "@mutualzz/types";

export function isCallNoticeMessage(message: {
  type?: MessageType | number | string;
  content?: string | null;
}) {
  const type = Number(message.type);
  if (type === MessageType.CallMissed || type === MessageType.CallEnded) {
    return true;
  }

  const content = message.content?.trim() ?? "";
  if (!content) return false;

  return (
    type === MessageType.System &&
    (/^call ended\b/i.test(content) ||
      /^you missed a call\b/i.test(content) ||
      /^missed a call\b/i.test(content) ||
      /^missed call\b/i.test(content))
  );
}
