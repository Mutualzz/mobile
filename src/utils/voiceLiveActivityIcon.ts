import { downloadAsync } from "expo-file-system/legacy";
import { Platform } from "react-native";
import { widgetsDirectory } from "expo-widgets";

const iconPathBySpaceId = new Map<string, string>();

function toFileUri(path: string) {
  if (!path) return "";
  if (path.startsWith("file://")) return path;
  return `file://${path}`;
}

export async function resolveVoiceLiveActivitySpaceIcon(options: {
  spaceId: string | null;
  iconUrl: string | null;
}): Promise<string> {
  if (Platform.OS !== "ios") return "";
  if (!options.spaceId || !options.iconUrl) return "";

  const cached = iconPathBySpaceId.get(options.spaceId);
  if (cached) return cached;

  try {
    const destination = `${widgetsDirectory}/voice-space-${options.spaceId}.png`;
    const download = await downloadAsync(options.iconUrl, destination);
    const uri = toFileUri(download.uri);
    iconPathBySpaceId.set(options.spaceId, uri);
    return uri;
  } catch {
    return "";
  }
}
