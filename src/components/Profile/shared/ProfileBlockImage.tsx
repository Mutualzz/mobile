import { isAnimatedProfileAsset } from "@utils/profileImagePicker";
import type { ProfileImageCrop } from "@mutualzz/types";
import { Image as ExpoImage } from "expo-image";
import {
  Image,
  View,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface Props {
  uri: string;
  assetHash?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
}

interface CroppedProps extends Props {
  crop?: ProfileImageCrop | null;
  containerStyle?: StyleProp<ViewStyle>;
}

function isAnimatedProfileImage(uri: string, assetHash?: string | null) {
  return (
    isAnimatedProfileAsset(assetHash) ||
    uri.includes("animated=true") ||
    /\.gif(\?|$)/i.test(uri)
  );
}

export function ProfileBlockImage({
  uri,
  assetHash,
  style,
  resizeMode = "cover",
}: Props) {
  if (isAnimatedProfileImage(uri, assetHash)) {
    return (
      <ExpoImage
        source={{ uri }}
        style={style}
        contentFit={resizeMode === "contain" ? "contain" : "cover"}
      />
    );
  }

  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
}

export function ProfileBlockCroppedImage({
  uri,
  assetHash,
  crop,
  style,
  containerStyle,
  resizeMode = "cover",
}: CroppedProps) {
  if (!crop || resizeMode === "contain") {
    return (
      <ProfileBlockImage
        uri={uri}
        assetHash={assetHash}
        style={style}
        resizeMode={resizeMode}
      />
    );
  }

  const widthPercent = 100 / crop.width;
  const heightPercent = 100 / crop.height;
  const leftPercent = -(crop.x / crop.width) * 100;
  const topPercent = -(crop.y / crop.height) * 100;

  return (
    <View style={[{ overflow: "hidden" }, containerStyle, style]}>
      <ProfileBlockImage
        uri={uri}
        assetHash={assetHash}
        style={{
          position: "absolute",
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
