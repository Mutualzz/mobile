import { toShortRelative } from "@components/Time/Time.helpers";
import { TimeDisplayMode, TimeProps } from "@components/Time/Time.types";
import { Typography } from "@mutualzz/ui-native";
import { calendarStrings } from "@utils/i18n";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable } from "react-native";

export const Time = ({
    value,
    format,
    defaultMode = format ? "format" : "relative",
    toggleOnPress = true,
    toggleToMode = defaultMode === "relative" ? "calendar" : "relative",
    relativeStyle = "short",
    refreshIntervalMs,
    onPressTime,
    typographyProps,
    pressableProps,
    accessibilityLabelPrefix = "Time",
}: TimeProps) => {
    const [, forceTick] = useState(0);

    useEffect(() => {
        if (!refreshIntervalMs) return;
        const id = setInterval(
            () => forceTick((x) => x + 1),
            refreshIntervalMs,
        );
        return () => clearInterval(id);
    }, [refreshIntervalMs]);

    const d = useMemo(() => dayjs(value), [value]);

    const [mode, setMode] = useState<TimeDisplayMode>(defaultMode);

    const iso = useMemo(() => d.toISOString(), [d]);
    const unixMs = useMemo(() => d.valueOf(), [d]);

    const calendarText = useMemo(
        () => d.calendar(undefined, calendarStrings),
        [d],
    );

    const absoluteText = useMemo(() => d.format("MM/DD/YYYY h:mm A"), [d]);

    const formattedText = useMemo(
        () => (format ? d.format(format) : calendarText),
        [d, format, calendarText],
    );

    const relativeText = useMemo(() => {
        if (relativeStyle === "long") return d.fromNow(); // "2 minutes ago"
        const short = toShortRelative(d); // "2m"
        return short === "now" ? "now" : `${short} ago`;
    }, [d, relativeStyle]);

    const visibleText = useMemo(() => {
        switch (mode) {
            case "calendar":
                return calendarText;
            case "absolute":
                return absoluteText;
            case "format":
                return formattedText;
            case "relative":
            default:
                return relativeText;
        }
    }, [mode, calendarText, absoluteText, formattedText, relativeText]);

    const a11yLabel = useMemo(() => {
        const relLong = d.fromNow();
        return `${accessibilityLabelPrefix}: ${calendarText}. (${relLong}).`;
    }, [accessibilityLabelPrefix, calendarText, d]);

    const handlePress = useCallback(() => {
        onPressTime?.({ raw: value, iso, unixMs });

        if (toggleOnPress) {
            setMode((prev) =>
                prev === defaultMode ? toggleToMode : defaultMode,
            );
        }
    }, [
        onPressTime,
        value,
        iso,
        unixMs,
        toggleOnPress,
        defaultMode,
        toggleToMode,
    ]);

    return (
        <Pressable
            {...pressableProps}
            onPress={handlePress}
            accessibilityRole="text"
            accessibilityLabel={a11yLabel}
            hitSlop={pressableProps?.hitSlop ?? 6}
        >
            <Typography {...typographyProps}>{visibleText}</Typography>
        </Pressable>
    );
};
