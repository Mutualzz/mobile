import {
  ProfileBlockCroppedImage,
  ProfileBlockImage,
} from "@components/Profile/shared/ProfileBlockImage";
import { ProfileBlockLoopingVideo } from "@components/Profile/shared/ProfileBlockLoopingVideo";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { MobileProfileImageBlock } from "@mutualzz/types";
import { ImageFormat, type Sizes } from "@mutualzz/types";
import {
  isProfileImageCdnHash,
  isProfileImageVideoUrl,
  resolveProfileImageBlockUrl,
} from "@mutualzz/ui-core";
import { View } from "react-native";

interface Props {
  block: MobileProfileImageBlock;
  profile: UserProfile;
}

function resolveBlockDisplayUrl(
  src: string,
  profile: UserProfile,
  size: Sizes = 512,
) {
  return resolveProfileImageBlockUrl(src, (hash, animated) =>
    profile.constructBlockImageUrl(
      hash,
      ImageFormat.WebP,
      size,
      animated,
    ),
  );
}

export function ProfileImageWidgetView({ block, profile }: Props) {
  const displayUrl = block.src
    ? resolveBlockDisplayUrl(block.src, profile)
    : null;
  const resizeMode = block.objectFit === "contain" ? "contain" : "cover";
  const isVideo = displayUrl ? isProfileImageVideoUrl(displayUrl) : false;
  const assetHash =
    block.src && isProfileImageCdnHash(block.src) ? block.src : null;

  return (
    <View style={{ width: "100%", height: "100%" }}>
      {displayUrl &&
        (isVideo ? (
          <ProfileBlockLoopingVideo
            uri={displayUrl}
            contentFit={resizeMode}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <ProfileBlockCroppedImage
            uri={displayUrl}
            assetHash={assetHash}
            crop={block.crop}
            containerStyle={{ width: "100%", height: "100%" }}
            resizeMode={resizeMode}
          />
        ))}
    </View>
  );
}

export function ProfileImageWidgetExpandedContent({ block, profile }: Props) {
  const displayUrl = block.src
    ? resolveBlockDisplayUrl(block.src, profile, 1024)
    : null;
  if (!displayUrl) return null;

  if (isProfileImageVideoUrl(displayUrl)) {
    return (
      <ProfileBlockLoopingVideo
        uri={displayUrl}
        contentFit="contain"
        style={{ width: "100%", aspectRatio: 1 }}
      />
    );
  }

  return (
    <ProfileBlockImage
      uri={displayUrl}
      assetHash={
        block.src && isProfileImageCdnHash(block.src) ? block.src : null
      }
      style={{ width: "100%", aspectRatio: 1 }}
      resizeMode="contain"
    />
  );
}
