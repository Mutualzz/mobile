export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  if (path.includes("voice-live-activity/")) {
    return "/";
  }

  return path;
}
