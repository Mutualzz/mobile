import { Platform } from "react-native";
import ImagePicker, { type Image } from "react-native-image-crop-picker";

export type PickedProfileImage = {
  path: string;
  mime: string;
  name: string;
};

export type ProfileImageCropOptions = {
  cropWidth?: number;
  cropHeight?: number;
  freeStyle?: boolean;
};

function isPickerCancelled(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "E_PICKER_CANCELLED"
  );
}

function isGif(image: Image) {
  return (
    image.mime === "image/gif" ||
    image.path.toLowerCase().endsWith(".gif") ||
    image.filename?.toLowerCase().endsWith(".gif")
  );
}

function toPickedImage(image: Image): PickedProfileImage {
  const gif = isGif(image);

  return {
    path: image.path,
    mime: image.mime ?? (gif ? "image/gif" : "image/jpeg"),
    name: image.filename ?? (gif ? "image.gif" : "image.jpg"),
  };
}

export function isAnimatedProfileAsset(source: string | null | undefined) {
  return !!source && source.startsWith("a_");
}

export async function pickProfileImageAsset(
  options: ProfileImageCropOptions = {},
): Promise<PickedProfileImage | null> {
  const { cropWidth, cropHeight, freeStyle = false } = options;

  try {
    const image = await ImagePicker.openPicker({
      mediaType: "any",
      cropping: false,
      includeBase64: false,
    });

    if (isGif(image)) {
      return toPickedImage(image);
    }

    if (Platform.OS === "android") {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const cropperOptions: Parameters<typeof ImagePicker.openCropper>[0] = {
      path: image.path,
      mediaType: "photo",
      compressImageQuality: 0.9,
      ...(freeStyle ? { freeStyleCropEnabled: true } : {}),
    };

    if (cropWidth && cropHeight) {
      cropperOptions.width = cropWidth;
      cropperOptions.height = cropHeight;
    } else if (freeStyle) {
      cropperOptions.width = image.width;
      if (Platform.OS === "ios") {
        cropperOptions.height = image.height;
      }
    }

    const cropped = await ImagePicker.openCropper(cropperOptions);
    return toPickedImage(cropped);
  } catch (error) {
    if (isPickerCancelled(error)) return null;
    throw error;
  } finally {
    void ImagePicker.clean();
  }
}
