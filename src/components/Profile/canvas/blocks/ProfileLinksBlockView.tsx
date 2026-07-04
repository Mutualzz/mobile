import type { ProfileLinksBlock } from "@mutualzz/types";
import { Paper, Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { ArrowSquareOutIcon, LinkIcon } from "phosphor-react-native";
import { Linking, Pressable } from "react-native";

const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function ProfileLinksBlockView({ block }: { block: ProfileLinksBlock }) {
  const { theme } = useTheme();
  const links = block.links.filter(
    (link) => link.label.trim() && link.url.trim(),
  );

  return (
    <Paper
      elevation={1}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        padding: 10,
        gap: 6,
        overflow: "hidden",
      }}
    >
      {links.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          No links yet
        </Typography>
      ) : (
        links.map((link, index) => (
          <Pressable
            key={`${link.url}-${index}`}
            onPress={() => void Linking.openURL(link.url)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 8,
              borderRadius: 10,
              backgroundColor: theme.colors.surface,
            }}
          >
            <LinkIcon size={18} color={theme.colors.primary} />
            <Stack direction="column" style={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-sm" weight="bold" numberOfLines={1}>
                {link.label}
              </Typography>
              <Typography level="body-xs" textColor="muted" numberOfLines={1}>
                {hostnameOf(link.url)}
              </Typography>
            </Stack>
            <ArrowSquareOutIcon size={14} color={theme.colors.primary} />
          </Pressable>
        ))
      )}
    </Paper>
  );
}
