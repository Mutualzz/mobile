import { Button } from "@components/Button";
import { ExpressionUploadSheet } from "@components/UserSettings/ExpressionUploadSheet";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import type { Expression } from "@stores/objects/Expression";
import type { Space } from "@stores/objects/Space";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { TrashIcon } from "phosphor-react-native";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
import { Image } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

interface Props {
  space: Space;
}

const EmojiRow = observer(
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

export const SpaceEmojisSettings = observer(({ space }: Props) => {
  const { openModal } = useModal();

  const emojis = Array.from(space.expressions.values()).filter(
    (expression) =>
      expression.spaceId === space.id &&
      expression.type === ExpressionType.Emoji,
  );

  const handleUpload = () => {
    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: false,
    })
      .then((image) => {
        const fileName =
          image.filename ?? image.path.split("/").pop() ?? "emoji.png";

        openModal(
          "space-expression-upload",
          <ExpressionUploadSheet
            type={ExpressionType.Emoji}
            uri={image.path}
            mimeType={image.mime ?? "image/png"}
            fileName={fileName}
            modalId="space-expression-upload"
            spaceId={space.id}
          />,
        );
      })
      .catch(() => undefined);
  };

  const canUpload =
    space.members.me?.hasAnyPermission([
      "ManageExpressions",
      "CreateExpressions",
    ]) ?? false;

  return (
    <Box style={{ gap: 16 }}>
      {canUpload ? (
        <Button style={{ alignSelf: "flex-start" }} onPress={handleUpload}>
          Upload emoji
        </Button>
      ) : null}

      {emojis.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          No space emojis yet
        </Typography>
      ) : (
        <Box style={{ gap: 8 }}>
          {emojis.map((expression) => (
            <EmojiRow
              key={expression.id}
              expression={expression}
              space={space}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});
