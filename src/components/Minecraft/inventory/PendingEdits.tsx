import { Button } from "@components/Button";
import type { InventoryEdit } from "@mutualzz/client";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { ClockIcon } from "phosphor-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { describeEdit } from "./inventoryEditing";

export const PendingEditList = ({
  edits,
  queue,
  onCancel,
}: {
  edits: InventoryEdit[];
  queue: InventoryEdit[];
  onCancel: (editId: string) => void;
}) => {
  const { t } = useTranslation("settings");

  return (
    <Box style={{ gap: 4 }}>
      {edits.map((edit) => {
        const later =
          queue.length - queue.findIndex((entry) => entry.id === edit.id) - 1;
        return (
          <Box
            key={edit.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Typography
              level="body-xs"
              textColor="muted"
              style={{ flex: 1, minWidth: 0 }}
            >
              {describeEdit(edit.op, t)}
            </Typography>
            <Button size="sm" variant="plain" onPress={() => onCancel(edit.id)}>
              {later > 0
                ? t("minecraftBridge.inventoryCancelEditWithLater", {
                    count: later,
                  })
                : t("minecraftBridge.inventoryCancelEdit")}
            </Button>
          </Box>
        );
      })}
    </Box>
  );
};

export const PendingEditsBar = ({
  edits,
  onCancel,
}: {
  edits: InventoryEdit[];
  onCancel: (editId: string) => void;
}) => {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  if (edits.length === 0) return null;

  const cancelAll = () => {
    if (!confirmAll) {
      setConfirmAll(true);
      return;
    }
    setConfirmAll(false);
    onCancel(edits[0].id);
  };

  return (
    <Box style={{ gap: 6 }}>
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <ClockIcon size={14} color={theme.typography.colors.primary} />
        <Typography level="body-xs">
          {t("minecraftBridge.inventoryPendingEdits", { count: edits.length })}
        </Typography>
        <Button
          size="sm"
          variant="plain"
          onPress={() => setOpen((current) => !current)}
        >
          {open
            ? t("minecraftBridge.inventoryPendingHide")
            : t("minecraftBridge.inventoryPendingShow")}
        </Button>
        <Button
          size="sm"
          color="danger"
          variant={confirmAll ? "solid" : "plain"}
          onPress={cancelAll}
        >
          {confirmAll
            ? t("minecraftBridge.inventoryCancelAllConfirmTap")
            : t("minecraftBridge.inventoryCancelAll")}
        </Button>
      </Box>
      {open && (
        <PendingEditList edits={edits} queue={edits} onCancel={onCancel} />
      )}
    </Box>
  );
};
