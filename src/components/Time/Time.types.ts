import { TypographyProps } from "@mutualzz/ui-native";
import { PressableProps } from "react-native";

type TimeValue = Date | string | number;

export type TimeDisplayMode = "relative" | "calendar" | "absolute" | "format";

export type TimePressPayload = {
    raw: TimeValue;
    iso: string;
    unixMs: number;
};

export interface TimeProps {
    value: TimeValue;

    /**
     * If you want to mimic your current left-side timestamp:
     * format="h:mm A"
     */
    format?: string;

    /** Default display mode */
    defaultMode?: TimeDisplayMode;

    /** Toggle behavior (Discord-ish) */
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
