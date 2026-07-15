import { useSheet } from "@hooks/useSheet";
import { BOTTOM_SHEET_PROPS } from "@utils/sheet";
import { useCallback, type ReactNode } from "react";

export function useOpenBottomSheet() {
    const { openSheet, closeSheet } = useSheet();

    const openBottomSheet = useCallback(
        (id: string, content: ReactNode) => {
            openSheet(id, content, BOTTOM_SHEET_PROPS);
        },
        [openSheet],
    );

    const closeBottomSheet = useCallback(
        (id: string) => {
            closeSheet(id);
        },
        [closeSheet],
    );

    return { openBottomSheet, closeBottomSheet };
}
