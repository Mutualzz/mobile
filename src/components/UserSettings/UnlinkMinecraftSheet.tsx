import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  minecraftName: string;
  minecraftUuid?: string;
  onClose: () => void;
}

export const UnlinkMinecraftSheet = observer(
  ({ minecraftName, minecraftUuid, onClose }: Props) => {
    const { t } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
      mutationFn: () => app.rest.delete("/@me/bridges/link"),
      onSuccess: () => {
        queryClient.setQueryData(["me", "bridges", "link"], null);
        onClose();
      },
    });

    return (
      <BottomSheet
        embedded
        open
        onClose={onClose}
        title={t("minecraftBridge.unlinkTitle", { name: minecraftName })}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <MinecraftAvatar uuid={minecraftUuid} name={minecraftName} size="lg" />
          <Typography level="body-sm" style={{ flex: 1 }}>
            {t("minecraftBridge.unlinkConfirm", { name: minecraftName })}
          </Typography>
        </Box>
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button variant="plain" onPress={onClose} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button color="danger" disabled={isPending} onPress={() => mutate()}>
            {isPending
              ? t("minecraftBridge.unlinking")
              : t("minecraftBridge.unlink")}
          </Button>
        </Box>
      </BottomSheet>
    );
  },
);
