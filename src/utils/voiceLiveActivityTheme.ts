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
    return fallback;
  }
  return fallback;
}

const FALLBACK_COLORS: Pick<
  VoiceChannelLiveActivityProps,
  | "accentColor"
  | "textColor"
  | "mutedTextColor"
  | "dangerColor"
  | "successColor"
> = {
  accentColor: "#B57EDC",
  textColor: "#FFFFFF",
  mutedTextColor: "#B0A8B8",
  dangerColor: "#E1556B",
  successColor: "#2AA8A3",
};

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
  try {
    const themeId =
      app.settings?.currentTheme ?? app.themes?.currentTheme ?? null;
    const stored =
      themeId && app.themes?.themes
        ? app.themes.themes.get(themeId)
        : undefined;
    const theme = stored ? Theme.toEmotion(stored) : baseDarkTheme;

    return {
      accentColor: toWidgetHex(
        theme?.colors?.primary,
        FALLBACK_COLORS.accentColor,
      ),
      textColor: toWidgetHex(
        theme?.typography?.colors?.primary,
        FALLBACK_COLORS.textColor,
      ),
      mutedTextColor: toWidgetHex(
        theme?.typography?.colors?.muted,
        FALLBACK_COLORS.mutedTextColor,
      ),
      dangerColor: toWidgetHex(
        theme?.colors?.danger,
        FALLBACK_COLORS.dangerColor,
      ),
      successColor: toWidgetHex(
        theme?.colors?.success,
        FALLBACK_COLORS.successColor,
      ),
    };
  } catch {
    return { ...FALLBACK_COLORS };
  }
}
