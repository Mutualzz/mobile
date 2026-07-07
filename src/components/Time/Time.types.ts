import { type TypographyProps } from "@mutualzz/ui-native";
import { type PressableProps } from "react-native";

type TimeValue = Date | string | number;

export type TimeDisplayMode = "relative" | "calendar" | "absolute" | "format";

export interface TimePressPayload {
  raw: TimeValue;
  iso: string;
  unixMs: number;
}

export interface TimeProps {
  value: TimeValue;

  /**
   * format="h:mm A"
   */
  format?: string;

  /** Default display mode */
  defaultMode?: TimeDisplayMode;

  /** Toggle behavior */
  toggleOnPress?: boolean;
  toggleToMode?: TimeDisplayMode;

  /** Relative style */
  relativeStyle?: "short" | "long";

  /** Optional: refresh relative text occasionally */
  refreshIntervalMs?: number;

  /** For “machine-readable” access (copy, logging, context menu, etc.) */
  onPressTime?: (payload: TimePressPayload) => void;

  /** Typography passthrough */
  typographyProps?: Omit<TypographyProps, "children">;

  /** Pressable passthrough */
  pressableProps?: Omit<PressableProps, "onPress">;

  /** A11y label prefix (e.g. "Sent", "Edited") */
  accessibilityLabelPrefix?: string;
}
