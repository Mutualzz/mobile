import { getFloatingTabBarInset } from "@utils/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabBarContentInset() {
    const insets = useSafeAreaInsets();
    return getFloatingTabBarInset(insets);
}
