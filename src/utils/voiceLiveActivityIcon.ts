import { downloadAsync } from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getVoiceLiveActivityAppGroupPath } from "voice-live-activity";

const iconFileBySpaceId = new Map<string, string>();

export async function resolveVoiceLiveActivitySpaceIcon(options: {
  spaceId: string | null;
  iconUrl: string | null;
}): Promise<string> {
  if (Platform.OS !== "ios") return "";
  if (!options.spaceId || !options.iconUrl) return "";

  const cached = iconFileBySpaceId.get(options.spaceId);
  if (cached) return cached;

  const appGroupPath = getVoiceLiveActivityAppGroupPath();
  if (!appGroupPath) return "";

  const fileName = `voice-space-${options.spaceId}.png`;
  const destination = `${appGroupPath}/${fileName}`;

  try {
    await downloadAsync(options.iconUrl, destination.startsWith("file://")
      ? destination
      : `file://${destination}`);
    iconFileBySpaceId.set(options.spaceId, fileName);
    return fileName;
  } catch {
    return "";
  }
}
