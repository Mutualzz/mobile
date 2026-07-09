import {
    Box,
    InputDefault,
    Modal,
    Typography,
    useTheme,
    type InputRootProps,
} from "@mutualzz/ui-native";
import type { AnyFieldApi } from "@tanstack/form-core";
import dayjs from "dayjs";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ApiErrors {
    email?: string;
    globalName?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    dateOfBirth?: string;
}

const MONTHS = [
    { value: "01", name: "January" },
    { value: "02", name: "February" },
    { value: "03", name: "March" },
    { value: "04", name: "April" },
    { value: "05", name: "May" },
    { value: "06", name: "June" },
    { value: "07", name: "July" },
    { value: "08", name: "August" },
    { value: "09", name: "September" },
    { value: "10", name: "October" },
    { value: "11", name: "November" },
    { value: "12", name: "December" },
] as const;

const parseDobParts = (value: unknown) => {
    const parsed = dayjs(value instanceof Date ? value : String(value));
    if (!parsed.isValid()) {
        const fallback = dayjs().subtract(13, "year");
        return {
            month: fallback.format("MM"),
            day: fallback.format("D"),
            year: fallback.format("YYYY"),
        };
    }

    return {
        month: parsed.format("MM"),
        day: parsed.format("D"),
        year: parsed.format("YYYY"),
    };
};

export const DOBInput = ({
    apiErrors,
    field,
    label,
    ...props
}: InputRootProps & {
    field: AnyFieldApi;
    label: string;
    apiErrors: ApiErrors;
    required?: boolean;
}) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const [month, setMonth] = useState(
        () => parseDobParts(field.state.value).month,
    );
    const [day, setDay] = useState(() => parseDobParts(field.state.value).day);
    const [year, setYear] = useState(
        () => parseDobParts(field.state.value).year,
    );
    const [monthOpen, setMonthOpen] = useState(false);

    const selectedMonth = MONTHS.find((entry) => entry.value === month);

    const commitDate = (
        nextMonth: string,
        nextDay: string,
        nextYear: string,
    ) => {
        if (!nextMonth || !nextDay || !nextYear) return;

        const parsed = dayjs(
            `${nextYear}-${nextMonth}-${nextDay.padStart(2, "0")}`,
            "YYYY-MM-DD",
            true,
        );
        if (!parsed.isValid()) return;

        const current = dayjs(field.state.value);
        if (current.isValid() && current.isSame(parsed, "day")) return;

        field.handleChange(parsed.toDate());
    };

    const maxYear = dayjs().subtract(13, "year").year();

    return (
        <Box
            style={{
                flexDirection: "column",
                gap: 8,
                width: "100%",
            }}
        >
            <Typography weight={500} level="body-sm">
                {label}{" "}
                {props.required && (
                    <Typography variant="plain" color="danger">
                        *
                    </Typography>
                )}
            </Typography>

            <Box
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                }}
            >
                <Pressable
                    onPress={() => setMonthOpen(true)}
                    style={{ flex: 1.4, minWidth: 0 }}
                    accessibilityRole="button"
                    accessibilityLabel="Select month"
                >
                    <Box
                        pointerEvents="none"
                        style={{
                            borderWidth: 1,
                            borderColor: theme.colors.neutral,
                            borderRadius: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            backgroundColor: theme.colors.surface,
                        }}
                    >
                        <Typography
                            level="body-sm"
                            textColor={selectedMonth ? "primary" : "muted"}
                            truncate="single"
                        >
                            {selectedMonth?.name ?? "Month"}
                        </Typography>
                    </Box>
                </Pressable>

                <Box style={{ flex: 0.8, minWidth: 0 }}>
                    <InputDefault
                        fullWidth
                        value={day}
                        onChangeText={(text) => {
                            setDay(text);
                            commitDate(month, text, year);
                        }}
                        onBlur={field.handleBlur}
                        placeholder="Day"
                        keyboardType="number-pad"
                        maxLength={2}
                    />
                </Box>

                <Box style={{ flex: 1, minWidth: 0 }}>
                    <InputDefault
                        fullWidth
                        value={year}
                        onChangeText={(text) => {
                            setYear(text);
                            commitDate(month, day, text);
                        }}
                        onBlur={field.handleBlur}
                        placeholder="Year"
                        keyboardType="number-pad"
                        maxLength={4}
                    />
                </Box>
            </Box>

            <Modal
                open={monthOpen}
                onClose={() => setMonthOpen(false)}
                layout="fullscreen"
                showCloseButton={false}
                style={{
                    justifyContent: "flex-end",
                    alignItems: "stretch",
                    backgroundColor: "transparent",
                    paddingVertical: 0,
                }}
            >
                <View
                    pointerEvents="box-none"
                    style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
                >
                    <Box
                        style={{
                            maxHeight: Math.min(windowHeight * 0.55, 420),
                            backgroundColor: theme.colors.background,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            paddingBottom: insets.bottom + 12,
                        }}
                    >
                        <Box
                            style={{
                                paddingHorizontal: 16,
                                paddingTop: 14,
                                paddingBottom: 8,
                            }}
                        >
                            <Typography level="title-sm" weight="bold">
                                Select month
                            </Typography>
                        </Box>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {MONTHS.map((entry) => {
                                const active = entry.value === month;
                                return (
                                    <Pressable
                                        key={entry.value}
                                        onPress={() => {
                                            setMonth(entry.value);
                                            commitDate(entry.value, day, year);
                                            setMonthOpen(false);
                                            field.handleBlur();
                                        }}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 14,
                                            backgroundColor: active
                                                ? `${theme.colors.primary}18`
                                                : "transparent",
                                        }}
                                    >
                                        <Typography
                                            level="body-md"
                                            weight={active ? "bold" : undefined}
                                            style={{
                                                color: active
                                                    ? theme.colors.primary
                                                    : theme.typography.colors
                                                          .primary,
                                            }}
                                        >
                                            {entry.name}
                                        </Typography>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Box>
                </View>
            </Modal>

            {!field.state.meta.isValid && field.state.meta.isTouched && (
                <Typography variant="plain" color="danger" level="body-sm">
                    {field.state.meta.errors[0].message}
                </Typography>
            )}
            {apiErrors[field.name as keyof ApiErrors] && (
                <Typography variant="plain" color="danger" level="body-sm">
                    {apiErrors[field.name as keyof ApiErrors]}
                </Typography>
            )}
            <Typography level="body-xs" textColor="muted">
                You must be at least 13 years old. Latest birth year: {maxYear}.
            </Typography>
        </Box>
    );
};
