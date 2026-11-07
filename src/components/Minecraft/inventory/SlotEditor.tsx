import { Button } from "@components/Button";
import {
  clampStackAmount,
  type InventorySlot,
  isValidItemId,
  itemName,
  normalizeItemId,
  toSlotRef,
} from "@mutualzz/client";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import type { InventoryEditOp } from "@mutualzz/validators";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const SlotEditor = ({
  slotKey,
  item,
  onRun,
}: {
  slotKey: string;
  item?: InventorySlot;
  onRun: (op: InventoryEditOp) => void;
}) => {
  const { t } = useTranslation("settings");
  const slotRef = toSlotRef(slotKey);
  const [amount, setAmount] = useState(String(item?.amount ?? 1));
  const [type, setType] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const parsedAmount = clampStackAmount(amount);
  const itemId = normalizeItemId(type);

  const amountInput = (
    <InputDefault
      style={{ width: 72 }}
      keyboardType="number-pad"
      value={amount}
      onChangeText={setAmount}
      maxLength={2}
    />
  );

  if (!item) {
    return (
      <Box style={{ gap: 8 }}>
        <InputDefault
          fullWidth
          value={type}
          onChangeText={setType}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t("minecraftBridge.inventoryGivePlaceholder")}
        />
        <Box style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {amountInput}
          <Button
            size="sm"
            disabled={!isValidItemId(itemId)}
            onPress={() =>
              onRun({
                kind: "give",
                ...slotRef,
                type: `minecraft:${itemId}`,
                amount: parsedAmount,
              })
            }
          >
            {t("minecraftBridge.inventoryGive")}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ gap: 8 }}>
      <Typography level="body-sm" weight="bold">
        {itemName(item.type)}
      </Typography>
      <Box
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {amountInput}
        <Button
          size="sm"
          variant="soft"
          disabled={parsedAmount === item.amount}
          onPress={() =>
            onRun({ kind: "amount", ...slotRef, amount: parsedAmount })
          }
        >
          {t("minecraftBridge.inventorySetAmount")}
        </Button>
        <Button
          size="sm"
          color="danger"
          variant={confirmRemove ? "solid" : "soft"}
          onPress={() =>
            confirmRemove
              ? onRun({ kind: "remove", ...slotRef })
              : setConfirmRemove(true)
          }
        >
          {confirmRemove
            ? t("minecraftBridge.inventoryRemoveConfirmTap")
            : t("minecraftBridge.inventoryRemove")}
        </Button>
      </Box>
    </Box>
  );
};
