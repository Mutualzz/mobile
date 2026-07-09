import { scaledLayoutSize, useFontScale } from "@mutualzz/ui-native";
import type { ViewStyle } from "react-native";

export function useUserRowStyle(): ViewStyle {
    const fontScale = useFontScale();

    return {
        flexDirection: "row",
        alignItems: "center",
        gap: scaledLayoutSize(10, fontScale, 1.25),
        paddingVertical: scaledLayoutSize(8, fontScale, 1.5),
        paddingHorizontal: scaledLayoutSize(10, fontScale, 1.25),
        borderRadius: 10,
        minHeight: scaledLayoutSize(44, fontScale, 1.5),
    };
}
