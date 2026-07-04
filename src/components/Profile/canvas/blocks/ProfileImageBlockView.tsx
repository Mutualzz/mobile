import type { UserProfile } from "@stores/objects/UserProfile";
import type { ProfileImageBlock } from "@mutualzz/types";
import { Image, View } from "react-native";

interface Props {
  block: ProfileImageBlock;
  profile: UserProfile;
}

export function ProfileImageBlockView({ block, profile }: Props) {
  const src = block.src ? profile.constructBlockImageUrl(block.src) : null;

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        overflow: "hidden",
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
