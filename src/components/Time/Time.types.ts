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
  format?: string;
  defaultMode?: TimeDisplayMode;
  toggleOnPress?: boolean;
  toggleToMode?: TimeDisplayMode;
  relativeStyle?: "short" | "long";
  refreshIntervalMs?: number;
  onPressTime?: (payload: TimePressPayload) => void;
  typographyProps?: Omit<TypographyProps, "children">;
  pressableProps?: Omit<PressableProps, "onPress">;
  accessibilityLabelPrefix?: string;
}
