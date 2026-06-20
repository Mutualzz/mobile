import emojiRegexOrig from "emojibase-regex";
import shortcodeRegexOrig from "emojibase-regex/shortcode";

const shortcodeRegex = new RegExp(shortcodeRegexOrig.source, "g");
const emojiRegex = new RegExp(emojiRegexOrig.source, "g");
const customEmojiRegex = /<a?:[^:]+:\d+>/g;

export const isEmojiOnlyMessage = (
  value: string | null | undefined,
  enlargeEmojiOnly = true
) => {
  if (!value || !enlargeEmojiOnly) return false;

  const textWithoutEmojis = value
    .replace(customEmojiRegex, "")
    .replace(shortcodeRegex, "")
    .replace(emojiRegex, "");

  return textWithoutEmojis.trim().length === 0 && value.trim().length > 0;
};
