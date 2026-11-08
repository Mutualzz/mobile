import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

const MAX_CONTENT_LENGTH = 2000;

interface Props {
  sheetId: string;
  scheduledMessageId: string;
}

export const EditScheduledSheet = observer(
  ({ sheetId, scheduledMessageId }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { closeSheet } = useSheet();
    const { t } = useTranslation("chat");
    const scheduled = app.scheduledMessages.get(scheduledMessageId);
    const [content, setContent] = useState(scheduled?.content ?? "");
    const [saving, setSaving] = useState(false);

    const save = async () => {
      setSaving(true);
      const ack = await app.scheduledMessages.edit(scheduledMessageId, {
        content: content.trim(),
      });
      setSaving(false);
      if (ack.ok) closeSheet(sheetId);
    };

    return (
      <View style={{ width: "100%", padding: 16, gap: 12 }}>
        <Typography level="body-md" weight={700}>
          {t("scheduledMessages.editTitle")}
        </Typography>
        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={MAX_CONTENT_LENGTH}
          autoFocus
          placeholderTextColor={theme.typography.colors.muted}
          style={{
            minHeight: 120,
            maxHeight: 260,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.surface,
            color: theme.typography.colors.primary,
            textAlignVertical: "top",
          }}
        />
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant="soft"
            color="neutral"
            disabled={saving}
            onPress={() => closeSheet(sheetId)}
            style={{ flex: 1 }}
          >
            {t("scheduledMessages.cancel")}
          </Button>
          <Button
            disabled={saving || !scheduled}
            onPress={() => void save()}
            style={{ flex: 1 }}
          >
            {t("scheduledMessages.save")}
          </Button>
        </Box>
      </View>
    );
  },
);
