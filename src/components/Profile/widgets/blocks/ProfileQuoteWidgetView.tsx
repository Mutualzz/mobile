import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { useAppStore } from "@hooks/useStores";
import type {
  MobileProfileQuoteBlock,
  ProfileBlockSize,
} from "@mutualzz/types";
import type { ColorLike } from "@mutualzz/ui-core";
import { dynamicElevation, formatColor } from "@mutualzz/ui-core";
import { Box, Stack, Typography, useTheme } from "@mutualzz/ui-native";
import Color from "color";
import { QuotesIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

const readableTextColors = (background: string) => {
  const onDark = Color(background).isDark();
  return {
    body: onDark ? "#f5f5f5" : "#1a1a1a",
    muted: onDark ? "#c9c9c9" : "#4a4a4a",
  };
};

const LINE_CLAMP: Record<ProfileBlockSize, number> = { s: 2, m: 4, l: 8 };

const variantStyles = (
  preferEmbossed: boolean,
  theme: ReturnType<typeof useTheme>["theme"],
) => {
  const accentBg = formatColor(theme.colors.primary, {
    darken: 25,
    format: "hexa",
  });
  const warningBg = dynamicElevation(
    formatColor(theme.colors.warning, { darken: 25, format: "hexa" }),
    preferEmbossed ? 5 : 1,
  );
  const accentText = readableTextColors(accentBg);
  const warningText = readableTextColors(warningBg);

  return {
    default: {
      background: dynamicElevation(
        theme.colors.surface,
        preferEmbossed ? 5 : 1,
      ),
      border: theme.colors.neutral,
      accent: theme.typography.colors.primary,
      text: theme.typography.colors.primary,
      mutedText: theme.typography.colors.muted,
    },
    accent: {
      background: accentBg,
      border: theme.colors.primary,
      accent: theme.typography.colors.accent,
      text: accentText.body,
      mutedText: accentText.muted,
    },
    warning: {
      background: warningBg,
      border: theme.colors.warning,
      accent: theme.typography.colors.secondary,
      text: warningText.body,
      mutedText: warningText.muted,
    },
  };
};

interface Props {
  block: MobileProfileQuoteBlock;
  size: ProfileBlockSize;
}

export function ProfileQuoteWidgetView({ block, size }: Props) {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { theme } = useTheme();
  const variant = block.variant ?? "default";
  const preferEmbossed = app.settings?.preferEmbossed ?? false;
  const styles = variantStyles(preferEmbossed, theme)[variant];
  const hasCustomBackground = Boolean(block.backgroundColor?.trim());

  return (
    <Stack
      direction="column"
      style={{
        width: "100%",
        height: "100%",
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: styles.border as string,
        backgroundColor: hasCustomBackground
          ? "transparent"
          : (styles.background as string),
        overflow: "hidden",
      }}
    >
      <QuotesIcon size={20} weight="fill" color={styles.accent} />
      <Box style={{ flex: 1, minHeight: 0 }}>
        {block.content ? (
          <ProfileMarkdownContent
            value={block.content}
            lineClamp={LINE_CLAMP[size]}
            textColor={styles.text as ColorLike}
          />
        ) : (
          <Typography
            level="body-sm"
            style={{ color: styles.mutedText as ColorLike }}
          >
            {t("profile.blocks.quote")}
          </Typography>
        )}
      </Box>
      {block.attribution && (
        <Typography
          level="body-xs"
          textColor={styles.mutedText as ColorLike}
          style={{ fontStyle: "italic" }}
        >
          — {block.attribution}
        </Typography>
      )}
    </Stack>
  );
}

export function ProfileQuoteWidgetExpandedContent({
  block,
}: {
  block: MobileProfileQuoteBlock;
}) {
  return (
    <Stack direction="column" style={{ gap: 8 }}>
      {block.content ? <ProfileMarkdownContent value={block.content} /> : null}
      {block.attribution && (
        <Typography
          level="body-xs"
          textColor="muted"
          style={{ fontStyle: "italic" }}
        >
          — {block.attribution}
        </Typography>
      )}
    </Stack>
  );
}
