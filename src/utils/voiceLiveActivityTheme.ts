import { formatColor, baseDarkTheme } from "@mutualzz/ui-core";
import type { AppStore } from "@stores/App.store";
import { Theme } from "@stores/objects/Theme";
import type { VoiceChannelLiveActivityProps } from "../widgets/VoiceChannelLiveActivity";

function toWidgetHex(value: unknown, fallback: string): string {
  try {
    const formatted = formatColor(value as never, { format: "hex" });
    if (typeof formatted === "string" && formatted.startsWith("#")) {
      return formatted;
    }
  } catch {
    // ingore
  }
  return fallback;
}

export function getVoiceLiveActivityThemeColors(
  app: AppStore,
): Pick<
  VoiceChannelLiveActivityProps,
  | "accentColor"
  | "textColor"
  | "mutedTextColor"
  | "dangerColor"
  | "successColor"
> {
  const themeId = app.settings?.currentTheme ?? app.themes.currentTheme ?? null;
  const stored = themeId ? app.themes.themes.get(themeId) : undefined;
  const theme = stored ? Theme.toEmotion(stored) : baseDarkTheme;

  return {
    accentColor: toWidgetHex(theme.colors.primary, "#B57EDC"),
    textColor: toWidgetHex(theme.typography.colors.primary, "#FFFFFF"),
    mutedTextColor: toWidgetHex(theme.typography.colors.muted, "#B0A8B8"),
    dangerColor: toWidgetHex(theme.colors.danger, "#E1556B"),
    successColor: toWidgetHex(theme.colors.success, "#2AA8A3"),
  };
}
