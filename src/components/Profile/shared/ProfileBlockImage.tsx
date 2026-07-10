import type { ProfileImageCrop } from "@mutualzz/types";
import {
  Image as ExpoImage,
  type ImageContentFit,
  type ImageContentPosition,
} from "expo-image";
import { useState } from "react";
import {
  View,
  type ImageResizeMode,
  type ImageStyle,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface Props {
  uri: string;
  assetHash?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  contentPosition?: ImageContentPosition;
}

interface CroppedProps extends Props {
  crop?: ProfileImageCrop | null;
  containerStyle?: StyleProp<ViewStyle>;
}

function toContentFit(resizeMode: ImageResizeMode): ImageContentFit {
  switch (resizeMode) {
    case "contain":
      return "contain";
    case "stretch":
      return "fill";
    case "center":
      return "none";
    default:
      return "cover";
  }
}

export function ProfileBlockImage({
  uri,
  style,
  resizeMode = "cover",
  contentPosition,
}: Props) {
  return (
    <ExpoImage
      source={{ uri }}
      style={style}
      contentFit={toContentFit(resizeMode)}
      contentPosition={contentPosition}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}

export function ProfileBlockCroppedImage({
  uri,
  assetHash,
  crop,
  style,
  containerStyle,
  resizeMode = "cover",
}: CroppedProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(
    null,
  );

  if (!crop || resizeMode === "contain") {
    return (
      <View style={[{ overflow: "hidden" }, containerStyle, style]}>
        <ProfileBlockImage
          uri={uri}
          assetHash={assetHash}
          style={{ width: "100%", height: "100%" }}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    }
  };

  const croppedStyle = layout
    ? {
        position: "absolute" as const,
        width: layout.width / crop.width,
        height: layout.height / crop.height,
        left: -(layout.width * crop.x) / crop.width,
        top: -(layout.height * crop.y) / crop.height,
      }
    : {
        position: "absolute" as const,
        width: "100%" as const,
        height: "100%" as const,
      };

  return (
    <View
      style={[{ overflow: "hidden" }, containerStyle, style]}
      onLayout={onLayout}
    >
      <ProfileBlockImage
        uri={uri}
        assetHash={assetHash}
        style={croppedStyle}
        resizeMode="stretch"
      />
    </View>
  );
}
