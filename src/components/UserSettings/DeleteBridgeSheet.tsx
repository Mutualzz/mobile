import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  bridgeId: string;
  bridgeName: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteBridgeSheet = observer(
  ({ bridgeId, bridgeName, onClose, onDeleted }: Props) => {
    const { t } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
      mutationFn: () => app.rest.delete(`/@me/bridges/${bridgeId}`),
      onSuccess: () => {
        queryClient.setQueryData<Array<{ id: string }>>(
          ["me", "bridges"],
          (prev) => (prev ?? []).filter((b) => b.id !== bridgeId),
        );
        queryClient.removeQueries({ queryKey: ["me", "bridges", bridgeId] });
        app.bridgeChat.clear(bridgeId);
        void queryClient.invalidateQueries({ queryKey: ["me", "bridges"] });
        onDeleted?.();
        onClose();
      },
    });

    return (
      <BottomSheet
        embedded
        open
        onClose={onClose}
        title={t("minecraftBridge.deleteTitle", { name: bridgeName })}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography level="body-sm" textColor="muted">
          {t("minecraftBridge.deleteConfirm", { name: bridgeName })}
        </Typography>
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button variant="plain" onPress={onClose} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button
            color="danger"
            disabled={isPending}
            onPress={() => mutate()}
          >
            {isPending
              ? t("minecraftBridge.deleting")
              : t("minecraftBridge.delete")}
          </Button>
        </Box>
      </BottomSheet>
    );
  },
);
