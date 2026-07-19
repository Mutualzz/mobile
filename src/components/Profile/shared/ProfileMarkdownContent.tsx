import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { ProfileScrim } from "@components/Profile/shared/ProfileScrim";
import type { ColorLike, TypographyColor } from "@mutualzz/ui-core";
import { Box, scaledMaxHeight } from "@mutualzz/ui-native";
import { PixelRatio } from "react-native";

interface Props {
  value: string;
  lineClamp?: number;
  textColor?: TypographyColor | ColorLike;
  scrim?: boolean;
}

const LINE_HEIGHT_PX = 22;

export const ProfileMarkdownContent = ({
  value,
  lineClamp,
  textColor = "primary",
  scrim = false,
}: Props) => {
  const content = (
    <Box
      style={
        lineClamp
          ? {
              maxHeight: scaledMaxHeight(
                lineClamp,
                LINE_HEIGHT_PX,
                PixelRatio.getFontScale(),
              ),
              overflow: "hidden",
            }
          : { flex: 1, minHeight: 0 }
      }
    >
      <MarkdownRenderer
        value={value}
        textColor={textColor}
        enlargeEmojiOnly={false}
        variant="plain"
        color="neutral"
      />
    </Box>
  );

  if (!scrim) return content;

  return <ProfileScrim>{content}</ProfileScrim>;
};
