import { MessageType } from "@mutualzz/types";

export const SYSTEM_USER_ID = "1";

export function isSystemUser(
  user?: {
    id?: string | number | bigint | null;
    username?: string | null;
  } | null,
) {
  if (!user) return false;
  if (user.id != null && String(user.id) === SYSTEM_USER_ID) return true;
  return user.username?.trim().toLowerCase() === "asmodeus";
}

export function isSystemMessageType(
  type?: MessageType | number | string | null,
) {
  const n = Number(type);
  return (
    n === MessageType.System ||
    n === MessageType.CallMissed ||
    n === MessageType.CallEnded
  );
}
