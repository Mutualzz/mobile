import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import {
  Box,
  ButtonGroup,
  InputDefault,
  Modal,
  Typography,
} from "@mutualzz/ui-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  onClose: () => void;
  space: Space;
  member: SpaceMember;
}

export const MemberBanSheet = observer(
  ({ visible, onClose, space, member }: Props) => {
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const [reason, setReason] = useState("");
    const [timeframe, setTimeframe] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const timeframes = useMemo(
      () =>
        [
          { label: t("moderation.deleteMessages.dontDelete"), value: 0 },
          { label: t("moderation.deleteMessages.previousHour"), value: 3600 },
          { label: t("moderation.deleteMessages.previousDay"), value: 86400 },
          { label: t("moderation.deleteMessages.previousWeek"), value: 604800 },
          { label: t("moderation.deleteMessages.allMessages"), value: -1 },
        ] as const,
      [t],
    );

    const { mutate, isPending } = useMutation({
      mutationFn: () =>
        app.rest.put(`/spaces/${space.id}/members/${member.userId}/ban`, {
          reason: reason.trim() || t("bans.noReason"),
          deleteMessageTimeframe: timeframe,
        }),
      onSuccess: onClose,
      onError: (err: HttpException) => setError(err.message),
    });

    return (
      <Modal
        open={visible}
        onClose={onClose}
        layout="center"
        showCloseButton={false}
      >
        <Box
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
            <Paper
              elevation={app.settings?.preferEmbossed ? 4 : 2}
              style={{ padding: 20, borderRadius: 12, gap: 12 }}
            >
              <Typography weight="bold">
                {t("moderation.banTitle", {
                  name: member.user?.displayName,
                })}
              </Typography>
              <InputDefault
                fullWidth
                placeholder={t("moderation.reason")}
                accessibilityLabel={t("moderation.reason")}
                value={reason}
                onChangeText={setReason}
              />
              <ButtonGroup orientation="vertical" spacing={6}>
                {timeframes.map((entry) => (
                  <Button
                    key={entry.value}
                    variant={timeframe === entry.value ? "soft" : "plain"}
                    onPress={() => setTimeframe(entry.value)}
                  >
                    {entry.label}
                  </Button>
                ))}
              </ButtonGroup>
              {error && (
                <Typography color="danger" level="body-sm" accessibilityLiveRegion="polite">
                  {error}
                </Typography>
              )}
              <Button
                color="danger"
                disabled={isPending || !reason.trim()}
                onPress={() => mutate()}
              >
                {t("actions.ban")}
              </Button>
              <Button variant="plain" onPress={onClose}>
                {tCommon("cancel")}
              </Button>
            </Paper>
          </Box>
      </Modal>
    );
  },
);
