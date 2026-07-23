import { useAppStore } from "@hooks/useStores";
import {
  modeKeyToAppMode,
  prepareDmsModeNavigation,
  prepareEmptySpacesNavigation,
  prepareFeedModeNavigation,
  prepareSpaceHubNavigation,
} from "@mutualzz/client";
import { type AppMode } from "@mutualzz/types";
import { usePathname, useRouter } from "expo-router";
import { useTabTrigger } from "expo-router/ui";

export function useNavigateToModeHub() {
  const app = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const spacesTab = useTabTrigger({ name: "spaces" });
  const feedTab = useTabTrigger({ name: "feed" });
  const meTab = useTabTrigger({ name: "@me" });

  const navigateToSpaceHub = (spaceId: string) => {
    prepareSpaceHubNavigation(app, spaceId);

    if (pathname.startsWith("/spaces")) {
      router.replace(`/spaces/${spaceId}`);
      return;
    }

    spacesTab.switchTab("spaces", {});
  };

  const navigateToModeHub = (mode: AppMode) => {
    if (mode === "feed") {
      prepareFeedModeNavigation(app);
      if (pathname.startsWith("/feed")) {
        router.replace("/feed");
      } else {
        feedTab.switchTab("feed", {});
      }
      return;
    }

    if (mode === "@me") {
      prepareDmsModeNavigation(app);
      if (pathname.startsWith("/@me")) {
        router.replace("/@me");
      } else {
        meTab.switchTab("@me", {});
      }
      return;
    }

    const space = app.spaces.mostRecentSpace ?? app.spaces.all[0];
    if (!space) {
      prepareEmptySpacesNavigation(app);
      if (pathname.startsWith("/spaces")) {
        router.replace("/spaces");
      } else {
        spacesTab.switchTab("spaces", {});
      }
      return;
    }

    navigateToSpaceHub(space.id);
  };

  return { navigateToModeHub, navigateToSpaceHub, modeKeyToAppMode };
}
