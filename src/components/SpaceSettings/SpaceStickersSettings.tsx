import { Button } from "@components/Button";
import { ExpressionUploadSheet } from "@components/UserSettings/ExpressionUploadSheet";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import { ExpressionType } from "@mutualzz/types";
import type { Expression } from "@stores/objects/Expression";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { TrashIcon } from "phosphor-react-native";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
import { Image } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

const STICKER_LIMIT = 100;

interface Props {
  space: Space;
}

const StickerRow = observer(
  ({ expression, space }: { expression: Expression; space: Space }) => {
    const app = useAppStore();
    const thumbnailStyle = useExpressionThumbnailStyle();
    const canManage =
      space.members.me?.hasPermission("ManageExpressions") ||
      expression.authorId === app.account?.id;

    if (expression.spaceId !== space.id) return null;

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
        <Image
          source={{ uri: expression.url }}
          style={thumbnailStyle}
        />
        <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
          :{expression.name}:
        </Typography>
        {canManage ? (
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
        ) : null}
      </Paper>
    );
  },
);

const StickerSection = ({
  title,
  expressions,
  space,
}: {
  title: string;
  expressions: Expression[];
  space: Space;
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
          <StickerRow key={expression.id} expression={expression} space={space} />
        ))}
      </Box>
    </Paper>
  );
};

export const SpaceStickersSettings = observer(({ space }: Props) => {
  const { openModal } = useModal();

  const stickers = Array.from(space.expressions.values()).filter(
    (expression) =>
      expression.spaceId === space.id &&
      expression.type === ExpressionType.Sticker,
  );

  const staticStickers = stickers.filter((sticker) => !sticker.animated);
  const animatedStickers = stickers.filter((sticker) => sticker.animated);

  const canUpload =
    space.members.me?.hasAnyPermission([
      "ManageExpressions",
      "CreateExpressions",
    ]) ?? false;

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
          "space-sticker-upload",
          <ExpressionUploadSheet
            type={ExpressionType.Sticker}
            uri={image.path}
            mimeType={image.mime ?? "image/png"}
            fileName={fileName}
            modalId="space-sticker-upload"
            spaceId={space.id}
          />,
        );
      })
      .catch(() => undefined);
  };

  return (
    <Box style={{ gap: 16 }}>
      <Box style={{ gap: 12 }}>
        <Box style={{ gap: 4 }}>
          <Typography level="body-sm" color="warning" variant="plain">
            Beta limit: {STICKER_LIMIT} stickers per space.
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {STICKER_LIMIT - stickers.length} slots available
          </Typography>
        </Box>
        {canUpload ? (
          <Button
            color="success"
            disabled={stickers.length >= STICKER_LIMIT}
            style={{ alignSelf: "flex-start" }}
            onPress={handleUpload}
          >
            Upload sticker
          </Button>
        ) : null}
      </Box>

      <StickerSection
        title="Stickers"
        expressions={staticStickers}
        space={space}
      />
      <StickerSection
        title="Animated Stickers"
        expressions={animatedStickers}
        space={space}
      />

      {stickers.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          No space stickers yet
        </Typography>
      ) : null}
    </Box>
  );
});

