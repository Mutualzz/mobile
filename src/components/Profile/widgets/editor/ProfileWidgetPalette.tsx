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
  TextAaIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import { Pressable, ScrollView } from "react-native";

const ITEMS: {
  type: ProfileBlockType;
  label: string;
  Icon: typeof TextAaIcon;
}[] = [
  { type: "header", label: "Header", Icon: UserCircleIcon },
  { type: "text", label: "Text", Icon: TextAaIcon },
  { type: "quote", label: "Quote", Icon: QuotesIcon },
  { type: "image", label: "Image", Icon: ImageIcon },
  { type: "music", label: "Music", Icon: MusicNotesIcon },
  { type: "links", label: "Links", Icon: LinkIcon },
  { type: "activity", label: "Activity", Icon: PulseIcon },
  { type: "roles", label: "Roles", Icon: ShieldCheckIcon },
  { type: "mutual", label: "Mutual", Icon: UsersThreeIcon },
  { type: "divider", label: "Divider", Icon: MinusIcon },
  { type: "draw", label: "Draw", Icon: PencilSimpleIcon },
];

interface Props {
  onAddWidget: (type: ProfileBlockType) => void;
}

export function ProfileWidgetPalette({ onAddWidget }: Props) {
  const { theme } = useTheme();
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
      {ITEMS.map(({ type, label, Icon }) => (
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
            {label}
          </Typography>
        </Pressable>
      ))}
    </ScrollView>
  );
}
