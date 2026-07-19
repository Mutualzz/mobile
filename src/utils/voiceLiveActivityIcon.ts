import { downloadAsync } from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getVoiceLiveActivityAppGroupPath } from "voice-live-activity";

const iconFileByKey = new Map<string, string>();

export async function resolveVoiceLiveActivityIcon(options: {
  cacheKey: string | null;
  iconUrl: string | null;
}): Promise<string> {
  if (Platform.OS !== "ios") return "";
  if (!options.cacheKey || !options.iconUrl) return "";

  const cached = iconFileByKey.get(options.cacheKey);
  if (cached) return cached;

  const appGroupPath = getVoiceLiveActivityAppGroupPath();
  if (!appGroupPath) return "";

  const fileName = `voice-icon-${options.cacheKey}.png`;
  const destination = `${appGroupPath}/${fileName}`;

  try {
    await downloadAsync(
      options.iconUrl,
      destination.startsWith("file://") ? destination : `file://${destination}`,
    );
    iconFileByKey.set(options.cacheKey, fileName);
    return fileName;
  } catch {
    return "";
  }
}

export async function resolveVoiceLiveActivitySpaceIcon(options: {
  spaceId: string | null;
  iconUrl: string | null;
}): Promise<string> {
  return resolveVoiceLiveActivityIcon({
    cacheKey: options.spaceId,
    iconUrl: options.iconUrl,
  });
}
