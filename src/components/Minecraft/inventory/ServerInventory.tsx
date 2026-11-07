import {
  ARMOR_SLOTS,
  type BridgeInventory,
  compareEditIds,
  editSlotKeys,
  itemAt,
  projectInventory,
  range,
  toSlotRef,
} from "@mutualzz/client";
import { Box, Typography } from "@mutualzz/ui-native";
import type { InventoryEditOp } from "@mutualzz/validators";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, useWindowDimensions } from "react-native";
import type { ServerEditing, SlotFlash } from "./inventoryEditing";
import { PendingEditList, PendingEditsBar } from "./PendingEdits";
import { SlotEditor } from "./SlotEditor";
import { SLOT_GAP, SlotGrid, type SlotGridEditing } from "./SlotGrid";

const SHEET_PADDING = 16;
const COLUMNS = 9;

export const ServerInventory = ({
  snapshot,
  live,
  serverLabel,
  editing,
}: {
  snapshot: BridgeInventory;
  live: boolean;
  serverLabel: string;
  editing?: ServerEditing;
}) => {
  const { t } = useTranslation("settings");
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<SlotFlash | null>(null);
  const myEdits = useRef(new Set<string>());
  const results = editing?.recentResults ?? [];
  const resultsKey = results
    .map((result) => `${result.id}:${result.status}`)
    .join(",");
  const seenResults = useRef(resultsKey);

  const slotSize = Math.floor(
    (width - SHEET_PADDING * 2 - SLOT_GAP * (COLUMNS - 1)) / COLUMNS,
  );

  const view = useMemo(
    () =>
      editing
        ? projectInventory(snapshot, editing.edits)
        : {
            inventory: snapshot.inventory,
            enderChest: snapshot.enderChest,
            pending: new Set<string>(),
          },
    [snapshot, editing?.edits],
  );

  const run = async (op: InventoryEditOp) => {
    if (!editing) return;
    const ack = await editing.send(op);
    if (!ack.ok) {
      Alert.alert(ack.message);
      return;
    }
    if (ack.edit) myEdits.current.add(ack.edit.id);
  };

  const cancel = async (editId: string) => {
    if (!editing) return;
    const ack = await editing.cancel(editId);
    if (!ack.ok) Alert.alert(ack.message);
  };

  useEffect(() => {
    if (!resultsKey || resultsKey === seenResults.current) return;
    seenResults.current = resultsKey;

    const finished = results.filter((result) => result.status !== "cancelled");
    if (finished.length === 0) return;

    const next: SlotFlash = new Map();
    for (const result of finished) {
      for (const key of editSlotKeys(result.op)) {
        next.set(key, (next.get(key) ?? true) && result.status === "applied");
      }
    }
    setFlash(next);

    const rejected = finished
      .filter(
        (result) =>
          result.status === "rejected" && myEdits.current.has(result.id),
      )
      .sort(compareEditIds);
    if (rejected.length > 0) {
      Alert.alert(
        t(
          rejected.length > 1
            ? "minecraftBridge.inventoryEditRejectedMore"
            : "minecraftBridge.inventoryEditRejected",
          { message: rejected[0].message ?? "", count: rejected.length - 1 },
        ),
      );
    }
    for (const result of results) myEdits.current.delete(result.id);

    const timer = setTimeout(() => setFlash(null), 1200);
    return () => clearTimeout(timer);
  }, [resultsKey, t]);

  const onSlotPress = (key: string) => {
    if (selected === key) {
      setSelected(null);
      return;
    }
    if (selected && itemAt(view, selected)) {
      void run({ kind: "move", from: toSlotRef(selected), to: toSlotRef(key) });
      setSelected(null);
      return;
    }
    setSelected(key);
  };

  const gridEditing: SlotGridEditing | undefined = editing && {
    pending: view.pending,
    selected,
    onPress: onSlotPress,
    live,
    flash,
  };

  const selectedItem = selected ? itemAt(view, selected) : undefined;
  const slotEdits =
    editing && selected
      ? editing.edits.filter((edit) => editSlotKeys(edit.op).includes(selected))
      : [];

  const sectionLabel = (label: string) => (
    <Typography level="label-sm" weight="bold">
      {label}
    </Typography>
  );

  return (
    <Box style={{ gap: 10 }}>
      <Typography level="body-xs" textColor="muted">
        {serverLabel} ·{" "}
        {live
          ? t("minecraftBridge.inventoryLive")
          : t("minecraftBridge.inventoryLastSeen", {
              time: new Date(snapshot.capturedAt).toLocaleString(),
            })}
      </Typography>

      {editing && !live && (
        <Typography level="body-xs" color="warning">
          {t("minecraftBridge.inventoryEditOffline")}
        </Typography>
      )}

      {editing && (
        <PendingEditsBar
          edits={editing.edits}
          onCancel={(editId) => void cancel(editId)}
        />
      )}

      {sectionLabel(t("minecraftBridge.inventoryArmor"))}
      <SlotGrid
        slots={view.inventory}
        container="inventory"
        indexes={ARMOR_SLOTS}
        slotSize={slotSize}
        editing={gridEditing}
      />

      {sectionLabel(t("minecraftBridge.inventoryMain"))}
      <SlotGrid
        slots={view.inventory}
        container="inventory"
        indexes={range(9, 35)}
        slotSize={slotSize}
        editing={gridEditing}
      />
      <SlotGrid
        slots={view.inventory}
        container="inventory"
        indexes={range(0, 8)}
        slotSize={slotSize}
        editing={gridEditing}
      />

      {sectionLabel(t("minecraftBridge.inventoryEnderChest"))}
      <SlotGrid
        slots={view.enderChest}
        container="enderChest"
        indexes={range(0, 26)}
        slotSize={slotSize}
        editing={gridEditing}
      />

      {editing && selected && (
        <Box style={{ gap: 8 }}>
          {selectedItem && (
            <Typography level="body-xs" textColor="muted">
              {t("minecraftBridge.inventoryMoveHint")}
            </Typography>
          )}
          <SlotEditor
            key={`${selected}:${selectedItem?.type ?? ""}:${selectedItem?.amount ?? 0}`}
            slotKey={selected}
            item={selectedItem}
            onRun={(op) => void run(op)}
          />
          {slotEdits.length > 0 && (
            <>
              {sectionLabel(t("minecraftBridge.inventorySlotPending"))}
              <PendingEditList
                edits={slotEdits}
                queue={editing.edits}
                onCancel={(editId) => void cancel(editId)}
              />
            </>
          )}
        </Box>
      )}
    </Box>
  );
};
