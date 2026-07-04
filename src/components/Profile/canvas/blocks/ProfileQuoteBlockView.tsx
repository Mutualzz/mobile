import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import type { ProfileQuoteBlock } from "@mutualzz/types";
import { dynamicElevation, formatColor } from "@mutualzz/ui-core";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { QuotesIcon } from "phosphor-react-native";

const variantStyles = (theme: ReturnType<typeof useTheme>["theme"]) => ({
  default: {
    background: dynamicElevation(theme.colors.surface, 1),
    border: theme.colors.neutral,
    accent: theme.typography.colors.primary,
  },
  accent: {
    background: formatColor(theme.colors.primary, {
      darken: 25,
      format: "hexa",
    }),
    border: theme.colors.primary,
    accent: theme.typography.colors.accent,
  },
  warning: {
    background: dynamicElevation(
      formatColor(theme.colors.warning, { darken: 25, format: "hexa" }),
      1,
    ),
    border: theme.colors.warning,
    accent: theme.typography.colors.secondary,
  },
});

export function ProfileQuoteBlockView({ block }: { block: ProfileQuoteBlock }) {
  const { theme } = useTheme();
  const variant = block.variant ?? "default";
  const styles = variantStyles(theme)[variant];

  return (
    <Stack
      direction="column"
      spacing={1}
      p={1.5}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: styles.border as string,
        backgroundColor: styles.background as string,
        overflow: "hidden",
      }}
    >
      <QuotesIcon size={20} weight="fill" color={styles.accent as string} />
      {block.content ? <ProfileMarkdownContent value={block.content} /> : null}
      {block.attribution ? (
        <Typography
          level="body-xs"
          textColor="muted"
          style={{ fontStyle: "italic" }}
        >
          — {block.attribution}
        </Typography>
      ) : null}
    </Stack>
  );
}
