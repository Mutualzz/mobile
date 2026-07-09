import { useAppStore } from "@hooks/useStores";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { resolveGifSendUrl } from "@utils/gifs";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { unifiedToEmoji } from "@utils/emojis/unified";
import { getCustomEmojiLabel } from "@utils/expressions";
import { replaceRange } from "@utils/markdown/textUtils";
import type { Selection } from "@utils/markdown/types";
import { useCallback, useState } from "react";

const DEFAULT_MAX_STICKERS = 3;

interface Options {
  content: string;
  setContent: (value: string) => void;
  selection: Selection;
  setSelection: (value: Selection) => void;
  maxStickers?: number;
}

/**
 * Shared emoji/gif/sticker insertion logic for composers that use a plain
 * content+selection string (post composer, post comments). MessageInput has
 * its own variant since gif selection there sends immediately instead of
 * inserting into the composer.
 */
export function useExpressionComposer({
  content,
  setContent,
  selection,
  setSelection,
  maxStickers = DEFAULT_MAX_STICKERS,
}: Options) {
  const app = useAppStore();
  const meId = app.account?.id ?? "";
  const [stickers, setStickers] = useState<Expression[]>([]);

  const insertIntoComposer = useCallback(
    (insert: string) => {
      const rep = replaceRange(
        content,
        selection.start,
        selection.end,
        insert,
      );
      const caret = selection.start + insert.length;
      setContent(rep.text);
      setSelection({ start: caret, end: caret });
    },
    [content, selection.end, selection.start, setContent, setSelection],
  );

  const handleSelectEmoji = useCallback(
    (emoji: PickerEmoji, skinTone: SkinTone) => {
      const unified =
        (skinTone && emoji.skinVariations?.[skinTone]?.unified) ||
        emoji.unified;
      insertIntoComposer(unifiedToEmoji(unified));
    },
    [insertIntoComposer],
  );

  const handleSelectCustomEmoji = useCallback(
    (expression: Expression) => {
      const label = getCustomEmojiLabel(
        app.expressions.all,
        expression,
        meId,
      );
      insertIntoComposer(`:${label}:`);
    },
    [app.expressions.all, insertIntoComposer, meId],
  );

  const handleSelectGif = useCallback(
    (gif: GifResult) => {
      insertIntoComposer(resolveGifSendUrl(gif));
    },
    [insertIntoComposer],
  );

  const handleSelectSticker = useCallback(
    (sticker: Expression) => {
      setStickers((prev) => {
        if (prev.some((entry) => entry.id === sticker.id)) return prev;
        if (prev.length >= maxStickers) return prev;
        return [...prev, sticker];
      });
    },
    [maxStickers],
  );

  const removeSticker = useCallback((stickerId: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== stickerId));
  }, []);

  const clearStickers = useCallback(() => setStickers([]), []);

  return {
    stickers,
    clearStickers,
    handleSelectEmoji,
    handleSelectCustomEmoji,
    handleSelectGif,
    handleSelectSticker,
    removeSticker,
  };
}
