import { useModal } from "@hooks/useModal";
import { BOTTOM_SHEET_MODAL_PROPS } from "@utils/modalSheet";
import { useCallback, type ReactNode } from "react";

export function useOpenBottomSheet() {
    const { openModal, closeModal } = useModal();

    const openBottomSheet = useCallback(
        (id: string, content: ReactNode) => {
            openModal(id, content, BOTTOM_SHEET_MODAL_PROPS);
        },
        [openModal],
    );

    const closeBottomSheet = useCallback(
        (id: string) => {
            closeModal(id);
        },
        [closeModal],
    );

    return { openBottomSheet, closeBottomSheet };
}
