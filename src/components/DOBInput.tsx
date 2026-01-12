import {
    Box,
    IconButton,
    InputDefault,
    InputRootProps,
    Typography,
} from "@mutualzz/ui-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AnyFieldApi } from "@tanstack/form-core";
import dayjs from "dayjs";
import { useState } from "react";
import { Pressable } from "react-native";

interface ApiErrors {
    email?: string;
    globalName?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    dateOfBirth?: string;
}

const MONTHS = [
    {
        value: "01",
        name: "January",
    },
    {
        value: "02",
        name: "February",
    },
    {
        value: "03",
        name: "March",
    },
    {
        value: "04",
        name: "April",
    },
    {
        value: "05",
        name: "May",
    },
    {
        value: "06",
        name: "June",
    },
    {
        value: "07",
        name: "July",
    },
    {
        value: "08",
        name: "August",
    },
    {
        value: "09",
        name: "September",
    },
    {
        value: "10",
        name: "October",
    },
    {
        value: "11",
        name: "November",
    },
    {
        value: "12",
        name: "December",
    },
];

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
    const [showPicker, setShowPicker] = useState(false);

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
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <Pressable
                    style={{
                        width: "100%",
                    }}
                    onPress={() => setShowPicker((prev) => !prev)}
                >
                    <InputDefault
                        readOnly
                        fullWidth
                        value={dayjs(field.state.value).format("MMMM D, YYYY")}
                        endDecorator={
                            <IconButton
                                padding={0}
                                size="sm"
                                onPress={() => field.handleChange(new Date())}
                                variant="plain"
                                color="neutral"
                                hitSlop={8}
                            >
                                X
                            </IconButton>
                        }
                    />
                </Pressable>
                {showPicker && (
                    <DateTimePicker
                        display="spinner"
                        value={field.state.value}
                        onChange={(_, dob) => {
                            if (dob) field.handleChange(dob);
                            setShowPicker(false);
                        }}
                        maximumDate={dayjs().subtract(13, "year").toDate()}
                    />
                )}
            </Box>
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
        </Box>
    );
};
