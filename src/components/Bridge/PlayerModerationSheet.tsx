import { Button } from "@components/Button";
import { BottomSheet } from "@components/Keyboard";
import { useBridgeServerLabel } from "@hooks/useBridgeInventory";
import { useAppStore } from "@hooks/useStores";
import { knownPlayersQueryKey, type ModerationResult } from "@mutualzz/client";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  spaceId: string;
  bridgeId: string;
  action: "kick" | "ban";
  minecraftUuid: string;
  minecraftName: string;
  onClose: () => void;
}

export const PlayerModerationSheet = observer(
  ({
    spaceId,
    bridgeId,
    action,
    minecraftUuid,
    minecraftName,
    onClose,
  }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("settings");
    const queryClient = useQueryClient();
    const labelFor = useBridgeServerLabel(bridgeId);
    const [reason, setReason] = useState("");
    const [results, setResults] = useState<ModerationResult[] | null>(null);
    const isBan = action === "ban";

    const { mutate, isPending, error } = useMutation({
      mutationFn: () =>
        app.rest.post<{ results: ModerationResult[] }>(
          `/spaces/${spaceId}/bridge/players/${minecraftUuid}/${action}`,
          { reason: reason.trim() || undefined },
        ),
      onSuccess: (data) => {
        setResults(data.results);
        if (isBan) {
          void queryClient.invalidateQueries({
            queryKey: ["space", spaceId, "bridge"],
          });
          void queryClient.invalidateQueries({
            queryKey: knownPlayersQueryKey(bridgeId),
          });
        }
      },
    });

    return (
      <BottomSheet
        embedded
        open
        onClose={onClose}
        keyboard="scroll"
        title={t(
          isBan ? "minecraftBridge.banTitle" : "minecraftBridge.kickTitle",
          { name: minecraftName },
        )}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography level="body-sm" textColor="muted">
          {t(
            isBan
              ? "minecraftBridge.banDescription"
              : "minecraftBridge.kickDescription",
          )}
        </Typography>

        {results ? (
          <Box style={{ gap: 4 }}>
            {isBan && (
              <Typography level="body-sm" color="success">
                ✓ {t("minecraftBridge.removedFromBridge")}
              </Typography>
            )}
            {results.length === 0 ? (
              <Typography level="body-sm" textColor="muted">
                {t("minecraftBridge.noServersConnected")}
              </Typography>
            ) : (
              results.map((result) => (
                <Typography
                  key={result.serverId}
                  level="body-sm"
                  color={result.ok ? "success" : "danger"}
                >
                  {result.ok ? "✓" : "✗"} {labelFor(result.serverId)}:{" "}
                  {result.message}
                </Typography>
              ))
            )}
          </Box>
        ) : (
          <Box style={{ gap: 6 }}>
            <Typography level="label-sm" weight="bold">
              {t("minecraftBridge.moderationReason")}
            </Typography>
            <InputDefault
              fullWidth
              value={reason}
              onChangeText={setReason}
              maxLength={200}
              placeholder={t("minecraftBridge.moderationReasonPlaceholder")}
            />
          </Box>
        )}

        {error && (
          <Typography level="body-sm" color="danger">
            {error.message}
          </Typography>
        )}

        <Box
          style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}
        >
          {results ? (
            <Button size="sm" onPress={onClose}>
              {t("minecraftBridge.done")}
            </Button>
          ) : (
            <>
              <Button size="sm" variant="plain" onPress={onClose}>
                {t("minecraftBridge.cancel")}
              </Button>
              <Button
                size="sm"
                color="danger"
                disabled={isPending}
                onPress={() => mutate()}
              >
                {t(
                  isBan
                    ? "minecraftBridge.ban"
                    : "minecraftBridge.kickFromServer",
                )}
              </Button>
            </>
          )}
        </Box>
      </BottomSheet>
    );
  },
);
