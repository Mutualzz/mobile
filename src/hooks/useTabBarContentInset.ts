import { useAppStore } from "@hooks/useStores";
import {
  getFloatingTabBarInset,
  shouldShowVoiceUserBarPill,
} from "@utils/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabBarContentInset() {
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const showVoicePill = shouldShowVoiceUserBarPill(app.voice);

  return getFloatingTabBarInset(insets, showVoicePill);
}
