import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { reportReasonKeys } from "@mutualzz/i18n";
import type {
  HttpException,
  ReportReason,
  ReportTargetType,
} from "@mutualzz/types";
import { reportReasons } from "@mutualzz/validators";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  contentLabel: string;
  sheetId: string;
}

export const ReportContentSheet = observer(
  ({ targetType, targetId, contentLabel, sheetId }: Props) => {
    const app = useAppStore();
    const { closeSheet } = useSheet();
    const { t } = useTranslation("common");
    const [reason, setReason] = useState<ReportReason>("spam");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const { mutate: submitReport, isPending } = useMutation({
      mutationKey: ["create-report", targetType, targetId],
      mutationFn: () =>
        app.rest.post("/reports", {
          targetType,
          targetId,
          reason,
          description: description.trim() || undefined,
        }),
      onSuccess: () => closeSheet(sheetId),
      onError: (err: HttpException) => setError(err.message),
    });

    return (
      <View
        style={{
          width: "100%",
          padding: 16,
          gap: 12,
        }}
      >
        <Typography level="body-md" weight={700}>
          {t("report.title", { label: contentLabel })}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("report.description")}
        </Typography>

        <Box style={{ gap: 6 }}>
          {reportReasons.map((r) => (
            <Pressable key={r} onPress={() => setReason(r)}>
              <Paper
                variant={reason === r ? "soft" : "plain"}
                color={reason === r ? "primary" : "neutral"}
                style={{ padding: 10, borderRadius: 8 }}
              >
                <Typography level="body-sm">{t(reportReasonKeys[r])}</Typography>
              </Paper>
            </Pressable>
          ))}
        </Box>

        <InputDefault
          fullWidth
          placeholder={t("report.detailsPlaceholder")}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {error && (
          <Typography level="body-sm" color="danger">
            {error}
          </Typography>
        )}

        <Button
          color="danger"
          disabled={isPending}
          onPress={() => submitReport()}
        >
          {isPending ? t("report.submitting") : t("report.submit")}
        </Button>
        <Button
          variant="soft"
          color="neutral"
          disabled={isPending}
          onPress={() => closeSheet(sheetId)}
        >
          {t("cancel")}
        </Button>
      </View>
    );
  },
);
