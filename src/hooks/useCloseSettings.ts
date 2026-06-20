import { useAppStore } from "@hooks/useStores";
import { switchMode } from "@utils/index";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export function useCloseSettings() {
    const app = useAppStore();
    const router = useRouter();

    return useCallback(() => {
        if (app.mode === "@me") {
            router.replace("/@me");
            return;
        }

        switchMode(
            app,
            router,
            app.settings?.preferredMode === "feed" ? "feed" : "spaces",
        );
    }, [app, router]);
}
