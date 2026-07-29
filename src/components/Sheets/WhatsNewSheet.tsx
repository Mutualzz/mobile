import { Button } from "@components/Button";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { useSheet } from "@hooks/useSheet";
import { formatColor } from "@mutualzz/ui-core";
import type { APIChangelog } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { SparkleIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, View } from "react-native";

export const WHATS_NEW_SHEET_ID = "whats-new";

interface WhatsNewSheetProps {
  changelog: APIChangelog;
  onAck?: () => Promise<void> | void;
}

export const WhatsNewSheet = observer(
  ({ changelog, onAck }: WhatsNewSheetProps) => {
    const { t } = useTranslation("common");
    const { theme } = useTheme();
    const { closeSheet } = useSheet();

    const handleAck = async () => {
      await onAck?.();
      closeSheet(WHATS_NEW_SHEET_ID);
    };

    const primarySoft = formatColor(theme.colors.primary, {
      alpha: 12,
      format: "hexa",
    });
    const primarySoftBorder = formatColor(theme.colors.primary, {
      alpha: 26,
      format: "hexa",
    });
    const primaryText = formatColor(theme.colors.primary);
    const metaPillBg = formatColor(theme.colors.neutral, {
      alpha: 12,
      format: "hexa",
    });
    const footerBorder = formatColor(theme.typography.colors.muted, {
      alpha: 14,
      format: "hexa",
    });
    const bodyWell = formatColor(theme.colors.neutral, {
      alpha: 6,
      format: "hexa",
    });
    const surface = formatColor(theme.colors.surface, { format: "hexa" });
    const version = changelog.mobileVersion;
    const hasImage = Boolean(changelog.imageUrl);

    return (
      <View style={{ width: "100%", backgroundColor: surface }}>
        {hasImage ? (
          <View style={{ position: "relative", width: "100%" }}>
            <Image
              source={{ uri: changelog.imageUrl! }}
              style={{ width: "100%", height: 220 }}
              resizeMode="cover"
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 120,
                backgroundColor: formatColor(theme.colors.surface, {
                  alpha: 72,
                  format: "hexa",
                }),
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 20,
                paddingBottom: 16,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: primarySoft,
                    borderWidth: 1,
                    borderColor: primarySoftBorder,
                  }}
                >
                  <SparkleIcon size={12} weight="fill" color={primaryText} />
                  <Typography
                    level="body-xs"
                    weight={700}
                    style={{ color: primaryText, letterSpacing: 0.3 }}
                  >
                    {t("whatsNew.title")}
                  </Typography>
                </View>

                <Typography level="body-xs" textColor="muted" weight={500}>
                  {dayjs(changelog.publishedAt).format("MMM D, YYYY")}
                </Typography>

                {version ? (
                  <View
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: metaPillBg,
                    }}
                  >
                    <Typography level="body-xs" textColor="muted" weight={600}>
                      v{version}
                    </Typography>
                  </View>
                ) : null}
              </View>

              <Typography
                level="title-md"
                weight={700}
                style={{ lineHeight: 28, letterSpacing: -0.3 }}
              >
                {changelog.title}
              </Typography>
            </View>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 8,
              gap: 10,
              backgroundColor: primarySoft,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: formatColor(theme.colors.primary, {
                    alpha: 16,
                    format: "hexa",
                  }),
                  borderWidth: 1,
                  borderColor: primarySoftBorder,
                }}
              >
                <SparkleIcon size={12} weight="fill" color={primaryText} />
                <Typography
                  level="body-xs"
                  weight={700}
                  style={{ color: primaryText, letterSpacing: 0.3 }}
                >
                  {t("whatsNew.title")}
                </Typography>
              </View>

              <Typography level="body-xs" textColor="muted" weight={500}>
                {dayjs(changelog.publishedAt).format("MMM D, YYYY")}
              </Typography>

              {version ? (
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: metaPillBg,
                  }}
                >
                  <Typography level="body-xs" textColor="muted" weight={600}>
                    v{version}
                  </Typography>
                </View>
              ) : null}
            </View>

            <Typography
              level="title-md"
              weight={700}
              style={{ lineHeight: 28, letterSpacing: -0.3 }}
            >
              {changelog.title}
            </Typography>
          </View>
        )}

        <Box
          style={{
            paddingHorizontal: 20,
            paddingTop: hasImage ? 8 : 16,
            paddingBottom: 22,
            gap: 16,
          }}
        >
          <View
            style={{
              maxHeight: 340,
              borderRadius: 14,
              padding: 14,
              backgroundColor: bodyWell,
              borderWidth: 1,
              borderColor: footerBorder,
            }}
          >
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <MarkdownRenderer value={changelog.body} />
            </ScrollView>
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: footerBorder,
              paddingTop: 14,
            }}
          >
            <Button
              variant="solid"
              color="primary"
              onPress={() => void handleAck()}
            >
              {t("gotIt")}
            </Button>
          </View>
        </Box>
      </View>
    );
  },
);
