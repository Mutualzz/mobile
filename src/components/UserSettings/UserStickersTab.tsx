import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { ExpressionUploadSheet } from "@components/UserSettings/ExpressionUploadSheet";
import { useAppStore } from "@hooks/useStores";
import { useSheet } from "@hooks/useSheet";
import { ExpressionType } from "@mutualzz/types";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import { BOTTOM_SHEET_PROPS } from "@utils/sheet";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { TrashIcon } from "phosphor-react-native";
import { InteractionManager, Image } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useTranslation } from "react-i18next";

const STICKER_LIMIT = 100;

const StickerRow = observer(({ expression }: { expression: Expression }) => {
  const { t } = useTranslation("settings");
  const thumbnailStyle = useExpressionThumbnailStyle();

  return (
    <Paper
      variant="plain"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 10,
        minWidth: 0,
      }}
    >
      <Image source={{ uri: expression.url }} style={thumbnailStyle} />
      <Typography
        level="body-sm"
        style={{ flex: 1, minWidth: 0 }}
        truncate="single"
      >
        :{expression.name}:
      </Typography>
      <IconButton
        padding={6}
        size={16}
        color="danger"
        variant="soft"
        onPress={() => void expression.delete()}
        accessibilityLabel={t("expressions.deleteNamed", {
          name: expression.name,
        })}
      >
        <TrashIcon weight="fill" />
      </IconButton>
    </Paper>
  );
});

const StickerSection = ({
  title,
  expressions,
}: {
  title: string;
  expressions: Expression[];
}) => {
  if (expressions.length === 0) return null;

  return (
    <Paper
      style={{
        padding: 12,
        borderRadius: 12,
        gap: 8,
        minWidth: 0,
      }}
    >
      <Typography level="body-md" weight={700}>
        {title}
      </Typography>
      <Divider lineColor="muted" />
      <Box style={{ gap: 8 }}>
        {expressions.map((expression) => (
          <StickerRow key={expression.id} expression={expression} />
        ))}
      </Box>
    </Paper>
  );
};

export const UserStickersTab = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { openSheet, closeSheet } = useSheet();
  const account = app.account;

  if (!account) return null;

  const stickers = app.expressions.stickers.filter(
    (expression) => expression.authorId === account.id && !expression.spaceId,
  );

  const staticStickers = stickers.filter((sticker) => !sticker.animated);
  const animatedStickers = stickers.filter((sticker) => sticker.animated);

  const handleUpload = () => {
    if (stickers.length >= STICKER_LIMIT) return;

    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: false,
    })
      .then((image) => {
        const fileName =
          image.filename ?? image.path.split("/").pop() ?? "sticker.png";
        const sheetId = "expression-upload";

        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            openSheet(
              sheetId,
              <ExpressionUploadSheet
                type={ExpressionType.Sticker}
                uri={image.path}
                mimeType={image.mime ?? "image/png"}
                fileName={fileName}
                onClose={() => closeSheet(sheetId)}
              />,
              BOTTOM_SHEET_PROPS,
            );
          }, 300);
        });
      })
      .catch(() => undefined);
  };

  return (
    <Box style={{ gap: 16, minWidth: 0 }}>
      <Box style={{ gap: 12 }}>
        <Box style={{ gap: 4 }}>
          <Typography level="body-sm" color="warning" variant="plain">
            {t("expressions.stickerLimitMobile", { limit: STICKER_LIMIT })}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("expressions.slotsAvailable", {
              count: STICKER_LIMIT - stickers.length,
            })}
          </Typography>
        </Box>
        <Button
          color="success"
          disabled={stickers.length >= STICKER_LIMIT}
          style={{ alignSelf: "flex-start" }}
          onPress={handleUpload}
        >
          {t("expressions.uploadSticker")}
        </Button>
      </Box>

      <StickerSection
        title={t("expressions.stickers")}
        expressions={staticStickers}
      />
      <StickerSection
        title={t("expressions.animatedStickers")}
        expressions={animatedStickers}
      />

      {stickers.length === 0 && (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          {t("expressions.noStickers")}
        </Typography>
      )}
    </Box>
  );
});
