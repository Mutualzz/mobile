import type { InventorySlot, SlotContainer } from "@mutualzz/client";
import { formatColor } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { ClockIcon } from "phosphor-react-native";
import { ActivityIndicator, Pressable } from "react-native";
import type { SlotFlash } from "./inventoryEditing";
import { ItemIcon } from "./ItemIcon";

export const SLOT_GAP = 4;

export interface SlotGridEditing {
  pending: Set<string>;
  selected: string | null;
  onPress: (key: string) => void;
  live: boolean;
  flash: SlotFlash | null;
}

interface SlotProps {
  item?: InventorySlot;
  size: number;
  pending: boolean;
  selected: boolean;
  live: boolean;
  flash?: "ok" | "fail";
  onPress?: () => void;
}

const Slot = ({
  item,
  size,
  pending,
  selected,
  live,
  flash,
  onPress,
}: SlotProps) => {
  const { theme } = useTheme();
  const flashColor =
    flash === "fail"
      ? theme.colors.danger
      : flash === "ok"
        ? theme.colors.success
        : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        opacity: pending ? 0.6 : 1,
        backgroundColor: flashColor
          ? formatColor(flashColor, { alpha: 35, format: "hexa" })
          : formatColor(theme.colors.neutral, { alpha: 18, format: "hexa" }),
        borderWidth: 2,
        borderColor: selected
          ? formatColor(theme.colors.primary)
          : flashColor
            ? formatColor(flashColor)
            : "transparent",
      }}
    >
      {item && (
        <>
          <ItemIcon key={item.type} type={item.type} size={size * 0.62} />
          {item.amount > 1 && (
            <Typography
              level="body-xs"
              weight="bold"
              style={{
                position: "absolute",
                right: 3,
                bottom: 1,
                fontSize: 11,
                textShadowColor: "#000",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 0,
              }}
            >
              {item.amount}
            </Typography>
          )}
        </>
      )}
      {pending && (
        <Box style={{ position: "absolute", top: 2, left: 2 }}>
          {live ? (
            <ActivityIndicator
              size="small"
              color={theme.typography.colors.primary}
              style={{ transform: [{ scale: 0.55 }], margin: -6 }}
            />
          ) : (
            <ClockIcon size={10} color={theme.typography.colors.primary} />
          )}
        </Box>
      )}
    </Pressable>
  );
};

export const SlotGrid = ({
  slots,
  container,
  indexes,
  slotSize,
  editing,
}: {
  slots: InventorySlot[];
  container: SlotContainer;
  indexes: number[];
  slotSize: number;
  editing?: SlotGridEditing;
}) => {
  const bySlot = new Map(slots.map((item) => [item.slot, item]));

  return (
    <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: SLOT_GAP }}>
      {indexes.map((index) => {
        const key = `${container}:${index}`;
        const flash = editing?.flash?.has(key)
          ? editing.flash.get(key)
            ? "ok"
            : "fail"
          : undefined;
        return (
          <Slot
            key={key}
            item={bySlot.get(index)}
            size={slotSize}
            pending={editing?.pending.has(key) ?? false}
            selected={editing?.selected === key}
            live={editing?.live ?? false}
            flash={flash}
            onPress={editing ? () => editing.onPress(key) : undefined}
          />
        );
      })}
    </Box>
  );
};
