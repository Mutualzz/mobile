import { formatColor, resolveColor, type Color } from "@mutualzz/ui-core";
import { useTheme } from "@mutualzz/ui-native";

export function useSettingsIconColor(tint: Color = "primary") {
    const { theme } = useTheme();
    return formatColor(resolveColor(tint, theme));
}
