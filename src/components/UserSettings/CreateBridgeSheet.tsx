import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import {
  type CreatedBridgeResult,
  sanitizeServerId,
} from "@app-types/bridge";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  spaceId: string;
  onClose?: () => void;
  onCreated?: (bridge: CreatedBridgeResult) => void;
}

export const CreateBridgeSheet = observer(({ spaceId, onClose, onCreated }: Props) => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [serverId, setServerId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canCreate = serverId.trim().length > 0;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      app.rest.post<CreatedBridgeResult>(`/spaces/${spaceId}/bridge`, {
        name: name.trim() || t("minecraftBridge.namePlaceholder"),
        serverId: sanitizeServerId(serverId),
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["space", spaceId, "bridge"] });
      onCreated?.(created);
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <BottomSheet
      embedded
      open
      onClose={onClose}
      title={t("minecraftBridge.createTitle")}
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      <Typography level="body-sm" textColor="muted">
        {t("minecraftBridge.getStartedHint")}
      </Typography>
      <InputDefault
        fullWidth
        placeholder={t("minecraftBridge.namePlaceholder")}
        accessibilityLabel={t("minecraftBridge.name")}
        value={name}
        onChangeText={setName}
      />
      <InputDefault
        fullWidth
        placeholder={t("minecraftBridge.serverIdPlaceholder")}
        accessibilityLabel={t("minecraftBridge.serverId")}
        value={serverId}
        onChangeText={(v) => setServerId(sanitizeServerId(v))}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Typography level="body-xs" textColor="muted">
        {t("minecraftBridge.serverIdHint")}
      </Typography>
      {error && (
        <Typography color="danger" level="body-sm">
          {error}
        </Typography>
      )}
      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="plain" onPress={onClose} disabled={isPending}>
          {tCommon("cancel")}
        </Button>
        <Button
          disabled={isPending || !canCreate}
          onPress={() => mutate()}
        >
          {isPending
            ? t("minecraftBridge.creating")
            : t("minecraftBridge.create")}
        </Button>
      </Box>
    </BottomSheet>
  );
});
