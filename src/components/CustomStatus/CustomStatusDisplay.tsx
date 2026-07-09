import { CustomStatusEmoji } from "@components/CustomStatus/CustomStatusEmoji";
import { useAppStore } from "@hooks/useStores";
import type {
  PresenceActivity,
  PresenceActivityEmoji,
} from "@mutualzz/types";
import type { ColorLike, TypographyColor } from "@mutualzz/ui-core";
import { Box, Typography } from "@mutualzz/ui-native";
import { hasStatusEmoji } from "@utils/customStatus";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

interface Props {
  activity?: PresenceActivity | null;
  text?: string | null;
  emoji?: PresenceActivityEmoji | null;
  textColor?: ColorLike | TypographyColor;
  truncate?: boolean;
  emojiSize?: number;
}

function canRenderStatusEmoji(
  emoji: PresenceActivityEmoji | null,
  getExpression: (id: string) => { url: string } | undefined,
) {
  if (!emoji || !hasStatusEmoji(emoji)) return false;

  if (emoji.id) {
    return Boolean(getExpression(emoji.id)?.url);
  }

  return Boolean(emoji.name?.trim());
}

export const CustomStatusDisplay = observer(
  ({
    activity,
    text,
    emoji,
    textColor = "accent",
    truncate = true,
    emojiSize = 16,
  }: Props) => {
    const app = useAppStore();
    const statusText = (text ?? activity?.state ?? activity?.name ?? "").trim();
    const statusEmoji = emoji ?? activity?.emoji ?? null;

    useEffect(() => {
      if (statusEmoji?.id && !app.expressions.get(statusEmoji.id)) {
        app.expressions.resolve(statusEmoji.id);
      }
    }, [app.expressions, statusEmoji?.id]);

    const showEmoji = canRenderStatusEmoji(statusEmoji, (id) =>
      app.expressions.get(id),
    );

    if (!statusText && !showEmoji) return null;

    const statusLabel = statusText ? (
      <Typography
        level="body-xs"
        textColor={textColor}
        truncate={truncate ? "single" : undefined}
        style={{ flexShrink: 1, minWidth: 0 }}
      >
        {statusText}
      </Typography>
    ) : null;

    if (!showEmoji || !statusEmoji) return statusLabel;

    return (
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        <CustomStatusEmoji emoji={statusEmoji} size={emojiSize} />
        {statusLabel}
      </Box>
    );
  },
);
