import { CustomEmojiPreviewSheet } from "@components/Preview/CustomEmojiPreviewSheet";
import { DefaultEmojiPreviewSheet } from "@components/Preview/DefaultEmojiPreviewSheet";
import { EXPRESSION_PREVIEW_SHEET_PROPS } from "@components/Preview/ExpressionPreviewSheetLayout";
import { useSheet } from "@hooks/useSheet";
import type { Expression } from "@stores/objects/Expression";
import { useCallback } from "react";

export function useEmojiPreview() {
  const { openSheet, closeSheet } = useSheet();

  const openDefaultEmojiPreview = useCallback(
    (name: string, unicode: string) => {
      const sheetId = `emoji-preview-${name}-${unicode.codePointAt(0) ?? 0}`;

      openSheet(
        sheetId,
        <DefaultEmojiPreviewSheet
          name={name}
          unicode={unicode}
          onClose={() => closeSheet(sheetId)}
        />,
        EXPRESSION_PREVIEW_SHEET_PROPS,
      );
    },
    [closeSheet, openSheet],
  );

  const openCustomEmojiPreview = useCallback(
    (expression: Expression) => {
      const sheetId = `custom-emoji-preview-${expression.id}`;

      openSheet(
        sheetId,
        <CustomEmojiPreviewSheet
          expression={expression}
          onClose={() => closeSheet(sheetId)}
        />,
        EXPRESSION_PREVIEW_SHEET_PROPS,
      );
    },
    [closeSheet, openSheet],
  );

  return {
    openDefaultEmojiPreview,
    openCustomEmojiPreview,
  };
}
