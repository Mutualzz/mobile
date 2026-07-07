import type { Channel } from "@stores/objects/Channel";
import type { Expression } from "@stores/objects/Expression";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Snowflake } from "@mutualzz/types";
import { ExpressionType } from "@mutualzz/types";

export const canUseCustomEmoji = (
  meId: Snowflake,
  emoji: Expression,
  currentMember?: SpaceMember | null,
  channel?: Channel | null,
) => {
  if (emoji.type !== ExpressionType.Emoji) return false;

  if (!emoji.spaceId && meId !== emoji.authorId) return false;

  const inSpace = !!channel?.spaceId && !!currentMember;

  if (!inSpace) {
    return !emoji.spaceId && meId === emoji.authorId;
  }

  if (emoji.spaceId === currentMember.spaceId) return true;

  return currentMember.hasPermission("UseExternalEmojis", channel ?? undefined);
};

export function getUsableCustomEmojis(
  expressions: Expression[],
  meId: Snowflake,
  currentMember?: SpaceMember | null,
  channel?: Channel | null,
): Expression[] {
  return expressions.filter(
    (exp) =>
      exp.type === ExpressionType.Emoji &&
      canUseCustomEmoji(meId, exp, currentMember, channel),
  );
}

export function getCustomEmojiLabel(
  expressions: Expression[],
  expression: Expression,
  meId: Snowflake,
  currentMember?: SpaceMember | null,
  channel?: Channel | null,
): string {
  const usable = getUsableCustomEmojis(
    expressions,
    meId,
    currentMember,
    channel,
  );
  const labels = buildDeduplicatedEmojiLabels(usable);
  return labels.get(expression) ?? expression.name;
}

export function findCustomEmojiByLabel(
  expressions: Expression[],
  label: string,
  meId: Snowflake,
  currentMember?: SpaceMember | null,
  channel?: Channel | null,
): Expression | null {
  const usable = getUsableCustomEmojis(
    expressions,
    meId,
    currentMember,
    channel,
  );
  const labels = buildDeduplicatedEmojiLabels(usable);
  const lowerLabel = label.toLowerCase();

  for (const exp of usable) {
    const dedupedLabel = labels.get(exp);
    if (dedupedLabel && dedupedLabel.toLowerCase() === lowerLabel) {
      return exp;
    }
  }

  return null;
}

export const canUseSticker = (
  meId: Snowflake,
  sticker: Expression,
  currentMember?: SpaceMember | null,
  channel?: Channel | null,
) => {
  if (sticker.type !== ExpressionType.Sticker) return false;
  if (!sticker.spaceId && meId !== sticker.authorId) return false;

  if (!currentMember) return true;

  if (sticker.spaceId === currentMember.spaceId) return true;

  return currentMember.hasPermission(
    "UseExternalStickers",
    channel ?? undefined,
  );
};

export function buildDeduplicatedEmojiLabels(
  expressions: Expression[],
): Map<Expression, string> {
  const counts = new Map<string, number>();
  for (const exp of expressions) {
    const key = exp.name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  const labels = new Map<Expression, string>();

  for (const exp of expressions) {
    const key = exp.name.trim().toLowerCase();
    const total = counts.get(key) ?? 0;

    if (total === 1) {
      labels.set(exp, exp.name);
    } else {
      const index = seen.get(key) ?? 0;
      seen.set(key, index + 1);
      labels.set(exp, index === 0 ? exp.name : `${exp.name}_${index}`);
    }
  }

  return labels;
}
