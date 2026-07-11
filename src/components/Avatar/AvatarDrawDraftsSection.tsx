import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";
import { SvgXml } from "react-native-svg";

interface Props {
  onOpenDraft: (draftId: string) => void;
  embossed?: boolean;
}

export const AvatarDrawDraftsSection = observer(
  ({ onOpenDraft, embossed = false }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { t } = useTranslation("settings");
    const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

    const drafts = app.drafts.avatars;
    if (drafts.length === 0) return null;

    const deleteSelectedDraft = () => {
      if (!selectedDraftId) return;
      app.drafts.deleteAvatarDraft(selectedDraftId);
      setSelectedDraftId(null);
    };

    return (
      <Paper
        style={{ padding: 16, borderRadius: 12, gap: 12 }}
        elevation={embossed ? 2 : 0}
      >
        <Box style={{ gap: 4 }}>
          <Typography level="body-md" weight={700}>
            {t("profile.avatar.draw.drawDraftsTitle")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("profile.avatar.draw.drawDraftsDescription")}
          </Typography>
        </Box>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {drafts.map((draft) => {
            const active = draft.id === selectedDraftId;

            return (
              <Pressable
                key={draft.id}
                onPress={() => {
                  setSelectedDraftId(draft.id);
                  onOpenDraft(draft.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("profile.avatar.draw.openDrawDraft")}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  overflow: "hidden",
                  borderWidth: active ? 2 : 1,
                  borderColor: active
                    ? theme.colors.primary
                    : `${theme.typography.colors.muted}44`,
                }}
              >
                <SvgXml xml={draft.svgData} width="100%" height="100%" />
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedDraftId && (
          <Button
            color="danger"
            size="sm"
            startDecorator={<TrashIcon size={14} />}
            onPress={deleteSelectedDraft}
            style={{ alignSelf: "flex-start" }}
          >
            {t("profile.avatar.draw.deleteDraft")}
          </Button>
        )}
      </Paper>
    );
  },
);
