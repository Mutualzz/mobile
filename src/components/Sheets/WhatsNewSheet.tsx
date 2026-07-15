import { Button } from "@components/Button";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { useSheet } from "@hooks/useSheet";
import type { APIChangelog } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, View } from "react-native";

export const WHATS_NEW_SHEET_ID = "whats-new";

interface WhatsNewSheetProps {
  changelog: APIChangelog;
  onAck: () => Promise<void> | void;
}

export const WhatsNewSheet = observer(
  ({ changelog, onAck }: WhatsNewSheetProps) => {
    const { t } = useTranslation("common");
    const { theme } = useTheme();
    const { closeSheet } = useSheet();

    const handleAck = async () => {
      await onAck();
      closeSheet(WHATS_NEW_SHEET_ID);
    };

    return (
      <View
        style={{
          width: "100%",
          backgroundColor: theme.colors.background,
        }}
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

          <ScrollView
            style={{ maxHeight: 320 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <MarkdownRenderer value={changelog.body} />
          </ScrollView>

          <Button variant="solid" color="primary" onPress={() => void handleAck()}>
            {t("gotIt")}
          </Button>
        </Box>
      </View>
    );
  },
);
