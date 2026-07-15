import { dismissPresentedStack } from "@utils/navigation";
import { useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";

export function useCloseSettings() {
  const router = useRouter();
  const navigation = useNavigation();

  return useCallback(() => {
    dismissPresentedStack(
      () => {
        if (router.canDismiss()) {
          router.dismiss();
          return;
        }
        if (router.canGoBack()) {
          router.back();
        }
      },
      () => navigation.getParent() ?? undefined,
    );
  }, [navigation, router]);
}
