import { useRouter } from "expo-router";
import { useCallback } from "react";

export function useCloseSettings() {
  const router = useRouter();

  return useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);
}
