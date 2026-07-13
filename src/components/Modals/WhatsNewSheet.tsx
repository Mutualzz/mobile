import { Button } from "@components/Button";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { APIChangelog } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image, ScrollView } from "react-native";

export const WHATS_NEW_MODAL_ID = "whats-new";

interface WhatsNewSheetProps {
  changelog: APIChangelog;
  onAck: () => Promise<void> | void;
}

export const WhatsNewSheet = observer(
  ({ changelog, onAck }: WhatsNewSheetProps) => {
    const { t } = useTranslation("common");
    const app = useAppStore();
    const { closeModal } = useModal();

    const handleAck = async () => {
      await onAck();
      closeModal(WHATS_NEW_MODAL_ID);
    };

    return (
      <Paper
        style={{
          width: 360,
          maxWidth: "100%",
          borderRadius: 16,
          overflow: "hidden",
          padding: 0,
        }}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        {changelog.imageUrl ? (
          <Image
            source={{ uri: changelog.imageUrl }}
            style={{ width: "100%", height: 160 }}
            resizeMode="cover"
          />
        ) : null}

        <Box style={{ padding: 16, gap: 12 }}>
          <Box style={{ gap: 4 }}>
            <Typography level="body-xs" textColor="muted">
              {t("whatsNew.title")} ·{" "}
              {dayjs(changelog.publishedAt).format("MMM D, YYYY")}
            </Typography>
            <Typography level="body-lg" weight={700}>
              {changelog.title}
            </Typography>
          </Box>

          <ScrollView style={{ maxHeight: 280 }}>
            <MarkdownRenderer value={changelog.body} />
          </ScrollView>

          <Button variant="solid" color="primary" onPress={() => void handleAck()}>
            {t("gotIt")}
          </Button>
        </Box>
      </Paper>
    );
  },
);
