import { PermissionsAndroid, Platform } from "react-native";

export async function ensureVoiceMicPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) return true;

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
