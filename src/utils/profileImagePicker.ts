import { Platform, Image as RNImage } from "react-native";
import ImagePicker, {
  type CropRect,
  type Image,
} from "react-native-image-crop-picker";
import { cacheDirectory, downloadAsync } from "expo-file-system/legacy";
import type { ProfileImageCrop } from "@mutualzz/types";

export interface PickedProfileImage {
  path: string;
  mime: string;
  name: string;
}

export interface ProfileImageCropOptions {
  cropWidth?: number;
  cropHeight?: number;
  freeStyle?: boolean;
}

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

export function canAdjustProfileImageCrop(source: string | null | undefined) {
  if (!source || source.startsWith("http")) return false;
  return !isAnimatedProfileAsset(source);
}

function normalizeCropRect(
  cropRect: CropRect,
  sourceWidth: number,
  sourceHeight: number,
): ProfileImageCrop {
  return {
    x: cropRect.x / sourceWidth,
    y: cropRect.y / sourceHeight,
    width: cropRect.width / sourceWidth,
    height: cropRect.height / sourceHeight,
  };
}

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function openFreeStyleCropper(
  path: string,
  sourceWidth: number,
  sourceHeight: number,
) {
  if (Platform.OS === "android") {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const cropperOptions: Parameters<typeof ImagePicker.openCropper>[0] = {
    path,
    mediaType: "photo",
    compressImageQuality: 1,
    freeStyleCropEnabled: true,
    width: sourceWidth,
  };

  if (Platform.OS === "ios") {
    cropperOptions.height = sourceHeight;
  }

  return ImagePicker.openCropper(cropperOptions);
}

export async function pickProfileImageForUpload(): Promise<PickedProfileImage | null> {
  try {
    const image = await ImagePicker.openPicker({
      mediaType: "any",
      cropping: false,
      includeBase64: false,
    });
    return toPickedImage(image);
  } catch (error) {
    if (isPickerCancelled(error)) return null;
    throw error;
  }
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
  }
}

export async function recropProfileImageFromUrl(
  sourceUrl: string,
): Promise<ProfileImageCrop | null> {
  if (!cacheDirectory) {
    throw new Error("Cache directory is unavailable");
  }

  const destination = `${cacheDirectory}profile-image-recrop-${Date.now()}.img`;

  try {
    const download = await downloadAsync(sourceUrl, destination);
    const { width, height } = await getImageSize(download.uri);
    const cropped = await openFreeStyleCropper(download.uri, width, height);

    if (!cropped.cropRect) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }

    return normalizeCropRect(cropped.cropRect, width, height);
  } catch (error) {
    if (isPickerCancelled(error)) return null;
    throw error;
  } finally {
    void ImagePicker.clean();
  }
}
