import { CustomEmojiPreviewSheet } from "@components/Preview/CustomEmojiPreviewSheet";
import { DefaultEmojiPreviewSheet } from "@components/Preview/DefaultEmojiPreviewSheet";
import { EXPRESSION_PREVIEW_MODAL_PROPS } from "@components/Preview/ExpressionPreviewSheetLayout";
import { useModal } from "@hooks/useModal";
import type { Expression } from "@stores/objects/Expression";
import { useCallback } from "react";

export function useEmojiPreview() {
  const { openModal, closeModal } = useModal();

  const openDefaultEmojiPreview = useCallback(
    (name: string, unicode: string) => {
      const modalId = `emoji-preview-${name}-${unicode.codePointAt(0) ?? 0}`;

      openModal(
        modalId,
        <DefaultEmojiPreviewSheet
          name={name}
          unicode={unicode}
          onClose={() => closeModal(modalId)}
        />,
        EXPRESSION_PREVIEW_MODAL_PROPS,
      );
    },
    [closeModal, openModal],
  );

  const openCustomEmojiPreview = useCallback(
    (expression: Expression) => {
      const modalId = `custom-emoji-preview-${expression.id}`;

      openModal(
        modalId,
        <CustomEmojiPreviewSheet
          expression={expression}
          onClose={() => closeModal(modalId)}
        />,
        EXPRESSION_PREVIEW_MODAL_PROPS,
      );
    },
    [closeModal, openModal],
  );

  return {
    openDefaultEmojiPreview,
    openCustomEmojiPreview,
  };
}
