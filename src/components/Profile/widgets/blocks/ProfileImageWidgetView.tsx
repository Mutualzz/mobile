import type { UserProfile } from "@stores/objects/UserProfile";
import type { MobileProfileImageBlock } from "@mutualzz/types";
import { Image, View } from "react-native";

interface Props {
  block: MobileProfileImageBlock;
  profile: UserProfile;
}

export function ProfileImageWidgetView({ block, profile }: Props) {
  const src = block.src ? profile.constructBlockImageUrl(block.src) : null;

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.15)",
      }}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: "100%", height: "100%" }}
          resizeMode={block.objectFit === "contain" ? "contain" : "cover"}
        />
      ) : null}
    </View>
  );
}

export function ProfileImageWidgetExpandedContent({ block, profile }: Props) {
  const src = block.src ? profile.constructBlockImageUrl(block.src) : null;
  if (!src) return null;

  return (
    <Image
      source={{ uri: src }}
      style={{ width: "100%", aspectRatio: 1 }}
      resizeMode="contain"
    />
  );
}
