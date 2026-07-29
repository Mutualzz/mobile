import { useAppStore } from "@hooks/useStores";
import { usePathname } from "expo-router";
import { useEffect } from "react";

export function useTrackLastRoute() {
  const app = useAppStore();
  const pathname = usePathname();

  useEffect(() => {
    app.navigation.trackRoute(pathname);
  }, [app, pathname]);
}
