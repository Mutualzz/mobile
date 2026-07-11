import { Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledWidgetPaletteItemWidth } from "@utils/accessibilityLayout";
import type { ProfileBlockType } from "@mutualzz/types";
import {
  ImageIcon,
  LinkIcon,
  MinusIcon,
  MusicNotesIcon,
  PencilSimpleIcon,
  PulseIcon,
  QuotesIcon,
  ShieldCheckIcon,
  StickerIcon,
  TextAaIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import { Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

const ITEMS: {
  type: ProfileBlockType;
  Icon: typeof TextAaIcon;
}[] = [
  { type: "header", Icon: UserCircleIcon },
  { type: "text", Icon: TextAaIcon },
  { type: "quote", Icon: QuotesIcon },
  { type: "image", Icon: ImageIcon },
  { type: "sticker", Icon: StickerIcon },
  { type: "music", Icon: MusicNotesIcon },
  { type: "links", Icon: LinkIcon },
  { type: "activity", Icon: PulseIcon },
  { type: "roles", Icon: ShieldCheckIcon },
  { type: "mutual", Icon: UsersThreeIcon },
  { type: "divider", Icon: MinusIcon },
  { type: "draw", Icon: PencilSimpleIcon },
];

interface Props {
  onAddWidget: (type: ProfileBlockType) => void;
}

export function ProfileWidgetPalette({ onAddWidget }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation("settings");
  const itemWidth = useScaledWidgetPaletteItemWidth();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: 12,
        alignItems: "flex-start",
      }}
    >
      {ITEMS.map(({ type, Icon }) => (
        <Pressable
          key={type}
          onPress={() => onAddWidget(type)}
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            width: itemWidth,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${theme.typography.colors.muted}48`,
          }}
        >
          <Icon size={20} color={theme.typography.colors.primary} />
          <Typography level="body-xs" truncate="single">
            {t(`profile.blocks.${type}`)}
          </Typography>
        </Pressable>
      ))}
    </ScrollView>
  );
}
