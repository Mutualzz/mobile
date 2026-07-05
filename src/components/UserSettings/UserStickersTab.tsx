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
import ImagePicker from "react-native-image-crop-picker";

const STICKER_LIMIT = 100;

const StickerRow = observer(({ expression }: { expression: Expression }) => (
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
    <Image
      source={{ uri: expression.url }}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        flexShrink: 0,
      }}
    />
    <Typography
      level="body-sm"
      style={{ flex: 1, minWidth: 0 }}
      numberOfLines={1}
    >
      :{expression.name}:
    </Typography>
    <IconButton
      padding={6}
      size={16}
      color="danger"
      variant="soft"
      onPress={() => void expression.delete()}
      accessibilityLabel={`Delete :${expression.name}:`}
    >
      <TrashIcon weight="fill" />
    </IconButton>
  </Paper>
));

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
  const app = useAppStore();
  const { openModal } = useModal();
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

        openModal(
          "expression-upload",
          <ExpressionUploadSheet
            type={ExpressionType.Sticker}
            uri={image.path}
            mimeType={image.mime ?? "image/png"}
            fileName={fileName}
          />,
        );
      })
      .catch(() => undefined)
      .finally(() => {
        void ImagePicker.clean();
      });
  };

  return (
    <Box style={{ gap: 16, minWidth: 0 }}>
      <Box style={{ gap: 12 }}>
        <Box style={{ gap: 4 }}>
          <Typography level="body-sm" color="warning" variant="plain">
            Beta limit: {STICKER_LIMIT} stickers per account.
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {STICKER_LIMIT - stickers.length} slots available
          </Typography>
        </Box>
        <Button
          color="success"
          disabled={stickers.length >= STICKER_LIMIT}
          style={{ alignSelf: "flex-start" }}
          onPress={handleUpload}
        >
          Upload Sticker
        </Button>
      </Box>

      <StickerSection title="Stickers" expressions={staticStickers} />
      <StickerSection
        title="Animated Stickers"
        expressions={animatedStickers}
      />

      {stickers.length === 0 && (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          No stickers created yet
        </Typography>
      )}
    </Box>
  );
});
