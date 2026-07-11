import { ProfileLinkKindIcon } from "@components/Profile/widgets/blocks/ProfileLinkKindIcon";
import {
  formatProfileUrlLabel,
  resolveProfileUrl,
} from "@components/Profile/widgets/blocks/profileLink.utils";
import type {
  MobileProfileLinksBlock,
  ProfileBlockSize,
} from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { useScaledProfileWidgetLinkMetrics } from "@utils/accessibilityLayout";
import { ArrowSquareOutIcon } from "phosphor-react-native";
import { Linking, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

const VISIBLE_COUNT: Record<ProfileBlockSize, number> = { s: 1, m: 2, l: 4 };

const LinkRow = ({
  label,
  url,
  compact = false,
}: {
  label: string;
  url: string;
  compact?: boolean;
}) => {
  const metrics = useScaledProfileWidgetLinkMetrics();
  const resolved = resolveProfileUrl(url);
  const kind = resolved?.kind ?? "website";
  const accent = resolved?.color ?? "#6366F1";
  const subtitle = resolved ? formatProfileUrlLabel(resolved) : url;
  const iconSize = compact ? metrics.iconSize - 4 : metrics.iconSize;

  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 8 : 10,
        paddingVertical: compact ? metrics.rowPaddingV - 1 : metrics.rowPaddingV,
        paddingHorizontal: metrics.rowPaddingH,
        borderRadius: compact ? 8 : 10,
        backgroundColor: `${accent}18`,
        borderWidth: 1,
        borderColor: `${accent}44`,
      }}
    >
      <View
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: compact ? 6 : 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${accent}22`,
          borderWidth: 1,
          borderColor: `${accent}55`,
          flexShrink: 0,
        }}
      >
        <ProfileLinkKindIcon
          kind={kind}
          size={compact ? metrics.iconGlyph - 2 : metrics.iconGlyph}
          color={accent}
        />
      </View>
      <Stack direction="column" style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Typography
          level={compact ? "body-xs" : "body-sm"}
          weight="bold"
          truncate="single"
        >
          {label}
        </Typography>
        {resolved && !compact ? (
          <Typography level="body-xs" textColor="muted" truncate="single">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      <ArrowSquareOutIcon
        size={compact ? 12 : 14}
        color={accent}
        style={{ opacity: 0.75, flexShrink: 0 }}
      />
    </Pressable>
  );
};

interface Props {
  block: MobileProfileLinksBlock;
  size: ProfileBlockSize;
}

export function ProfileLinksWidgetView({ block, size }: Props) {
  const { t } = useTranslation("settings");
  const metrics = useScaledProfileWidgetLinkMetrics();
  const links = (block.links ?? []).filter(
    (link) => link.label.trim() && link.url.trim(),
  );
  const visible = links.slice(0, VISIBLE_COUNT[size]);
  const remaining = links.length - visible.length;
  const isCompact = size === "s" || size === "m";

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        padding: isCompact ? 8 : 10,
        gap: metrics.rowGap,
        justifyContent: "center",
      }}
    >
      {links.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          {t("profile.blocks.noLinksYet")}
        </Typography>
      ) : (
        <>
          {visible.map((link, index) => (
            <LinkRow
              key={`${link.url}-${index}`}
              label={link.label}
              url={link.url}
              compact={isCompact}
            />
          ))}
          {remaining > 0 ? (
            <Typography level="body-xs" textColor="muted">
              {t("profile.blocks.moreCount", { value: remaining })}
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
  const { t } = useTranslation("settings");
  const links = (block.links ?? []).filter(
    (link) => link.label.trim() && link.url.trim(),
  );

  return (
    <View style={{ gap: 6 }}>
      {links.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          {t("profile.blocks.noLinksYet")}
        </Typography>
      ) : (
        links.map((link, index) => (
          <LinkRow
            key={`${link.url}-${index}`}
            label={link.label}
            url={link.url}
          />
        ))
      )}
    </View>
  );
}
