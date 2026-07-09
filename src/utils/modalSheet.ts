import { useWindowDimensions, type ViewStyle } from "react-native";

export const MODAL_SHEET_WRAPPER_STYLE: ViewStyle = {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
};

export const MODAL_SHEET_KEYBOARD_STYLE: ViewStyle = {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
};

export function useModalSheetMaxHeight(ratio = 0.9) {
    const { height, fontScale } = useWindowDimensions();
    const adjustedRatio = Math.min(
        0.95,
        ratio + Math.max(0, fontScale - 1) * 0.04,
    );
    return Math.round(height * adjustedRatio);
}

export const PROFILE_SHEET_HEIGHT_RATIO = 0.9;
