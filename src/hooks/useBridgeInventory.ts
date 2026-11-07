import type { BridgeDetail, MinecraftLink } from "@app-types/bridge";
import { useAppStore } from "@hooks/useStores";
import {
  type BridgeInventory,
  EMPTY_EDITS,
  inventoryEditsQueryKey,
  type InventoryEditsState,
  inventoryQueryKey,
  minecraftServerLabel,
} from "@mutualzz/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const useInventorySubscription = (
  bridgeId: string,
  minecraftUuid: string | undefined,
) => {
  const app = useAppStore();

  useEffect(() => {
    if (!minecraftUuid) return;
    app.gateway.subscribeInventory(bridgeId, minecraftUuid);
    return () => app.gateway.unsubscribeInventory(bridgeId, minecraftUuid);
  }, [app, bridgeId, minecraftUuid]);

  const uuid = minecraftUuid?.toLowerCase();
  return Boolean(
    uuid &&
    app.bridgeChat
      .playersFor(bridgeId)
      .some((player) => player.uuid.toLowerCase() === uuid),
  );
};

export const useMyBridgeInventory = (bridgeId: string) => {
  const app = useAppStore();

  const linkQuery = useQuery({
    queryKey: ["me", "bridges", "link"],
    queryFn: () => app.rest.get<MinecraftLink | null>("/@me/bridges/link"),
  });
  const minecraftUuid = linkQuery.data?.minecraftUuid;

  const inventoryQuery = useQuery({
    queryKey: inventoryQueryKey(bridgeId, minecraftUuid ?? ""),
    queryFn: () =>
      app.rest.get<BridgeInventory[]>(
        `/@me/bridges/${bridgeId}/inventories/@me`,
      ),
    enabled: Boolean(minecraftUuid),
    staleTime: Infinity,
  });

  const live = useInventorySubscription(bridgeId, minecraftUuid);

  return {
    link: linkQuery.data ?? null,
    inventories: inventoryQuery.data ?? [],
    isLoading: linkQuery.isLoading || inventoryQuery.isLoading,
    live,
  };
};

export const usePlayerBridgeInventory = (
  bridgeId: string,
  spaceId: string,
  minecraftUuid: string,
) => {
  const app = useAppStore();

  const inventoryQuery = useQuery({
    queryKey: inventoryQueryKey(bridgeId, minecraftUuid),
    queryFn: () =>
      app.rest.get<BridgeInventory[]>(
        `/spaces/${spaceId}/bridge/inventories/${minecraftUuid}`,
      ),
    retry: false,
  });
  const live = useInventorySubscription(bridgeId, minecraftUuid);

  return {
    inventories: inventoryQuery.data ?? [],
    isLoading: inventoryQuery.isLoading,
    live,
  };
};

export const useInventoryEdits = (bridgeId: string, minecraftUuid: string) => {
  const { data } = useQuery<InventoryEditsState>({
    queryKey: inventoryEditsQueryKey(bridgeId, minecraftUuid),
    queryFn: () => EMPTY_EDITS,
    staleTime: Infinity,
  });
  return data ?? EMPTY_EDITS;
};

export const useBridgeDetail = (bridgeId: string) => {
  const app = useAppStore();
  return useQuery({
    queryKey: ["me", "bridges", bridgeId],
    queryFn: () => app.rest.get<BridgeDetail>(`/@me/bridges/${bridgeId}`),
    staleTime: 15_000,
  });
};

export const useBridgeServerLabel = (bridgeId: string) => {
  const { data } = useBridgeDetail(bridgeId);

  return (serverId: string) =>
    minecraftServerLabel(
      data?.servers?.find((server) => server.serverId === serverId) ?? {
        serverId,
      },
    );
};
