import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import {
  useBridgeServerLabel,
  useInventoryEdits,
  useMyBridgeInventory,
  usePlayerBridgeInventory,
} from "@hooks/useBridgeInventory";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import {
  type BridgeInventory,
  inventoryQueryKey,
  knownPlayersQueryKey,
} from "@mutualzz/client";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { XIcon } from "phosphor-react-native";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import type { ServerEditing } from "./inventoryEditing";
import { ServerInventory } from "./ServerInventory";

export const INVENTORY_SHEET_ID = "bridge-inventory";

const InventorySheetLayout = ({
  name,
  inventories,
  isLoading,
  live,
  emptyMessage,
  actions,
  labelFor,
  editingFor,
}: {
  name: string;
  inventories: BridgeInventory[];
  isLoading: boolean;
  live: boolean;
  emptyMessage: string | null;
  actions?: ReactNode;
  labelFor: (serverId: string) => string;
  editingFor?: (serverId: string) => ServerEditing | undefined;
}) => {
  const { t } = useTranslation("settings");
  const { closeSheet } = useSheet();

  return (
    <Box style={{ flex: 1, width: "100%", minHeight: 0 }}>
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
          gap: 8,
        }}
      >
        <Typography
          level="body-lg"
          weight="bold"
          truncate="single"
          style={{ flex: 1 }}
        >
          {t("minecraftBridge.inventoryTitle", { name })}
        </Typography>
        <IconButton padding={8} onPress={() => closeSheet(INVENTORY_SHEET_ID)}>
          <XIcon size={20} />
        </IconButton>
      </Box>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {actions}
        {!isLoading && emptyMessage && (
          <Typography level="body-sm" textColor="muted">
            {emptyMessage}
          </Typography>
        )}
        {inventories.map((snapshot) => (
          <ServerInventory
            key={snapshot.serverId}
            snapshot={snapshot}
            live={live}
            serverLabel={labelFor(snapshot.serverId)}
            editing={editingFor?.(snapshot.serverId)}
          />
        ))}
        <Typography level="body-xs" textColor="muted">
          {t("minecraftBridge.inventoryDisclaimer")}
        </Typography>
      </ScrollView>
    </Box>
  );
};

export const MyInventorySheet = observer(
  ({ bridgeId }: { bridgeId: string }) => {
    const { t } = useTranslation("settings");
    const { link, inventories, isLoading, live } =
      useMyBridgeInventory(bridgeId);
    const labelFor = useBridgeServerLabel(bridgeId);

    const emptyMessage = !link
      ? t("minecraftBridge.inventoryNotLinked")
      : inventories.length === 0
        ? t("minecraftBridge.inventoryEmpty")
        : null;

    return (
      <InventorySheetLayout
        name={link?.minecraftName ?? ""}
        inventories={inventories}
        isLoading={isLoading}
        live={live}
        emptyMessage={emptyMessage}
        labelFor={labelFor}
      />
    );
  },
);

export const PlayerInventorySheet = observer(
  ({
    bridgeId,
    spaceId,
    minecraftUuid,
    minecraftName,
  }: {
    bridgeId: string;
    spaceId: string;
    minecraftUuid: string;
    minecraftName: string;
  }) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const queryClient = useQueryClient();
    const { closeSheet } = useSheet();
    const [confirming, setConfirming] = useState(false);
    const { inventories, isLoading, live } = usePlayerBridgeInventory(
      bridgeId,
      spaceId,
      minecraftUuid,
    );
    const labelFor = useBridgeServerLabel(bridgeId);
    const editsState = useInventoryEdits(bridgeId, minecraftUuid);

    const editingFor = (serverId: string): ServerEditing | undefined =>
      editsState.editableServers.includes(serverId)
        ? {
            edits: editsState.edits.filter(
              (edit) => edit.serverId === serverId,
            ),
            recentResults: editsState.recentResults.filter(
              (edit) => edit.serverId === serverId,
            ),
            send: (op) =>
              app.gateway.editInventory(bridgeId, minecraftUuid, serverId, op),
            cancel: (editId) =>
              app.gateway.cancelInventoryEdit(bridgeId, editId),
          }
        : undefined;

    const { mutate: deleteSnapshot, isPending } = useMutation({
      mutationFn: () =>
        app.rest.delete(
          `/spaces/${spaceId}/bridge/inventories/${minecraftUuid}`,
        ),
      onSuccess: () => {
        queryClient.removeQueries({
          queryKey: inventoryQueryKey(bridgeId, minecraftUuid),
        });
        void queryClient.invalidateQueries({
          queryKey: knownPlayersQueryKey(bridgeId),
        });
        closeSheet(INVENTORY_SHEET_ID);
      },
    });

    return (
      <InventorySheetLayout
        name={minecraftName}
        inventories={inventories}
        isLoading={isLoading}
        live={live}
        emptyMessage={
          inventories.length === 0
            ? t("minecraftBridge.inventoryEmptyPlayer", { name: minecraftName })
            : null
        }
        labelFor={labelFor}
        editingFor={editingFor}
        actions={
          inventories.length > 0 && (
            <Box style={{ alignItems: "flex-start" }}>
              <Button
                size="sm"
                variant={confirming ? "solid" : "soft"}
                color="danger"
                disabled={isPending}
                onPress={() =>
                  confirming ? deleteSnapshot() : setConfirming(true)
                }
              >
                {confirming
                  ? t("minecraftBridge.inventoryDeleteConfirmTap")
                  : t("minecraftBridge.inventoryDelete")}
              </Button>
            </Box>
          )
        }
      />
    );
  },
);
