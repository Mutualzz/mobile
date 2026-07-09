import { isAnimatedProfileAsset } from "@utils/profileImagePicker";
import { Image as ExpoImage } from "expo-image";
import {
  Image,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
} from "react-native";

interface Props {
  uri: string;
  assetHash?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
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
