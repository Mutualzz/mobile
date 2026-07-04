import { useAppStore } from "@hooks/useStores";
import type { Space } from "@stores/objects/Space";
import {
  canOpenSpaceSettings,
  getVisibleSpaceSettingsPages,
} from "@components/SpaceSettings/spaceSettingsPages";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export function useSpaceFromRoute() {
  const app = useAppStore();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const space = spaceId ? app.spaces.get(spaceId) : null;

  useEffect(() => {
    if (!spaceId || spaceId === app.spaces.activeId) return;

    app.spaces.setActive(spaceId);
    app.spaces.setMostRecentSpace(spaceId);
  }, [app.spaces, spaceId]);

  return { spaceId, space };
}

export function useSpaceSettingsAccess(space: Space | null | undefined) {
  const me = space?.members.me;
  const canManage =
    !!me &&
    (canOpenSpaceSettings(me) ||
      me.hasAnyPermission(["ManageSpace", "ManageRoles"]));

  const categories = me ? getVisibleSpaceSettingsPages(me) : [];

  return { me, canManage, categories };
}

export function useRequireSpaceSettingsAccess() {
  const router = useRouter();
  const { space, spaceId } = useSpaceFromRoute();
  const { canManage } = useSpaceSettingsAccess(space);

  useEffect(() => {
    if (!spaceId) return;
    if (!space || !canManage) {
      router.back();
    }
  }, [spaceId, space, canManage, router]);

  return { space: canManage ? space : null, spaceId };
}
