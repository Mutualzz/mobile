import type {
  InventoryEdit,
  InventoryEditAck,
  SlotRef,
} from "@mutualzz/client";
import { itemName } from "@mutualzz/client";
import type { InventoryEditOp } from "@mutualzz/validators";
import type { TFunction } from "i18next";

export interface ServerEditing {
  edits: InventoryEdit[];
  recentResults: InventoryEdit[];
  send: (op: InventoryEditOp) => Promise<InventoryEditAck>;
  cancel: (editId: string) => Promise<InventoryEditAck>;
}

export type SlotFlash = Map<string, boolean>;

export const describeEdit = (op: InventoryEditOp, t: TFunction<"settings">) => {
  const slotLabel = (ref: SlotRef) =>
    t(
      ref.container === "enderChest"
        ? "minecraftBridge.inventoryEditSlotEnder"
        : "minecraftBridge.inventoryEditSlot",
      { slot: ref.slot },
    );

  switch (op.kind) {
    case "move":
      return `${slotLabel(op.from)} → ${slotLabel(op.to)}`;
    case "remove":
      return t("minecraftBridge.inventoryEditRemove", { slot: slotLabel(op) });
    case "amount":
      return t("minecraftBridge.inventoryEditAmount", {
        slot: slotLabel(op),
        amount: op.amount,
      });
    case "give":
      return t("minecraftBridge.inventoryEditGive", {
        slot: slotLabel(op),
        amount: op.amount,
        item: itemName(op.type),
      });
  }
};
