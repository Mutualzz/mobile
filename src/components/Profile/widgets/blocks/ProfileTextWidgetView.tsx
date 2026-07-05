import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import type { MobileProfileTextBlock, ProfileBlockSize } from "@mutualzz/types";
import { Typography } from "@mutualzz/ui-native";
import { View } from "react-native";

const LINE_CLAMP: Record<ProfileBlockSize, number> = { s: 2, m: 4, l: 8 };

interface Props {
  block: MobileProfileTextBlock;
  size: ProfileBlockSize;
}

export function ProfileTextWidgetView({ block, size }: Props) {
  return (
    <View style={{ width: "100%", height: "100%", padding: 12 }}>
      {block.content ? (
        <ProfileMarkdownContent value={block.content} lineClamp={LINE_CLAMP[size]} />
      ) : (
        <Typography level="body-md" textColor="muted">
          Text
        </Typography>
      )}
    </View>
  );
}

export function ProfileTextWidgetExpandedContent({
  block,
}: {
  block: MobileProfileTextBlock;
}) {
  return block.content ? (
    <ProfileMarkdownContent value={block.content} />
  ) : (
    <Typography level="body-md" textColor="muted">
      Text
    </Typography>
  );
}
