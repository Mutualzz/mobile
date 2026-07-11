import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { ExpressionUploadSheet } from "@components/UserSettings/ExpressionUploadSheet";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import { ExpressionType } from "@mutualzz/types";
import type { Expression } from "@stores/objects/Expression";
import { observer } from "mobx-react-lite";
import { TrashIcon } from "phosphor-react-native";
import { Image } from "react-native";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
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
          <ExpressionRow key={expression.id} expression={expression} />
        ))}
      </Box>
    </Paper>
  );
};

export const UserEmojisTab = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { openModal } = useModal();
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

        openModal(
          "expression-upload",
          <ExpressionUploadSheet
            type={ExpressionType.Emoji}
            uri={image.path}
            mimeType={image.mime ?? "image/png"}
            fileName={fileName}
          />,
        );
      })
      .catch(() => undefined);
  };

  return (
    <Box style={{ gap: 16, minWidth: 0 }}>
      <Box style={{ gap: 12 }}>
        <Box style={{ gap: 4 }}>
          <Typography level="body-sm" color="warning" variant="plain">
            {t("expressions.emojiLimitMobile", { limit: EMOJI_LIMIT })}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("expressions.slotsAvailable", {
              count: EMOJI_LIMIT - emojis.length,
            })}
          </Typography>
        </Box>
        <Button
          color="success"
          disabled={emojis.length >= EMOJI_LIMIT}
          style={{ alignSelf: "flex-start" }}
          onPress={handleUpload}
        >
          {t("expressions.uploadEmoji")}
        </Button>
      </Box>

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
