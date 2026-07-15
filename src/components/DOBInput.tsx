import { Box, InputDefault, Sheet, Typography, useTheme, type InputRootProps } from "@mutualzz/ui-native";
import type { AnyFieldApi } from "@tanstack/form-core";
import dayjs from "dayjs";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    useWindowDimensions,
    View } from "react-native";
import { useTranslation } from "react-i18next";

interface ApiErrors {
    email?: string;
    globalName?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    dateOfBirth?: string;
}

const MONTH_VALUES = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
] as const;

const parseDobParts = (value: unknown) => {
    const parsed = dayjs(value instanceof Date ? value : String(value));
    if (!parsed.isValid()) {
        const fallback = dayjs().subtract(13, "year");
        return {
            month: fallback.format("MM"),
            day: fallback.format("D"),
            year: fallback.format("YYYY")};
    }

    return {
        month: parsed.format("MM"),
        day: parsed.format("D"),
        year: parsed.format("YYYY")};
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
    const { t } = useTranslation("auth");
    const { theme } = useTheme();
    const { height: windowHeight } = useWindowDimensions();
    const [month, setMonth] = useState(
        () => parseDobParts(field.state.value).month,
    );
    const [day, setDay] = useState(() => parseDobParts(field.state.value).day);
    const [year, setYear] = useState(
        () => parseDobParts(field.state.value).year,
    );
    const [monthOpen, setMonthOpen] = useState(false);

    const selectedMonthValue = MONTH_VALUES.find((value) => value === month);
    const selectedMonthName = selectedMonthValue
        ? t(`dob.months.${selectedMonthValue}`)
        : undefined;

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
                width: "100%"}}
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
                    width: "100%"}}
            >
                <Pressable
                    onPress={() => setMonthOpen(true)}
                    style={{ flex: 1.4, minWidth: 0 }}
                    accessibilityRole="button"
                    accessibilityLabel={t("dob.selectMonth")}
                >
                    <Box
                        pointerEvents="none"
                        style={{
                            borderWidth: 1,
                            borderColor: theme.colors.neutral,
                            borderRadius: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            backgroundColor: theme.colors.surface}}
                    >
                        <Typography
                            level="body-sm"
                            textColor={selectedMonthName ? "primary" : "muted"}
                            truncate="single"
                        >
                            {selectedMonthName ?? t("dob.month")}
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
                        placeholder={t("dob.day")}
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
                        placeholder={t("dob.year")}
                        keyboardType="number-pad"
                        maxLength={4}
                    />
                </Box>
            </Box>

            <Sheet
                open={monthOpen}
                onClose={() => setMonthOpen(false)}
                showCloseButton={false}
                enableDynamicSizing
            >
                <View style={{ width: "100%" }}>
                    <Box
                        style={{
                            maxHeight: Math.min(windowHeight * 0.55, 420),
                            backgroundColor: theme.colors.background,
                        }}
                    >
                        <Box
                            style={{
                                paddingHorizontal: 16,
                                paddingTop: 14,
                                paddingBottom: 8}}
                        >
                            <Typography level="title-sm" weight="bold">
                                {t("dob.selectMonth")}
                            </Typography>
                        </Box>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {MONTH_VALUES.map((value) => {
                                const active = value === month;
                                return (
                                    <Pressable
                                        key={value}
                                        onPress={() => {
                                            setMonth(value);
                                            commitDate(value, day, year);
                                            setMonthOpen(false);
                                            field.handleBlur();
                                        }}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 14,
                                            backgroundColor: active
                                                ? `${theme.colors.primary}18`
                                                : "transparent"}}
                                    >
                                        <Typography
                                            level="body-md"
                                            weight={active ? "bold" : undefined}
                                            style={{
                                                color: active
                                                    ? theme.colors.primary
                                                    : theme.typography.colors
                                                          .primary}}
                                        >
                                            {t(`dob.months.${value}`)}
                                        </Typography>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Box>
                </View>
            </Sheet>

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
                {t("dob.ageHint", { maxYear })}
            </Typography>
        </Box>
    );
};
