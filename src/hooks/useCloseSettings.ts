import { useRouter } from "expo-router";
import { useCallback } from "react";

export function useCloseSettings() {
  const router = useRouter();

  return useCallback(() => {
    router.back();
  }, [router]);
}
