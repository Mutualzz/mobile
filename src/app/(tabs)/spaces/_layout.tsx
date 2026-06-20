import { SpacesSidebar } from "@components/Space/SpacesSidebar";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { useHideSpacesSidebar } from "@utils/layout";
import {
  Slot,
  useGlobalSearchParams,
  useRouter,
  useSegments,
} from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const SpacesLayout = () => {
  const app = useAppStore();
  const segments = useSegments();
  const router = useRouter();
  const { spaceId } = useGlobalSearchParams<{
    spaceId?: string;
  }>();

  const hideSidebar = useHideSpacesSidebar();

  useEffect(() => {
    if (app.mode !== "spaces") app.setMode("spaces");

    return () => {
      if (app.mode === "spaces") app.resetMode();
    };
  }, []);

  useEffect(() => {
    const atSpacesRoot = segments.length === 2 && segments[1] === "spaces";

    if (!spaceId) {
      if (!atSpacesRoot) return;

      const recentSpace = app.spaces.setPreferredActive();
      if (!recentSpace) return;

      router.replace(`/spaces/${recentSpace.id}`);

      return;
    }

    if (spaceId !== app.spaces.activeId) {
      app.spaces.setActive(spaceId);
      app.spaces.setMostRecentSpace(spaceId);
    }
  }, [spaceId, segments.join("/")]);

  return (
    <Box style={{ flex: 1, flexDirection: "row" }}>
      {!hideSidebar && <SpacesSidebar />}
      <Slot key={spaceId ?? "spaces-root"} />
    </Box>
  );
};

export default observer(SpacesLayout);
