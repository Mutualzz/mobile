import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  spaceId: string;
  userId: string;
  displayName: string;
  onClose: () => void;
}

export const KickBridgeMemberSheet = observer(
  ({ spaceId, userId, displayName, onClose }: Props) => {
    const { t } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
      mutationFn: () =>
        app.rest.delete(`/spaces/${spaceId}/bridge/members/${userId}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ["space", spaceId, "bridge"],
        });
        onClose();
      },
    });

    return (
      <BottomSheet
        embedded
        open
        onClose={onClose}
        title={t("minecraftBridge.kickMemberTitle", { name: displayName })}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography level="body-sm" textColor="muted">
          {t("minecraftBridge.kickMemberConfirm", { name: displayName })}
        </Typography>
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button variant="plain" onPress={onClose} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button color="danger" disabled={isPending} onPress={() => mutate()}>
            {isPending
              ? t("minecraftBridge.kickingMember")
              : t("minecraftBridge.kickMember")}
          </Button>
        </Box>
      </BottomSheet>
    );
  },
);
