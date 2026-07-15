import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { ExpressionUploadSheet } from "@components/UserSettings/ExpressionUploadSheet";
import { useAppStore } from "@hooks/useStores";
import { useSheet } from "@hooks/useSheet";
import { ExpressionType } from "@mutualzz/types";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { Space } from "@stores/objects/Space";
import { BOTTOM_SHEET_PROPS } from "@utils/sheet";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { TrashIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { InteractionManager, Image } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

const EMOJI_LIMIT = 100;

interface Props {
  space: Space;
}

const EmojiRow = observer(
  ({ expression, space }: { expression: Expression; space: Space }) => {
    const { t } = useTranslation("settings");
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
        <Image source={{ uri: expression.url }} style={thumbnailStyle} />
        <Typography
          level="body-sm"
          style={{ flex: 1, minWidth: 0 }}
          truncate="single"
        >
          :{expression.name}:
        </Typography>
        {canManage && (
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
        )}
      </Paper>
    );
  },
);

const EmojiSection = ({
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
          <EmojiRow
            key={expression.id}
            expression={expression}
            space={space}
          />
        ))}
      </Box>
    </Paper>
  );
};

export const SpaceEmojisSettings = observer(({ space }: Props) => {
  const { t } = useTranslation("space");
  const { t: tSettings } = useTranslation("settings");
  const { openSheet, closeSheet } = useSheet();

  const emojis = Array.from(space.expressions.values()).filter(
    (expression) =>
      expression.spaceId === space.id &&
      expression.type === ExpressionType.Emoji,
  );

  const staticEmojis = emojis.filter((emoji) => !emoji.animated);
  const animatedEmojis = emojis.filter((emoji) => emoji.animated);

  const canUpload =
    space.members.me?.hasAnyPermission([
      "ManageExpressions",
      "CreateExpressions",
    ]) ?? false;

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
                spaceId={space.id}
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
            {t("expressions.emojiLimitMobile", { limit: EMOJI_LIMIT })}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {tSettings("expressions.slotsAvailable", {
              count: EMOJI_LIMIT - emojis.length,
            })}
          </Typography>
        </Box>
        {canUpload && (
          <Button
            color="success"
            disabled={emojis.length >= EMOJI_LIMIT}
            style={{ alignSelf: "flex-start" }}
            onPress={handleUpload}
          >
            {tSettings("expressions.uploadEmoji")}
          </Button>
        )}
      </Box>

      <EmojiSection
        title={tSettings("expressions.emojis")}
        expressions={staticEmojis}
        space={space}
      />
      <EmojiSection
        title={tSettings("expressions.animatedEmojis")}
        expressions={animatedEmojis}
        space={space}
      />

      {emojis.length === 0 && (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          {t("expressions.emptyEmojis")}
        </Typography>
      )}
    </Box>
  );
});
