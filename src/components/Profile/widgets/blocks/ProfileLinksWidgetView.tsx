import { ProfileLinkKindIcon } from "@components/Profile/widgets/blocks/ProfileLinkKindIcon";
import {
  formatProfileUrlLabel,
  resolveProfileUrl,
} from "@components/Profile/widgets/blocks/profileLink.utils";
import type { MobileProfileLinksBlock, ProfileBlockSize } from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { ArrowSquareOutIcon } from "phosphor-react-native";
import { Linking, Pressable, View } from "react-native";

const VISIBLE_COUNT: Record<ProfileBlockSize, number> = { s: 1, m: 3, l: 5 };

const LinkRow = ({ label, url }: { label: string; url: string }) => {
  const resolved = resolveProfileUrl(url);
  const kind = resolved?.kind ?? "website";
  const accent = resolved?.color ?? "#6366F1";
  const subtitle = resolved ? formatProfileUrlLabel(resolved) : url;

  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: `${accent}18`,
        borderWidth: 1,
        borderColor: `${accent}44`,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${accent}22`,
          borderWidth: 1,
          borderColor: `${accent}55`,
        }}
      >
        <ProfileLinkKindIcon kind={kind} size={18} color={accent} />
      </View>
      <Stack direction="column" style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Typography level="body-sm" weight="bold" truncate="single">
          {label}
        </Typography>
        {resolved ? (
          <Typography level="body-xs" textColor="muted" truncate="single">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      <ArrowSquareOutIcon size={14} color={accent} style={{ opacity: 0.75 }} />
    </Pressable>
  );
};

interface Props {
  block: MobileProfileLinksBlock;
  size: ProfileBlockSize;
}

export function ProfileLinksWidgetView({ block, size }: Props) {
  const links = (block.links ?? []).filter((link) => link.label.trim() && link.url.trim());
  const visible = links.slice(0, VISIBLE_COUNT[size]);
  const remaining = links.length - visible.length;

  return (
    <View style={{ width: "100%", height: "100%", padding: 10, gap: 6 }}>
      {links.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          No links yet
        </Typography>
      ) : (
        <>
          {visible.map((link, index) => (
            <LinkRow key={`${link.url}-${index}`} label={link.label} url={link.url} />
          ))}
          {remaining > 0 ? (
            <Typography level="body-xs" textColor="muted">
              +{remaining} more
            </Typography>
          ) : null}
        </>
      )}
    </View>
  );
}

export function ProfileLinksWidgetExpandedContent({
  block,
}: {
  block: MobileProfileLinksBlock;
}) {
  const links = (block.links ?? []).filter((link) => link.label.trim() && link.url.trim());

  return (
    <View style={{ gap: 6 }}>
      {links.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          No links yet
        </Typography>
      ) : (
        links.map((link, index) => (
          <LinkRow key={`${link.url}-${index}`} label={link.label} url={link.url} />
        ))
      )}
    </View>
  );
}
