import { ExpressionPreviewSheetLayout } from "@components/Preview/ExpressionPreviewSheetLayout";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { Expression } from "@stores/objects/Expression";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import { Image as ExpoImage } from "expo-image";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

interface Props {
  expression: Expression;
  onClose: () => void;
}

export const CustomEmojiPreviewSheet = observer(
  ({ expression, onClose }: Props) => {
    const app = useAppStore();
    const author = expression.author;

    useEffect(() => {
      if (!author) void app.users.resolve(expression.authorId);
    }, [app.users, author, expression.authorId]);

    const sourceLabel = expression.spaceId
      ? " from one of the spaces you belong in"
      : expression.authorId === app.account?.id
        ? " from you, you can use it in any chats"
        : " from a user";

    return (
      <ExpressionPreviewSheetLayout onClose={onClose}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ExpoImage
            source={{ uri: expression.url }}
            style={{ width: 48, height: 48 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Box style={{ flex: 1, gap: 4 }}>
            <Typography level="body-sm" textColor="accent">
              :{expression.name}:
            </Typography>
            <Typography level="body-xs" textColor="muted">
              This emoji is{sourceLabel}
            </Typography>
          </Box>
        </Box>

        <Divider lineColor="muted" style={{ opacity: 0.5 }} />

        {expression.spaceId ? (
          <Box style={{ gap: 6 }}>
            <Typography level="body-sm">
              This emoji is from a space
            </Typography>
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SpaceIcon space={expression.space} size="sm" />
              <Typography level="body-sm" weight="bold">
                {expression.space?.name ?? "Private Space"}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box style={{ gap: 6 }}>
            <Typography level="body-xs" textColor="muted">
              This emoji is from a user
            </Typography>
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <UserAvatar
                user={author}
                size="sm"
                style={{ width: 28, height: 28 }}
              />
              <Typography level="body-sm" weight="bold">
                {author?.displayName ?? "Unknown User"}
              </Typography>
            </Box>
          </Box>
        )}
      </ExpressionPreviewSheetLayout>
    );
  },
);
