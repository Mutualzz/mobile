import { Paper } from "@components/Paper";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import {
    Box,
    Button,
    InputDefault,
    InputPassword,
    InputPasswordProps,
    InputRootProps,
    Typography,
} from "@mutualzz/ui-native";
import { emailRegex } from "@mutualzz/validators";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { View } from "react-native";

const InputWithLabel = ({
    label,
    apiError,
    type,
    ...props
}: InputRootProps &
    InputPasswordProps & {
        label: string;
        apiError?: string | null;
        required?: boolean;
        type?: string;
    }) => (
    <Box style={{ width: "100%", flexDirection: "column", gap: 8 }}>
        <Typography level="body-sm" style={{ fontWeight: 500 }}>
            {label}{" "}
            {props.required && (
                <Typography variant="plain" color="danger">
                    *
                </Typography>
            )}
        </Typography>
        {type === "password" ? (
            <InputPassword {...props} fullWidth />
        ) : (
            <InputDefault {...props} fullWidth />
        )}
        {apiError && (
            <Typography variant="plain" color="danger" level="body-sm">
                {apiError}
            </Typography>
        )}
    </Box>
);

const Login = () => {
    const app = useAppStore();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (values: any) => {
            const requestBody: Record<string, string | undefined> = {
                password: values.password,
            };

            if (emailRegex.test(values.usernameOrEmail))
                requestBody.email = values.usernameOrEmail;
            else requestBody.username = values.usernameOrEmail;

            return app.rest.post<{ token: string }, any>(
                "auth/login",
                requestBody,
            );
        },
        onSuccess: ({ token }) => {
            app.setToken(token);
        },
        onError: (error: HttpException) => {
            setError(error.message);
        },
    });

    const Form = useForm({
        defaultValues: {
            usernameOrEmail: "",
            password: "",
        },
        onSubmit: ({ value }) => {
            mutation.mutate(value);
        },
    });

    if (app.token)
        return (
            <Redirect href={`/${app.settings?.preferredMode ?? "spaces"}`} />
        );

    const space = app.joiningSpace;

    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <Paper
                style={{
                    flexDirection: "column",
                    padding: 20,
                    borderRadius: 12,
                    gap: 32,
                    width: "90%",
                }}
            >
                <Box
                    style={{
                        flexDirection: "column",
                        gap: 16,
                        width: "100%",
                        alignItems: "center",
                    }}
                >
                    <Typography level="body-lg" weight="bold">
                        Login to an account
                    </Typography>
                    {space && (
                        <Box
                            style={{
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <Typography
                                level="body-sm"
                                color="primary"
                                style={{ textAlign: "center" }}
                            >
                                You are logging in to accept an invite to join a
                                space:{" "}
                            </Typography>
                            <Box
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <SpaceIcon size={36} space={space} />
                                <Typography
                                    level="body-sm"
                                    style={{
                                        textAlign: "center",
                                    }}
                                >
                                    {space.name}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
                <Box
                    style={{ flexDirection: "column", gap: 32, width: "100%" }}
                >
                    <Form.Field
                        name="usernameOrEmail"
                        children={(field) => (
                            <InputWithLabel
                                label="Username or Email"
                                onChangeText={field.handleChange}
                                onBlur={field.handleBlur}
                                value={field.state.value}
                                required
                            />
                        )}
                    />
                    <Form.Field
                        name="password"
                        children={(field) => (
                            <InputWithLabel
                                label="Password"
                                type="password"
                                onChangeText={field.handleChange}
                                onBlur={field.handleBlur}
                                value={field.state.value}
                                required
                                apiError={error}
                            />
                        )}
                    />
                    <Form.Subscribe
                        selector={(state) => [state.isSubmitting]}
                        children={([isSubmitting]) => (
                            <Button onPress={Form.handleSubmit}>
                                {isSubmitting ? "..." : "Login"}
                            </Button>
                        )}
                    />
                </Box>
            </Paper>
        </View>
    );
};

export default observer(Login);
