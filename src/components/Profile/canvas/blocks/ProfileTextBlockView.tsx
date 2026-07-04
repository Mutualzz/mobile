import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import type { ProfileTextBlock } from "@mutualzz/types";
import { Paper, Typography } from "@mutualzz/ui-native";

export function ProfileTextBlockView({ block }: { block: ProfileTextBlock }) {
  return (
    <Paper
      elevation={1}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        overflow: "hidden",
        padding: 12,
      }}
    >
      {block.content ? (
        <ProfileMarkdownContent value={block.content} />
      ) : (
        <Typography level="body-md" textColor="muted">
          Text
        </Typography>
      )}
    </Paper>
  );
}
