const INVITE_URL_PATTERN =
  /^(?:(?:https?:\/\/)?(?:www\.)?(?:mutualzz\.com|localhost:\d+)\/invite\/[A-Za-z0-9_-]{8,}|mutualzz:\/\/invite\/[A-Za-z0-9_-]{8,})$/i;

export function isOnlyInviteUrl(content: string) {
  return INVITE_URL_PATTERN.test(content.trim());
}

export function shouldHideInviteUrlContent(
  content: string | null | undefined,
  codedLinkCount: number,
) {
  if (!content || codedLinkCount === 0) return false;
  return isOnlyInviteUrl(content);
}
