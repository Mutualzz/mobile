import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { Box } from "@mutualzz/ui-native";
import { PixelRatio } from "react-native";

interface Props {
    value: string;
    lineClamp?: number;
}

const LINE_HEIGHT_PX = 22;

export const ProfileMarkdownContent = ({ value, lineClamp }: Props) => (
    <Box
        style={
            lineClamp
                ? {
                      maxHeight:
                          lineClamp * LINE_HEIGHT_PX * PixelRatio.getFontScale(),
                      overflow: "hidden",
                  }
                : undefined
        }
    >
        <MarkdownRenderer
            value={value}
            textColor="primary"
            enlargeEmojiOnly={false}
        />
    </Box>
);
