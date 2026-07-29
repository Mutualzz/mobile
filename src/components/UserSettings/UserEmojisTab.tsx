import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { SettingsSection } from "@components/UserSettings/SettingsField";
import { ExpressionUploadSheet } from "@components/UserSettings/ExpressionUploadSheet";
import { useAppStore } from "@hooks/useStores";
import { useSheet } from "@hooks/useSheet";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import { BOTTOM_SHEET_PROPS } from "@utils/sheet";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { TrashIcon } from "phosphor-react-native";
import { InteractionManager, Image } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useTranslation } from "react-i18next";

const EMOJI_LIMIT = 100;

const ExpressionRow = observer(({ expression }: { expression: Expression }) => {
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

const EmojiSection = ({
  title,
  expressions,
}: {
  title: string;
  expressions: Expression[];
}) => {
  if (expressions.length === 0) return null;

  return (
    <SettingsSection title={title}>
      <Box style={{ gap: 8 }}>
        {expressions.map((expression) => (
          <ExpressionRow key={expression.id} expression={expression} />
        ))}
      </Box>
    </SettingsSection>
  );
};

export const UserEmojisTab = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { openSheet, closeSheet } = useSheet();
  const account = app.account;

  if (!account) return null;

  const emojis = app.expressions.emojis.filter(
    (expression) => expression.authorId === account.id && !expression.spaceId,
  );

  const staticEmojis = emojis.filter((emoji) => !emoji.animated);
  const animatedEmojis = emojis.filter((emoji) => emoji.animated);

  const handleUpload = () => {
    if (emojis.length >= EMOJI_LIMIT) return;

    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: false,
    })
      .then((image) => {
        const fileName =
          image.filename ?? image.path.split("/").pop() ?? "emoji.png";
        const sheetId = "expression-upload";

        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            openSheet(
              sheetId,
              <ExpressionUploadSheet
                type={ExpressionType.Emoji}
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
      .catch(() => { return; });
  };

  return (
    <Box style={{ gap: 16, minWidth: 0 }}>
      <SettingsSection>
        <Typography level="body-sm" color="warning" variant="plain">
          {t("expressions.emojiLimitMobile", { limit: EMOJI_LIMIT })}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("expressions.slotsAvailable", {
            count: EMOJI_LIMIT - emojis.length,
          })}
        </Typography>
        <Button
          color="success"
          disabled={emojis.length >= EMOJI_LIMIT}
          style={{ alignSelf: "flex-start" }}
          onPress={handleUpload}
        >
          {t("expressions.uploadEmoji")}
        </Button>
      </SettingsSection>

      <EmojiSection
        title={t("expressions.emojis")}
        expressions={staticEmojis}
      />
      <EmojiSection
        title={t("expressions.animatedEmojis")}
        expressions={animatedEmojis}
      />

      {emojis.length === 0 && (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          {t("expressions.noEmojis")}
        </Typography>
      )}
    </Box>
  );
});
