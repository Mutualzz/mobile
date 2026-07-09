import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { MobileProfileImageBlock } from "@mutualzz/types";
import { View } from "react-native";

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
        <ProfileBlockImage
          uri={src}
          assetHash={block.src}
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
    <ProfileBlockImage
      uri={src}
      assetHash={block.src}
      style={{ width: "100%", aspectRatio: 1 }}
      resizeMode="contain"
    />
  );
}
