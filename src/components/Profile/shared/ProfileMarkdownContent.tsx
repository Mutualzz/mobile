import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { Box } from "@mutualzz/ui-native";

interface Props {
    value: string;
    lineClamp?: number;
}

export const ProfileMarkdownContent = ({ value, lineClamp }: Props) => (
    <Box
        style={
            lineClamp
                ? {
                      maxHeight: lineClamp * 22,
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
