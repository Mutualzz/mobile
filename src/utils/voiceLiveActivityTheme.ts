import { formatColor, baseDarkTheme } from "@mutualzz/ui-core";
import type { AppStore } from "@stores/App.store";
import { Theme } from "@stores/objects/Theme";
import type { VoiceLiveActivityProps } from "voice-live-activity";

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
  VoiceLiveActivityProps,
  | "accentColor"
  | "textColor"
  | "mutedTextColor"
  | "dangerColor"
> = {
  accentColor: "#B57EDC",
  textColor: "#FFFFFF",
  mutedTextColor: "#B0A8B8",
  dangerColor: "#E1556B",
};

export function getVoiceLiveActivityThemeColors(
  app: AppStore,
): Pick<
  VoiceLiveActivityProps,
  | "accentColor"
  | "textColor"
  | "mutedTextColor"
  | "dangerColor"
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
    };
  } catch {
    return { ...FALLBACK_COLORS };
  }
}
