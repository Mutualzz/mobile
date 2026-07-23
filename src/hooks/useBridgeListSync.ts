import type { BridgeSummary } from "@app-types/bridge";
import { useAppStore } from "@hooks/useStores";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useBridgeListSync(enabled = true) {
  const app = useAppStore();

  const query = useQuery({
    queryKey: ["me", "bridges"],
    queryFn: () => app.rest.get<BridgeSummary[]>("/@me/bridges"),
    refetchInterval: 15_000,
    staleTime: 30_000,
    enabled: enabled && Boolean(app.account),
  });

  useEffect(() => {
    if (!query.data) return;
    app.bridgeChat.setUnreadFromList(query.data);
  }, [query.data, app.bridgeChat]);

  return query;
}
