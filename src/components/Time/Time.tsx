import { toShortRelative } from "@components/Time/Time.helpers";
import { TimeDisplayMode, TimeProps } from "@components/Time/Time.types";
import { Typography } from "@mutualzz/ui-native";
import { calendarStrings } from "@mutualzz/client";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    accessibilityLabelPrefix,
}: TimeProps) => {
    const { t } = useTranslation("common");
    const [, forceTick] = useState(0);
    const labelPrefix = accessibilityLabelPrefix ?? t("a11y.time");
    const [mode, setMode] = useState<TimeDisplayMode>(defaultMode);

    useEffect(() => {
        if (!refreshIntervalMs) return;
        const id = setInterval(
            () => forceTick((x) => x + 1),
            refreshIntervalMs,
        );
        return () => clearInterval(id);
    }, [refreshIntervalMs]);

    const d = dayjs(value);
    const iso = d.toISOString();
    const unixMs = d.valueOf();
    const calendarText = d.calendar(undefined, calendarStrings);
    const absoluteText = d.format("MM/DD/YYYY h:mm A");
    const formattedText = format ? d.format(format) : calendarText;
    const relativeText =
        relativeStyle === "long"
            ? d.fromNow()
            : (() => {
                  const short = toShortRelative(d);
                  return short === "now" ? "now" : `${short} ago`;
              })();

    let visibleText: string;
    switch (mode) {
        case "calendar":
            visibleText = calendarText;
            break;
        case "absolute":
            visibleText = absoluteText;
            break;
        case "format":
            visibleText = formattedText;
            break;
        case "relative":
        default:
            visibleText = relativeText;
    }

    const a11yLabel = `${labelPrefix}: ${calendarText}. (${d.fromNow()}).`;

    const handlePress = () => {
        onPressTime?.({ raw: value, iso, unixMs });

        if (toggleOnPress) {
            setMode((prev) =>
                prev === defaultMode ? toggleToMode : defaultMode,
            );
        }
    };

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
